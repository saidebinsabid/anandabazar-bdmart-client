"use client";

import React from 'react';
import type { ElementType } from 'react';
import {
    LuReceipt,
    LuBadgeCheck,
    LuPackage,
    LuTruck,
    LuNavigation,
    LuBike,
    LuPackageCheck,
    LuCheck,
    LuCircleX,
    LuRotateCcw,
    LuDollarSign,
    LuMapPin,
    LuClock,
} from 'react-icons/lu';

// ── Types ────────────────────────────────────────────────────────────
interface TimelineEvent {
    status?: string;
    note?: string;
    createdAt?: string;
}

interface OrderProgressTrackerProps {
    status: string;
    timeline?: TimelineEvent[];
    carrier?: string;
    trackingNumber?: string;
    courierStatus?: string;
    createdAt?: string;
    className?: string;
}

interface Milestone {
    key: string;
    label: string;
    sub: string;
    icon: ElementType;
}

// ── The 7 happy-path milestones (maps the 11-state backend lifecycle) ──
const MILESTONES: Milestone[] = [
    { key: 'pending', label: 'Order Placed', sub: 'We received your order', icon: LuReceipt },
    { key: 'confirmed', label: 'Confirmed', sub: 'Your order is confirmed', icon: LuBadgeCheck },
    { key: 'processing', label: 'Packed', sub: 'Packed & ready to ship', icon: LuPackage },
    { key: 'shipped', label: 'Shipped', sub: 'Handed to the courier', icon: LuTruck },
    { key: 'on_the_way', label: 'On the Way', sub: 'In transit to your area', icon: LuNavigation },
    { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'Arriving soon', icon: LuBike },
    { key: 'delivered', label: 'Delivered', sub: 'Delivered successfully', icon: LuPackageCheck },
];

// order status → index within MILESTONES (delivery_attempt rides the out-for-delivery node)
const STATUS_INDEX: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    on_the_way: 4,
    delivery_attempt: 5,
    out_for_delivery: 5,
    delivered: 6,
};

// Milestone key → the timeline statuses that fulfil it (for per-step timestamps)
const KEY_ALIASES: Record<string, string[]> = {
    on_the_way: ['on_the_way'],
    out_for_delivery: ['out_for_delivery', 'delivery_attempt'],
};

const TERMINAL: Record<
    string,
    { label: string; sub: string; icon: ElementType; bg: string; fg: string; iconBg: string }
