"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LuShoppingCart, LuChevronDown, LuMenu, LuX,
    LuUser, LuHeart, LuPhone, LuMail, LuLogOut,
    LuLayoutGrid, LuBox,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { logout } from '@/redux/slices/authSlice';
import Logo from '@/components/shared/Logo';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { useWishlist } from '@/hooks/useWishlist';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
}

const FALLBACK_CATEGORIES: Category[] = [
    { _id: 'f-electronics',  name: 'Electronics',           slug: 'electronics',         icon: '📱' },
    { _id: 'f-fashion',      name: 'Fashion & Clothing',    slug: 'fashion-clothing',    icon: '👗' },
    { _id: 'f-home',         name: 'Home & Kitchen',        slug: 'home-kitchen',        icon: '🏠' },
    { _id: 'f-health',       name: 'Health & Beauty',       slug: 'health-beauty',       icon: '💊' },
    { _id: 'f-sports',       name: 'Sports & Outdoors',     slug: 'sports-outdoors',     icon: '⚽' },
    { _id: 'f-books',        name: 'Books & Stationery',    slug: 'books-stationery',    icon: '📚' },
    { _id: 'f-grocery',      name: 'Grocery & Food',        slug: 'grocery-food',        icon: '🛒' },
    { _id: 'f-toys',         name: 'Toys & Kids',           slug: 'toys-kids',           icon: '🧸' },
    { _id: 'f-shoes',        name: 'Shoes & Footwear',      slug: 'shoes-footwear',      icon: '👟' },
    { _id: 'f-accessories',  name: 'Watches & Accessories', slug: 'watches-accessories', icon: '⌚' },
];

