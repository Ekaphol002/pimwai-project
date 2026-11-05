"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import {
    Volume2,
    VolumeX,
    CheckCircle2,
    FileCode,
    Terminal,
    X,
    Save,
    ChevronRight,
    RefreshCw,
    Plus,
    Trash2,
    Cloud,
    SunMedium
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { soundManager } from '@/lib/soundEffects';
import { toDateKey } from '@/lib/streakUtils';
import QuickAudioModal from '@/components/QuickAudioModal/QuickAudioModal';

interface CodeSnippet {
    id: string;
    title: string;
    language: string;
    code: string;
    isCustom?: boolean;
}

interface CodeWordToken {
    globalIdx: number;
    word: string;
    chars: string[];
    lineNum: number;
    isLastInLine: boolean;
}

interface CodeLine {
    lineNum: number;
    indentation: string;
    isEmpty: boolean;
    words: CodeWordToken[];
}

type ContrastLevel = 'hidden' | 'light' | 'medium' | 'high' | 'solid';

const CONTRAST_CONFIG: Record<ContrastLevel, { label: string; textClass: string; desc: string }> = {
    hidden: { label: 'ปิด', textClass: 'text-transparent', desc: '0% (ซ่อนตัวเขียนตาม แต่ตรวจปกติ)' },
    light: { label: 'อ่อน', textClass: 'text-gray-300', desc: '30%' },
    medium: { label: 'ปานกลาง', textClass: 'text-gray-400', desc: '50%' },
    high: { label: 'คมชัด', textClass: 'text-gray-500', desc: '70%' },
    solid: { label: 'เข้มชัดเจน', textClass: 'text-gray-700', desc: '90%' },
};

const PRESET_SNIPPETS: CodeSnippet[] = [
    {
        id: 'php-config',
        title: '1. config.php',
        language: 'PHP',
        code: `<?php
try {
    $conn = new PDO("mysql:host=localhost;dbname=competition_db;charset=utf8", "root", "");
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>`
    },
    {
        id: 'php-dashboard',
        title: '2. dashboard.php',
        language: 'PHP',
        code: `<?php
require_once 'auth.php';
require_once 'config.php';

$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>แดชบอร์ด</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
</head>
<body class="bg-light">
<nav class="navbar navbar-dark bg-primary shadow-sm">
    <div class="container">
        <a class="navbar-brand fw-bold" href="dashboard.php">ระบบสมาชิก</a>
        <div class="d-flex align-items-center gap-2 text-white">
            <span><?= $user['firstname'] . ' ' . $user['lastname'] ?></span>
            <a href="logout.php" class="btn btn-sm btn-light">ออกจากระบบ</a>
        </div>
    </div>
</nav>
<div class="container col-md-8 mt-4">
    <div class="card shadow-sm p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>สวัสดีคุณ <?= $user['firstname'] . ' ' . $user['lastname'] ?></h4>
            <span class="badge <?= $user['role'] === 'admin' ? 'bg-danger' : 'bg-secondary' ?>">สถานะ: <?= $user['role'] ?></span>
        </div>
        <hr>
        <p><b>รหัสสมาชิก (ID):</b> #<?= $user['id'] ?></p>
        <p><b>อีเมล:</b> <?= $user['email'] ?></p>
        <p><b>วันที่สมัครสมาชิก:</b> <?= $user['created_at'] ?></p>
        <div class="d-flex gap-2 mt-3">
            <?php if ($user['role'] === 'admin'): ?>
                <a href="admin_dashboard.php" class="btn btn-dark">จัดการระบบ (Admin)</a>
            <?php endif; ?>
            <a href="profile.php" class="btn btn-primary">แก้ไขข้อมูลส่วนตัว</a>
            <a href="logout.php" class="btn btn-outline-danger ms-auto">ออกจากระบบ</a>
        </div>
    </div>
</div>
</body>
</html>`
    },
    {
        id: 'php-admin-dashboard',
        title: '3. admin_dashboard.php',
        language: 'PHP',
        code: `<?php
require_once 'auth.php';
require_once 'config.php';

if ($_SESSION['role'] !== 'admin') {
    header("Location: dashboard.php");
    exit();
}

if (isset($_GET['delete']) && $_GET['delete'] != $_SESSION['user_id']) {
    $conn->prepare("DELETE FROM users WHERE id = ?")->execute([$_GET['delete']]);
    header("Location: admin_dashboard.php");
    exit();
}

if (isset($_GET['toggle_role']) && $_GET['toggle_role'] != $_SESSION['user_id']) {
    $conn->prepare("UPDATE users SET role = IF(role='admin','user','admin') WHERE id = ?")->execute([$_GET['toggle_role']]);
    header("Location: admin_dashboard.php");
    exit();
}

$all_users = $conn->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>จัดการระบบ (Admin)</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
</head>
<body class="bg-light">
<nav class="navbar navbar-dark bg-dark shadow-sm">
    <div class="container">
        <a class="navbar-brand fw-bold" href="admin_dashboard.php">ระบบจัดการผู้ใช้งาน (Admin)</a>
        <div class="d-flex gap-2">
            <a href="dashboard.php" class="btn btn-sm btn-outline-light">หน้าแดชบอร์ด</a>
            <a href="logout.php" class="btn btn-sm btn-danger">ออกจากระบบ</a>
        </div>
    </div>
</nav>
<div class="container mt-4">
    <div class="card shadow-sm p-4">
        <h5 class="fw-bold mb-3">รายชื่อสมาชิกทั้งหมด (<?= count($all_users) ?> คน)</h5>
        <table class="table table-hover align-middle">
            <thead class="table-light">
                <tr><th>ID</th><th>ชื่อ - นามสกุล</th><th>อีเมล</th><th>สิทธิ์</th><th>วันที่สมัคร</th><th class="text-center">จัดการ</th></tr>
            </thead>
            <tbody>
                <?php foreach ($all_users as $u): ?>
                <tr>
                    <td>#<?= $u['id'] ?></td>
                    <td><?= $u['firstname'] . ' ' . $u['lastname'] ?></td>
                    <td><?= $u['email'] ?></td>
                    <td><span class="badge <?= $u['role'] === 'admin' ? 'bg-danger' : 'bg-secondary' ?>"><?= $u['role'] ?></span></td>
                    <td><?= $u['created_at'] ?></td>
                    <td class="text-center">
                        <?php if ($u['id'] != $_SESSION['user_id']): ?>
                            <a href="?toggle_role=<?= $u['id'] ?>" class="btn btn-sm btn-outline-dark" onclick="return confirm('เปลี่ยนสิทธิ์ผู้ใช้นี้?')">สลับสิทธิ์</a>
                            <a href="?delete=<?= $u['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('ยืนยันการลบสมาชิก?')">ลบ</a>
                        <?php else: ?>
                            <span class="text-muted small">บัญชีของคุณ</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>`
    },
    {
        id: 'php-profile',
        title: '4. profile.php',
        language: 'PHP',
        code: `<?php
require_once 'auth.php';
require_once 'config.php';

$uid = $_SESSION['user_id'];
$error = $success = '';

$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if ($_POST) {
    $action = $_POST['action'] ?? '';

    if ($action === 'update_profile') {
        $fn = trim($_POST['firstname']);
        $ln = trim($_POST['lastname']);
        if (!$fn || !$ln) {
            $error = "กรุณากรอกชื่อและนามสกุลให้ครบ";
        } else {
            $conn->prepare("UPDATE users SET firstname = ?, lastname = ? WHERE id = ?")->execute([$fn, $ln, $uid]);
            $_SESSION['firstname'] = $user['firstname'] = $fn;
            $_SESSION['lastname']  = $user['lastname']  = $ln;
            $success = "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว";
        }
    } elseif ($action === 'change_password') {
        $old = $_POST['old_password'];
        $new = $_POST['new_password'];
        $con = $_POST['confirm_password'];

        if (!password_verify($old, $user['password'])) $error = "รหัสผ่านเดิมไม่ถูกต้อง";
        elseif (strlen($new) < 6)                      $error = "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร";
        elseif ($new !== $con)                         $error = "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน";
        else {
            $hash = password_hash($new, PASSWORD_BCRYPT);
            $conn->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, $uid]);
            $user['password'] = $hash;
            $success = "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>แก้ไขข้อมูลส่วนตัว</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
</head>
<body class="bg-light">
<nav class="navbar navbar-dark bg-primary shadow-sm">
    <div class="container">
        <a class="navbar-brand fw-bold" href="dashboard.php">ระบบสมาชิก</a>
        <div class="d-flex gap-2">
            <a href="dashboard.php" class="btn btn-sm btn-outline-light">กลับหน้าแดชบอร์ด</a>
            <a href="logout.php" class="btn btn-sm btn-light">ออกจากระบบ</a>
        </div>
    </div>
</nav>
<div class="container col-md-7 mt-4 pb-5">
    <?php if ($success): ?><div class="alert alert-success"><?= $success ?></div><?php endif; ?>
    <?php if ($error): ?><div class="alert alert-danger"><?= $error ?></div><?php endif; ?>

    <div class="card shadow-sm p-4 mb-4">
        <h5 class="fw-bold mb-3">แก้ไขข้อมูลส่วนตัว</h5>
        <form method="POST">
            <input type="hidden" name="action" value="update_profile">
            <div class="row mb-3">
                <div class="col"><label>ชื่อจริง</label><input name="firstname" class="form-control" value="<?= $user['firstname'] ?>" required></div>
                <div class="col"><label>นามสกุล</label><input name="lastname" class="form-control" value="<?= $user['lastname'] ?>" required></div>
            </div>
            <div class="mb-3"><label>อีเมล (ไม่สามารถแก้ไขได้)</label><input class="form-control bg-light" value="<?= $user['email'] ?>" disabled></div>
            <button class="btn btn-primary">บันทึกข้อมูล</button>
        </form>
    </div>

    <div class="card shadow-sm p-4">
        <h5 class="fw-bold mb-3">เปลี่ยนรหัสผ่าน</h5>
        <form method="POST">
            <input type="hidden" name="action" value="change_password">
            <div class="mb-3"><label>รหัสผ่านเดิม</label><input type="password" name="old_password" id="p1" class="form-control" required></div>
            <div class="row mb-3">
                <div class="col"><label>รหัสผ่านใหม่</label><input type="password" name="new_password" id="p2" class="form-control" minlength="6" required></div>
                <div class="col"><label>ยืนยันรหัสผ่านใหม่</label><input type="password" name="confirm_password" id="p3" class="form-control" minlength="6" required></div>
            </div>
            <div class="mb-3">
                <input type="checkbox" id="show" onclick="p1.type = p2.type = p3.type = this.checked ? 'text' : 'password'">
                <label for="show">แสดงรหัสผ่าน</label>
            </div>
            <button class="btn btn-warning fw-bold">เปลี่ยนรหัสผ่าน</button>
        </form>
    </div>
</div>
</body>
</html>`
    }
];

