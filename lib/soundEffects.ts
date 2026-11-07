// lib/soundEffects.ts

export interface KeyboardSoundOption {
    id: string;
    name: string;
    file: string;
}

export const KEYBOARD_SOUNDS: KeyboardSoundOption[] = [
    { id: 'none', name: 'ปิดเสียง', file: '' },
    { id: 'kb1', name: 'Keyboard 1 (Tactile)', file: '/sounds/keyboard/Keyboard.mp3' },
    { id: 'kb2', name: 'Keyboard 2 (Creamy)', file: '/sounds/keyboard/Keyboard1.mp3' },
    { id: 'kb3', name: 'Keyboard 3 (Clicky)', file: '/sounds/keyboard/Keyboard2.mp3' },
    { id: 'kb4', name: 'Keyboard 4 (Soft)', file: '/sounds/keyboard/Keyboard3.mp3' },
    { id: 'thock', name: 'Custom Thock (Deep)', file: '__synth_thock__' },
];

export interface BgmTrack {
    id: string;
    title: string;
    file: string;
    youtubeId?: string;
    isCustom?: boolean;
}

export const BGM_TRACKS: BgmTrack[] = [
    { id: 'bgm1', title: 'Cozy Cartoon Groove', file: '/sounds/bgm/Cozy Cartoon Groove.mp3' },
    { id: 'bgm2', title: 'Cozy Study Beats', file: '/sounds/bgm/Cozy Study Beats.mp3' },
    { id: 'bgm3', title: 'Cozy Typing Groove', file: '/sounds/bgm/Cozy Typing Groove.mp3' },
];

export function extractYouTubeVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const host = url.hostname.replace(/^www\./, '').toLowerCase();

        if (host === 'youtu.be') {
            const id = url.pathname.split('/').filter(Boolean)[0];
            if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }

        if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
            const vParam = url.searchParams.get('v');
            if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

            const parts = url.pathname.split('/').filter(Boolean);
            if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'v') && parts[1]) {
                const id = parts[1].substring(0, 11);
                if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
            }
        }
    } catch (e) {}

    const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

export type SoundState = {
    isBgmPlaying: boolean;
    bgmVolume: number;
    sfxVolume: number;
    selectedKbSound: string;
    selectedTracks: string[];
    customTracks: BgmTrack[];
    allTracks: BgmTrack[];
    previewingTrackId: string | null;
};

type SoundEventListener = (state: SoundState) => void;

class SoundManager {
    private keyAudioPool: Map<string, HTMLAudioElement[]> = new Map();
    private audioCtx: AudioContext | null = null;
    private keyBuffers: Map<string, AudioBuffer> = new Map();
    private loadingBuffers: Map<string, Promise<AudioBuffer | null>> = new Map();
    private bgmAudio: HTMLAudioElement | null = null;
    private ytPlayer: any = null;
    private ytReady = false;
    private ytLoadingPromise: Promise<void> | null = null;
    private pendingYoutubeId: string | null = null;