> = {
    cancelled: { label: 'Order Cancelled', sub: 'This order has been cancelled.', icon: LuCircleX, bg: 'bg-red-50', fg: 'text-red-700', iconBg: 'bg-red-100 text-red-600' },
    returned: { label: 'Order Returned', sub: 'This order has been returned.', icon: LuRotateCcw, bg: 'bg-gray-100', fg: 'text-gray-700', iconBg: 'bg-gray-200 text-gray-600' },
    refunded: { label: 'Order Refunded', sub: 'This order has been refunded.', icon: LuDollarSign, bg: 'bg-rose-50', fg: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-600' },
};

// ── Helpers ──────────────────────────────────────────────────────────
function fmtStamp(d?: string): string {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return (
        date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
        ' · ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
}

function humanize(raw: string): string {
    return (raw || '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}

export default function OrderProgressTracker({
    status,
    timeline = [],
    carrier,
    trackingNumber,
    courierStatus,
    createdAt,
    className = '',
}: OrderProgressTrackerProps) {
    const term = TERMINAL[status];

    // ── Terminal / branch states get a clear banner instead of the bar ──
    if (term) {
        const Icon = term.icon;
        const when = timeline.find((t) => t.status === status)?.createdAt;
        return (
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
                <div className={`flex items-center gap-4 rounded-xl p-4 ${term.bg}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${term.iconBg}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <p className={`text-base font-bold ${term.fg}`}>{term.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {term.sub}
                            {when ? ` · ${fmtStamp(when)}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const currentIndex = STATUS_INDEX[status] ?? 0;
    const isDelivered = status === 'delivered';
    const lastIndex = MILESTONES.length - 1;
    const pct = Math.max(0, Math.min(100, (currentIndex / lastIndex) * 100));
    const inset = 100 / (MILESTONES.length * 2); // half a column — aligns the line with first/last node centres
    const showTruck = currentIndex >= 3 && currentIndex <= 5; // shipping phase

    // timestamp for a given milestone key (earliest matching timeline entry)
    const stampFor = (key: string): string => {
        const keys = KEY_ALIASES[key] || [key];
        const evt = timeline.find((t) => t.status && keys.includes(t.status));
        if (evt?.createdAt) return fmtStamp(evt.createdAt);
        if (key === 'pending' && createdAt) return fmtStamp(createdAt);
        return '';
    };

    const nodeState = (i: number): 'done' | 'current' | 'todo' => {
        if (i < currentIndex || (i === currentIndex && isDelivered)) return 'done';
        if (i === currentIndex) return 'current';
        return 'todo';
    };

    const nodeClasses = (state: 'done' | 'current' | 'todo') =>
        state === 'done'
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
            : state === 'current'
                ? 'bg-white border-[var(--color-primary)] text-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30'
                : 'bg-white border-gray-200 text-gray-300';

    const liveStatusText =
        courierStatus && currentIndex >= 3 && currentIndex < 6
            ? humanize(courierStatus)
            : MILESTONES[currentIndex]?.sub || '';

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                        <LuTruck size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">Order Tracking</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{liveStatusText}</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                    {MILESTONES[currentIndex]?.label || humanize(status)}
                </span>
            </div>

            {/* ===== Horizontal tracker (sm and up) ===== */}
            <div className="hidden sm:block">
                <div className="relative">
                    {/* Track + animated fill + moving courier */}
                    <div
                        className="absolute h-1 rounded-full bg-gray-100"
                        style={{ top: 22, left: `${inset}%`, right: `${inset}%` }}
                    >
                        <div
                            className="ob-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                        />
                        {showTruck && (
                            <div
                                className="absolute z-20"
                                style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                            >
                                <div className="ob-truck w-7 h-7 rounded-full bg-white border-2 border-[var(--color-primary)] shadow-md flex items-center justify-center text-[var(--color-primary)]">
                                    <LuTruck size={14} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nodes */}
                    <div className="flex justify-between relative">
                        {MILESTONES.map((m, i) => {
                            const state = nodeState(i);
                            const Icon = m.icon;
                            const ts = stampFor(m.key);
                            return (
                                <div key={m.key} className="flex-1 flex flex-col items-center px-0.5">
                                    <div className="relative">
                                        {state === 'current' && (
                                            <span className="ob-node-ring absolute inset-0 rounded-full bg-[var(--color-primary)]" />
                                        )}
                                        <div
                                            className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${nodeClasses(state)}`}
                                        >
                                            {state === 'done' ? (
                                                <LuCheck size={18} className="ob-check-pop" />
                                            ) : (
                                                <Icon size={18} />
                                            )}
                                        </div>
                                    </div>
                                    <p
                                        className={`mt-2.5 text-[11px] font-bold text-center leading-tight ${state === 'todo' ? 'text-gray-300' : 'text-gray-800'}`}
                                    >
                                        {m.label}
                                    </p>
                                    {ts ? (
                                        <p className="text-[9px] text-gray-400 mt-1 text-center">{ts}</p>
                                    ) : state === 'current' ? (
                                        <p className="text-[9px] text-[var(--color-primary)] font-semibold mt-1 text-center">In progress</p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ===== Vertical tracker (mobile) ===== */}
            <ol className="sm:hidden relative">
                {MILESTONES.map((m, i) => {
                    const state = nodeState(i);
                    const Icon = m.icon;
                    const ts = stampFor(m.key);
                    const isLast = i === MILESTONES.length - 1;
                    return (
                        <li key={m.key} className="flex gap-4 pb-5 last:pb-0 relative">
                            {/* connector */}
                            {!isLast && (
                                <span
                                    className={`absolute top-11 left-[21px] w-0.5 ${i < currentIndex ? 'ob-fill-v' : 'bg-gray-200'}`}
                                    style={{ bottom: 0 }}
                                />
                            )}
                            <div className="relative flex-shrink-0">
                                {state === 'current' && (
                                    <span className="ob-node-ring absolute inset-0 rounded-full bg-[var(--color-primary)]" />
                                )}
                                <div
                                    className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${nodeClasses(state)}`}
                                >
                                    {state === 'done' ? <LuCheck size={18} /> : <Icon size={18} />}
                                </div>
                            </div>
                            <div className="pt-1 min-w-0">
                                <p className={`text-sm font-bold leading-tight ${state === 'todo' ? 'text-gray-300' : 'text-gray-800'}`}>
                                    {m.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${state === 'todo' ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {state === 'current' ? liveStatusText || m.sub : m.sub}
                                </p>
                                {ts && <p className="text-[10px] text-gray-400 mt-0.5">{ts}</p>}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {/* Courier info row */}
            {(carrier || trackingNumber || courierStatus) && (
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
                    {carrier && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <LuTruck size={13} className="text-[var(--color-primary)]" />
                            Carrier: <span className="font-bold text-gray-700">{carrier}</span>
                        </span>
                    )}
                    {trackingNumber && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <LuMapPin size={13} className="text-[var(--color-primary)]" />
                            Tracking: <span className="font-mono font-bold text-gray-700">{trackingNumber}</span>
                        </span>
                    )}
                    {courierStatus && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <LuClock size={13} className="text-[var(--color-primary)]" />
                            Courier: <span className="font-semibold text-gray-700">{humanize(courierStatus)}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