const getCodeStorageKey = (email?: string | null) =>
    email ? `pimwai_custom_code_${email}` : 'pimwai_custom_code_guest';
const LOCAL_STORAGE_CONTRAST_KEY = 'pimwai_code_contrast';

// สร้าง Storage Key สำหรับจำเวลาพิมพ์โค้ดของวันนี้ (ตัดรอบเที่ยงคืนเวลาไทย)
const getTodayTimeStorageKey = (email?: string | null) => {
    const todayStr = toDateKey(new Date());
    return email
        ? `pimwai_code_today_time_${email}_${todayStr}`
        : `pimwai_code_today_time_guest_${todayStr}`;
};

// สร้าง Storage Key สำหรับจำความคืบหน้าของโค้ดที่พิมพ์ค้างไว้ (ถึงคำไหน / โค้ดชุดไหน)
const getProgressStorageKey = (email?: string | null) =>
    email ? `pimwai_code_progress_${email}` : 'pimwai_code_progress_guest';

// แปลงเวลาเป็นข้อความภาษาไทยตามสูตร Farm Mode (เช่น "1 ชม. 25 นาที" หรือ "45 นาที 10 วิ" หรือ "15 วิ")
const formatFarmTimeDetailed = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return "0 วิ";
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
        return `${hours} ชม. ${minutes > 0 ? `${minutes} นาที` : ''} ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    }
    if (minutes > 0) {
        return `${minutes} นาที ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    }
    return `${seconds} วิ`;
};

// แปลงโค้ดเป็นบรรทัดและคำ โดยเก็บการเยื้อง (Indentation) และลำดับของแต่ละคำ
function parseCodeIntoLines(codeText: string): { lines: CodeLine[]; allTokens: CodeWordToken[] } {
    const rawLines = codeText.replace(/\r\n/g, '\n').split('\n');
    const lines: CodeLine[] = [];
    const allTokens: CodeWordToken[] = [];
    let globalCounter = 0;

    rawLines.forEach((rawLine, lIdx) => {
        const lineNum = lIdx + 1;
        const indentMatch = rawLine.match(/^[ \t]+/);
        const indentation = indentMatch ? indentMatch[0] : '';
        const trimmed = rawLine.slice(indentation.length);

        if (trimmed.length === 0) {
            lines.push({
                lineNum,
                indentation,
                isEmpty: true,
                words: []
            });
            return;
        }

        const rawWords = trimmed.split(/ +/).filter(w => w.length > 0);
        const wordsOnLine: CodeWordToken[] = rawWords.map((w, wIdx) => {
            const token: CodeWordToken = {
                globalIdx: globalCounter++,
                word: w,
                chars: w.split(''),
                lineNum,
                isLastInLine: wIdx === rawWords.length - 1
            };
            allTokens.push(token);
            return token;
        });

        lines.push({
            lineNum,
            indentation,
            isEmpty: false,
            words: wordsOnLine
        });
    });

    return { lines, allTokens };
}

// ⚡ Memoized Word Component: ป้องกันการ Re-render คำอื่นๆ ทั้งหน้าเวลาพิมพ์ทีละตัวอักษร (แก้ปัญหาคอมวิทยาลัยช้า/หน่วง 100%)
interface MemoCodeWordProps {
    wToken: CodeWordToken;
    isCompleted: boolean;
    isActive: boolean;
    activeInput: string;
    completedTyped: string | undefined;
    untypedClass: string;
    registerWordRef: (idx: number, el: HTMLSpanElement | null) => void;
}

const MemoCodeWord = memo(function MemoCodeWord({
    wToken,
    isCompleted,
    isActive,
    activeInput,
    completedTyped,
    untypedClass,
    registerWordRef
}: MemoCodeWordProps) {
    const targetWord = wToken.word;
    const targetChars = wToken.chars;
    const currentTyped = isActive ? activeInput : (isCompleted ? (completedTyped || '') : '');
    const isHiddenFollow = untypedClass === 'text-transparent';

    return (
        <>
            <span
                ref={el => registerWordRef(wToken.globalIdx, el)}
                className="relative inline-flex items-baseline font-mono"
            >
                {targetChars.map((char, cIdx) => {
                    let colorClass = untypedClass;
                    let displayChar = char;

                    if (isCompleted) {
                        if (cIdx < currentTyped.length) {
                            const isCorrect = currentTyped[cIdx] === char;
                            colorClass = isCorrect ? 'text-gray-800' : 'text-red-500';
                            if (isHiddenFollow) {
                                displayChar = currentTyped[cIdx];
                            }
                        } else {
                            // กรณีเคาะข้ามคำก่อนพิมพ์ครบทุกตัวอักษร
                            colorClass = 'text-red-500';
                            if (isHiddenFollow) {
                                displayChar = '_';
                            }
                        }
                    } else if (isActive) {
                        if (cIdx < currentTyped.length) {
                            const isCorrect = currentTyped[cIdx] === char;
                            colorClass = isCorrect ? 'text-gray-800' : 'text-red-500';
                            if (isHiddenFollow) {
                                displayChar = currentTyped[cIdx];
                            }
                        }
                    }

                    return (
                        <span key={cIdx} className={colorClass}>
                            {displayChar}
                        </span>
                    );
                })}

                {/* ตัวอักษรที่พิมพ์เกินคำเป้าหมาย (Overflow Characters) */}
                {(isActive || isCompleted) && currentTyped.length > targetWord.length && (
                    <span className="text-red-500">
                        {currentTyped.slice(targetWord.length)}
                    </span>
                )}
            </span>

            {/* Fixed Monospace Space between words */}
            {!wToken.isLastInLine && (
                <span className={`select-none font-mono ${untypedClass}`}> </span>
            )}
        </>
    );
}, (prev, next) => {
    // อัปเดตเฉพาะคำที่สถานะเปลี่ยน หรือคำที่กำลังพิมพ์อยู่เท่านั้น คำอื่นอีกหลายร้อยคำไม่ต้องวาดใหม่เลย!
    return (
        prev.isActive === next.isActive &&
        prev.isCompleted === next.isCompleted &&
        prev.activeInput === next.activeInput &&
        prev.completedTyped === next.completedTyped &&
        prev.untypedClass === next.untypedClass &&
        prev.wToken === next.wToken
    );
});

