"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
    parent?: string | { _id: string } | null;
}

interface CategoryExpertiseProps {
    onClose?: () => void;
}

const ICON_MAP: { keywords: string[]; icon: string }[] = [
    { keywords: ['construction', 'engineering', 'civil', 'architect'],                              icon: '🏗️' },
    { keywords: ['electrical', 'electronics', 'electric'],                                          icon: '⚡' },
    { keywords: ['family', 'kids', 'daily care', 'baby', 'child'],                                 icon: '👨‍👩‍👧‍👦' },
    { keywords: ['fashion', 'personal style', 'clothing', 'apparel', 'garment'],                   icon: '👗' },
    { keywords: ['home & lifestyle', 'home and lifestyle', 'lifestyle', 'home decor', 'interior', 'furniture', 'kitchen'], icon: '🏠' },
    { keywords: ['industrial', 'manufacturing', 'factory', 'machinery'],                            icon: '🏭' },
    { keywords: ['agriculture', 'food industry', 'farming', 'agro'],                               icon: '🌾' },
    { keywords: ['auto', 'vehicle', 'motor', 'car', 'bike', 'truck'],                             icon: '🚗' },
    { keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor'],                               icon: '⚽' },
    { keywords: ['health', 'beauty', 'cosmetic', 'skincare', 'medical', 'pharma', 'wellness'],    icon: '💊' },
    { keywords: ['toy', 'game', 'play', 'puzzle'],                                                 icon: '🧸' },
    { keywords: ['bag', 'luggage', 'backpack', 'suitcase'],                                        icon: '👜' },
    { keywords: ['shoe', 'footwear', 'sneaker', 'sandal', 'boot'],                                icon: '👟' },
    { keywords: ['watch', 'jewel', 'accessories', 'sunglass'],                                     icon: '⌚' },
    { keywords: ['gadget', 'tool', 'hardware', 'equipment'],                                       icon: '🔧' },
    { keywords: ['book', 'stationery', 'education', 'office', 'school'],                          icon: '📚' },
    { keywords: ['phone', 'smartphone', 'mobile', 'tablet'],                                       icon: '📱' },
    { keywords: ['computer', 'laptop', 'pc', 'desktop'],                                           icon: '💻' },
    { keywords: ['grocery', 'supermarket', 'vegetable', 'fruit', 'food', 'restaurant', 'catering', 'bakery'], icon: '🛒' },
    { keywords: ['pet', 'animal', 'dog', 'cat', 'bird'],                                          icon: '🐾' },
    { keywords: ['energy', 'solar', 'power', 'oil', 'gas'],                                       icon: '🔋' },
    { keywords: ['chemical', 'plastic', 'rubber', 'material'],                                     icon: '🧪' },
    { keywords: ['security', 'safety', 'surveillance', 'cctv'],                                   icon: '🔒' },
    { keywords: ['textile', 'fabric', 'yarn', 'thread'],                                          icon: '🧵' },
    { keywords: ['printing', 'packaging', 'paper', 'cardboard'],                                  icon: '🖨️' },
];

function resolveIcon(name: string, dbIcon?: string): string {
    if (dbIcon && dbIcon.length <= 8) return dbIcon; // emoji from DB preferred
    const lower = name.toLowerCase();
    for (const entry of ICON_MAP) {
        if (entry.keywords.some(kw => lower.includes(kw))) return entry.icon;
    }
    return '📦';
}

const FALLBACK_CATEGORIES: Category[] = [
    { _id: 'f-electronics',  name: 'Electronics',          slug: 'electronics',        icon: '📱' },
    { _id: 'f-fashion',      name: 'Fashion & Clothing',   slug: 'fashion-clothing',   icon: '👗' },
    { _id: 'f-home',         name: 'Home & Kitchen',       slug: 'home-kitchen',       icon: '🏠' },
    { _id: 'f-health',       name: 'Health & Beauty',      slug: 'health-beauty',      icon: '💊' },
    { _id: 'f-sports',       name: 'Sports & Outdoors',    slug: 'sports-outdoors',    icon: '⚽' },
    { _id: 'f-books',        name: 'Books & Stationery',   slug: 'books-stationery',   icon: '📚' },
    { _id: 'f-grocery',      name: 'Grocery & Food',       slug: 'grocery-food',       icon: '🛒' },
    { _id: 'f-toys',         name: 'Toys & Kids',          slug: 'toys-kids',          icon: '🧸' },
    { _id: 'f-shoes',        name: 'Shoes & Footwear',     slug: 'shoes-footwear',     icon: '👟' },
    { _id: 'f-accessories',  name: 'Watches & Accessories',slug: 'watches-accessories',icon: '⌚' },
];

const CategoryExpertise: React.FC<CategoryExpertiseProps> = ({ onClose }) => {
    // Only categories the admin has toggled to show on the homepage.
    const { data: categoriesData } = useGetCategoriesQuery({ home: true });
    const apiCategories: Category[] = categoriesData?.data || [];
    // Only show top-level categories (not sub-categories) in the featured strip.
    const topLevel = apiCategories.filter((c) => !c.parent);
    const categories: Category[] = topLevel.length > 0 ? topLevel : FALLBACK_CATEGORIES;

    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
    };

    return (
        <section id="home-categories" className="w-full scroll-mt-24 bg-white border-b border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">

                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="w-[3px] h-5 rounded-full"
                            style={{ background: 'var(--color-primary)' }}
                        />
                        <h2 className="text-sm sm:text-base font-bold text-gray-800 tracking-tight">
                            Featured Categories
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/products"
                            className="text-xs font-semibold hover:underline"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            View All →
                        </Link>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <LuX size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Scroll area */}
                <div className="relative px-7 sm:px-0">
                    {/* Left arrow — visible on all sizes */}
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                        className="flex absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                        <LuChevronLeft size={13} className="sm:hidden" />
                        <LuChevronLeft size={16} className="hidden sm:block" />
                    </button>

                    <div
                        ref={scrollRef}
                        className="scrollbar-hide overflow-x-auto"
                    >
                        <div className="flex gap-2 sm:gap-4 justify-center min-w-full py-2">
                            {categories.map(cat => (
                                <Link
                                    key={cat._id}
                                    href={`/products?category=${cat._id}`}
                                    className="flex-shrink-0 flex flex-col items-center gap-1.5 sm:gap-2.5 group w-[76px] sm:w-[130px]"
                                >
                                    {/* Tile — a real category photo when the admin has set one,
                                        otherwise fall back to the emoji so nothing looks empty. */}
                                    <div
                                        className="w-[72px] h-[72px] sm:w-[128px] sm:h-[128px] rounded-md bg-white border border-gray-200 overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:border-orange-300 group-hover:shadow-md"
                                    >
                                        {cat.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={cat.image}
                                                alt={cat.name}
                                                // This strip sits high on the homepage — only six small tiles, so
                                                // load them straight away rather than lazily popping them in.
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <span className="text-3xl sm:text-6xl select-none transition-transform duration-200 group-hover:scale-110">
                                                {resolveIcon(cat.name, cat.icon)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className="w-full text-[10px] sm:text-[13px] sm:font-semibold text-gray-600 text-center font-medium leading-snug transition-colors group-hover:text-[var(--color-primary)]">
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right arrow — visible on all sizes */}
                    <button
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                        className="flex absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                        <LuChevronRight size={13} className="sm:hidden" />
                        <LuChevronRight size={16} className="hidden sm:block" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CategoryExpertise;