const Header: React.FC = () => {

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSearchCatOpen, setIsSearchCatOpen] = useState(false);
    const [selectedSearchCat, setSelectedSearchCat] = useState<Category | null>(null);

    const profileRef = useRef<HTMLDivElement>(null);
    const searchCatRef = useRef<HTMLDivElement>(null);

    const cartItems = useAppSelector((state) => state.cart.items);
    const { count: wishlistCount } = useWishlist();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

    // Storefront wishlist page handles both logged-in (server) and guest (local) wishlists.
    const wishlistHref = '/wishlist';

    const { data: categoriesData } = useGetCategoriesQuery({});
    const categories: Category[] = categoriesData?.data?.length > 0 ? categoriesData.data : FALLBACK_CATEGORIES;
    const { data: siteContentRes } = useGetSiteContentQuery(undefined);
    const contact = siteContentRes?.data?.contact || {};
    const contactPhone: string = contact.phone || '+8801688500771';
    const contactEmail: string = contact.email || 'anandabazarbdmart@gmail.com';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
            if (searchCatRef.current && !searchCatRef.current.contains(e.target as Node)) setIsSearchCatOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        setIsProfileOpen(false);
        router.push('/');
    };

    const handleGoHome = () => {
        setSearchQuery('');
    };

    const handleSearch = (rawTerm?: string) => {
        const trimmed = (rawTerm ?? searchQuery).trim();
        if (!trimmed && !selectedSearchCat) return;
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (selectedSearchCat) params.set('category', selectedSearchCat._id);
        router.push(`/products?${params.toString()}`);
    };

    const actionCls = "flex flex-col items-center gap-0.5 px-2.5 py-2 text-white hover:text-white transition-colors rounded-md hover:bg-white/15 cursor-pointer select-none";

    return (
        <>
            <header
                className="sticky top-0 z-50 bg-white"
                style={{
                    transition: 'box-shadow 0.25s ease',
                    boxShadow: scrolled
                        ? '0 4px 28px -6px rgba(0,0,0,0.14)'
                        : '0 1px 0 rgba(0,0,0,0.07)',
                }}
            >

                {/* ════════════════ TOP BAR ════════════════ */}
                <div className="hidden md:block bg-gray-50 border-b border-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-9">
                            <div className="flex items-center gap-5 text-[11.5px] text-gray-500">
                                <a href={`tel:${contactPhone}`} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                                    <LuPhone size={11} strokeWidth={2} />
                                    <span>{contactPhone}</span>
                                </a>
                                <a href={`mailto:${contactEmail}`} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                                    <LuMail size={11} strokeWidth={2} />
                                    <span>{contactEmail}</span>
                                </a>
                            </div>
                            <div className="flex items-center gap-5 text-[11.5px] text-gray-500">
                                <span className="flex items-center gap-2.5">
                                    <Link href="/terms" className="hover:text-gray-800 transition-colors">Terms &amp; Conditions</Link>
                                    <span className="text-gray-300">•</span>
                                    <Link href="/privacy" className="hover:text-gray-800 transition-colors">Privacy Policy</Link>
                                    <span className="text-gray-300">•</span>
                                    <Link href="/refund" className="hover:text-gray-800 transition-colors">Refund Policy</Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════════════ MAIN HEADER ════════════════ */}
                <div style={{ background: 'var(--color-primary)' }}>
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 lg:gap-5 h-[76px]">

                            {/* Logo — always leftmost */}
                            <Link href="/" className="shrink-0 mr-2 lg:mr-5" onClick={handleGoHome}>
                                <HeaderLogo />
                            </Link>

                            {/* Search Bar (Desktop) */}
                            <div className="flex-1 hidden md:flex">
                                <SearchAutocomplete
                                    variant="desktop"
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onSubmit={(term) => handleSearch(term)}
                                    leading={
                                        <>
                                            {/* Category selector */}
                                            <div className="relative shrink-0" ref={searchCatRef}>
                                                <button
                                                    onClick={() => setIsSearchCatOpen(!isSearchCatOpen)}
                                                    className="flex items-center gap-1.5 pl-4 pr-3 h-[44px] text-[13px] font-medium text-gray-600 whitespace-nowrap hover:bg-[var(--color-primary-lightest)] transition-colors"
                                                >
                                                    <span className="max-w-[88px] truncate">
                                                        {selectedSearchCat ? selectedSearchCat.name : 'All'}
                                                    </span>
                                                    <LuChevronDown
                                                        size={12}
                                                        strokeWidth={2.5}
                                                        style={{ color: 'var(--color-primary)' }}
                                                        className={`transition-transform duration-200 ${isSearchCatOpen ? 'rotate-180' : ''}`}
                                                    />
                                                </button>

                                                {isSearchCatOpen && (
                                                    <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-md shadow-2xl shadow-gray-900/10 border border-gray-100 z-[70] max-h-72 overflow-y-auto py-1.5">
                                                        <button
                                                            onClick={() => { setSelectedSearchCat(null); setIsSearchCatOpen(false); }}
                                                            className="w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--color-primary-lightest)]"
                                                            style={!selectedSearchCat ? { color: 'var(--color-primary)', fontWeight: 600, background: 'var(--color-primary-lightest)' } : { color: '#374151' }}
                                                        >
                                                            All Categories
                                                        </button>
                                                        {categories.map(cat => (
                                                            <button
                                                                key={cat._id}
                                                                onClick={() => { setSelectedSearchCat(cat); setIsSearchCatOpen(false); }}
                                                                className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--color-primary-lightest)]"
                                                                style={selectedSearchCat?._id === cat._id
                                                                    ? { color: 'var(--color-primary)', fontWeight: 600, background: 'var(--color-primary-lightest)' }
                                                                    : { color: '#374151' }}
                                                            >
                                                                {cat.icon && <span className="text-sm leading-none">{cat.icon}</span>}
                                                                {cat.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Separator */}
                                            <div className="shrink-0 h-6 w-px bg-gray-200" />
                                        </>
                                    }
                                />
                            </div>

                            {/* Right Action Icons */}
                            <div className="flex items-center shrink-0 gap-0.5 ml-auto">

                                <Link href="/products" className={`hidden xl:flex ${actionCls}`}>
                                    <LuLayoutGrid size={22} strokeWidth={1.7} />
                                    <span className="text-[10px] font-medium whitespace-nowrap">All Products</span>
                                </Link>

                                {isAuthenticated && user ? (
                                    <div className="relative hidden sm:block" ref={profileRef}>
                                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={actionCls}>
                                            {user.avatar
                                                ? <img src={user.avatar} alt="" className="w-[22px] h-[22px] rounded-full object-cover ring-1 ring-gray-200" />
                                                : <LuUser size={22} strokeWidth={1.7} />
                                            }
                                            <span className="text-[10px] font-medium max-w-[72px] truncate">
                                                {user.name?.split(' ')[0] || 'Account'}
                                            </span>
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-md shadow-2xl shadow-gray-900/12 border border-gray-100 overflow-hidden z-50">
                                                <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: 'var(--color-primary-lightest)' }}>
                                                    <p className="text-sm font-bold text-gray-800 truncate">{user.name || 'User'}</p>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                                </div>
                                                <div className="py-1.5">
                                                    {[
                                                        {
                                                            href: (user.role === 'admin' || user.role === 'superadmin') ? '/dashboard/admin' : '/dashboard/user',
                                                            icon: <LuLayoutGrid size={15} />, label: 'Dashboard',
                                                        },
                                                        { href: '/dashboard/user/orders', icon: <LuBox size={15} />, label: 'My Orders' },
                                                        { href: wishlistHref, icon: <LuHeart size={15} />, label: 'Wishlist' },
                                                    ].map(item => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors"
                                                        >
                                                            {item.icon} {item.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-100 py-1.5">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <LuLogOut size={15} /> Logout
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link href="/login" className={`hidden sm:flex ${actionCls}`}>
                                        <LuUser size={22} strokeWidth={1.7} />
                                        <span className="text-[10px] font-medium">Sign In</span>
                                    </Link>
                                )}

                                <Link href={wishlistHref} className={`hidden lg:flex ${actionCls}`}>
                                    <div className="relative">
                                        <LuHeart size={22} strokeWidth={1.7} />
                                        {wishlistCount > 0 && (
                                            <span
                                                className="absolute -top-2 -right-2 text-[9px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold ring-2 ring-[var(--color-primary)]"
                                                style={{ background: '#fff', color: 'var(--color-primary)' }}
                                            >
                                                {wishlistCount > 99 ? '99+' : wishlistCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium">Wishlist</span>
                                </Link>

                                <Link
                                    href="/cart"
                                    className="hidden sm:flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-md transition-colors hover:bg-white/15 cursor-pointer select-none text-white"
                                >
                                    <div className="relative">
                                        <LuShoppingCart size={22} strokeWidth={1.7} />
                                        {cartItems.length > 0 && (
                                            <span
                                                className="absolute -top-2 -right-2 text-[9px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold ring-2 ring-[var(--color-primary)]"
                                                style={{ background: '#fff', color: 'var(--color-primary)' }}
                                            >
                                                {cartItems.length > 99 ? '99+' : cartItems.length}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium">Cart</span>
                                </Link>

                                {/* Hamburger — mobile only, rightmost */}
                                <button
                                    className="lg:hidden p-2 text-white hover:text-white rounded-md hover:bg-white/15 transition-colors flex-shrink-0"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    aria-label="Menu"
                                >
                                    {isMobileMenuOpen ? <LuX size={22} /> : <LuMenu size={22} />}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Search */}
                        <div className="md:hidden pb-3">
                            <SearchAutocomplete
                                variant="mobile"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={(term) => handleSearch(term)}
                                placeholder="Search products…"
                            />
                        </div>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="lg:hidden bg-white rounded-xl border border-gray-100 shadow-lg mt-1 mb-3 py-2">
                                <div className="space-y-0.5">
                                    <button
                                        onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-gray-800 font-semibold text-sm rounded-md hover:bg-gray-50"
                                    >
                                        <span>Categories</span>
                                        <LuChevronDown size={14} className={`transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isMobileCategoryOpen && (
                                        <div className="pl-3 space-y-0.5">
                                            <Link href="/products" className="block px-3 py-2 text-gray-600 text-sm rounded-md hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                                🛒 All Products
                                            </Link>
                                            {categories.map(cat => (
                                                <Link
                                                    key={cat._id}
                                                    href={`/products?category=${cat._id}`}
                                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm rounded-md hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {cat.icon && <span className="text-sm">{cat.icon}</span>}
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {[
                                        { href: '/track', label: '📦 Track Order' },
                                        { href: '/contact', label: '💬 Help & Support' },
                                        { href: wishlistHref, label: '♥ Wishlist' },
                                    ].map(item => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)] rounded-md transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </header>
        </>
    );
};

function HeaderLogo() {
    return (
        <div className="group select-none transition-transform duration-300 group-hover:scale-105" aria-label="Anandabazar BDMart">
            <Logo boxed imgClassName="h-[36px] md:h-[46px]" />
        </div>
    );
}

export default Header;