    private currentTrackIndex = 0;
    private selectedTracks: string[] = ['bgm1', 'bgm2', 'bgm3'];
    private customTracks: BgmTrack[] = [];
    private bgmVolume = 0.5;
    private sfxVolume = 0.7;
    private isBgmPlaying = false;
    private currentKeyboardSound = 'kb1';
    private previewingTrackId: string | null = null;
    private hasRestoredOnLoad = false;
    private listeners: Set<SoundEventListener> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadSettings();
            setTimeout(() => this.preloadKeyboardBuffers(), 300);
        }
    }

    private getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.audioCtx) {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            if (Ctx) {
                this.audioCtx = new Ctx({ latencyHint: 'interactive' });
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    }

    private loadKeyBuffer(id: string, fileUrl: string): Promise<AudioBuffer | null> {
        if (!fileUrl || fileUrl.startsWith('__synth')) return Promise.resolve(null);
        const cached = this.keyBuffers.get(id);
        if (cached) return Promise.resolve(cached);

        const existingPromise = this.loadingBuffers.get(id);
        if (existingPromise) return existingPromise;

        const promise = (async () => {
            try {
                const ctx = this.getAudioContext();
                if (!ctx) return null;
                const res = await fetch(fileUrl);
                if (!res.ok) return null;
                const arrayBuffer = await res.arrayBuffer();
                const decoded = await ctx.decodeAudioData(arrayBuffer);
                this.keyBuffers.set(id, decoded);
                return decoded;
            } catch (e) {
                return null;
            } finally {
                this.loadingBuffers.delete(id);
            }
        })();

        this.loadingBuffers.set(id, promise);
        return promise;
    }

    private preloadKeyboardBuffers() {
        if (typeof window === 'undefined') return;
        for (const sound of KEYBOARD_SOUNDS) {
            if (sound.file && !sound.file.startsWith('__synth')) {
                this.loadKeyBuffer(sound.id, sound.file);
            }
        }
    }

    /**
     * คำนวณโทนเสียง (Pitch) และน้ำหนักการกด (Gain) ตามแถวบนแป้นพิมพ์และน้ำหนักนิ้วธรรมชาติ
     * โดยให้ Spacebar, Backspace, Enter ใช้โทนเสียงเดียวกับปุ่มปกติ ไม่กดทุ้มลง
     */
    private getRealisticKeyAcousticProfile(event?: KeyboardEvent): {
        pitch: number;
        gainMultiplier: number;
        lowpassFreq: number;
        hasSubThock: boolean;
    } {
        // สุ่มความหนัก-เบาของนิ้วมนุษย์เล็กน้อยในทุกครั้งที่กด (Humanization)
        const pitchJitter = (Math.random() - 0.5) * 0.05; // ±2.5%
        const gainJitter = 0.94 + Math.random() * 0.12;   // 94% - 106%

        const code = event?.code || '';

        // แยกโทนเสียงตามแถวของคีย์แคปเล็กน้อยอย่างเป็นธรรมชาติ
        let rowPitchOffset = 0;
        if (/^Digit|^Minus|^Equal|^Backquote/.test(code)) {
            rowPitchOffset = -0.015;
        } else if (/^Key[QWERTYUIOP]|^Bracket|^Backslash/.test(code)) {
            rowPitchOffset = 0.01;
        } else if (/^Key[ASDFGHJKL]|^Semicolon|^Quote/.test(code)) {
            rowPitchOffset = 0.0;
        } else if (/^Key[ZXCVBNM]|^Comma|^Period|^Slash/.test(code)) {
            rowPitchOffset = -0.01;
        }

        return {
            pitch: Math.max(0.9, 1.0 + rowPitchOffset + pitchJitter),
            gainMultiplier: gainJitter,
            lowpassFreq: 7500 + (Math.random() - 0.5) * 600,
            hasSubThock: false,
        };
    }

    /**
     * สังเคราะห์เสียง Mechanical Switch แบบ Custom Creamy Thock ด้วย Web Audio API ล้วน
     */
    private playSynthThock(ctx: AudioContext, profile: { pitch: number; gainMultiplier: number; hasSubThock: boolean }) {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        const vol = Math.min(1, this.sfxVolume * profile.gainMultiplier);
        masterGain.gain.setValueAtTime(vol, now);
        masterGain.connect(ctx.destination);

        // 1. เสียง Bottom-out Thock (มวลเสียงทุ้มจาก PBT Keycap กระทบเพลท)
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'triangle';
        const baseFreq = (profile.hasSubThock ? 135 : 165) * profile.pitch;
        bodyOsc.frequency.setValueAtTime(baseFreq * 1.6, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(45, baseFreq * 0.48), now + 0.042);

        bodyGain.gain.setValueAtTime(0.001, now);
        bodyGain.gain.linearRampToValueAtTime(0.95, now + 0.002);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + (profile.hasSubThock ? 0.065 : 0.048));

        bodyOsc.connect(bodyGain);
        bodyGain.connect(masterGain);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.07);

        // 2. เสียง Tactile Transient (เสียงก้านสวิตช์กระทบแบบนุ่มนวล)
        const bufferSize = Math.floor(ctx.sampleRate * 0.018);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime((profile.hasSubThock ? 1150 : 1550) * profile.pitch, now);
        bandpass.Q.setValueAtTime(2.2, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.65, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.018);

        whiteNoise.connect(bandpass);
        bandpass.connect(clickGain);
        clickGain.connect(masterGain);
        whiteNoise.start(now);
    }

    public subscribe(listener: SoundEventListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        const state = this.getState();
        this.listeners.forEach(fn => {
            try { fn(state); } catch (e) {}
        });
    }

    public getAllTracks(): BgmTrack[] {
        return [...BGM_TRACKS, ...this.customTracks];
    }

    public getCustomTracks(): BgmTrack[] {
        return this.customTracks;
    }

    public getState(): SoundState {
        const activeId = this.isBgmPlaying
            ? (this.previewingTrackId || this.selectedTracks[this.currentTrackIndex % Math.max(1, this.selectedTracks.length)] || null)
            : null;

        return {
            isBgmPlaying: this.isBgmPlaying,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            selectedKbSound: this.currentKeyboardSound,
            selectedTracks: this.selectedTracks,
            customTracks: this.customTracks,
            allTracks: this.getAllTracks(),
            previewingTrackId: activeId,
        };
    }

    public loadSettings() {
        if (typeof window === 'undefined') return;
        try {
            const savedKb = localStorage.getItem('pimwai_keyboard_sound');
            if (savedKb) this.currentKeyboardSound = savedKb;

            const savedSfxVol = localStorage.getItem('pimwai_sfx_volume');
            if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);

            const savedBgmVol = localStorage.getItem('pimwai_bgm_volume');
            if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);

            const savedCustom = localStorage.getItem('pimwai_custom_youtube_tracks');
            if (savedCustom) {
                const parsedCustom = JSON.parse(savedCustom);
                if (Array.isArray(parsedCustom)) {
                    this.customTracks = parsedCustom.filter(
                        (t: any) => t && t.id && t.youtubeId && t.title
                    );
                }
            }

            const savedTracks = localStorage.getItem('pimwai_selected_bgm');
            if (savedTracks) {
                const parsed = JSON.parse(savedTracks);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const validIds = new Set(this.getAllTracks().map(t => t.id));
                    const filtered = parsed.filter((id: string) => validIds.has(id));
                    if (filtered.length > 0) {
                        this.selectedTracks = filtered;
                    }
                }
            }
        } catch (e) {
            console.error('Error loading sound settings:', e);
        }
    }

    /**
     * เรียกครั้งเดียวเมื่อโหลดหรือรีเฟรชหน้าเว็บ:
     * สุ่มเพลงใหม่จากรายการที่ติ๊กไว้ (ถ้ามีมากกว่า 1 เพลง จะสุ่มให้ไม่ซ้ำกับเพลงก่อนรีเฟรช)
     */
    public restoreBgmOnLoad() {
        if (typeof window === 'undefined') return;
        if (this.hasRestoredOnLoad) return;
        this.hasRestoredOnLoad = true;

        try {
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
            if (!isAutoPlayEnabled) return;
            if (this.isBgmPlaying) return;

            if (this.selectedTracks.length === 0) {
                this.selectedTracks = ['bgm1', 'bgm2', 'bgm3'];
            }

            const lastTrackId = localStorage.getItem('pimwai_bgm_active_track_id');
            let nextIndex = Math.floor(Math.random() * this.selectedTracks.length);

            if (this.selectedTracks.length > 1 && lastTrackId) {
                const candidates = this.selectedTracks
                    .map((id, idx) => ({ id, idx }))
                    .filter(item => item.id !== lastTrackId);
                if (candidates.length > 0) {
                    const picked = candidates[Math.floor(Math.random() * candidates.length)];
                    nextIndex = picked.idx;
                }
            }

            this.currentTrackIndex = nextIndex;
            this.previewingTrackId = null;
            this.isBgmPlaying = true;
            this.playCurrentTrack();
            this.notify();
        } catch (e) {}
    }

    /**
     * เรียกเมื่อผู้ใช้คลิกหรือกดปุ่มครั้งแรกบนหน้าเว็บ:
     * ถ้าเพลงกำลังเล่นอยู่แล้ว จะไม่รีเซ็ตหรือสุ่มเพลงใหม่เด็ดขาด
     * จะสั่งเล่นต่อเฉพาะกรณีที่เบราว์เซอร์บล็อกเสียงอัตโนมัติตอนเพิ่งรีเฟรชเท่านั้น
     */
    public unlockBgmOnGesture(): boolean {
        if (typeof window === 'undefined') return true;

        const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
        if (!isAutoPlayEnabled) {
            return true;
        }

        if (!this.isBgmPlaying) {
            this.restoreBgmOnLoad();
            return true;
        }

        // กรณีเป็นเพลง MP3: ถ้าเบราว์เซอร์บล็อกไว้ (paused) ให้สั่ง play() ต่อจากตัวเดิมโดยไม่สร้างใหม่
        if (this.bgmAudio) {
            if (this.bgmAudio.paused) {
                this.bgmAudio.play().catch(() => {});
            }
            return true;
        }

        // กรณีเป็นเพลง YouTube: ถ้าพร้อมแล้วแต่ถูกเบราว์เซอร์บล็อกไว้ (ไม่ได้อยู่ในสถานะ PLAYING=1 หรือ BUFFERING=3) ให้สั่ง playVideo()
        if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.getPlayerState === 'function') {
            try {
                const state = this.ytPlayer.getPlayerState();
                if (state !== 1 && state !== 3) {
                    this.ytPlayer.playVideo();
                }
                return true;
            } catch (e) {}
        }

        return false;
    }

    public async addYoutubeTrack(urlOrId: string): Promise<{ success: boolean; track?: BgmTrack; error?: string }> {
        const videoId = extractYouTubeVideoId(urlOrId);
        if (!videoId) {
            return { success: false, error: 'รูปแบบลิงก์ YouTube ไม่ถูกต้อง' };
        }

        const trackId = `yt_${videoId}`;
        const existing = this.customTracks.find(t => t.id === trackId);
        if (existing) {
            if (!this.selectedTracks.includes(trackId)) {
                this.selectedTracks = [trackId, ...this.selectedTracks];
                this.saveSelectedTracks();
            }
            this.playSpecificTrack(trackId);
            return { success: true, track: existing };
        }

        let title = `YouTube Music (${videoId})`;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(
                `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
                { signal: controller.signal }
            );
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                if (data && data.title) {
                    title = data.title;
                }
            }
        } catch (e) {}

        const newTrack: BgmTrack = {
            id: trackId,
            title,
            file: `https://www.youtube.com/watch?v=${videoId}`,
            youtubeId: videoId,
            isCustom: true,
        };

        this.customTracks = [newTrack, ...this.customTracks];
        this.saveCustomTracks();

        if (!this.selectedTracks.includes(trackId)) {
            this.selectedTracks = [trackId, ...this.selectedTracks];
        }
        this.saveSelectedTracks();
        this.playSpecificTrack(trackId);

        return { success: true, track: newTrack };
    }

    public removeCustomTrack(trackId: string) {
        const currentActiveId = this.getState().previewingTrackId;
        this.customTracks = this.customTracks.filter(t => t.id !== trackId);
        this.saveCustomTracks();

        this.selectedTracks = this.selectedTracks.filter(id => id !== trackId);
        if (this.selectedTracks.length === 0) {
            this.selectedTracks = ['bgm1', 'bgm2', 'bgm3'];
        }
        this.saveSelectedTracks();

        if (currentActiveId === trackId) {
            this.stopBgm();
        }
        this.notify();
    }

    private saveCustomTracks() {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('pimwai_custom_youtube_tracks', JSON.stringify(this.customTracks));
            } catch (e) {}
        }
    }

    private saveSelectedTracks() {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('pimwai_selected_bgm', JSON.stringify(this.selectedTracks));
            } catch (e) {}
        }
    }

    public setKeyboardSound(id: string) {
        this.currentKeyboardSound = id;
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_keyboard_sound', id);
        }
        this.notify();
    }

    public getKeyboardSound(): string {
        return this.currentKeyboardSound;
    }

    public setSfxVolume(vol: number) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_sfx_volume', this.sfxVolume.toString());
        }
        this.notify();
    }

    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    public setBgmVolume(vol: number) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmVolume;
        }
        if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
            try {
                this.ytPlayer.setVolume(Math.round(this.bgmVolume * 100));
            } catch (e) {}
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_volume', this.bgmVolume.toString());
        }
        this.notify();
    }

    public getBgmVolume(): number {
        return this.bgmVolume;
    }

    public setSelectedTracks(trackIds: string[]) {
        const validIds = new Set(this.getAllTracks().map(t => t.id));
        const filtered = trackIds.filter(id => validIds.has(id));
        const currentActiveId = this.getState().previewingTrackId;

        this.selectedTracks = filtered.length > 0 ? filtered : ['bgm1', 'bgm2', 'bgm3'];
        this.saveSelectedTracks();

        if (this.isBgmPlaying && currentActiveId) {
            const newIdx = this.selectedTracks.indexOf(currentActiveId);
            if (newIdx !== -1) {
                this.currentTrackIndex = newIdx;
            }
        }
        this.notify();
    }

    public getSelectedTracks(): string[] {
        return this.selectedTracks;
    }

    public playKeySound(soundId?: string, event?: KeyboardEvent) {
        if (event) {
            if (event.repeat) return;
            if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
        }

        const id = soundId || this.currentKeyboardSound;
        if (id === 'none' || this.sfxVolume <= 0) return;

        const sound = KEYBOARD_SOUNDS.find(s => s.id === id) || KEYBOARD_SOUNDS[1];
        if (!sound || !sound.file) return;

        const profile = this.getRealisticKeyAcousticProfile(event);
        const ctx = this.getAudioContext();

        // กรณีเลือกเสียงสังเคราะห์ Custom Thock (Deep)
        if (sound.file === '__synth_thock__' && ctx) {
            this.playSynthThock(ctx, profile);
            return;
        }

        // ใช้ Web Audio API (Zero-Latency + Polyphonic + Acoustic Filter + Sub-Thock สำหรับปุ่มใหญ่)
        const buffer = this.keyBuffers.get(sound.id);
        if (ctx && buffer) {
            try {
                const now = ctx.currentTime;
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.setValueAtTime(profile.pitch, now);

                // Acoustic Low-pass Filter เพื่อจำลองความนุ่มของเคสและโฟมซับเสียงตามน้ำหนักนิ้ว
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(profile.lowpassFreq, now);

                const gainNode = ctx.createGain();
                const finalVol = Math.min(1, this.sfxVolume * profile.gainMultiplier);
                gainNode.gain.setValueAtTime(finalVol, now);

                source.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(ctx.destination);
                source.start(now);

                // เสริมมวลเสียงทุ้มต่ำ (Stabilizer Sub-Thock) เมื่อกด Spacebar, Enter หรือ Backspace
                if (profile.hasSubThock) {
                    const subOsc = ctx.createOscillator();
                    const subGain = ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(115 * profile.pitch, now);
                    subOsc.frequency.exponentialRampToValueAtTime(52, now + 0.045);

                    subGain.gain.setValueAtTime(Math.min(0.45, finalVol * 0.35), now);
                    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                    subOsc.connect(subGain);
                    subGain.connect(ctx.destination);
                    subOsc.start(now);
                    subOsc.stop(now + 0.055);
                }
                return;
            } catch (e) {}
        }

        // สั่งโหลด Buffer เผื่อไว้สำหรับครั้งถัดไป
        this.loadKeyBuffer(sound.id, sound.file);

        // Fallback: HTMLAudioElement (กรณีที่ Buffer กำลังโหลดในจังหวะกดปุ่มครั้งแรกสุด)
        let pool = this.keyAudioPool.get(sound.id);
        if (!pool) {
            pool = [];
            this.keyAudioPool.set(sound.id, pool);
        }

        let audio = pool.find(a => a.paused || a.ended);
        if (!audio) {
            if (pool.length < 8) {
                audio = new Audio(sound.file);
                pool.push(audio);
            } else {
                audio = pool[0];
            }
        }

        audio.volume = Math.min(1, this.sfxVolume * profile.gainMultiplier);
        audio.playbackRate = profile.pitch;
        (audio as any).preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    public playStarSound(starIndex: number = 1) {
        if (typeof window === 'undefined') return;
        try {
            const audio = new Audio('/sounds/sfx/star.mp3');
            audio.volume = Math.min(1, this.sfxVolume * 1.2);

            let pitch = 1.0;
            if (starIndex === 1) pitch = 0.96;
            else if (starIndex === 2) pitch = 1.18;
            else if (starIndex >= 3) pitch = 1.42;

            audio.playbackRate = pitch;
            (audio as any).preservesPitch = false;
            (audio as any).mozPreservesPitch = false;
            (audio as any).webkitPreservesPitch = false;

            audio.play().catch(() => {});
        } catch (e) {
            console.error('Error playing star sound:', e);
        }
    }

    private ensureYouTubePlayer(): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        if (this.ytReady && this.ytPlayer) return Promise.resolve();
        if (this.ytLoadingPromise) return this.ytLoadingPromise;

        this.ytLoadingPromise = new Promise<void>((resolve) => {
            const createPlayer = () => {
                let container = document.getElementById('pimwai-yt-bgm-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'pimwai-yt-bgm-container';
                    container.style.position = 'fixed';
                    container.style.left = '-9999px';
                    container.style.bottom = '-9999px';
                    container.style.width = '1px';
                    container.style.height = '1px';
                    container.style.opacity = '0';
                    container.style.pointerEvents = 'none';
                    const inner = document.createElement('div');
                    inner.id = 'pimwai-yt-bgm-player';
                    container.appendChild(inner);
                    document.body.appendChild(container);
                }

                const YT = (window as any).YT;
                this.ytPlayer = new YT.Player('pimwai-yt-bgm-player', {
                    height: '1',
                    width: '1',
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        playsinline: 1,
                    },
                    events: {
                        onReady: () => {
                            this.ytReady = true;
                            try {
                                this.ytPlayer.setVolume(Math.round(this.bgmVolume * 100));
                            } catch (e) {}
                            if (this.pendingYoutubeId && this.isBgmPlaying) {
                                const vid = this.pendingYoutubeId;
                                this.pendingYoutubeId = null;
                                this.ytPlayer.loadVideoById(vid);
                            }
                            resolve();
                        },
                        onStateChange: (event: any) => {
                            // 0 === YT.PlayerState.ENDED
                            if (event.data === 0) {
                                if (this.selectedTracks.length <= 1) {
                                    try {
                                        this.ytPlayer.seekTo(0, true);
                                        this.ytPlayer.playVideo();
                                    } catch (e) {}
                                } else {
                                    this.playNextTrack();
                                }
                            }
                        },
                        onError: () => {
                            if (this.selectedTracks.length > 1) {
                                this.playNextTrack();
                            }
                        }
                    }
                });
            };

            if ((window as any).YT && (window as any).YT.Player) {
                createPlayer();
            } else {
                const prevCallback = (window as any).onYouTubeIframeAPIReady;
                (window as any).onYouTubeIframeAPIReady = () => {
                    if (typeof prevCallback === 'function') prevCallback();
                    createPlayer();
                };

                if (!document.getElementById('pimwai-yt-iframe-api')) {
                    const tag = document.createElement('script');
                    tag.id = 'pimwai-yt-iframe-api';
                    tag.src = 'https://www.youtube.com/iframe_api';
                    document.head.appendChild(tag);
                }
            }
        });

        return this.ytLoadingPromise;
    }

    private playYouTubeVideoId(videoId: string) {
        this.pendingYoutubeId = videoId;
        this.ensureYouTubePlayer().then(() => {
            if (!this.isBgmPlaying) return;
            // ถ้า onReady โหลดไปแล้ว (pendingYoutubeId เป็น null) ไม่ต้องเรียก loadVideoById ซ้ำอีกรอบ!
            if (!this.pendingYoutubeId) return;
            if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
                const vid = this.pendingYoutubeId;
                this.pendingYoutubeId = null;
                try {
                    this.ytPlayer.setVolume(Math.round(this.bgmVolume * 100));
                    this.ytPlayer.loadVideoById(vid);
                    this.ytPlayer.playVideo();
                } catch (e) {}
            }
        });
    }

    private stopYouTubePlayer() {
        this.pendingYoutubeId = null;
        if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.stopVideo === 'function') {
            try {
                this.ytPlayer.stopVideo();
            } catch (e) {}
        }
    }

    private stopHtmlAudio() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.removeEventListener('ended', this.onTrackEnded);
            this.bgmAudio = null;
        }
    }

    public playSpecificTrack(trackId: string) {
        const idx = this.selectedTracks.indexOf(trackId);
        if (idx !== -1) {
            this.currentTrackIndex = idx;
            this.previewingTrackId = null;
        } else {
            this.previewingTrackId = trackId;
        }
        this.isBgmPlaying = true;
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_autoplay', 'true');
            localStorage.setItem('pimwai_bgm_active_track_id', trackId);
        }
        this.playCurrentTrack();
        this.notify();
    }

    public startBgm() {
        if (this.selectedTracks.length === 0) {
            this.selectedTracks = ['bgm1', 'bgm2', 'bgm3'];
        }
        this.previewingTrackId = null;
        this.isBgmPlaying = true;
        this.currentTrackIndex = Math.floor(Math.random() * this.selectedTracks.length);
        const trackId = this.selectedTracks[this.currentTrackIndex];
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_autoplay', 'true');
            if (trackId) localStorage.setItem('pimwai_bgm_active_track_id', trackId);
        }
        this.playCurrentTrack();
        this.notify();
    }

    public togglePreviewTrack(trackId: string): boolean {
        const currentActiveId = this.getState().previewingTrackId;
        if (this.isBgmPlaying && currentActiveId === trackId) {
            this.stopBgm();
            return false;
        }

        const track = this.getAllTracks().find(t => t.id === trackId);
        if (!track) return false;

        this.playSpecificTrack(trackId);
        return true;
    }

    public getPreviewingTrackId(): string | null {
        return this.getState().previewingTrackId;
    }

    public stopBgm() {
        this.isBgmPlaying = false;
        this.previewingTrackId = null;
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_autoplay', 'false');
        }
        this.stopHtmlAudio();
        this.stopYouTubePlayer();
        this.notify();
    }

    public toggleBgm(): boolean {
        if (this.isBgmPlaying) {
            this.stopBgm();
            return false;
        } else {
            this.startBgm();
            return true;
        }
    }

    public getIsBgmPlaying(): boolean {
        return this.isBgmPlaying;
    }

    private playNextTrack() {
        this.previewingTrackId = null;
        if (this.selectedTracks.length === 0) {
            this.selectedTracks = ['bgm1', 'bgm2', 'bgm3'];
        }

        if (this.selectedTracks.length === 1) {
            this.currentTrackIndex = 0;
        } else {
            let nextIndex = this.currentTrackIndex;
            while (nextIndex === this.currentTrackIndex) {
                nextIndex = Math.floor(Math.random() * this.selectedTracks.length);
            }
            this.currentTrackIndex = nextIndex;
        }

        const nextTrackId = this.selectedTracks[this.currentTrackIndex];
        if (typeof window !== 'undefined' && nextTrackId) {
            localStorage.setItem('pimwai_bgm_active_track_id', nextTrackId);
        }

        this.playCurrentTrack();
        this.notify();
    }

    private playCurrentTrack() {
        if (!this.isBgmPlaying) return;

        const currentTrackId = this.previewingTrackId || this.selectedTracks[this.currentTrackIndex % Math.max(1, this.selectedTracks.length)];
        if (!currentTrackId) return;

        const track = this.getAllTracks().find(t => t.id === currentTrackId);
        if (!track) return;

        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_active_track_id', currentTrackId);
        }

        this.stopHtmlAudio();

        if (track.youtubeId) {
            this.playYouTubeVideoId(track.youtubeId);
            return;
        }

        this.stopYouTubePlayer();
        const audio = new Audio(track.file);
        audio.volume = this.bgmVolume;
        audio.addEventListener('ended', this.onTrackEnded);
        this.bgmAudio = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    }

    private onTrackEnded = () => {
        this.playNextTrack();
    };
}

export const soundManager = new SoundManager();
