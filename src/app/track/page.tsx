"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    LuSearch,
    LuPackage,
    LuCalendar,
    LuCreditCard,
    LuCircleAlert,
} from 'react-icons/lu';
import { useLazyTrackOrderQuery } from '@/redux/api/orderApi';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';
import OrderProgressTracker from '@/components/orders/OrderProgressTracker';

/* ───────── Types of the public track contract ───────── */
interface TimelineEntry {
    status: string;
    note?: string;
    createdAt: string;
}
interface TrackData {
    orderId: string;
    status: string;
    paymentStatus?: string;
    paymentMethod?: string;
    createdAt: string;
    customerName?: string;
    itemsCount?: number;
    timeline?: TimelineEntry[];
    trackingNumber?: string;
    carrier?: string;
    courierStatus?: string;
}

const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

/* ───────── Status badge ───────── */
function StatusBadge({ status }: { status: string }) {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
            <Icon size={13} strokeWidth={2.2} />
            {cfg.label}
        </span>
    );
}

/* ───────── Timeline ───────── */
function Timeline({ entries }: { entries: TimelineEntry[] }) {
    if (!entries || entries.length === 0) {
        return <p className="text-sm text-gray-400">No timeline events yet.</p>;
    }
    // newest first
    const sorted = [...entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return (
        <ol className="space-y-0">
            {sorted.map((ev, idx) => {
                const cfg = getStatusConfig(ev.status);
                const isLast = idx === sorted.length - 1;
                return (
                    <li key={`${ev.status}-${ev.createdAt}-${idx}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                            {!isLast && <span className="w-px flex-1 min-h-[28px] bg-gray-200" />}
                        </div>
                        <div className="pb-4 -mt-0.5">
                            <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                            {ev.note && <p className="text-xs text-gray-500 mt-0.5">{ev.note}</p>}
                            <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(ev.createdAt)}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

/* ───────── Inner component (uses useSearchParams) ───────── */
function TrackOrderInner() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [trigger, { data, isFetching, isError }] = useLazyTrackOrderQuery();

    const track: TrackData | undefined = data?.data;
    // Show the "not found" card on any lookup error (404, network, etc.).
    // Before a search runs, isError is false, so nothing is shown.
    const notFound = isError;

    const runTrack = (id: string) => {
        const trimmed = id.trim();
        if (!trimmed) return;
        trigger(trimmed);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        runTrack(orderId);
    };

    // Auto-track from ?id= on load
    useEffect(() => {
        const qid = searchParams.get('id');
        if (qid) {
            setOrderId(qid);
            runTrack(qid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return (
        <div className="min-h-[70vh] bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Heading */}
                <div className="text-center mb-6">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                        style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}
                    >
                        <LuPackage size={26} strokeWidth={2} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Enter your Order ID to see the latest delivery status.
                    </p>
                </div>

                {/* Search card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
                >
                    <div className="flex-1 flex items-center gap-2 px-3 h-12 rounded-xl border border-gray-200 focus-within:border-[var(--color-primary)] transition-colors">
                        <LuSearch size={18} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="e.g. ABM-0001"
                            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isFetching || !orderId.trim()}
                        className="h-12 px-7 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {isFetching ? 'Tracking…' : 'Track'}
                    </button>
                </form>

                {/* Loading */}
                {isFetching && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
                        <div className="h-5 bg-gray-200 rounded w-40" />
                        <div className="h-3 bg-gray-100 rounded w-56" />
                        <div className="h-16 bg-gray-100 rounded" />
                    </div>
                )}

                {/* Not found / error */}
                {!isFetching && notFound && !track && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-3">
                            <LuCircleAlert size={22} />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Order not found</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Double-check your Order ID (e.g. ABM-0001) and try again.
                        </p>
                    </div>
                )}

                {/* Result */}
                {!isFetching && track && (
                    <div className="mt-6 space-y-5">
                        {/* Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Order</p>
                                    <p className="text-lg font-bold text-gray-900">{track.orderId}</p>
                                </div>
                                <StatusBadge status={track.status} />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <LuCalendar size={15} className="text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400">Placed On</p>
                                        <p className="text-xs font-medium text-gray-700 truncate">{fmtDate(track.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <LuCreditCard size={15} className="text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400">Payment</p>
                                        <p className="text-xs font-medium text-gray-700 truncate">
                                            {paymentMethodLabel(track.paymentMethod || '')}
                                            {track.paymentStatus ? ` · ${track.paymentStatus}` : ''}
                                        </p>
                                    </div>
                                </div>
                                {typeof track.itemsCount === 'number' && (
                                    <div className="flex items-center gap-2">
                                        <LuPackage size={15} className="text-gray-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-gray-400">Items</p>
                                            <p className="text-xs font-medium text-gray-700">{track.itemsCount}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Animated courier tracker (shared component — also on user + admin order pages) */}
                        <OrderProgressTracker
                            status={track.status}
                            timeline={track.timeline}
                            carrier={track.carrier}
                            trackingNumber={track.trackingNumber}
                            courierStatus={track.courierStatus}
                            createdAt={track.createdAt}
                        />

                        {/* Order timeline */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-bold text-gray-900 mb-4">Order Timeline</h2>
                            <Timeline entries={track.timeline || []} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center">
                    <div className="text-sm text-gray-400">Loading…</div>
                </div>
            }
        >
            <TrackOrderInner />
        </Suspense>
    );
}
