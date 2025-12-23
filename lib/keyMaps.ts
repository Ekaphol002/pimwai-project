// lib/keyMaps.ts

// (แถวคีย์บอร์ด - ถูกต้องแล้ว)
export const row1 = ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'];
export const row2 = ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'];
export const row3 = ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'];
export const row4 = ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'];
export const row5 = ['ControlLeft', 'AltLeft', 'CmdLeft', 'Space', 'CmdRight', 'AltRight', 'ControlRight'];

// --- (1. แก้ไข) แผนที่: KeyCode -> ตัวอักษรไทย (โหมดปกติ) ---
export const thaiKeyDisplayMap: { [key: string]: string } = {
  Backquote: '_', Digit1: 'ๅ', Digit2: '/', Digit3: '-', Digit4: 'ภ', Digit5: 'ถ', Digit6: 'ุ', Digit7: 'ึ', Digit8: 'ค', Digit9: 'ต', Digit0: 'จ', Minus: 'ข', Equal: 'ช',
  Tab: 'Tab', KeyQ: 'ๆ', KeyW: 'ไ', KeyE: 'ำ', KeyR: 'พ', KeyT: 'ะ', KeyY: 'ั', KeyU: 'ี', KeyI: 'ร', KeyO: 'น', KeyP: 'ย', BracketLeft: 'บ', BracketRight: 'ล', Backslash: 'ฃ',
  CapsLock: 'Caps Lock', KeyA: 'ฟ', KeyS: 'ห', KeyD: 'ก', KeyF: 'ด', KeyG: 'เ', KeyH: '้', KeyJ: '่', KeyK: 'า', KeyL: 'ส', Semicolon: 'ว', Quote: 'ง',
  ShiftLeft: 'Shift', KeyZ: 'ผ', KeyX: 'ป', KeyC: 'แ', KeyV: 'อ', KeyB: 'ิ',
  // --- (แก้) 'ื' อยู่ที่ KeyN, 'ม' อยู่ที่ KeyM, 'ใ' อยู่ที่ Comma ---
  KeyN: 'ื', KeyM: 'ท', Comma: 'ม', Period: 'ใ', Slash: 'ฝ',
  Space: ' ',
  Enter: 'Enter', ControlLeft: 'Ctrl', AltLeft: 'Alt', CmdLeft: 'Cmd', CmdRight: 'Cmd', AltRight: 'Alt', ControlRight: 'Ctrl', Backspace: 'Backspace', ShiftRight: 'Shift',
};

// --- (2. แก้ไข) แผนที่: KeyCode -> ตัวอักษรไทย (โหมด Shift) ---
export const thaiShiftKeyDisplayMap: { [key: string]: string } = {
  Backquote: '%', Digit1: '+', Digit2: '๑', Digit3: '๒', Digit4: '๓', Digit5: '๔', Digit6: 'ู', Digit7: '฿', Digit8: '๕', Digit9: '๖', Digit0: '๗', Minus: '๘', Equal: '๙',
  KeyQ: '๐', KeyW: '"', KeyE: 'ฎ', KeyR: 'ฑ', KeyT: 'ธ',
  // --- (แก้) '์' (การันต์) อยู่บน 'ั' (KeyY) ---
  KeyY: 'ํ', KeyU: '๊', KeyI: 'ณ', KeyO: 'ฯ', KeyP: 'ญ', BracketLeft: 'ฐ', BracketRight: ',',
  KeyA: 'ฤ', KeyS: 'ฆ', KeyD: 'ฏ', KeyF: 'โ', KeyG: 'ฌ', KeyH: '็', KeyJ: '๋', KeyK: 'ษ', KeyL: 'ศ', Semicolon: 'ซ', Quote: '.',
  KeyZ: '(', KeyX: ')', KeyC: 'ฉ', KeyV: 'ฮ', KeyB: ' ฺ ' ,
  // --- (แก้) '?' อยู่บน 'ท' (KeyM), 'ฬ' อยู่บน 'ม' (Comma) ---
  KeyN: '์', // (จริงๆ KeyN Shift คือ ๊ แต่ ๊ ก็อยู่บน ู (Digit6) ด้วย... เอา ๊ ไปก่อน)
  KeyM: '?', Comma: 'ฬ', Period: 'ฒ', Slash: 'ฦ',
};

// (แผนที่ "ย้อนกลับ" - ไม่ต้องแก้ มันสร้างเองอัตโนมัติ)
const createReverseMap = () => {
  const map: { [key: string]: string } = {};
  for (const key in thaiKeyDisplayMap) {
    map[thaiKeyDisplayMap[key]] = key;
  }
  for (const key in thaiShiftKeyDisplayMap) {
    map[thaiShiftKeyDisplayMap[key]] = key;
  }
  return map;
};
export const reverseThaiKeyMap = createReverseMap();

// (ข้อมูล "มือ" - ไม่ต้องแก้)
export const leftHandKeys = new Set([
  'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT',
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG',
  'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB',
  'Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
]);
export const rightHandKeys = new Set([
  'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
  'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote',
  'KeyN', 'KeyM', 'Comma', 'Period', 'Slash',
  'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal',
  'BracketLeft', 'BracketRight', 'Backslash'
]);