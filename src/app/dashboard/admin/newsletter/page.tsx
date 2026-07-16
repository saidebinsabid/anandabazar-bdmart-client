"use client";

import React, { useState } from 'react';
import { LuMail, LuSearch, LuDownload, LuChevronLeft, LuChevronRight, LuUsers } from 'react-icons/lu';
import { useGetNewsletterSubscribersQuery } from '@/redux/api/newsletterApi';

/**
 * Admin → Newsletter subscribers.
 * Read-only list of everyone who subscribed via the storefront footer,
 * backed by GET /api/newsletter (admin/superadmin). Supports search,
 * pagination and CSV export of the current filter.
 */
export default function NewsletterPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching } = useGetNewsletterSubscribersQuery({
        page,
        limit: 20,
        search: search || undefined,
    });

    const subscribers: any[] = data?.data || [];
    const meta = data?.meta || { total: 0, totalPages: 1 };

    const formatDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const exportCsv = () => {
        if (subscribers.length === 0) return;
        const rows = [
            ['Email', 'Subscribed On'],
            ...subscribers.map((s) => [s.email, formatDate(s.createdAt)]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'newsletter_subscribers.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <LuMail size={20} className="text-[var(--color-primary)]" />
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Newsletter</h1>
                            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                                <LuUsers size={13} /> {meta.total} subscriber{meta.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={exportCsv}
                        disabled={subscribers.length === 0}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-all shadow-md shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <LuDownload size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="relative">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading || isFetching ? (
                    <div className="divide-y divide-gray-50">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                                <div className="w-9 h-9 rounded-full bg-gray-100" />
                                <div className="h-4 bg-gray-100 rounded w-64" />
                            </div>
                        ))}
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className="p-12 text-center">
                        <LuMail size={44} className="mx-auto text-gray-200 mb-3" />
                        <h3 className="text-base font-bold text-gray-600 mb-1">No subscribers yet</h3>
                        <p className="text-sm text-gray-400">
                            {search ? 'No emails match your search.' : 'Newsletter sign-ups from the storefront footer will appear here.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-5 py-3">Email</th>
                                <th className="px-5 py-3 text-right">Subscribed On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {subscribers.map((s) => (
                                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                                                <LuMail size={15} className="text-[var(--color-primary)]" />
                                            </span>
                                            <span className="font-semibold text-gray-800 break-all">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1"
                    >
                        <LuChevronLeft size={15} /> Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500">Page {page} of {meta.totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1"
                    >
                        Next <LuChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}
