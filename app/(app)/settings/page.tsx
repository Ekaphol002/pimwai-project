"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
    Camera, Pencil, Check, X, Clock, Loader2, Calendar, ShieldCheck,
    Mail, User as UserIcon, KeyRound, Eye, EyeOff, LogOut, Volume2,
    Music, Play, Square, CheckSquare, Sparkles, VolumeX, Pause,
    MessageSquarePlus, ShieldAlert, Send
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import toast, { Toaster } from 'react-hot-toast';
import { soundManager, KEYBOARD_SOUNDS, BGM_TRACKS } from '@/lib/soundEffects';
import { isAdmin } from '@/lib/adminAuth';

interface UserProfile {
    id: string;
    name: string | null;
    username: string | null;
    displayName: string;
    email: string | null;
    image: string | null;
    rank: number;
    stars: number;
    currentExp: number;
    createdAt: string;
    lastNameChangedAt: string | null;
    provider?: string;
    hasPassword?: boolean;
    isAvatarLocked?: boolean;
}

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [canChangeName, setCanChangeName] = useState(true);
    const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
    const [daysLeft, setDaysLeft] = useState(0);

    // Edit Name States
    const [isEditingName, setIsEditingName] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    // Audio Settings States
    const [selectedKbSound, setSelectedKbSound] = useState('kb1');
    const [sfxVolume, setSfxVolume] = useState(70);
    const [bgmVolume, setBgmVolume] = useState(40);
    const [selectedBgmTracks, setSelectedBgmTracks] = useState<string[]>(['bgm1', 'bgm2', 'bgm3']);
    const [isBgmPlaying, setIsBgmPlaying] = useState(false);
    const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

    // Feedback States
    const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
    const [feedbackTitle, setFeedbackTitle] = useState('');
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Change Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Avatar Upload States
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.success && data.user) {
                setProfile(data.user);
                setUsernameInput(data.user.displayName || '');
                setCanChangeName(data.canChangeName);
                setNextAvailableDate(data.nextAvailableDate);
                setDaysLeft(data.daysLeft || 0);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();

        const unsubscribe = soundManager.subscribe((state) => {
            setIsBgmPlaying(state.isBgmPlaying);
            setBgmVolume(Math.round(state.bgmVolume * 100));
            setSfxVolume(Math.round(state.sfxVolume * 100));
            setSelectedKbSound(state.selectedKbSound);
            setSelectedBgmTracks(state.selectedTracks);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleSelectKeyboardSound = (id: string) => {
        setSelectedKbSound(id);
        soundManager.setKeyboardSound(id);
        if (id !== 'none') {
            soundManager.playKeySound(id);
        }
        toast.success(`เลือก ${KEYBOARD_SOUNDS.find(k => k.id === id)?.name}`);
    };

    const handleSfxVolumeChange = (vol: number) => {
        setSfxVolume(vol);
        soundManager.setSfxVolume(vol / 100);
    };

    const handleSfxVolumeCommit = () => {
        if (selectedKbSound !== 'none') {
            soundManager.playKeySound();
        }
    };

    const handleToggleBgmTrack = (trackId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        let updated: string[];
        if (selectedBgmTracks.includes(trackId)) {
            updated = selectedBgmTracks.filter(id => id !== trackId);
        } else {
            updated = [...selectedBgmTracks, trackId];
        }

        if (updated.length === 0) {
            toast.error('ต้องเลือกอย่างน้อย 1 เพลง');
            return;
        }

        setSelectedBgmTracks(updated);
        soundManager.setSelectedTracks(updated);
    };

    const handlePreviewTrack = (trackId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isPlaying = soundManager.togglePreviewTrack(trackId);
        if (isPlaying) {
            setPreviewingTrackId(trackId);
            const track = BGM_TRACKS.find(t => t.id === trackId);
            toast.success(`กำลังทดลองฟัง: ${track?.title}`);
        } else {
            setPreviewingTrackId(null);
            toast.success('หยุดฟังเพลงแล้ว');
        }
    };

    const handleBgmVolumeChange = (vol: number) => {
        setBgmVolume(vol);
        soundManager.setBgmVolume(vol / 100);
    };

    // ส่งข้อเสนอแนะ Feedback
    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackTitle.trim() || !feedbackContent.trim()) {
            toast.error('กรุณากรอกหัวข้อและเนื้อหาข้อเสนอแนะ');
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: feedbackCategory,
                    title: feedbackTitle,
                    content: feedbackContent
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'ส่งข้อเสนอแนะสำเร็จ ขอบคุณครับ!');
                setFeedbackTitle('');
                setFeedbackContent('');
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // 1. บันทึกชื่อผู้ใช้ (พร้อมกรองคำหยาบ)
    const handleSaveName = async () => {
        const trimmed = usernameInput.trim();

        if (!trimmed) {
            toast.error('กรุณากรอกชื่อผู้ใช้');
            return;
        }

        if (trimmed === profile?.displayName) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: trimmed })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('เปลี่ยนชื่อผู้ใช้เรียบร้อยแล้ว');
                setIsEditingName(false);
                await updateSession({ name: trimmed });
                fetchProfile();
                // รีโหลดเพื่อให้ Navbar และหน้าอื่นๆ อัปเดตชื่อทันที
                window.location.reload();
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อ');
            }
        } catch (error) {
            console.error('Update name error:', error);
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            setIsSavingName(false);
        }
    };

    // 2. เปลี่ยนรหัสผ่าน
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('รหัสผ่านยืนยันไม่ตรงกัน');
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                fetchProfile();
            } else {
                toast.error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            }
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // 3. อัปโหลดรูปภาพ
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (profile?.isAvatarLocked) {
            toast.error('บัญชีของคุณถูกระงับสิทธิ์ในการเปลี่ยนรูปโปรไฟล์');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setIsUploadingAvatar(true);
        const toastId = toast.loading('กำลังอัปโหลดรูปภาพ...');

        try {
            const res = await fetch('/api/user/upload-avatar', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                toast.success('เปลี่ยนรูปโปรไฟล์สำเร็จ!', { id: toastId });
                setProfile(prev => prev ? { ...prev, image: data.imageUrl } : null);
                await updateSession();
                fetchProfile();
            } else {
                toast.error(data.error || 'อัปโหลดรูปภาพล้มเหลว', { id: toastId });
            }
        } catch (error) {
            console.error('Upload avatar error:', error);
            toast.error('เกิดข้อผิดพลาดในการอัปโหลด', { id: toastId });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={48} className="animate-spin mb-3 text-[#5cb5db]" />
                <p className="text-sm font-semibold logo-font">Loading settings...</p>
            </div>
        );
    }

    const currentImage = (profile?.image && profile.image !== '/default-avatar.png')
        ? profile.image
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'User')}&background=e2f1f8&color=3a90b5&bold=true`;
    const userIsAdmin = isAdmin(session?.user?.email);

    return (
        <div className="min-h-screen bg-[#f4f7fb] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
            <Toaster position="top-center" />

            <div className="w-full max-w-5xl flex flex-col gap-6">

                {/* Page Title Header */}
                <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight logo-font">
                            Account Settings
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base mt-1">จัดการข้อมูลส่วนตัว เสียงพิมพ์ เพลงพื้นหลัง และส่งข้อเสนอแนะ</p>
                    </div>

                    {/* Admin Dashboard Badge Button */}
                    {userIsAdmin && (
                        <Link
                            href="/admin"
                            className="px-5 py-2.5 bg-red-500 hover:from-red-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer"
                        >
                            <ShieldAlert size={18} />
                            <span>Admin Panel (แผงควบคุม)</span>
                        </Link>
                    )}
                </div>

                {/* --- Section 1: ข้อมูลโปรไฟล์หลัก --- */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/80 flex flex-col gap-8">
                    <h2 className="text-lg sm:text-xl font-black text-gray-800 logo-font flex items-center gap-2">
                        <span>Profile Information</span>
                    </h2>

                    {/* Top Profile Summary Section */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b border-gray-100">
                        {/* Avatar with Camera Button */}
                        <div className="relative shrink-0 group">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gray-100 ring-4 ring-[#5cb5db]/20 flex items-center justify-center shadow-md">
                                {isUploadingAvatar ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-xs text-white">
                                        <Loader2 size={32} className="animate-spin text-white mb-1" />
                                        <span className="text-[11px] font-bold logo-font">Uploading...</span>
                                    </div>
                                ) : (
                                    <img
                                        src={currentImage}
                                        alt={profile?.displayName || 'User'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'User')}&background=e2f1f8&color=3a90b5&bold=true`;
                                        }}
                                    />
                                )}
                            </div>

                            {!profile?.isAvatarLocked && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    title="เปลี่ยนรูปโปรไฟล์"
                                    className="absolute bottom-1 right-1 p-2.5 bg-[#5cb5db] hover:bg-[#4a9ec2] active:scale-95 text-white rounded-full shadow-lg border-2 border-white transition-all cursor-pointer"
                                >
                                    <Camera size={16} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                className="hidden"
                            />
                        </div>

                        {/* Name & Inline Edit */}
                        <div className="flex-1 flex flex-col items-center md:items-start justify-center gap-2 w-full">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest logo-font">Username</span>

                            {isEditingName ? (
                                <div className="flex flex-col gap-2 w-full max-w-md">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={usernameInput}
                                            onChange={(e) => setUsernameInput(e.target.value)}
                                            maxLength={20}
                                            autoFocus
                                            className="flex-1 px-4 py-2 text-lg font-bold text-gray-800 rounded-2xl border border-[#5cb5db] focus:ring-4 focus:ring-[#5cb5db]/15 outline-none logo-font"
                                            placeholder="Username"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveName}
                                            disabled={isSavingName}
                                            className="p-2.5 bg-[#5cb5db] hover:bg-[#4a9ec2] text-white rounded-2xl transition cursor-pointer shadow-sm"
                                            title="บันทึก"
                                        >
                                            {isSavingName ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingName(false);
                                                setUsernameInput(profile?.displayName || '');
                                            }}
                                            disabled={isSavingName}
                                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition cursor-pointer"
                                            title="ยกเลิก"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400 logo-font">{usernameInput.length}/20 characters</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-800 logo-font">
                                        {profile?.displayName || 'User'}
                                    </h2>

                                    {canChangeName ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingName(true)}
                                            className="p-2 text-gray-400 hover:text-[#5cb5db] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                            title="แก้ไขชื่อผู้ใช้"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-white bg-[#5cb5db] px-3 py-1.5 rounded-full font-bold logo-font">
                                            <Clock size={14} />
                                            <span>เปลี่ยนได้อีกใน {daysLeft} วัน</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                {canChangeName
                                    ? 'สามารถเปลี่ยนชื่อผู้ใช้ได้ 1 ครั้งในทุกๆ 7 วัน (มีระบบกรองคำหยาบ)'
                                    : `เปลี่ยนชื่อล่าสุดเมื่อ ${profile?.lastNameChangedAt ? new Date(profile.lastNameChangedAt).toLocaleDateString('th-TH') : ''}`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Account Details List */}
                    <div className="flex flex-col divide-y divide-gray-100">
                        {/* Email / Username */}
                        <div className="py-4 sm:py-5 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3 text-gray-500 font-medium">
                                {profile?.email ? <Mail size={18} className="text-gray-400" /> : <UserIcon size={18} className="text-gray-400" />}
                                <span className="text-sm sm:text-base font-semibold">{profile?.email ? 'อีเมล' : 'บัญชีผู้ใช้'}</span>
                            </div>
                            <span className="font-bold text-gray-800 text-sm sm:text-base text-right truncate max-w-[280px] sm:max-w-md logo-font">
                                {profile?.email || profile?.username || profile?.name || 'No data'}
                            </span>
                        </div>

                        {/* Provider */}
                        <div className="py-4 sm:py-5 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3 text-gray-500 font-medium">
                                <ShieldCheck size={18} className="text-gray-400" />
                                <span className="text-sm sm:text-base font-semibold">วิธีการเข้าสู่ระบบ</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-gray-700 text-sm sm:text-base logo-font">
                                {profile?.provider === 'Google Account' ? (
                                    <>
                                        <FcGoogle size={20} />
                                        <span>Google</span>
                                    </>
                                ) : (
                                    <span>Email & Password</span>
                                )}
                            </div>
                        </div>

                        {/* Membership Date */}
                        <div className="py-4 sm:py-5 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3 text-gray-500 font-medium">
                                <Calendar size={18} className="text-gray-400" />
                                <span className="text-sm sm:text-base font-semibold">วันที่เริ่มใช้งาน</span>
                            </div>
                            <span className="font-bold text-gray-700 text-sm sm:text-base logo-font">
                                {profile?.createdAt
                                    ? new Date(profile.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Section 2: เสียงแป้นพิมพ์ & เพลงพื้นหลัง (Audio Preferences) --- */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/80 flex flex-col gap-8">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-800 logo-font flex items-center gap-2">
                            <span>Audio Preferences</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">เลือกเสียงแป้นพิมพ์และเลือกเพลงพื้นหลังที่คุณชื่นชอบ</p>
                    </div>

                    <div className="flex flex-col gap-8 divide-y divide-gray-100">
                        {/* 1. Keyboard Sound Selection */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-gray-800 font-bold text-base">
                                    <Volume2 size={20} className="text-[#5cb5db]" />
                                    <span>เสียงแป้นพิมพ์ (Keyboard Sound)</span>
                                </div>
                                <span className="text-xs font-bold text-[#5cb5db] bg-blue-50 px-3 py-1 rounded-full logo-font">
                                    {KEYBOARD_SOUNDS.find(k => k.id === selectedKbSound)?.name}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {KEYBOARD_SOUNDS.map((sound) => (
                                    <button
                                        key={sound.id}
                                        type="button"
                                        onClick={() => handleSelectKeyboardSound(sound.id)}
                                        className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-1 ${selectedKbSound === sound.id
                                            ? 'bg-[#5cb5db] text-white shadow-md shadow-blue-200 scale-[1.02]'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/60'
                                            }`}
                                    >
                                        <span className="logo-font">{sound.name}</span>
                                    </button>
                                ))}
                            </div>

                            {selectedKbSound !== 'none' && (
                                <div className="flex items-center gap-4 pt-2">
                                    <span className="text-xs font-semibold text-gray-500 w-24 shrink-0">ระดับเสียงปุ่มกด:</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={sfxVolume}
                                        onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
                                        onMouseUp={handleSfxVolumeCommit}
                                        onTouchEnd={handleSfxVolumeCommit}
                                        className="flex-1 accent-[#5cb5db] cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
                                        style={{
                                            background: `linear-gradient(to right, #5cb5db 0%, #5cb5db ${sfxVolume}%, #e5e7eb ${sfxVolume}%, #e5e7eb 100%)`
                                        }}
                                    />
                                    <span className="text-xs font-bold text-gray-700 w-10 text-right logo-font">{sfxVolume}%</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Background Music Playlist Selection */}
                        <div className="flex flex-col gap-5 pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2.5 text-gray-800 font-bold text-base">
                                        <Music size={20} className="text-[#5cb5db]" />
                                        <span>เพลงพื้นหลัง (Background Music Playlist)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">กดปุ่ม Play เพื่อทดลองฟังแต่ละเพลง และติ๊กเลือกเพลงที่จะให้เล่นวนลูป</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => soundManager.toggleBgm()}
                                    className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${isBgmPlaying
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                        : 'bg-[#5cb5db] hover:bg-[#4a9ec2] text-white'
                                        }`}
                                >
                                    {isBgmPlaying ? <Square size={14} className="fill-white" /> : <Play size={14} className="fill-white" />}
                                    <span>{isBgmPlaying ? 'หยุดเล่น' : 'เล่นเพลง'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {BGM_TRACKS.map((track) => {
                                    const isSelected = selectedBgmTracks.includes(track.id);
                                    const isThisPreviewing = previewingTrackId === track.id;

                                    return (
                                        <div
                                            key={track.id}
                                            onClick={(e) => handleToggleBgmTrack(track.id, e)}
                                            className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer ${isSelected
                                                ? 'bg-blue-50/60 border-[#5cb5db] text-gray-800 shadow-xs'
                                                : 'bg-gray-50/80 border-gray-200 text-gray-400 hover:bg-gray-100/70'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                                <button
                                                    type="button"
                                                    title={isThisPreviewing ? "หยุดฟัง" : "ทดลองฟังเพลงนี้"}
                                                    onClick={(e) => handlePreviewTrack(track.id, e)}
                                                    className={`p-2 rounded-xl shrink-0 transition-all cursor-pointer shadow-xs ${isThisPreviewing
                                                        ? 'bg-amber-500 text-white animate-pulse'
                                                        : 'bg-[#5cb5db] hover:bg-[#4a9ec2] text-white'
                                                        }`}
                                                >
                                                    {isThisPreviewing ? <Pause size={15} /> : <Play size={15} className="fill-white" />}
                                                </button>

                                                <span className="text-xs sm:text-sm font-bold truncate logo-font">{track.title}</span>
                                            </div>

                                            <div className="shrink-0">
                                                {isSelected ? (
                                                    <CheckSquare size={20} className="text-[#5cb5db]" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-md border-2 border-gray-300"></div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <span className="text-xs font-semibold text-gray-500 w-24 shrink-0">ระดับเสียงเพลง:</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={bgmVolume}
                                    onChange={(e) => handleBgmVolumeChange(Number(e.target.value))}
                                    className="flex-1 accent-[#5cb5db] cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
                                    style={{
                                        background: `linear-gradient(to right, #5cb5db 0%, #5cb5db ${bgmVolume}%, #e5e7eb ${bgmVolume}%, #e5e7eb 100%)`
                                    }}
                                />
                                <span className="text-xs font-bold text-gray-700 w-10 text-right logo-font">{bgmVolume}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Section 3: ส่งข้อเสนอแนะ / อยากให้มีอะไร (Feedback System) --- */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/80 flex flex-col gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 text-[#5cb5db] rounded-xl">
                            <MessageSquarePlus size={30} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-800 logo-font">
                                Feedback & Suggestions
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500">อยากให้มีฟีเจอร์อะไร หรือพบปัญหาการใช้งาน สามารถส่งข้อความถึงทีมพัฒนาได้โดยตรง</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-4 max-w-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">ประเภท</label>
                                <select
                                    value={feedbackCategory}
                                    onChange={(e) => setFeedbackCategory(e.target.value)}
                                    className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-sm bg-gray-50"
                                >
                                    <option value="suggestion">เสนอแนะฟีเจอร์ใหม่</option>
                                    <option value="bug">แจ้งบั๊ก / ปัญหา</option>
                                    <option value="content">เนื้อหาบทเรียน</option>
                                    <option value="other">อื่นๆ</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">หัวข้อข้อเสนอแนะ</label>
                                <input
                                    type="text"
                                    value={feedbackTitle}
                                    onChange={(e) => setFeedbackTitle(e.target.value)}
                                    placeholder="เช่น อยากให้มีโหมดพิมพ์แข่งกับเพื่อน"
                                    maxLength={100}
                                    className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700">รายละเอียดเพิ่มเติม</label>
                            <textarea
                                value={feedbackContent}
                                onChange={(e) => setFeedbackContent(e.target.value)}
                                rows={4}
                                placeholder="พิมพ์อธิบายสิ่งที่คุณอยากให้มี หรือความคิดเห็นของคุณที่นี่..."
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-sm resize-none"
                            />
                        </div>

                        <div className="flex justify-start pt-1">
                            <button
                                type="submit"
                                disabled={isSubmittingFeedback || !feedbackTitle || !feedbackContent}
                                className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${isSubmittingFeedback || !feedbackTitle || !feedbackContent
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#5cb5db] hover:bg-[#4a9ec2] text-white shadow-sm hover:shadow-md'
                                    }`}
                            >
                                {isSubmittingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                                <span>ส่งความคิดเห็น</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Section 4: ความปลอดภัย & รหัสผ่าน --- */}
                {profile?.provider === 'Google Account' ? (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
                            <FcGoogle size={28} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-base font-bold text-gray-800 logo-font">Google Account Security</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                บัญชีนี้เข้าสู่ระบบผ่าน Google ความปลอดภัยได้รับการดูแลโดย Google ไม่จำเป็นต้องตั้งรหัสผ่าน
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/80 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <KeyRound size={22} className="text-[#5cb5db]" />
                            <h2 className="text-lg sm:text-xl font-black text-gray-800 logo-font">
                                Change Password
                            </h2>
                        </div>

                        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-xl">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs sm:text-sm font-bold text-gray-700">รหัสผ่านเดิม</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPw ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] focus:ring-4 focus:ring-[#5cb5db]/10 outline-none text-sm text-gray-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-gray-700">รหัสผ่านใหม่</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="อย่างน้อย 8 ตัวอักษร"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] focus:ring-4 focus:ring-[#5cb5db]/10 outline-none text-sm text-gray-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] focus:ring-4 focus:ring-[#5cb5db]/10 outline-none text-sm text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-start pt-2">
                                <button
                                    type="submit"
                                    disabled={isChangingPassword || !newPassword || !currentPassword}
                                    className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${isChangingPassword || !newPassword || !currentPassword
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#5cb5db] hover:bg-[#4a9ec2] text-white shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                                    <span>อัปเดตรหัสผ่าน</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- Section 5: ออกจากระบบ --- */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-gray-200/80 gap-4">
                    <div className="flex flex-col text-center sm:text-left">
                        <h3 className="text-base sm:text-lg font-black text-red-600 logo-font flex items-center justify-center sm:justify-start gap-2">
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">ออกจากระบบบัญชีผู้ใช้นี้บนอุปกรณ์นี้</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-red-500 hover:bg-red-700 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                        ออกจากระบบ
                    </button>
                </div>

            </div>
        </div>
    );
}
