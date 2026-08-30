// lib/adminAuth.ts

export const ADMIN_EMAILS = [
    'ekapholekaphol368@gmail.com'
];

export function isAdmin(email?: string | null): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