// สร้างคำใบ้ขั้นตอนของบรรทัดปัจจุบัน เพื่อช่วยให้จำโครงสร้างโค้ดได้โดยไม่ต้องเปิดดูตัวเขียนตาม
function getLineStepHint(words: CodeWordToken[]): string {
    if (!words || words.length === 0) return '';
    const lineStr = words.map(w => w.word).join(' ');

    if (lineStr === '<?php' || lineStr === '?>') return 'เปิด/ปิดแท็ก PHP';
    if (lineStr.includes("require_once 'auth.php'")) return 'ดึงไฟล์เช็กการล็อกอิน (auth.php)';
    if (lineStr.includes("require_once 'config.php'")) return 'ดึงไฟล์เชื่อมต่อฐานข้อมูล (config.php)';
    if (lineStr.includes('new PDO(')) return 'เชื่อมต่อฐานข้อมูล MySQL ด้วย PDO (localhost, competition_db, root)';
    if (lineStr.includes('ATTR_ERRMODE')) return 'ตั้งค่า PDO ให้แจ้งเตือนข้อผิดพลาดแบบ Exception';
    if (lineStr.includes('ATTR_DEFAULT_FETCH_MODE')) return 'ตั้งค่า PDO ให้ดึงข้อมูลเป็น Array ชื่อคอลัมน์ (FETCH_ASSOC)';
    if (lineStr.includes('catch (PDOException')) return 'ดักจับข้อผิดพลาดกรณีต่อฐานข้อมูลไม่สำเร็จ';
    if (lineStr.includes('die(')) return 'หยุดทำงานและแสดงข้อความเมื่อเชื่อมต่อล้มเหลว';
    if (lineStr.includes('SELECT * FROM users WHERE id = ?')) return 'เตรียมคำสั่ง SQL ดึงข้อมูลผู้ใช้ปัจจุบันจาก id';
    if (lineStr.includes('->execute([$_SESSION') || lineStr.includes('->execute([$uid])')) return 'ส่งค่า id ของผู้ใช้ที่ล็อกอินเข้าไปรันคำสั่ง SQL';
    if (lineStr.includes('$user = $stmt->fetch()')) return 'ดึงข้อมูลผู้ใช้เก็บลงตัวแปร $user';
    if (lineStr.includes("role'] !== 'admin'")) return 'เช็กสิทธิ์: ถ้าไม่ใช่ admin ให้ดีดกลับหน้า dashboard.php';
    if (lineStr.includes("$_GET['delete']")) return 'เช็กการกดปุ่มลบสมาชิก (และห้ามลบตัวเอง)';
    if (lineStr.includes('DELETE FROM users WHERE id = ?')) return 'สั่งลบสมาชิกออกจากตาราง users ตาม id ที่ส่งมา';
    if (lineStr.includes("$_GET['toggle_role']")) return 'เช็กการกดปุ่มสลับสิทธิ์ (และห้ามสลับสิทธิ์ตัวเอง)';
    if (lineStr.includes("UPDATE users SET role = IF(")) return 'สลับค่า role ระหว่าง admin กับ user ในคำสั่ง SQL เดียว';
    if (lineStr.includes('SELECT * FROM users ORDER BY id ASC')) return 'ดึงรายชื่อสมาชิกทั้งหมดเรียงตาม id จากน้อยไปมาก';
    if (lineStr.includes("action === 'update_profile'")) return 'ส่วนบันทึกการแก้ไขชื่อจริง-นามสกุล';
    if (lineStr.includes('UPDATE users SET firstname = ?, lastname = ?')) return 'อัปเดตชื่อและนามสกุลลงฐานข้อมูลตาม id';
    if (lineStr.includes("$_SESSION['firstname']")) return 'อัปเดตชื่อใน SESSION ให้เปลี่ยนทันที';
    if (lineStr.includes("$_SESSION['lastname']")) return 'อัปเดตนามสกุลใน SESSION ให้เปลี่ยนทันที';
    if (lineStr.includes("action === 'change_password'")) return 'ส่วนตรวจสอบและเปลี่ยนรหัสผ่านใหม่';
    if (lineStr.includes('password_verify(')) return 'ตรวจสอบว่ารหัสผ่านเดิมตรงกับในฐานข้อมูลหรือไม่';
    if (lineStr.includes('strlen($new) < 6')) return 'ตรวจสอบความยาวรหัสผ่านใหม่ต้องไม่ต่ำกว่า 6 ตัวอักษร';
    if (lineStr.includes('$new !== $con')) return 'ตรวจสอบว่ารหัสผ่านใหม่และยืนยันรหัสผ่านตรงกันหรือไม่';
    if (lineStr.includes('password_hash(')) return 'เข้ารหัสรหัสผ่านใหม่ด้วย PASSWORD_BCRYPT';
    if (lineStr.includes('UPDATE users SET password = ?')) return 'บันทึกรหัสผ่านใหม่ที่เข้ารหัสแล้วลงฐานข้อมูล';
    if (lineStr.includes('<link rel="stylesheet"')) return 'ดึงไฟล์ CSS ของ Bootstrap (css/bootstrap.min.css)';
    if (lineStr.includes('<nav class="navbar')) return 'แถบเมนูด้านบน (Bootstrap Navbar)';
    if (lineStr.includes('<table class="table')) return 'ตารางแสดงข้อมูลสมาชิก (Bootstrap Table)';
    if (lineStr.includes('foreach ($all_users as $u)')) return 'วนลูปแสดงข้อมูลสมาชิกทีละคน ($u)';
    if (lineStr.includes('?toggle_role=')) return 'ปุ่มกดสลับสิทธิ์พร้อม confirm ยืนยัน';
    if (lineStr.includes('?delete=')) return 'ปุ่มกดลบสมาชิกพร้อม confirm ยืนยัน';
    if (lineStr.includes('onclick="p1.type')) return 'ติ๊กถูกเพื่อสลับแสดง/ซ่อนรหัสผ่าน (text / password)';
    return '';
}

