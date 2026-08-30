// lib/soundEffects.ts

export interface KeyboardSoundOption {
    id: string;
    name: string;
    file: string;
}

export const KEYBOARD_SOUNDS: KeyboardSoundOption[] = [
    { id: 'none', name: 'ปิดเสียง', file: '' },
    { id: 'kb1', name: 'Keyboard 1', file: '/sounds/keyboard/Keyboard.mp3' },
    { id: 'kb2', name: 'Keyboard 2', file: '/sounds/keyboard/Keyboard1.mp3' },
    { id: 'kb3', name: 'Keyboard 3', file: '/sounds/keyboard/Keyboard2.mp3' },
    { id: 'kb4', name: 'Keyboard 4', file: '/sounds/keyboard/Keyboard3.mp3' },
];

export interface BgmTrack {
    id: string;
    title: string;
    file: string;
}

export const BGM_TRACKS: BgmTrack[] = [
    { id: 'bgm1', title: 'Cozy Cartoon Groove', file: '/sounds/bgm/Cozy Cartoon Groove.mp3' },
    { id: 'bgm2', title: 'Cozy Study Beats', file: '/sounds/bgm/Cozy Study Beats.mp3' },
    { id: 'bgm3', title: 'Cozy Typing Groove', file: '/sounds/bgm/Cozy Typing Groove.mp3' },
];

type SoundEventListener = (state: { isBgmPlaying: boolean; bgmVolume: number; sfxVolume: number; selectedKbSound: string; selectedTracks: string[] }) => void;

class SoundManager {
    private keyAudioPool: Map<string, HTMLAudioElement[]> = new Map();
    private bgmAudio: HTMLAudioElement | null = null;
    private currentTrackIndex = 0;
    private selectedTracks: string[] = ['bgm1', 'bgm2', 'bgm3'];
    private bgmVolume = 0.5;
    private sfxVolume = 0.7;
    private isBgmPlaying = false;
    private currentKeyboardSound = 'kb1';
    private previewingTrackId: string | null = null;
    private listeners: Set<SoundEventListener> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadSettings();
        }
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

    public getState() {
        return {
            isBgmPlaying: this.isBgmPlaying,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            selectedKbSound: this.currentKeyboardSound,
            selectedTracks: this.selectedTracks,
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

            const savedTracks = localStorage.getItem('pimwai_selected_bgm');
            if (savedTracks) {
                const parsed = JSON.parse(savedTracks);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.selectedTracks = parsed;
                }
            }
        } catch (e) {
            console.error('Error loading sound settings:', e);
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
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_volume', this.bgmVolume.toString());
        }
        this.notify();
    }

    public getBgmVolume(): number {
        return this.bgmVolume;
    }

    public setSelectedTracks(trackIds: string[]) {
        this.selectedTracks = trackIds.length > 0 ? trackIds : ['bgm1', 'bgm2', 'bgm3'];
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_selected_bgm', JSON.stringify(this.selectedTracks));
        }

        if (this.isBgmPlaying && !this.previewingTrackId) {
            this.playNextTrack();
        }
        this.notify();
    }

    public getSelectedTracks(): string[] {
        return this.selectedTracks;
    }

    public playKeySound(soundId?: string) {
        const id = soundId || this.currentKeyboardSound;
        if (id === 'none') return;

        const sound = KEYBOARD_SOUNDS.find(s => s.id === id);
        if (!sound || !sound.file) return;

        let pool = this.keyAudioPool.get(id);
        if (!pool) {
            pool = [];
            this.keyAudioPool.set(id, pool);
        }

        let audio = pool.find(a => a.paused || a.ended);
        if (!audio) {
            audio = new Audio(sound.file);
            pool.push(audio);
        }

        audio.volume = this.sfxVolume;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    // เล่นเสียงดาวเด้ง โดยปรับระดับเสียงไล่จากต่ำไปสูง
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

    // เริ่มเล่น Playlist วนลูป (สุ่มเพลง)
    public startBgm() {
        if (this.selectedTracks.length === 0) {
            this.selectedTracks = ['bgm1', 'bgm2', 'bgm3'];
        }
        this.previewingTrackId = null;
        this.isBgmPlaying = true;
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_autoplay', 'true');
        }
        this.currentTrackIndex = Math.floor(Math.random() * this.selectedTracks.length);
        this.playCurrentTrack();
        this.notify();
    }

    // ทดลองฟังเฉพาะเพลงใดเพลงหนึ่ง
    public togglePreviewTrack(trackId: string): boolean {
        if (this.previewingTrackId === trackId) {
            this.stopBgm();
            return false;
        }

        const track = BGM_TRACKS.find(t => t.id === trackId);
        if (!track) return false;

        this.stopBgm();
        this.previewingTrackId = trackId;
        this.isBgmPlaying = true;

        this.bgmAudio = new Audio(track.file);
        this.bgmAudio.volume = this.bgmVolume;
        this.bgmAudio.addEventListener('ended', () => {
            this.stopBgm();
        });

        this.bgmAudio.play().catch(e => console.log('Audio preview play error:', e));
        this.notify();
        return true;
    }

    public getPreviewingTrackId(): string | null {
        return this.previewingTrackId;
    }

    public stopBgm() {
        this.isBgmPlaying = false;
        this.previewingTrackId = null;
        if (typeof window !== 'undefined') {
            localStorage.setItem('pimwai_bgm_autoplay', 'false');
        }
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.removeEventListener('ended', this.onTrackEnded);
            this.bgmAudio = null;
        }
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

        this.playCurrentTrack();
    }

    private playCurrentTrack() {
        if (!this.isBgmPlaying || this.selectedTracks.length === 0) return;

        const currentTrackId = this.selectedTracks[this.currentTrackIndex % this.selectedTracks.length];
        const track = BGM_TRACKS.find(t => t.id === currentTrackId);
        if (!track) return;

        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.removeEventListener('ended', this.onTrackEnded);
        }

        const audio = new Audio(track.file);
        audio.volume = this.bgmVolume;
        audio.addEventListener('ended', this.onTrackEnded);
        this.bgmAudio = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.log('Autoplay blocked, waiting for user click:', e);
            });
        }
    }

    private onTrackEnded = () => {
        this.playNextTrack();
    };
}

export const soundManager = new SoundManager();
