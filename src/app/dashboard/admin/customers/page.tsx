"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuSearch, LuDownload, LuMail, LuEye, LuEllipsisVertical,
    LuChevronLeft, LuChevronRight, LuRefreshCw, LuUsers,
    LuUserCheck, LuUserX, LuCalendar, LuPhone, LuMapPin,
    LuX, LuUserPlus, LuShield, LuPencil, LuSave,
} from 'react-icons/lu';
import {
    useGetAdminUsersQuery,
    useGetAdminUserStatsQuery,
    useUpdateUserMutation,
} from '@/redux/api/userApi';
import { useRegisterMutation } from '@/redux/api/authApi';
import toast from 'react-hot-toast';

// Status Badge
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
        pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
        blocked: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    };
    const { bg, text, border } = config[status] || config.pending;
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize border ${bg} ${text} ${border}`}>
            {status}
        </span>
    );
};

// Role Badge
const RoleBadge = ({ role }: { role: string }) => {
    if (role === 'admin') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                <LuShield size={11} /> Admin
            </span>
        );
    }
    return (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">
            User
        </span>
    );
};

// Customer Avatar
const Avatar = ({ name, avatar }: { name: string; avatar?: string }) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-red-500'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    if (avatar) return <img src={avatar} alt={name} className="w-10 h-10 rounded-md object-cover border border-gray-100" />;
    return (
        <div className={`w-10 h-10 rounded-md ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
            {initials}
        </div>
    );
};

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });

    const {
        data: usersData, isLoading: isUsersLoading, isFetching: isUsersFetching, refetch: refetchUsers
    } = useGetAdminUsersQuery({
        page, limit: 10,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined
    });

    const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useGetAdminUserStatsQuery(undefined);
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [registerUser, { isLoading: isCreating }] = useRegisterMutation();

    const handleRefresh = () => { refetchUsers(); refetchStats(); toast.success('Data refreshed'); };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateUser({ id: userId, role: newRole }).unwrap();
            toast.success(`Role updated to ${newRole}`);
            setEditingRole(null);
            refetchUsers();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update role');
        }
    };

    const handleCreateAdmin = async () => {
        if (!createForm.firstName || !createForm.email || !createForm.password) {
            toast.error('Name, email and password are required');
            return;
        }
        if (createForm.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        try {
            // Step 1: Register as user
            const res = await registerUser({ ...createForm }).unwrap();
            const newUserId = res?.data?.user?._id;

            // Step 2: Promote to admin
            if (newUserId) {
                await updateUser({ id: newUserId, role: 'admin' }).unwrap();
            }

            toast.success('Admin account created!');
            setShowCreateAdmin(false);
            setCreateForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
            refetchUsers();
            refetchStats();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to create admin');
        }
    };

    const formatDate = (d: string) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const customers = usersData?.data || [];
    const meta = usersData?.meta || { totalPages: 1, total: 0 };
    const stats = statsData?.data || { totalUsers: 0, activeUsers: 0, blockedUsers: 0, totalCustomers: 0 };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers || meta.total, icon: LuUsers, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Active', value: stats.activeUsers, icon: LuUserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Blocked', value: stats.blockedUsers, icon: LuUserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        { label: 'New This Month', value: 12, icon: LuCalendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    ];

    const inputStyle = "w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)] transition-colors";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Users & Admins</h1>
                    <p className="text-gray-500 mt-1">Manage users, change roles, and create admin accounts</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleRefresh}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm">
                        <LuRefreshCw size={16} className={(isUsersFetching || isStatsLoading) ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateAdmin(true)}
                        className="px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-2 transition-all shadow-md"
                    >
                        <LuUserPlus size={16} /> Create Admin
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className={`${stat.bg} ${stat.border} border rounded-md p-5 shadow-sm hover:shadow-md transition-all`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-md bg-white shadow-sm ${stat.color}`}><stat.icon size={22} /></div>
                            <div>
                                <p className={`text-2xl font-bold ${stat.color} leading-none`}>{isStatsLoading ? '...' : stat.value?.toLocaleString()}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-md p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search by name, email, phone..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all bg-gray-50/30" />
                    </div>
                    <div className="flex gap-3">
                        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2.5 border border-gray-200 rounded-md outline-none bg-white text-sm font-medium min-w-[130px]">
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2.5 border border-gray-200 rounded-md outline-none bg-white text-sm font-medium min-w-[140px]">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isUsersLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-md" /><div><div className="h-4 bg-gray-200 rounded w-24 mb-1" /><div className="h-3 bg-gray-200 rounded w-16" /></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-200 rounded w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-[var(--color-primary-lightest)] rounded-[20px] flex items-center justify-center mb-4 ring-1 ring-[var(--color-primary-border)]"><LuUsers size={30} className="text-[var(--color-primary)]" /></div>
                                            <p className="text-gray-500 font-medium text-lg">No users found</p>
                                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={`${user.firstName} ${user.lastName}`} avatar={user.avatar} />
                                                <div>
                                                    <p className="font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">ID: {user._id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700 flex items-center gap-1.5 font-medium">
                                                <LuMail size={14} className="text-gray-400" /> {user.email}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                                <LuPhone size={14} className="text-gray-400" /> {user.phone || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingRole === user._id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        defaultValue={user.role}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        disabled={isUpdatingUser}
                                                        className="text-xs border border-[var(--color-primary)] rounded-md px-2 py-1.5 outline-none bg-white font-bold"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600">
                                                        <LuX size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <RoleBadge role={user.role} />
                                                    <button onClick={() => setEditingRole(user._id)}
                                                        className="p-1 text-gray-300 hover:text-[var(--color-primary)] transition-colors" title="Change role">
                                                        <LuPencil size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                                                <LuCalendar size={14} className="text-gray-400" /> {formatDate(user.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/admin/customers/${user._id}`}
                                                    className="p-2 bg-gray-50 hover:bg-white text-gray-500 hover:text-[var(--color-primary)] border border-gray-100 hover:border-[var(--color-primary)]/30 rounded-md transition-all shadow-sm" title="View">
                                                    <LuEye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="text-gray-800 font-bold">{customers.length}</span> of <span className="text-gray-800 font-bold">{meta.total}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isUsersLoading}
                            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">
                            <LuChevronLeft size={18} />
                        </button>
                        <div className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-bold text-gray-700 shadow-sm">
                            Page {page} of {meta.totalPages}
                        </div>
                        <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages || isUsersLoading}
                            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">
                            <LuChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ CREATE ADMIN MODAL ═══ */}
            {showCreateAdmin && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateAdmin(false)}>
                    <div onClick={e => e.stopPropagation()}
                        className="bg-white rounded-xl w-full max-w-md p-7 shadow-2xl relative" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <button onClick={() => setShowCreateAdmin(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <LuX size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <LuShield size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Create Admin Account</h2>
                                <p className="text-xs text-gray-500">This user will have full admin access</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">First Name *</label>
                                    <input value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                                        className={inputStyle} placeholder="First name" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Last Name</label>
                                    <input value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                                        className={inputStyle} placeholder="Last name" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Email *</label>
                                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    className={inputStyle} placeholder="admin@example.com" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Phone</label>
                                <input value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                    className={inputStyle} placeholder="01XXXXXXXXX" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Password *</label>
                                <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                    className={inputStyle} placeholder="Min 6 characters" />
                            </div>
                        </div>

                        <button onClick={handleCreateAdmin} disabled={isCreating}
                            className="w-full mt-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-60 shadow-md">
                            {isCreating ? 'Creating...' : <><LuUserPlus size={16} /> Create Admin Account</>}
                        </button>
                    </div>
                </div>
            )}

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
}
