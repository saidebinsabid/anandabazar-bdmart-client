"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LuHouse, LuShoppingBag, LuUsers,
    LuLayoutGrid, LuLogOut, LuMenu, LuX, LuChevronDown,
    LuShoppingCart, LuUser, LuChevronLeft,
    LuLayoutDashboard, LuChartColumn, LuTruck, LuTag, LuStar, LuMapPin,
    LuSettings, LuBell, LuSearch, LuCreditCard, LuZap, LuShield, LuRefreshCw,
} from 'react-icons/lu';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/shared/Logo';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface AdminLayoutProps { children: React.ReactNode; }

const SIDEBAR_W = 240;

const menuSections = [
    // Overview — what an admin opens first
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', href: '/dashboard/admin', icon: LuHouse, submenu: null },
            { name: 'Report & Analysis', href: '/dashboard/admin/analytics', icon: LuChartColumn, submenu: null },
        ],
    },
    // Daily operations — follows the order lifecycle: placed → shipped → returned
    {
        label: 'Orders & Fulfillment',
        items: [
            { name: 'Orders', href: '/dashboard/admin/orders', icon: LuShoppingCart, submenu: null },
            { name: 'Courier / Shipments', href: '/dashboard/admin/courier', icon: LuTruck, submenu: null },
            { name: 'Shipping & Zones', href: '/dashboard/admin/shipping', icon: LuMapPin, submenu: null },
            { name: 'Returns', href: '/dashboard/admin/returns', icon: LuRefreshCw, submenu: null },
        ],
    },
    // What you sell
    {
        label: 'Catalog',
        items: [
            {
                name: 'Products', href: '/dashboard/admin/products', icon: LuShoppingBag, submenu: [
                    { name: 'All Products', href: '/dashboard/admin/products' },
                    { name: 'Add Product', href: '/dashboard/admin/products/new' },
                ]
            },
            { name: 'Categories', href: '/dashboard/admin/categories', icon: LuLayoutGrid, submenu: null },
        ],
    },
    // Promotions & engagement
    {
        label: 'Marketing',
        items: [
            { name: 'Coupons', href: '/dashboard/admin/coupons', icon: LuTag, submenu: null },
            { name: 'Offers & Flash Sales', href: '/dashboard/admin/offers', icon: LuZap, submenu: null },
            { name: 'Reviews', href: '/dashboard/admin/reviews', icon: LuStar, submenu: null },
        ],
    },
    // Money flow — payments collected from customers
    {
        label: 'Finance',
        items: [
            { name: 'Payments', href: '/dashboard/admin/payments', icon: LuCreditCard, submenu: null },
        ],
    },
    // People & access control
    {
        label: 'Users & Access',
        items: [
            { name: 'Users & Admins', href: '/dashboard/admin/customers', icon: LuUsers, submenu: null },
            { name: 'Roles & Permissions', href: '/dashboard/admin/roles', icon: LuShield, submenu: null, superadminOnly: true },
        ],
    },
    // Configuration
    {
        label: 'Support & System',
        items: [
            { name: 'Site Content', href: '/dashboard/admin/site-content', icon: LuLayoutDashboard, submenu: null },
            { name: 'Settings', href: '/dashboard/admin/settings', icon: LuSettings, submenu: null },
            { name: 'Profile', href: '/dashboard/admin/profile', icon: LuUser, submenu: null },
        ],
    },
];

