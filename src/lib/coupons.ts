/**
 * Shared applied-coupon storage (cart ↔ checkout).
 * Supports stacking multiple coupons on one order and transparently migrates
 * the old single-coupon localStorage shape.
 */

export interface AppliedCoupon {
    code: string;
    discount: number;
    freeShipping?: boolean;
    message?: string;
}

const KEY = 'anandabazarbdmart_applied_coupons';
const LEGACY_KEY = 'anandabazarbdmart_applied_coupon';

export function loadAppliedCoupons(): AppliedCoupon[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr.filter((c) => c && c.code);
        }
        // Migrate a legacy single-coupon object → one-element array.
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
            const o = JSON.parse(legacy);
            if (o?.code) {
                return [{ code: o.code, discount: o.discount || 0, freeShipping: !!o.freeShipping, message: o.message }];
            }
        }
    } catch {
        /* ignore corrupt storage */
    }
    return [];
}

export function saveAppliedCoupons(coupons: AppliedCoupon[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(KEY, JSON.stringify(coupons));
        localStorage.removeItem(LEGACY_KEY);
    } catch {
        /* ignore */
    }
}

export function clearAppliedCoupons(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(LEGACY_KEY);
    } catch {
        /* ignore */
    }
}

export const couponDiscountTotal = (coupons: AppliedCoupon[]): number =>
    coupons.reduce((s, c) => s + (c.discount || 0), 0);

export const couponHasFreeShipping = (coupons: AppliedCoupon[]): boolean =>
    coupons.some((c) => c.freeShipping);
