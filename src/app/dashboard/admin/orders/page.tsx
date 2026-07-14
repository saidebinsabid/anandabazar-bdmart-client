"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LuSearch,
    LuDownload,
    LuEye,
    LuPackage,
    LuChevronLeft,
    LuChevronRight,
    LuRefreshCw,
    LuCalendar,
    LuEllipsisVertical,
    LuX
} from 'react-icons/lu';
import {
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
    useGetOrderStatsQuery
} from '@/redux/api/orderApi';
import { toast } from 'react-hot-toast';
import {
    ORDER_STATUS_CONFIG,
    getStatusConfig,
    paymentMethodLabel,
    paymentMethodBadge,
} from '@/lib/orderStatus';
import OrderItemsPreview from '@/components/shared/OrderItemsPreview';

// Payment Method Badge (shared label + colors, incl. sslcommerz)
const PaymentMethodBadge = ({ method }: { method: string }) => {
    const key = (method || '').toLowerCase();
    const label = method ? paymentMethodLabel(method) : '—';
    const c = paymentMethodBadge[key] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.color }}>
            {label}
        </span>
    );
};

export default function OrdersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const limit = 10;

    // API Hooks
    const { data: ordersData, isLoading, refetch } = useGetAdminOrdersQuery({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const { data: statsData } = useGetOrderStatsQuery({});
    const [updateStatus] = useUpdateOrderStatusMutation();
    const [updatePayment] = useUpdatePaymentStatusMutation();

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await updateStatus({ id: orderId, status: newStatus }).unwrap();
            toast.success(`Order status updated to ${newStatus}`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update status');
        }
    };

    const handlePaymentChange = async (orderId: string, newStatus: string) => {
        try {
            await updatePayment({ id: orderId, paymentStatus: newStatus }).unwrap();
            toast.success(`Payment status updated to ${newStatus}`, {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update payment');
        }
    };

    const orders = ordersData?.data || [];
    const totalPages = ordersData?.meta?.totalPages || 1;
    const totalOrders = ordersData?.meta?.total || 0;

    const exportOrdersCsv = (list: any[], suffix: string) => {
        if (!list.length) {
            toast.error('No orders to export');
            return;
        }
        const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Payment Method', 'Payment Status', 'Status', 'Date'];
        const escapeCell = (val: any) => {
            const s = String(val ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rows = list.map((order: any) => [
            order.orderId || order.orderNumber || order._id,
            `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || order.shippingAddress?.fullName || 'Guest',
            order.items?.length || 0,
            order.total ?? 0,
            order.paymentMethod ? paymentMethodLabel(order.paymentMethod) : '',
            order.paymentStatus || '',
            getStatusConfig(order.status).label,
            order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
        ]);
        const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${list.length} orders`);
    };

    const handleExportOrders = () => exportOrdersCsv(orders, `page-${page}`);

    // ── Bulk selection ──
    useEffect(() => { setSelected(new Set()); }, [page, statusFilter, search]);

    const allSelected = orders.length > 0 && orders.every((o: any) => selected.has(o._id));
    const someSelected = selected.size > 0 && !allSelected;

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (orders.every((o: any) => next.has(o._id))) {
                orders.forEach((o: any) => next.delete(o._id));
            } else {
                orders.forEach((o: any) => next.add(o._id));
            }
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const handleBulkStatus = async (newStatus: string) => {
        const ids = Array.from(selected);
        if (!ids.length || !newStatus) return;
        const tId = toast.loading(`Updating ${ids.length} order${ids.length > 1 ? 's' : ''}...`);
        const results = await Promise.allSettled(
            ids.map((id) => updateStatus({ id, status: newStatus }).unwrap())
        );
        const ok = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - ok;
        if (ok > 0) {
            toast.success(
                `Updated ${ok} order${ok > 1 ? 's' : ''} to ${getStatusConfig(newStatus).label}${failed ? ` · ${failed} failed` : ''}`,
                { id: tId }
            );
        } else {
            toast.error('Could not update the selected orders', { id: tId });
        }
        clearSelection();
        setBulkStatus('');
        refetch();
    };

    const handleExportSelected = () =>
        exportOrdersCsv(orders.filter((o: any) => selected.has(o._id)), 'selected');

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statsConfig = [
        { label: 'All Orders', value: statsData?.data?.total || 0, color: 'text-gray-700', bg: 'bg-white border-gray-200', key: 'all' },
        { label: 'Pending', value: statsData?.data?.pending || 0, color: 'text-yellow-700', bg: 'bg-white border-yellow-200', key: 'pending' },
        { label: 'Confirmed', value: statsData?.data?.confirmed || 0, color: 'text-blue-700', bg: 'bg-white border-blue-200', key: 'confirmed' },
        { label: 'Processing', value: statsData?.data?.processing || 0, color: 'text-purple-700', bg: 'bg-white border-purple-200', key: 'processing' },
        { label: 'Shipped', value: statsData?.data?.shipped || 0, color: 'text-indigo-700', bg: 'bg-white border-indigo-200', key: 'shipped' },
        { label: 'Delivered', value: statsData?.data?.delivered || 0, color: 'text-green-700', bg: 'bg-white border-green-200', key: 'delivered' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track all customer orders from one place</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
                    >
                        <LuRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExportOrders}
                        className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-md text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all shadow-md flex items-center gap-2"
                    >
                        <LuDownload size={16} />
                        Export Orders
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {statsConfig.map((stat, i) => (
                    <div
                        key={i}
                        className={`${stat.bg} border rounded-md p-4 cursor-pointer transition-all hover:shadow-md bg-white ${statusFilter === stat.key ? 'ring-2 ring-[var(--color-primary)] border-transparent' : ''}`}
                        onClick={() => {
                            setStatusFilter(stat.key);
                            setPage(1);
                        }}
                    >
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className={`text-sm ${stat.color} opacity-80 font-medium`}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-md p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order number, customer name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:bg-white transition-all outline-none text-sm"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all outline-none text-sm bg-white min-w-[150px]"
                    >
                        <option value="all">Total Orders</option>
                        {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    <button className="px-4 py-2.5 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all shadow-sm text-gray-600">
                        <LuCalendar size={16} />
                        Filter Date
                    </button>
                </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[var(--color-primary)] text-white text-xs">
                            {selected.size}
                        </span>
                        order{selected.size > 1 ? 's' : ''} selected
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                        <select
                            value={bulkStatus}
                            onChange={(e) => handleBulkStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white outline-none focus:border-[var(--color-primary)] cursor-pointer"
                        >
                            <option value="">Change status to…</option>
                            {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleExportSelected}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all"
                        >
                            <LuDownload size={15} /> Export selected
                        </button>
                        <button
                            onClick={clearSelection}
                            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                        >
                            <LuX size={15} /> Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop / tablet: table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all orders on this page"
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-primary)]"
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italicContent">
                            {isLoading ? (
                                [...Array(limit)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-4 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-10 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <LuPackage size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-500">No orders found matching your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order._id} className={`transition-colors group ${selected.has(order._id) ? 'bg-[var(--color-primary)]/5' : 'hover:bg-gray-50/50'}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                aria-label="Select order"
                                                checked={selected.has(order._id)}
                                                onChange={() => toggleOne(order._id)}
                                                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[var(--color-primary)]">{order.orderId || order.orderNumber}</p>
                                            <div className="mt-1">
                                                <PaymentMethodBadge method={order.paymentMethod} />
                                            </div>
                                            {order.transactionId && (
                                                <p className="text-[10px] text-gray-400 font-mono mt-1 truncate max-w-[100px]" title={order.transactionId}>
                                                    TxID: {order.transactionId}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-800">
                                                {order.user?.firstName} {order.user?.lastName}
                                            </p>
                                            <p className="text-xs text-gray-400">{order.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <OrderItemsPreview items={order.items} totalCount={order.items?.length} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800">৳{order.total?.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.paymentStatus || 'pending'}
                                                onChange={(e) => handlePaymentChange(order._id, e.target.value)}
                                                className={`text-xs font-semibold px-2 py-1 rounded-md border-0 outline-none cursor-pointer transition-all ${
                                                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                    order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="failed">Failed</option>
                                                <option value="refunded">Refunded</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status || 'pending'}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className={`text-xs font-semibold px-2 py-1 rounded-md border-0 outline-none cursor-pointer transition-all ${getStatusConfig(order.status).badgeBg} ${getStatusConfig(order.status).badgeText}`}
                                            >
                                                {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                                                    <option key={key} value={key}>{cfg.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/admin/orders/${order._id}`}
                                                    className="p-2 hover:bg-white hover:shadow-md rounded-md text-gray-400 hover:text-[var(--color-primary)] transition-all border border-transparent hover:border-gray-100"
                                                    title="View Details"
                                                >
                                                    <LuEye size={18} />
                                                </Link>
                                                <button className="p-2 hover:bg-white hover:shadow-md rounded-md text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-100">
                                                    <LuEllipsisVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile: cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="h-24 bg-gray-100 rounded-lg" />
                            </div>
                        ))
                    ) : orders.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <LuPackage size={44} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500">No orders found matching your filters</p>
                        </div>
                    ) : (
                        orders.map((order: any) => (
                            <div key={order._id} className={`p-4 space-y-3 ${selected.has(order._id) ? 'bg-[var(--color-primary)]/5' : ''}`}>
                                {/* Header: checkbox + order no + date + payment method */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <input
                                            type="checkbox"
                                            aria-label="Select order"
                                            checked={selected.has(order._id)}
                                            onChange={() => toggleOne(order._id)}
                                            className="w-4 h-4 mt-1 shrink-0 rounded border-gray-300 cursor-pointer accent-[var(--color-primary)]"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[var(--color-primary)]">{order.orderId || order.orderNumber}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                                        </div>
                                    </div>
                                    <PaymentMethodBadge method={order.paymentMethod} />
                                </div>

                                {/* Product preview */}
                                <OrderItemsPreview items={order.items} totalCount={order.items?.length} />

                                {/* Customer + total */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-800 text-sm truncate">{order.user?.firstName} {order.user?.lastName}</p>
                                        <p className="text-xs text-gray-400 truncate">{order.user?.email}</p>
                                    </div>
                                    <p className="font-bold text-gray-800 shrink-0">৳{order.total?.toLocaleString()}</p>
                                </div>

                                {/* Status controls + view */}
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    <select
                                        value={order.paymentStatus || 'pending'}
                                        onChange={(e) => handlePaymentChange(order._id, e.target.value)}
                                        className={`text-xs font-semibold px-2 py-1.5 rounded-md border-0 outline-none cursor-pointer ${
                                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                            order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                    <select
                                        value={order.status || 'pending'}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        className={`text-xs font-semibold px-2 py-1.5 rounded-md border-0 outline-none cursor-pointer ${getStatusConfig(order.status).badgeBg} ${getStatusConfig(order.status).badgeText}`}
                                    >
                                        {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                    <Link
                                        href={`/dashboard/admin/orders/${order._id}`}
                                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20"
                                    >
                                        <LuEye size={14} /> View
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="text-gray-900">{orders.length}</span> of <span className="text-gray-900">{totalOrders}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <LuChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${page === i + 1
                                            ? 'bg-[var(--color-primary)] text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <LuChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
