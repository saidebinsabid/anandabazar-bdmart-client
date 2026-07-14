import {
    LuClock,
    LuCircleCheck,
    LuPackage,
    LuTruck,
    LuNavigation,
    LuMapPin,
    LuCircleAlert,
    LuCircleX,
    LuRotateCcw,
    LuDollarSign,
} from 'react-icons/lu';
import type { ElementType } from 'react';

export interface OrderStatusConfig {
    label: string;
    badgeBg: string;
    badgeText: string;
    dot: string;
    icon: ElementType;
}

// ===== Single source of truth for the 11-state order lifecycle =====
export const ORDER_STATUS_CONFIG: Record<string, OrderStatusConfig> = {
    pending: {
        label: 'Pending',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        dot: 'bg-amber-500',
        icon: LuClock,
    },
    confirmed: {
        label: 'Confirmed',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        dot: 'bg-blue-500',
        icon: LuCircleCheck,
    },
    processing: {
        label: 'Processing',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        dot: 'bg-purple-500',
        icon: LuPackage,
    },
    shipped: {
        label: 'Shipped',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        dot: 'bg-indigo-500',
        icon: LuTruck,
    },
    on_the_way: {
        label: 'On The Way',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        dot: 'bg-sky-500',
        icon: LuNavigation,
    },
    out_for_delivery: {
        label: 'Out For Delivery',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        dot: 'bg-teal-500',
        icon: LuTruck,
    },
    delivery_attempt: {
        label: 'Delivery Attempt',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        dot: 'bg-orange-500',
        icon: LuCircleAlert,
    },
    delivered: {
        label: 'Delivered',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        dot: 'bg-emerald-500',
        icon: LuCircleCheck,
    },
    cancelled: {
        label: 'Cancelled',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-700',
        dot: 'bg-red-500',
        icon: LuCircleX,
    },
    returned: {
        label: 'Returned',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        dot: 'bg-gray-500',
        icon: LuRotateCcw,
    },
    refunded: {
        label: 'Refunded',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        dot: 'bg-rose-500',
        icon: LuDollarSign,
    },
};

// Sane default for unknown/legacy statuses
const DEFAULT_STATUS_CONFIG: OrderStatusConfig = {
    label: 'Unknown',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    dot: 'bg-gray-400',
    icon: LuClock,
};

export function getStatusConfig(status: string): OrderStatusConfig {
    const cfg = ORDER_STATUS_CONFIG[status];
    if (cfg) return cfg;
    // Auxiliary timeline events (e.g. 'tracking_updated', 'payment_paid') aren't part of
    // the 11-state lifecycle — humanize them instead of showing "Unknown".
    const label = (status || 'Unknown')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    return { ...DEFAULT_STATUS_CONFIG, label };
}

// ===== Payment method labels & badges =====
export function paymentMethodLabel(method: string): string {
    switch ((method || '').toLowerCase()) {
        case 'bkash':
            return 'bKash';
        case 'sslcommerz':
            return 'SSLCommerz';
        case 'cod':
            return 'Cash on Delivery';
        case 'rocket':
            return 'Rocket';
        case 'nagad':
            return 'Nagad';
        default:
            return (method || '').toUpperCase();
    }
}

export interface PaymentMethodBadge {
    bg: string;
    color: string;
}

export const paymentMethodBadge: Record<string, PaymentMethodBadge> = {
    bkash: { bg: '#fdeef4', color: '#e2136e' },
    sslcommerz: { bg: '#eef6ff', color: '#1f5fbf' },
    cod: { bg: '#eefcf3', color: '#0f9d58' },
    rocket: { bg: '#f3eefb', color: '#8c3ec0' },
    nagad: { bg: '#fdeeee', color: '#ed1c24' },
};

// ===== Carriers for tracking dropdowns =====
export const CARRIERS: string[] = [
    'Steadfast',
    'Pathao',
    'RedX',
    'Sundarban',
    'Paperfly',
    'Other',
];