// Flatten for compatibility
const allMenuItems = menuSections.flatMap(s => s.items);

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const role = useSelector((s: RootState) => s.auth.user?.role);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        allMenuItems.forEach((item) => {
            if (item.submenu?.some(s => pathname.startsWith(s.href))) {
                setExpandedMenu(item.name);
            }
        });
    }, [pathname]);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    const isActive = (href: string) => pathname === href;
    const isParentActive = (item: typeof allMenuItems[0]) =>
        item.submenu ? item.submenu.some(s => pathname.startsWith(s.href)) : pathname === item.href;

    const Sidebar = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div style={{
                height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', borderBottom: '1px solid #334155', flexShrink: 0,
            }}>
                <Link href="/dashboard/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <Logo light imgClassName="h-[30px] md:h-[34px]" />
                </Link>
                <button
                    className="lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px' }}
                >
                    <LuX size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                {menuSections.map((section) => (
                    <div key={section.label} style={{ marginBottom: '16px' }}>
                        <p style={{
                            fontSize: '9px', fontWeight: 700, color: '#94A3B8',
                            textTransform: 'uppercase', letterSpacing: '1.2px',
                            padding: '0 10px 6px', margin: 0,
                        }}>
                            {section.label}
                        </p>
                        {section.items.filter((item: any) => !item.superadminOnly || role === 'superadmin').map((item) => {
                            const hasSubmenu = !!(item.submenu && item.submenu.length > 0);
                            const isExpanded = expandedMenu === item.name;
                            const parentActive = isParentActive(item);
                            const exactActive = !hasSubmenu && isActive(item.href);
                            const highlighted = exactActive || (hasSubmenu && parentActive);

                            return (
                                <div key={item.name} style={{ marginBottom: '1px' }}>
                                    <Link
                                        href={hasSubmenu ? '#' : item.href}
                                        onClick={(e) => {
                                            if (hasSubmenu) { e.preventDefault(); setExpandedMenu(isExpanded ? null : item.name); }
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px', borderRadius: '8px', textDecoration: 'none',
                                            background: highlighted ? 'var(--color-primary)' : 'transparent',
                                            color: highlighted ? '#fff' : '#cbd5e1',
                                            fontSize: '13px', fontWeight: highlighted ? 600 : 500,
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => { if (!highlighted) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; } }}
                                        onMouseLeave={e => { if (!highlighted) { (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <item.icon size={16} />
                                            <span>{item.name}</span>
                                        </div>
                                        {hasSubmenu && (
                                            <LuChevronDown size={13} style={{
                                                transform: isExpanded ? 'rotate(180deg)' : 'none',
                                                transition: 'transform 0.2s',
                                                opacity: 0.5,
                                            }} />
                                        )}
                                    </Link>

                                    {hasSubmenu && isExpanded && (
                                        <div style={{
                                            marginLeft: '16px', paddingLeft: '12px',
                                            borderLeft: '2px solid #334155', marginTop: '2px', marginBottom: '4px',
                                        }}>
                                            {item.submenu!.map((sub) => (
                                                <Link key={sub.name} href={sub.href}
                                                    style={{
                                                        display: 'block', padding: '6px 10px', borderRadius: '6px',
                                                        fontSize: '12px', textDecoration: 'none', marginBottom: '1px',
                                                        background: isActive(sub.href) ? 'rgba(248,86,6,0.15)' : 'transparent',
                                                        color: isActive(sub.href) ? 'var(--color-primary)' : '#94A3B8',
                                                        fontWeight: isActive(sub.href) ? 600 : 400,
                                                        borderLeft: isActive(sub.href) ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                    }}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div style={{ padding: '8px 10px', borderTop: '1px solid #334155', flexShrink: 0 }}>
                <button onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px', background: 'none',
                        border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '13px', fontWeight: 500,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
                >
                    <LuLogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, backdropFilter: 'blur(4px)' }}
                />
            )}

            {/* Desktop Sidebar */}
            <div
                className="hidden lg:block"
                style={{
                    position: 'fixed', top: 0, left: 0, width: `${SIDEBAR_W}px`, height: '100vh',
                    background: '#1E293B', borderRight: '1px solid #334155', zIndex: 50, overflowY: 'hidden',
                }}
            >
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            <div
                className="lg:hidden"
                style={{
                    position: 'fixed', top: 0, left: 0, width: '260px', height: '100vh',
                    background: '#1E293B', borderRight: '1px solid #334155', zIndex: 100,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.25s ease',
                    boxShadow: mobileOpen ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                <Sidebar />
            </div>

            {/* Main Content */}
            <div
                className="lg:ml-[240px]"
                style={{ minHeight: '100vh' }}
            >
                {/* Top Header */}
                <header style={{
                    height: '56px', background: '#fff', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 clamp(12px, 4vw, 24px)', position: 'sticky', top: 0, zIndex: 40,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
                        >
                            <LuMenu size={20} />
                        </button>

                        {/* Search Bar (hidden on mobile — inline display must not override the `hidden` class) */}
                        <div style={{
                            position: 'relative', alignItems: 'center',
                        }} className="hidden md:flex">
                            <LuSearch size={14} style={{
                                position: 'absolute', left: '12px', color: '#bbb',
                            }} />
                            <input
                                type="text"
                                placeholder="Search orders, products, customers..."
                                style={{
                                    width: '320px', padding: '7px 12px 7px 34px',
                                    background: '#f5f5f5', border: '1px solid transparent',
                                    borderRadius: '8px', fontSize: '12.5px', color: '#555',
                                    outline: 'none', transition: 'all 0.2s',
                                }}
                                onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                                onBlur={e => { e.target.style.background = '#f5f5f5'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Notifications */}
                        <NotificationBell theme="indigo" seeAllHref="/dashboard/admin/notifications" />

                        <div style={{ width: '1px', height: '20px', background: '#efefef' }} />

                        <Link href="/" style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', fontWeight: 600, color: '#777',
                            textDecoration: 'none', padding: '5px 10px', borderRadius: '6px',
                        }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                            <LuChevronLeft size={13} /> Store
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary), #4338CA)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff',
                            }}>A</div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }} className="hidden sm:inline">Admin</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ padding: 'clamp(14px, 3.5vw, 24px)', minHeight: 'calc(100vh - 56px)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
