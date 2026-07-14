"use client";

import React, { useState, useEffect } from 'react';
import {
    LuPlus, LuSquarePen, LuTrash2, LuSearch, LuX, LuSave, LuLayoutGrid,
} from 'react-icons/lu';
import {
    useGetCategoriesQuery,
    useDeleteCategoryMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
} from '@/redux/api/categoryApi';
import { toast } from 'react-hot-toast';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const errStyle: React.CSSProperties = { fontSize: '11px', color: '#ef4444', margin: '4px 0 0' };
/* parent may be a populated object {_id,name} or a raw id string or null */
const parentId = (cat: any): string => (cat?.parent && typeof cat.parent === 'object' ? cat.parent._id : cat?.parent) || '';
const parentName = (cat: any): string => (cat?.parent && typeof cat.parent === 'object' ? cat.parent.name : '') || '';

/* Category icons - variety marketplace product categories */
const ICON_OPTIONS = [
    { emoji: '📱', label: 'Electronics' },
    { emoji: '💻', label: 'Computers' },
    { emoji: '👗', label: 'Fashion' },
    { emoji: '👟', label: 'Footwear' },
    { emoji: '💄', label: 'Beauty' },
    { emoji: '🧴', label: 'Personal Care' },
    { emoji: '🏠', label: 'Home & Living' },
    { emoji: '🍳', label: 'Kitchen' },
    { emoji: '🪑', label: 'Furniture' },
    { emoji: '🔌', label: 'Appliances' },
    { emoji: '🛒', label: 'Grocery' },
    { emoji: '🧸', label: 'Toys & Baby' },
    { emoji: '📚', label: 'Books' },
    { emoji: '⚽', label: 'Sports' },
    { emoji: '🎮', label: 'Gaming' },
    { emoji: '⌚', label: 'Watches' },
    { emoji: '💍', label: 'Jewelry' },
    { emoji: '🎒', label: 'Bags' },
    { emoji: '💊', label: 'Health' },
    { emoji: '🚗', label: 'Automotive' },
    { emoji: '🐾', label: 'Pet Supplies' },
    { emoji: '🌿', label: 'Garden & Outdoor' },
];

const CategoriesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: categoriesData, isLoading, refetch } = useGetCategoriesQuery({});
    const [deleteCategory] = useDeleteCategoryMutation();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    /* ─── Modal State ─── */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', icon: '', description: '', parent: '', isActive: true, showInMenu: true, showInHome: true });
    /* per-field inline errors (mirrors backend errorMessages[].path → message) */
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const categories = categoriesData?.data || [];
    const isSaving = isCreating || isUpdating;

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: '', icon: '', description: '', parent: '', isActive: true, showInMenu: true, showInHome: true });
        setFieldErrors({});
        setModalOpen(true);
    };

    const openEdit = (cat: any) => {
        setEditingId(cat._id);
        setForm({
            name: cat.name || '',
            icon: cat.icon || '',
            description: cat.description || '',
            parent: parentId(cat),
            isActive: cat.isActive !== false,
            showInMenu: cat.showInMenu !== false,
            showInHome: cat.showInHome !== false,
        });
        setFieldErrors({});
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); setFieldErrors({}); };

    /* Client-side mirror of the backend zod rules → returns per-field error map */
    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Category name is required';
        if (!form.icon) errs.icon = 'Please select an icon for this category';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            toast.error('Please fix the highlighted fields');
            return;
        }
        setFieldErrors({});

        // Build payload: parent as id or null
        const payload: any = {
            name: form.name.trim(),
            icon: form.icon,
            description: form.description,
            isActive: form.isActive,
            showInMenu: form.showInMenu,
            showInHome: form.showInHome,
            parent: form.parent || null,
        };

        try {
            if (editingId) {
                await updateCategory({ id: editingId, data: payload }).unwrap();
                toast.success('Category updated');
            } else {
                await createCategory(payload).unwrap();
                toast.success('Category created');
            }
            closeModal();
        } catch (error: any) {
            // Map backend 400 errorMessages[].path → matching field, render inline
            const errorMessages = error?.data?.errorMessages;
            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                const mapped: Record<string, string> = {};
                errorMessages.forEach((em: any) => { if (em?.path) mapped[em.path] = em.message; });
                setFieldErrors(mapped);
                toast.error(errorMessages[0]?.message || 'Please fix the highlighted fields');
            } else {
                toast.error(error?.data?.message || 'Something went wrong');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id).unwrap();
                toast.success('Category deleted');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete');
            }
        }
    };

    const filtered = categories.filter((cat: any) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Root categories available as parent options (exclude the category being edited)
    const rootCategories = categories.filter((c: any) => !parentId(c) && c._id !== editingId);

    // Order list so each parent is followed by its sub-categories (indented). Falls back to flat order when searching.
    const orderedList = (() => {
        if (searchTerm.trim()) return filtered.map((c: any) => ({ cat: c, isSub: !!parentId(c) }));
        const roots = filtered.filter((c: any) => !parentId(c));
        const subsByParent: Record<string, any[]> = {};
        filtered.forEach((c: any) => { const p = parentId(c); if (p) { (subsByParent[p] ||= []).push(c); } });
        const out: { cat: any; isSub: boolean }[] = [];
        roots.forEach((r: any) => {
            out.push({ cat: r, isSub: false });
            (subsByParent[r._id] || []).forEach((s: any) => out.push({ cat: s, isSub: true }));
        });
        // orphan sub-categories whose parent isn't in the current list
        filtered.forEach((c: any) => { const p = parentId(c); if (p && !roots.some((r: any) => r._id === p)) out.push({ cat: c, isSub: true }); });
        // de-dupe (orphans may already be appended)
        const seen = new Set<string>();
        return out.filter(({ cat }) => { if (seen.has(cat._id)) return false; seen.add(cat._id); return true; });
    })();

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Categories</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage product categories</p>
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                    cursor: 'pointer',
                }}>
                    <LuPlus size={14} /> Add Category
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <LuSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inp, paddingLeft: '34px' }}
                />
            </div>

            {/* Categories List */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : orderedList.length > 0 ? (
                    <div>
                        {orderedList.map(({ cat, isSub }: { cat: any; isSub: boolean }, i: number) => (
                            <div key={cat._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px',
                                paddingLeft: isSub ? '40px' : '16px',
                                background: isSub ? '#fcfcfc' : '#fff',
                                borderLeft: isSub ? '3px solid var(--color-primary-lightest)' : '3px solid transparent',
                                borderBottom: i < orderedList.length - 1 ? '1px solid #f5f5f5' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = isSub ? '#fcfcfc' : '#fff'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isSub && <span style={{ color: '#ccc', fontSize: '14px', marginLeft: '-6px' }}>↳</span>}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px',
                                        background: '#f5f5f5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, fontSize: '18px',
                                    }}>
                                        {cat.icon || <LuLayoutGrid size={16} color="#bbb" />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            {cat.name}
                                            {isSub && (
                                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: '#eef2ff', color: '#6366f1' }}>
                                                    Sub of {parentName(cat) || '—'}
                                                </span>
                                            )}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10.5px', color: '#aaa', fontFamily: 'monospace' }}>{cat.slug}</span>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700,
                                                padding: '1px 6px', borderRadius: '999px',
                                                background: cat.isActive ? 'var(--color-primary-lightest)' : '#fef2f2',
                                                color: cat.isActive ? '#16a34a' : '#dc2626',
                                            }}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#ccc' }}>{cat.productCount || 0} products</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => openEdit(cat)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: 'var(--color-primary)', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lightest)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuSquarePen size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat._id)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '56px 24px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                        {/* Icon badge */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--color-primary-lightest) 0%, var(--color-primary-light) 100%)',
                            boxShadow: 'inset 0 0 0 1px var(--color-primary-border)',
                            marginBottom: '18px',
                        }}>
                            <LuLayoutGrid size={30} color="var(--color-primary)" />
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
                            No categories yet
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 22px', maxWidth: '320px', lineHeight: 1.5 }}>
                            Categories help you organize products so customers can find them faster. Create your first one to get started.
                        </p>

                        <button onClick={openCreate} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '11px 24px', background: 'var(--color-primary)', color: '#fff',
                            border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '0.2px',
                            boxShadow: '0 6px 16px rgba(248,86,6,0.28)',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-primary-dark)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 22px rgba(248,86,6,0.36)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--color-primary)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(248,86,6,0.28)';
                            }}
                        >
                            <LuPlus size={16} strokeWidth={2.6} /> Create Category
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ POPUP MODAL ═══ */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {/* Backdrop */}
                    <div onClick={closeModal} style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    }} />

                    {/* Modal */}
                    <div style={{
                        position: 'relative', background: '#fff',
                        borderRadius: '12px', width: '500px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: 0 }}>
                                {editingId ? 'Edit Category' : 'Add Category'}
                            </h3>
                            <button onClick={closeModal} style={{
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#888',
                            }}>
                                <LuX size={14} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Name */}
                            <div>
                                <label style={lbl}>Category Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Electronics, Fashion"
                                    value={form.name}
                                    onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                                    style={{ ...inp, borderColor: fieldErrors.name ? '#fca5a5' : '#e5e7eb' }}
                                    autoFocus
                                />
                                {fieldErrors.name && <p style={errStyle}>{fieldErrors.name}</p>}
                            </div>

                            {/* Parent Category (make this a sub-category) */}
                            <div>
                                <label style={lbl}>
                                    Parent Category <span style={{ color: '#aaa', fontWeight: 400 }}>(optional — leave empty for a top-level category)</span>
                                </label>
                                <select
                                    value={form.parent}
                                    onChange={e => { setForm(p => ({ ...p, parent: e.target.value })); if (fieldErrors.parent) setFieldErrors(p => ({ ...p, parent: '' })); }}
                                    style={{ ...inp, borderColor: fieldErrors.parent ? '#fca5a5' : '#e5e7eb', background: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="">— None (top-level category) —</option>
                                    {rootCategories.map((c: any) => (
                                        <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                                    ))}
                                </select>
                                {fieldErrors.parent && <p style={errStyle}>{fieldErrors.parent}</p>}
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label style={lbl}>
                                    Category Icon <span style={{ color: '#ef4444' }}>*</span>
                                    {form.icon && (
                                        <span style={{
                                            marginLeft: '10px', fontSize: '11px', fontWeight: 500,
                                            color: '#16a34a', background: '#f0fdf4',
                                            padding: '2px 8px', borderRadius: '999px',
                                        }}>
                                            Selected: {form.icon}
                                        </span>
                                    )}
                                </label>

                                {/* Preview Box */}
                                {form.icon && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 14px', background: '#f8fffe',
                                        border: '1.5px solid var(--color-primary)',
                                        borderRadius: '8px', marginBottom: '10px',
                                    }}>
                                        <span style={{ fontSize: '32px', lineHeight: 1 }}>{form.icon}</span>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111' }}>
                                                {ICON_OPTIONS.find(i => i.emoji === form.icon)?.label || 'Custom'}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Selected icon preview</p>
                                        </div>
                                        <button
                                            onClick={() => setForm(p => ({ ...p, icon: '' }))}
                                            style={{
                                                marginLeft: 'auto', background: 'none', border: 'none',
                                                cursor: 'pointer', color: '#aaa', fontSize: '16px', lineHeight: 1,
                                            }}
                                            title="Clear selection"
                                        >×</button>
                                    </div>
                                )}

                                {/* Icon Grid */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
                                    padding: '12px', background: '#fafafa',
                                    border: `1.5px solid ${!form.icon ? '#fca5a5' : '#e5e7eb'}`,
                                    borderRadius: '8px',
                                }}>
                                    {ICON_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.emoji}
                                            title={opt.label}
                                            onClick={() => { setForm(p => ({ ...p, icon: opt.emoji })); if (fieldErrors.icon) setFieldErrors(p => ({ ...p, icon: '' })); }}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                justifyContent: 'center', gap: '3px',
                                                padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                border: form.icon === opt.emoji
                                                    ? '2px solid var(--color-primary)'
                                                    : '2px solid transparent',
                                                background: form.icon === opt.emoji
                                                    ? 'var(--color-primary-lightest, #f0fdf4)'
                                                    : '#fff',
                                                transition: 'all 0.15s',
                                                boxShadow: form.icon === opt.emoji
                                                    ? '0 0 0 1px var(--color-primary)'
                                                    : '0 1px 3px rgba(0,0,0,0.06)',
                                            }}
                                            onMouseEnter={e => {
                                                if (form.icon !== opt.emoji)
                                                    (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
                                            }}
                                            onMouseLeave={e => {
                                                if (form.icon !== opt.emoji)
                                                    (e.currentTarget as HTMLElement).style.background = '#fff';
                                            }}
                                        >
                                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.emoji}</span>
                                            <span style={{ fontSize: '9px', color: '#888', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                {(!form.icon || fieldErrors.icon) && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', margin: '4px 0 0' }}>
                                        ⚠ {fieldErrors.icon || 'Please select an icon to continue'}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label style={lbl}>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    placeholder="Short description..."
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    style={{ ...inp, resize: 'vertical' }}
                                />
                            </div>

                            {/* Toggles */}
                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { key: 'isActive', label: 'Active' },
                                    { key: 'showInMenu', label: 'Show in Menu' },
                                    { key: 'showInHome', label: 'Show on Homepage' },
                                ].map((toggle) => (
                                    <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '12.5px', color: '#555', fontWeight: 500 }}>{toggle.label}</span>
                                        <div
                                            onClick={() => setForm(p => ({ ...p, [toggle.key]: !(p as any)[toggle.key] }))}
                                            style={{
                                                position: 'relative', width: '36px', height: '20px',
                                                borderRadius: '999px', cursor: 'pointer',
                                                background: (form as any)[toggle.key] ? 'var(--color-primary)' : '#ddd',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: '3px',
                                                left: (form as any)[toggle.key] ? '19px' : '3px',
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                background: '#fff', transition: 'left 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                            }} />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex', gap: '8px', padding: '14px 20px',
                            borderTop: '1px solid #f0f0f0',
                        }}>
                            <button onClick={closeModal} style={{
                                flex: 1, padding: '9px', background: '#f5f5f5', color: '#666',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} style={{
                                flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isSaving ? '#888' : 'var(--color-primary)', color: '#fff',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                            }}>
                                <LuSave size={13} />
                                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