export default function CodeTypingPage() {
    const { data: session } = useSession();

    // Snippets state
    const [snippets, setSnippets] = useState<CodeSnippet[]>(PRESET_SNIPPETS);
    const [selectedSnippetId, setSelectedSnippetId] = useState<string>(PRESET_SNIPPETS[0].id);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isSavingToServer, setIsSavingToServer] = useState(false);
    const [isSyncingProgress, setIsSyncingProgress] = useState(false);

    // Contrast Level for Target Follow Text (ความเข้มตัวพิมพ์ตาม)
    const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('medium');
    const [isPeekingLine, setIsPeekingLine] = useState(false);
    const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerLinePeek = useCallback(() => {
        setIsPeekingLine(true);
        if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
        peekTimeoutRef.current = setTimeout(() => {
            setIsPeekingLine(false);
        }, 2200);
    }, []);

    // Form state for creating custom snippet
    const [customTitle, setCustomTitle] = useState('');
    const [customLanguage, setCustomLanguage] = useState('TypeScript');
    const [customCode, setCustomCode] = useState('');

    // Farm Mode Typing Engine States
    const [activeWordIdx, setActiveWordIdx] = useState<number>(0);
    const [inputBuffer, setInputBuffer] = useState<string>('');
    const [typedWordsHistory, setTypedWordsHistory] = useState<{ [tokenIdx: number]: string }>({});

    // Live Metrics
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [todayCodeTimeSeconds, setTodayCodeTimeSeconds] = useState<number>(0);
    const [isFinished, setIsFinished] = useState(false);
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

    useEffect(() => {
        const unsub = soundManager.subscribe((state) => {
            setIsSoundOn(state.selectedKbSound !== 'none');
        });
        return () => unsub();
    }, []);

    // ⏱️ Refs สำหรับจับเวลาและซิงค์ข้อมูลเข้าในรหัส (Account Sync) แบบลื่นไหลไม่กระตุก
    const lastTypingTimeRef = useRef<number>(0);
    const lastTimerTickTimeRef = useRef<number>(0);
    const activeTypingAccumulatedMsRef = useRef<number>(0);
    const unsyncedSecondsRef = useRef<number>(0);
    const isDirtyProgressRef = useRef<boolean>(false);
    const isSyncingRef = useRef<boolean>(false);
    const hasRestoredInitialProgressRef = useRef<boolean>(false);

    // Live Refs เพื่อให้อ่านค่าล่าสุดใน Interval / Unload โดยไม่ต้องสร้าง Closure ใหม่ทุกครั้งที่กดคีย์บอร์ด
    const selectedSnippetIdRef = useRef<string>(selectedSnippetId);
    const activeWordIdxRef = useRef<number>(activeWordIdx);
    const inputBufferRef = useRef<string>(inputBuffer);
    const typedWordsHistoryRef = useRef<{ [tokenIdx: number]: string }>(typedWordsHistory);
    const todayCodeTimeSecondsRef = useRef<number>(todayCodeTimeSeconds);

    useEffect(() => { selectedSnippetIdRef.current = selectedSnippetId; }, [selectedSnippetId]);
    useEffect(() => { activeWordIdxRef.current = activeWordIdx; }, [activeWordIdx]);
    useEffect(() => { inputBufferRef.current = inputBuffer; }, [inputBuffer]);
    useEffect(() => { typedWordsHistoryRef.current = typedWordsHistory; }, [typedWordsHistory]);
    useEffect(() => { todayCodeTimeSecondsRef.current = todayCodeTimeSeconds; }, [todayCodeTimeSeconds]);

    // Smooth Floating Caret Ref (อัปเดตผ่าน DOM ตรงๆ ระดับ GPU 60fps ไม่ต้องเรียก setState ทุกครั้งที่พิมพ์!)
    const caretElRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const wordElementsRef = useRef<{ [idx: number]: HTMLSpanElement | null }>({});
    const typedPartRef = useRef<HTMLSpanElement>(null);

    const registerWordRef = useCallback((idx: number, el: HTMLSpanElement | null) => {
        wordElementsRef.current[idx] = el;
    }, []);

    // Load saved contrast level
    useEffect(() => {
        try {
            const savedContrast = localStorage.getItem(LOCAL_STORAGE_CONTRAST_KEY);
            if (savedContrast && savedContrast in CONTRAST_CONFIG) {
                setContrastLevel(savedContrast as ContrastLevel);
            }
        } catch {
            // ignore
        }
    }, []);

    const handleContrastChange = (level: ContrastLevel) => {
        setContrastLevel(level);
        try {
            localStorage.setItem(LOCAL_STORAGE_CONTRAST_KEY, level);
        } catch {
            // ignore
        }
    };

    // ☁️ ฟังก์ชันบันทึกความคืบหน้าและเวลาวันนี้ลง LocalStorage + ซิงค์เข้าในรหัสบัญชี (Database)
    const saveProgressToLocalStorage = useCallback((
        snippetId: string,
        wordIdx: number,
        buffer: string,
        history: { [tokenIdx: number]: string }
    ) => {
        try {
            const key = getProgressStorageKey(session?.user?.email);
            localStorage.setItem(key, JSON.stringify({
                selectedSnippetId: snippetId,
                activeWordIdx: wordIdx,
                inputBuffer: buffer,
                typedWordsHistory: history,
                updatedAt: new Date().toISOString()
            }));
        } catch {
            // ignore
        }
    }, [session?.user?.email]);

    const syncProgressToServer = useCallback(async (forceSync = false) => {
        if (!session?.user?.email) return;
        if (isSyncingRef.current && !forceSync) return;
        if (!isDirtyProgressRef.current && unsyncedSecondsRef.current <= 0 && !forceSync) return;

        isSyncingRef.current = true;
        setIsSyncingProgress(true);

        const addedSec = unsyncedSecondsRef.current;
        unsyncedSecondsRef.current = 0;
        isDirtyProgressRef.current = false;

        try {
            const res = await fetch('/api/code/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedSnippetId: selectedSnippetIdRef.current,
                    activeWordIdx: activeWordIdxRef.current,
                    inputBuffer: inputBufferRef.current,
                    typedWordsHistory: typedWordsHistoryRef.current,
                    todayTimeSeconds: todayCodeTimeSecondsRef.current,
                    addedSeconds: addedSec
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && typeof data.todayTimeSeconds === 'number') {
                    const mergedTime = Math.max(todayCodeTimeSecondsRef.current, data.todayTimeSeconds);
                    setTodayCodeTimeSeconds(mergedTime);
                    todayCodeTimeSecondsRef.current = mergedTime;
                    try {
                        const timeKey = getTodayTimeStorageKey(session?.user?.email);
                        localStorage.setItem(timeKey, String(mergedTime));
                    } catch {
                        // ignore
                    }
                }
            } else {
                unsyncedSecondsRef.current += addedSec;
                isDirtyProgressRef.current = true;
            }
        } catch {
            unsyncedSecondsRef.current += addedSec;
            isDirtyProgressRef.current = true;
        } finally {
            isSyncingRef.current = false;
            setIsSyncingProgress(false);
        }
    }, [session?.user?.email]);

    // โหลด Snippets + เวลาวันนี้ + ตำแหน่งโค้ดล่าสุดที่พิมพ์ค้างไว้ในรหัสบัญชี
    useEffect(() => {
        let isMounted = true;

        async function loadAllAccountData() {
            try {
                const email = session?.user?.email;

                // 1. โหลดเวลาวันนี้จาก LocalStorage ก่อนเพื่อให้แสดงผลทันใจ
                let localTodaySec = 0;
                const timeKey = getTodayTimeStorageKey(email);
                const savedTime = localStorage.getItem(timeKey);
                if (savedTime) {
                    const parsedTime = parseInt(savedTime, 10);
                    if (!isNaN(parsedTime) && parsedTime > 0) {
                        localTodaySec = parsedTime;
                        if (isMounted) {
                            setTodayCodeTimeSeconds(localTodaySec);
                            todayCodeTimeSecondsRef.current = localTodaySec;
                        }
                    }
                }

                // 2. โหลด Custom Snippets จาก LocalStorage
                const storageKey = getCodeStorageKey(email);
                let localCustom: CodeSnippet[] = [];
                let savedSnippets = localStorage.getItem(storageKey);
                if (!savedSnippets && !email) {
                    savedSnippets = localStorage.getItem('pimwai_custom_code_snippets');
                }
                if (savedSnippets) {
                    const parsed = JSON.parse(savedSnippets);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        localCustom = parsed;
                    }
                }

                let allAvailableSnippets = [...PRESET_SNIPPETS, ...localCustom];

                // 3. โหลดความคืบหน้าล่าสุดจาก LocalStorage
                let localProgress: any = null;
                const progressKey = getProgressStorageKey(email);
                const savedProgressStr = localStorage.getItem(progressKey);
                if (savedProgressStr) {
                    try {
                        localProgress = JSON.parse(savedProgressStr);
                    } catch {
                        localProgress = null;
                    }
                }

                // 4. ถ้าล็อกอินแล้ว ดึงทั้ง Snippets และ Progress (เวลาวันนี้ + พิมพ์ถึงตรงไหน) จากฐานข้อมูลในรหัส
                if (email) {
                    const [snippetsRes, progressRes] = await Promise.all([
                        fetch('/api/code/snippets').catch(() => null),
                        fetch('/api/code/progress').catch(() => null)
                    ]);

                    if (snippetsRes && snippetsRes.ok) {
                        const sData = await snippetsRes.json();
                        if (sData.success && Array.isArray(sData.snippets)) {
                            const serverSnippets: CodeSnippet[] = sData.snippets;
                            const serverIds = new Set(serverSnippets.map(s => s.id));
                            const combined = [...serverSnippets];

                            for (const loc of localCustom) {
                                if (!serverIds.has(loc.id) && !serverSnippets.some(s => s.title === loc.title && s.code === loc.code)) {
                                    combined.push(loc);
                                }
                            }
                            allAvailableSnippets = [...PRESET_SNIPPETS, ...combined];
                            try {
                                localStorage.setItem(storageKey, JSON.stringify(combined));
                            } catch {
                                // ignore
                            }
                        }
                    }

                    if (isMounted) {
                        setSnippets(allAvailableSnippets);
                    }

                    if (progressRes && progressRes.ok) {
                        const pData = await progressRes.json();
                        if (pData.success) {
                            const serverTodaySec = Number(pData.todayTimeSeconds) || 0;
                            const bestTodaySec = Math.max(localTodaySec, serverTodaySec);
                            if (isMounted) {
                                setTodayCodeTimeSeconds(bestTodaySec);
                                todayCodeTimeSecondsRef.current = bestTodaySec;
                                try {
                                    localStorage.setItem(timeKey, String(bestTodaySec));
                                } catch {
                                    // ignore
                                }
                            }

                            // ถ้าเวลาในเครื่องมากกว่าบนเซิร์ฟเวอร์ ให้ซิงค์ขึ้นเซิร์ฟเวอร์ด้วย
                            if (localTodaySec > serverTodaySec) {
                                isDirtyProgressRef.current = true;
                            }

                            // เลือกความคืบหน้าที่ใหม่กว่าระหว่างเครื่องกับรหัสบัญชีบนเซิร์ฟเวอร์
                            const serverProg = pData.progress;
                            let targetProg = serverProg;
                            if (localProgress && serverProg) {
                                const localTime = localProgress.updatedAt ? new Date(localProgress.updatedAt).getTime() : 0;
                                const serverTime = serverProg.updatedAt ? new Date(serverProg.updatedAt).getTime() : 0;
                                if (localTime > serverTime) {
                                    targetProg = localProgress;
                                    isDirtyProgressRef.current = true;
                                }
                            } else if (localProgress && !serverProg) {
                                targetProg = localProgress;
                                isDirtyProgressRef.current = true;
                            }

                            if (targetProg && isMounted && !hasRestoredInitialProgressRef.current) {
                                hasRestoredInitialProgressRef.current = true;
                                const validSnippet = allAvailableSnippets.find(s => s.id === targetProg.selectedSnippetId) || allAvailableSnippets[0];
                                const { allTokens: tokensForSnippet } = parseCodeIntoLines(validSnippet.code);
                                const safeIdx = Math.min(
                                    Math.max(0, Number(targetProg.activeWordIdx) || 0),
                                    Math.max(0, tokensForSnippet.length - 1)
                                );

                                setSelectedSnippetId(validSnippet.id);
                                selectedSnippetIdRef.current = validSnippet.id;
                                setActiveWordIdx(safeIdx);
                                activeWordIdxRef.current = safeIdx;
                                setInputBuffer(targetProg.inputBuffer || '');
                                inputBufferRef.current = targetProg.inputBuffer || '';
                                setTypedWordsHistory(targetProg.typedWordsHistory || {});
                                typedWordsHistoryRef.current = targetProg.typedWordsHistory || {};

                                saveProgressToLocalStorage(
                                    validSnippet.id,
                                    safeIdx,
                                    targetProg.inputBuffer || '',
                                    targetProg.typedWordsHistory || {}
                                );
                                return;
                            }
                        }
                    }
                } else {
                    if (isMounted) {
                        setSnippets(allAvailableSnippets);
                    }
                }

                // Fallback: กู้คืนตำแหน่งพิมพ์ล่าสุดจาก LocalStorage (กรณีไม่ได้ล็อกอิน หรือยังไม่มีบนเซิร์ฟเวอร์)
                if (localProgress && isMounted && !hasRestoredInitialProgressRef.current) {
                    hasRestoredInitialProgressRef.current = true;
                    const validSnippet = allAvailableSnippets.find(s => s.id === localProgress.selectedSnippetId) || allAvailableSnippets[0];
                    const { allTokens: tokensForSnippet } = parseCodeIntoLines(validSnippet.code);
                    const safeIdx = Math.min(
                        Math.max(0, Number(localProgress.activeWordIdx) || 0),
                        Math.max(0, tokensForSnippet.length - 1)
                    );

                    setSelectedSnippetId(validSnippet.id);
                    selectedSnippetIdRef.current = validSnippet.id;
                    setActiveWordIdx(safeIdx);
                    activeWordIdxRef.current = safeIdx;
                    setInputBuffer(localProgress.inputBuffer || '');
                    inputBufferRef.current = localProgress.inputBuffer || '';
                    setTypedWordsHistory(localProgress.typedWordsHistory || {});
                    typedWordsHistoryRef.current = localProgress.typedWordsHistory || {};
                }
            } catch (e) {
                console.error('Failed to load code account data:', e);
            }
        }

        loadAllAccountData();
        return () => { isMounted = false; };
    }, [session?.user?.email, saveProgressToLocalStorage]);

    const currentSnippet = useMemo(() => {
        return snippets.find(s => s.id === selectedSnippetId) || snippets[0];
    }, [snippets, selectedSnippetId]);

    // ⚡ Performance Optimization: แปลงโค้ดเฉพาะตอนเปลี่ยนชุดโค้ดเท่านั้น ไม่รันซ้ำตอนพิมพ์
    const { lines, allTokens } = useMemo(() => {
        return parseCodeIntoLines(currentSnippet.code);
    }, [currentSnippet.code]);

    // ⚡ Ultra-Fast Direct DOM Caret Update: เลื่อนเคอร์เซอร์ด้วย GPU Transform โดยไม่เรียก setState (ไม่เกิด React Re-render!)
    const updateCaretPosition = useCallback(() => {
        const currentWordEl = wordElementsRef.current[activeWordIdx];
        const caretEl = caretElRef.current;
        if (!currentWordEl || !textContainerRef.current || !caretEl) return;

        let typedWidth = 0;
        if (typedPartRef.current) {
            typedWidth = typedPartRef.current.offsetWidth;
        }

        const caretHeight = 22;
        const left = currentWordEl.offsetLeft + typedWidth;
        const top = currentWordEl.offsetTop + Math.max(0, (currentWordEl.offsetHeight - caretHeight) / 2);

        caretEl.style.height = `${caretHeight}px`;
        caretEl.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        caretEl.style.opacity = isFinished ? '0' : '1';
    }, [activeWordIdx, isFinished]);

    // Update Caret position on keystroke (Direct DOM manipulation)
    useEffect(() => {
        updateCaretPosition();
    }, [activeWordIdx, inputBuffer, updateCaretPosition, currentSnippet.id]);

    // ⚡ Auto-Scroll เฉพาะเมื่อเปลี่ยนคำและหลุดขอบจอ และใช้การเลื่อนแบบไม่กิน CPU
    useEffect(() => {
        const currentWordEl = wordElementsRef.current[activeWordIdx];
        const container = textContainerRef.current;
        if (currentWordEl && container) {
            const wordTop = currentWordEl.offsetTop;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;

            if (wordTop < containerScrollTop + 30 || wordTop > containerScrollTop + containerHeight - 70) {
                container.scrollTop = Math.max(0, wordTop - 60);
            }
        }
    }, [activeWordIdx, currentSnippet.id]);

    useEffect(() => {
        window.addEventListener('resize', updateCaretPosition);
        return () => window.removeEventListener('resize', updateCaretPosition);
    }, [updateCaretPosition]);

    // Reset practice (เริ่มพิมพ์โค้ดชุดนั้นใหม่ตั้งแต่ต้น หรือสลับไปชุดอื่น)
    const resetPractice = useCallback((newSnippetId?: string) => {
        const targetId = newSnippetId || selectedSnippetIdRef.current;
        if (newSnippetId) {
            setSelectedSnippetId(newSnippetId);
            selectedSnippetIdRef.current = newSnippetId;
        }
        setActiveWordIdx(0);
        activeWordIdxRef.current = 0;
        setInputBuffer('');
        inputBufferRef.current = '';
        setTypedWordsHistory({});
        typedWordsHistoryRef.current = {};
        setStartTime(null);
        setElapsedSeconds(0);
        setIsFinished(false);
        setTotalKeystrokes(0);
        setCorrectKeystrokes(0);
        setErrorCount(0);
        lastTypingTimeRef.current = 0;
        lastTimerTickTimeRef.current = 0;
        activeTypingAccumulatedMsRef.current = 0;

        // บันทึกสถานะที่รีเซ็ตลงในเครื่องและคิวซิงค์เข้าบัญชี
        saveProgressToLocalStorage(targetId, 0, '', {});
        isDirtyProgressRef.current = true;
        setTimeout(() => {
            syncProgressToServer(true);
            inputRef.current?.focus();
        }, 50);
    }, [saveProgressToLocalStorage, syncProgressToServer]);

    // ⏱️ นับเวลาเล่นเฉพาะขณะกำลังพิมพ์อยู่จริง (สูตร Farm Mode เป๊ะ + ประหยัด CPU สำหรับคอมสเปคต่ำ)
    useEffect(() => {
        if (!startTime || isFinished) return;

        lastTimerTickTimeRef.current = Date.now();

        const interval = setInterval(() => {
            const now = Date.now();
            const lastTick = lastTimerTickTimeRef.current || now;
            const deltaMs = Math.min(1000, Math.max(0, now - lastTick));
            lastTimerTickTimeRef.current = now;

            // ตรวจจับว่ากำลังพิมพ์อยู่จริง: มีการกดปุ่มพิมพ์ภายใน 1.2 วินาทีที่ผ่านมา
            const timeSinceLastKeypress = now - (lastTypingTimeRef.current || 0);
            const isActivelyTyping = timeSinceLastKeypress < 1200;

            if (isActivelyTyping) {
                activeTypingAccumulatedMsRef.current += deltaMs;

                // สะสมเวลาพิมพ์จริงครบทุกๆ 1,000 มิลลิวินาที (1 วินาทีเต็ม)
                if (activeTypingAccumulatedMsRef.current >= 1000) {
                    const addedSec = Math.floor(activeTypingAccumulatedMsRef.current / 1000);
                    activeTypingAccumulatedMsRef.current %= 1000;

                    setElapsedSeconds(prev => prev + addedSec);
                    setTodayCodeTimeSeconds(prev => {
                        const nextSec = prev + addedSec;
                        todayCodeTimeSecondsRef.current = nextSec;
                        try {
                            const key = getTodayTimeStorageKey(session?.user?.email);
                            localStorage.setItem(key, String(nextSec));
                        } catch {
                            // ignore
                        }
                        return nextSec;
                    });

                    unsyncedSecondsRef.current += addedSec;
                    isDirtyProgressRef.current = true;
                }
            } else {
                // ถ้าหยุดพิมพ์เกิน 1.2 วินาที ให้ตัดเศษ ms ทิ้ง เพื่อหยุดเวลาทันทีอย่างสมบูรณ์
                activeTypingAccumulatedMsRef.current = 0;
            }
        }, 250);

        return () => clearInterval(interval);
    }, [startTime, isFinished, session?.user?.email]);

    // ☁️ ซิงค์เวลาและตำแหน่งโค้ดที่พิมพ์ค้างไว้เข้าในรหัสอัตโนมัติ (ทุก 4 วินาทีเมื่อมีการพิมพ์ และเมื่อสลับหน้า/ปิดแท็บ)
    useEffect(() => {
        if (!session?.user?.email) return;

        const syncInterval = setInterval(() => {
            if (isDirtyProgressRef.current || unsyncedSecondsRef.current > 0) {
                syncProgressToServer();
            }
        }, 4000);

        const handleBeforeUnload = () => {
            if ((isDirtyProgressRef.current || unsyncedSecondsRef.current > 0) && session?.user?.email) {
                const payload = JSON.stringify({
                    selectedSnippetId: selectedSnippetIdRef.current,
                    activeWordIdx: activeWordIdxRef.current,
                    inputBuffer: inputBufferRef.current,
                    typedWordsHistory: typedWordsHistoryRef.current,
                    todayTimeSeconds: todayCodeTimeSecondsRef.current,
                    addedSeconds: unsyncedSecondsRef.current
                });
                navigator.sendBeacon?.('/api/code/progress', new Blob([payload], { type: 'application/json' }));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (isDirtyProgressRef.current || unsyncedSecondsRef.current > 0) {
                syncProgressToServer(true);
            }
        };
    }, [session?.user?.email, syncProgressToServer]);

    // Calculate metrics
    const wpm = useMemo(() => {
        if (!elapsedSeconds || elapsedSeconds === 0) return 0;
        const minutes = elapsedSeconds / 60;
        const words = correctKeystrokes / 5;
        return Math.round(words / minutes);
    }, [elapsedSeconds, correctKeystrokes]);

    const cpm = useMemo(() => {
        if (!elapsedSeconds || elapsedSeconds === 0) return 0;
        const minutes = elapsedSeconds / 60;
        return Math.round(correctKeystrokes / minutes);
    }, [elapsedSeconds, correctKeystrokes]);

    const accuracy = useMemo(() => {
        if (totalKeystrokes === 0) return 100;
        return Math.round((correctKeystrokes / totalKeystrokes) * 100);
    }, [totalKeystrokes, correctKeystrokes]);

    const currentToken = allTokens[activeWordIdx];
    const activeLineObj = useMemo(() => {
        if (!currentToken) return null;
        return lines.find(l => l.lineNum === currentToken.lineNum) || null;
    }, [lines, currentToken]);

    const activeLineHint = useMemo(() => {
        if (currentSnippet.isCustom || !activeLineObj) return '';
        return getLineStepHint(activeLineObj.words);
    }, [currentSnippet.isCustom, activeLineObj]);

    // Handle typing events strictly following Farm Mode principle
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isFinished || !currentToken) return;

        // กด Tab เพื่อแอบดูคำใบ้บรรทัดปัจจุบันชั่วคราว (มีประโยชน์มากตอนปิดตัวเขียนตาม)
        if (e.key === 'Tab') {
            e.preventDefault();
            triggerLinePeek();
            return;
        }

        const now = Date.now();
        lastTypingTimeRef.current = now;

        // Start timer on first printable key
        if (!startTime && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            setStartTime(now);
        }

        const isSpace = e.key === ' ' || e.code === 'Space';
        const isEnter = e.key === 'Enter';

        // 1. กด SPACEBAR หรือ ENTER เมื่อจบคำ
        if (isSpace || (isEnter && currentToken.isLastInLine)) {
            e.preventDefault();

            // ไม่ให้กดข้ามถ้ายังไม่ได้เริ่มพิมพ์ในคำนั้น (เหมือนโหมดฟาร์ม)
            if (inputBuffer.length === 0) return;

            if (isSoundOn) soundManager.playKeySound();

            const isWordCorrect = inputBuffer === currentToken.word;
            const nextHistory = { ...typedWordsHistoryRef.current, [activeWordIdx]: inputBuffer };

            setTypedWordsHistory(nextHistory);
            typedWordsHistoryRef.current = nextHistory;

            setTotalKeystrokes(prev => prev + 1);

            if (isWordCorrect) {
                setCorrectKeystrokes(prev => prev + 1);
            } else {
                setErrorCount(prev => prev + 1);
            }

            // ถ้าเป็นคำสุดท้ายของโค้ดชุดนี้
            if (activeWordIdx + 1 >= allTokens.length) {
                setIsFinished(true);
                // เมื่อพิมพ์จบชุด ให้เซ็ตตำแหน่งกลับไปที่ 0 เผื่อเปิดมาใหม่จะได้พร้อมเล่นทันที แต่เก็บเวลาวันนี้ไว้ครบถ้วน
                saveProgressToLocalStorage(selectedSnippetIdRef.current, 0, '', {});
                activeWordIdxRef.current = 0;
                inputBufferRef.current = '';
                typedWordsHistoryRef.current = {};
                isDirtyProgressRef.current = true;
                syncProgressToServer(true);
                toast.success('🎉 พิมพ์โค้ดเสร็จสมบูรณ์!');
                return;
            }

            const nextWordIdx = activeWordIdx + 1;
            setActiveWordIdx(nextWordIdx);
            activeWordIdxRef.current = nextWordIdx;
            setInputBuffer('');
            inputBufferRef.current = '';

            // เซฟตำแหน่งคำปัจจุบันลงเครื่องทันที + ตั้งสถานะให้ซิงค์เข้ารหัส
            saveProgressToLocalStorage(selectedSnippetIdRef.current, nextWordIdx, '', nextHistory);
            isDirtyProgressRef.current = true;
            return;
        }

        // 2. กด BACKSPACE (ลบทีละตัว / ถอยกลับคำก่อนหน้าได้)
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (isSoundOn) soundManager.playKeySound();

            if (inputBuffer.length > 0) {
                const nextBuf = inputBuffer.slice(0, -1);
                setInputBuffer(nextBuf);
                inputBufferRef.current = nextBuf;
                saveProgressToLocalStorage(selectedSnippetIdRef.current, activeWordIdx, nextBuf, typedWordsHistoryRef.current);
                isDirtyProgressRef.current = true;
            } else if (activeWordIdx > 0) {
                const prevIdx = activeWordIdx - 1;
                const prevTyped = typedWordsHistoryRef.current[prevIdx] || '';
                setActiveWordIdx(prevIdx);
                activeWordIdxRef.current = prevIdx;
                setInputBuffer(prevTyped);
                inputBufferRef.current = prevTyped;
                saveProgressToLocalStorage(selectedSnippetIdRef.current, prevIdx, prevTyped, typedWordsHistoryRef.current);
                isDirtyProgressRef.current = true;
            }
            return;
        }

        // ละเว้นปุ่มควบคุม
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }

        // 3. พิมพ์ตัวอักษรปกติ (ตรวจจับทีละตัวทันทีที่กด เหมือนโหมดฟาร์ม)
        if (e.key.length === 1) {
            e.preventDefault();
            if (isSoundOn) soundManager.playKeySound(undefined, e as any);

            setTotalKeystrokes(prev => prev + 1);

            const nextCharIdx = inputBuffer.length;
            const targetChar = currentToken.word[nextCharIdx];
            const isCharCorrect = e.key === targetChar;

            if (isCharCorrect) {
                setCorrectKeystrokes(prev => prev + 1);
            } else {
                setErrorCount(prev => prev + 1);
            }

            const nextBuf = inputBuffer + e.key;
            setInputBuffer(nextBuf);
            inputBufferRef.current = nextBuf;

            saveProgressToLocalStorage(selectedSnippetIdRef.current, activeWordIdx, nextBuf, typedWordsHistoryRef.current);
            isDirtyProgressRef.current = true;
        }
    };

    // 💾 บันทึกโค้ดลงในรหัสบัญชี (Database Account) + สำรองใน localStorage
    const handleSaveCustomSnippet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle.trim() || !customCode.trim()) {
            toast.error('กรุณาระบุชื่อและใส่โค้ดให้ครบถ้วน');
            return;
        }

        const cleanTitle = customTitle.trim();
        const cleanLanguage = customLanguage;
        const cleanCode = customCode.replace(/\r\n/g, '\n');

        const tempId = `custom-${Date.now()}`;
        const newSnippet: CodeSnippet = {
            id: tempId,
            title: cleanTitle,
            language: cleanLanguage,
            code: cleanCode,
            isCustom: true
        };

        // แสดงผลทันทีในเครื่อง (Optimistic update)
        const existingCustom = snippets.filter(s => s.isCustom);
        const updatedCustom = [newSnippet, ...existingCustom];
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);
        setSelectedSnippetId(newSnippet.id);
        resetPractice(newSnippet.id);

        setCustomTitle('');
        setCustomCode('');
        setIsCustomModalOpen(false);

        // เซฟลง localStorage ตามบัญชี
        const storageKey = getCodeStorageKey(session?.user?.email);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
        } catch {
            // ignore
        }

        // ☁️ เซฟลงในรหัสบัญชีผู้ใช้ใน Database
        if (session?.user?.email) {
            setIsSavingToServer(true);
            try {
                const res = await fetch('/api/code/snippets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: cleanTitle,
                        language: cleanLanguage,
                        code: cleanCode
                    })
                });
                const data = await res.json();
                if (data.success && data.snippet) {
                    const serverSnippet = data.snippet;
                    const finalCustom = [serverSnippet, ...existingCustom.filter(s => s.id !== tempId)];
                    setSnippets([...PRESET_SNIPPETS, ...finalCustom]);
                    setSelectedSnippetId(serverSnippet.id);
                    selectedSnippetIdRef.current = serverSnippet.id;
                    localStorage.setItem(storageKey, JSON.stringify(finalCustom));
                    saveProgressToLocalStorage(serverSnippet.id, 0, '', {});
                    isDirtyProgressRef.current = true;
                    syncProgressToServer(true);
                    toast.success('บันทึกโค้ดลงในรหัสบัญชีเรียบร้อย!');
                    return;
                }
            } catch (err) {
                console.error('Error saving snippet to server:', err);
            } finally {
                setIsSavingToServer(false);
            }
        }

        toast.success('บันทึกโค้ดของคุณเรียบร้อยแล้ว!');
    };

    // ลบ Custom Snippet ออกจากบัญชีและเครื่อง
    const handleDeleteSnippet = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const storageKey = getCodeStorageKey(session?.user?.email);
        const updatedCustom = snippets.filter(s => s.isCustom && s.id !== id);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
        } catch {
            // ignore
        }
        setSnippets([...PRESET_SNIPPETS, ...updatedCustom]);

        if (selectedSnippetId === id) {
            resetPractice(PRESET_SNIPPETS[0].id);
        }

        if (session?.user?.email && !id.startsWith('custom-')) {
            try {
                await fetch(`/api/code/snippets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Error deleting from server:', err);
            }
        }

        toast.success('ลบโค้ดเรียบร้อย');
    };

    const untypedClass = CONTRAST_CONFIG[contrastLevel].textClass;

    return (
        <div className="min-h-screen bg-[#f4f7fb] pt-6 pb-20 px-4 sm:px-6 flex flex-col items-center font-sans">
            <Toaster position="top-center" />

            <div className="w-full max-w-5xl flex flex-col gap-5">

                {/* 🌟 Top Control Pill - Pure White Card with Soft Shadow (สไตล์ Farm Mode) */}
                <div className="bg-white px-5 sm:px-6 py-3 rounded-3xl shadow-md border border-blue-50/60 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">

                    {/* Left: Snippets Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Terminal size={15} className="text-[#5cb5db] mr-1 shrink-0" />
                        {snippets.map(s => {
                            const isSelected = s.id === selectedSnippetId;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        if (s.id !== selectedSnippetId) {
                                            resetPractice(s.id);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs sm:text-sm ${isSelected
                                        ? 'bg-[#5cb5db] text-white shadow-xs font-bold'
                                        : 'hover:text-[#5cb5db] hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{s.title}</span>
                                    {s.isCustom && (
                                        <>
                                            <span title="บันทึกในรหัสบัญชีแล้ว">
                                                <Cloud size={11} className={isSelected ? 'text-white/80' : 'text-blue-400'} />
                                            </span>
                                            <span
                                                title="ลบโค้ด"
                                                onClick={(e) => handleDeleteSnippet(s.id, e)}
                                                className="hover:text-red-300 ml-0.5 cursor-pointer inline-flex items-center"
                                            >
                                                <Trash2 size={12} />
                                            </span>
                                        </>
                                    )}
                                </button>
                            );
                        })}

                        {/* Button: Add Custom Code */}
                        <button
                            type="button"
                            onClick={() => setIsCustomModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer font-bold text-xs sm:text-sm ml-1"
                        >
                            <Plus size={15} />
                            <span>ใส่โค้ดของคุณ</span>
                        </button>
                    </div>

                    {/* Right: Contrast Level Selector (ความเข้มตัวพิมพ์ตาม) & Sound */}
                    <div className="flex items-center gap-3">
                        {/* Contrast Selector */}
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-xl border border-gray-100 text-xs">
                            <SunMedium size={14} className="text-amber-500 shrink-0 ml-1" />
                            <span className="text-gray-400 font-medium hidden sm:inline mr-1">ความเข้ม:</span>
                            {(Object.keys(CONTRAST_CONFIG) as ContrastLevel[]).map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleContrastChange(lvl)}
                                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${contrastLevel === lvl
                                        ? 'bg-white text-gray-800 shadow-xs border border-gray-200'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title={`ความเข้มตัวพิมพ์ตาม ${CONTRAST_CONFIG[lvl].desc}`}
                                >
                                    {CONTRAST_CONFIG[lvl].label}
                                </button>
                            ))}
                        </div>

                        {/* Audio & Music Settings Text Button */}
                        <button
                            type="button"
                            onClick={() => setIsAudioModalOpen(true)}
                            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#5cb5db] transition-colors cursor-pointer px-1"
                            title="ตั้งค่าเสียงและเพลง"
                        >
                            เสียง/เพลง
                        </button>
                    </div>

                </div>

                {/* ⌨️ Main Typing Stream Box (กล่องสีขาวใหญ่ เหมือนโหมดฟาร์มเป๊ะ) */}
                <div
                    onClick={() => inputRef.current?.focus()}
                    className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-md relative min-h-[460px] flex flex-col justify-between overflow-hidden border border-blue-50 cursor-text"
                >
                    {/* Hidden Textarea for Input */}
                    <textarea
                        ref={inputRef}
                        value=""
                        onChange={() => { }}
                        onKeyDown={handleKeyDown}
                        className="opacity-0 absolute -top-9999px left-0 w-1 h-1 pointer-events-none"
                        autoFocus
                    />

                    {isFinished ? (
                        /* Results Screen inside Card */
                        <div className="py-6 flex flex-col justify-between flex-1">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center text-emerald-500 mb-3">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mb-2">
                                    ยอดเยี่ยม! คุณพิมพ์โค้ดชุดนี้ผ่านแล้ว
                                </h2>
                                <p className="text-sm text-gray-400">
                                    สถิติความเร็วและความแม่นยำในการพิมพ์โค้ด (Code Typing Practice)
                                </p>
                            </div>

                            {/* Stats Grid inside Result */}
                            <div className="my-8 flex flex-col items-center">
                                <div className="mb-6 flex flex-col items-center">
                                    <div className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">ความเร็วเฉลี่ย</div>
                                    <div className="text-6xl sm:text-7xl font-black text-[#5cb5db] tracking-tight leading-none logo-font">
                                        {wpm}
                                    </div>
                                    <div className="text-xs font-bold text-[#5cb5db]/70 tracking-widest uppercase mt-1">wpm</div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-center w-full max-w-2xl pt-6 border-t border-gray-100">
                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">acc</div>
                                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 leading-tight logo-font">
                                            {accuracy}%
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ความแม่นยำ
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">cpm</div>
                                        <div className="text-2xl sm:text-3xl font-black text-purple-600 leading-tight logo-font">
                                            {cpm}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ตัวอักษรต่อนาที
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">errors</div>
                                        <div className="text-2xl sm:text-3xl font-black text-red-500 leading-tight logo-font">
                                            {errorCount}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ครั้งที่พิมพ์ผิด
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm sm:text-base font-bold text-gray-400 tracking-wider lowercase mb-1 logo-font">time</div>
                                        <div className="text-2xl sm:text-3xl font-black text-gray-800 leading-tight logo-font">
                                            {elapsedSeconds}s
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                                            ระยะเวลาที่ใช้
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-center gap-10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextIdx = (snippets.findIndex(s => s.id === selectedSnippetId) + 1) % snippets.length;
                                            resetPractice(snippets[nextIdx].id);
                                        }}
                                        className="text-gray-400 hover:text-[#5cb5db] transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer p-3 rounded-2xl select-none"
                                        title="โค้ดถัดไป"
                                    >
                                        <ChevronRight size={34} strokeWidth={2.8} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => resetPractice()}
                                        className="text-gray-400 hover:text-gray-800 transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer p-3 rounded-2xl select-none"
                                        title="พิมพ์ซ้ำ (โค้ดเดิม)"
                                    >
                                        <RefreshCw size={28} strokeWidth={2.8} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Top Stats Header inside card */}
                            <div className="flex items-center justify-between gap-4 pb-4 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <div className="px-3 py-1 bg-gradient-to-r from-[#0c648b] to-[#5cb5db] text-white font-black text-xs rounded-full uppercase tracking-wider shadow-xs">
                                        {currentSnippet.title}
                                    </div>
                                    <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-bold text-[11px] rounded-full">
                                        {currentSnippet.language}
                                    </span>
                                    {!currentSnippet.isCustom && activeLineHint && (
                                        <span className="px-3 py-1 bg-gray-800 text-white font-bold text-xs rounded-full shadow-xs">
                                            คำใบ้: {activeLineHint}
                                        </span>
                                    )}
                                    {!currentSnippet.isCustom && contrastLevel === 'hidden' && (
                                        <button
                                            type="button"
                                            onClick={triggerLinePeek}
                                            className="px-3 py-1 bg-[#0c648b] hover:bg-[#094b69] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer transition-colors"
                                            title="กดปุ่ม Tab บนคีย์บอร์ดเพื่อแอบดูบรรทัดปัจจุบันชั่วคราว 2 วินาที"
                                        >
                                            แอบดูบรรทัดนี้ (กด Tab)
                                        </button>
                                    )}
                                </div>

                                {/* Right Area: เวลาวันนี้ (วางไว้ข้างซ้ายปุ่มรีเซ็ต) + Quick Reset Button */}
                                <div className="flex items-center gap-2.5 sm:gap-3.5 select-none">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-400" title="เวลาพิมพ์โค้ดของวันนี้ทั้งหมด (ซิงค์เข้าในรหัสบัญชี)">
                                        <span>เวลาวันนี้:</span>
                                        <strong className="text-sm sm:text-base font-black text-gray-800 logo-font">
                                            {formatFarmTimeDetailed(todayCodeTimeSeconds)}
                                        </strong>
                                    </div>

                                    <div className="w-[1px] h-4 bg-gray-200 hidden sm:block"></div>

                                    <button
                                        type="button"
                                        onClick={() => resetPractice()}
                                        className="text-gray-400 hover:text-gray-700 hover:scale-110 active:scale-95 transition-transform cursor-pointer p-1.5"
                                        title="เริ่มพิมพ์โค้ดชุดนี้ใหม่ตั้งแต่ต้น (Restart)"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* ⌨️ Code Text Stream Area (High-Performance Memoized Engine สำหรับคอมทุกสเปค) */}
                            <div
                                ref={textContainerRef}
                                className="relative flex-1 overflow-x-auto overflow-y-auto max-h-[380px] font-mono text-lg sm:text-xl leading-relaxed py-4 pr-2 antialiased select-none"
                            >
                                {/* 🎯 Direct-DOM GPU Caret (เลื่อนสมูท 60fps โดยไม่ก่อให้เกิด React Re-render และไม่ใช้ animate-pulse ที่กินเครื่อง) */}
                                <div
                                    ref={caretElRef}
                                    className="absolute left-0 top-0 w-[2.5px] bg-[#5cb5db] rounded-full pointer-events-none z-30"
                                    style={{
                                        height: '22px',
                                        transform: 'translate3d(0px, 0px, 0)',
                                        transition: 'transform 65ms ease-out',
                                        willChange: 'transform',
                                    }}
                                />

                                {/* Reference span สำหรับวัดความกว้างของตัวที่พิมพ์ในคำ เพื่อวางตำแหน่ง Caret ให้เป๊ะ */}
                                <span
                                    ref={typedPartRef}
                                    aria-hidden="true"
                                    className="opacity-0 pointer-events-none absolute left-0 top-0 select-none font-mono text-lg sm:text-xl whitespace-pre"
                                >
                                    {currentToken ? currentToken.word.slice(0, Math.min(inputBuffer.length, currentToken.word.length)) : ''}
                                    {currentToken && inputBuffer.length > currentToken.word.length ? inputBuffer.slice(currentToken.word.length) : ''}
                                </span>

                                {lines.map((line) => {
                                    return (
                                        <div key={line.lineNum} className="flex items-baseline leading-8 min-h-[32px]">
                                            {/* Line Number */}
                                            <div className="select-none text-gray-300 pr-4 text-right border-r border-gray-100 mr-4 shrink-0 font-mono text-sm w-8">
                                                {line.lineNum}
                                            </div>

                                            {/* Code Line Content with Static Monospace Spaces */}
                                            <div className="flex-1 whitespace-pre flex flex-wrap items-baseline font-mono">
                                                {/* Line Indentation */}
                                                {line.indentation && (
                                                    <span className="select-none text-transparent font-mono">
                                                        {line.indentation}
                                                    </span>
                                                )}

                                                {/* Words on this line (Memoized to prevent lag on school PCs) */}
                                                {line.words.map((wToken) => {
                                                    const isCompleted = wToken.globalIdx < activeWordIdx;
                                                    const isActive = wToken.globalIdx === activeWordIdx;
                                                    const effectiveUntypedClass = (contrastLevel === 'hidden' && isPeekingLine && currentToken?.lineNum === line.lineNum)
                                                        ? 'text-gray-400'
                                                        : untypedClass;

                                                    return (
                                                        <MemoCodeWord
                                                            key={wToken.globalIdx}
                                                            wToken={wToken}
                                                            isCompleted={isCompleted}
                                                            isActive={isActive}
                                                            activeInput={isActive ? inputBuffer : ''}
                                                            completedTyped={isCompleted ? typedWordsHistory[wToken.globalIdx] : undefined}
                                                            untypedClass={effectiveUntypedClass}
                                                            registerWordRef={registerWordRef}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Helper Bar */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#5cb5db]" />
                                    <span>เคาะ <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold border border-gray-200">Spacebar</kbd> เพื่อจบคำ หรือ <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold border border-gray-200">Enter</kbd> เมื่อจบบรรทัด (เซฟจุดที่พิมพ์อัตโนมัติ)</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span>คำ: {activeWordIdx} / {allTokens.length}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* 📝 Modal: ใส่โค้ดของคุณ (Custom Snippet Modal) */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-50">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-[#5cb5db] rounded-2xl">
                                    <FileCode size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">ใส่โค้ดที่คุณต้องการฝึก</h3>
                                    <p className="text-xs text-gray-400">บันทึกเชื่อมกับรหัสบัญชีของคุณ ใช้ได้ทุกเครื่องรวมถึงคอมวิทยาลัย</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCustomModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCustomSnippet} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    ชื่อชุดโค้ด
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="เช่น My Algorithm, Auth Middleware..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#5cb5db] focus:bg-white transition"
                                    maxLength={40}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    ภาษา (Language)
                                </label>
                                <select
                                    value={customLanguage}
                                    onChange={(e) => setCustomLanguage(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-[#5cb5db] focus:bg-white transition cursor-pointer"
                                >
                                    <option value="TypeScript">TypeScript</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Python">Python</option>
                                    <option value="HTML/CSS">HTML / CSS</option>
                                    <option value="SQL">SQL</option>
                                    <option value="C++">C++</option>
                                    <option value="Java">Java</option>
                                    <option value="Go">Go</option>
                                    <option value="PHP">PHP</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    โค้ด (วางโค้ดที่ต้องการฝึกพิมพ์ที่นี่)
                                </label>
                                <textarea
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value)}
                                    rows={8}
                                    placeholder="// Paste your code here..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#5cb5db] focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingToServer}
                                    className="px-5 py-2.5 bg-[#5cb5db] hover:bg-[#4ba3c7] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    <span>{isSavingToServer ? 'กำลังบันทึกลงบัญชี...' : 'บันทึกลงบัญชี'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🎵 Audio & YouTube Music Settings Modal */}
            <QuickAudioModal
                isOpen={isAudioModalOpen}
                onClose={() => {
                    setIsAudioModalOpen(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                onKeyboardSoundChange={(soundId) => setIsSoundOn(soundId !== 'none')}
            />
        </div>
    );
}
