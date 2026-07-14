"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NewProductCard from '@/components/shared/NewProductCard';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { LuX, LuSearch } from 'react-icons/lu';
import HeroSection from './HeroSection';
import CategoryExpertise from './CategoryExpertise';
import QualityFeatures from './QualityFeatures';
import CtaBanner from './CtaBanner';
import TrustStrip from './TrustStrip';
import FlashSale from './FlashSale';
import DealsRow from './DealsRow';
import BestSellers from './BestSellers';

const LIMIT = 20;

const NewHomePage: React.FC = () => {
    const searchParams = useSearchParams();

    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || '');
    const [page, setPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const search = searchParams.get('searchTerm') || '';
        setSelectedCategory(cat);
        setSearchTerm(search);
        setPage(1);
        setAccumulatedProducts([]);
    }, [searchParams]);

    // Memoized so the query arg stays referentially stable across renders (Next 16
    // client components otherwise churn object identity, which can break RTK
    // Query's refetch-on-arg-change).
    const queryParams = useMemo(() => {
        const p: Record<string, string | number | undefined> = { limit: LIMIT, page, sort: '-createdAt' };
        if (selectedCategory) p.category = selectedCategory;
        if (searchTerm) p.searchTerm = searchTerm;
        return p;
    }, [page, selectedCategory, searchTerm]);

    const { data: productsData, isLoading, isFetching } = useGetProductsQuery(queryParams);
    // Only categories the admin has toggled to show on the homepage.
    const { data: categoriesData } = useGetCategoriesQuery({ home: true });

    const products = productsData?.data || [];
    const meta = productsData?.meta;
    const totalPages = meta?.totalPages || 1;
    const categories = categoriesData?.data || [];

    // Signal the preloader once both products and categories are available
    useEffect(() => {
        const productsReady = !isLoading && !isFetching && !!productsData;
        const categoriesReady = !!categoriesData;
        if (productsReady && categoriesReady) {
            window.dispatchEvent(new CustomEvent('anandabazarbdmart:dataReady'));
        }
    }, [isLoading, isFetching, productsData, categoriesData]);

    // Accumulate products when new data arrives
    useEffect(() => {
        if (products.length > 0 && !isFetching) {
            if (page === 1) {
                setAccumulatedProducts(products);
            } else {
                setAccumulatedProducts(prev => {
                    const existingIds = new Set(prev.map((p: any) => p._id));
                    const newProducts = products.filter((p: any) => !existingIds.has(p._id));
                    return [...prev, ...newProducts];
                });
            }
            setIsLoadingMore(false);
        }
    }, [products, isFetching, page]);

    const handleClearTextSearch = () => {
        setSearchTerm('');
        setPage(1);
        setAccumulatedProducts([]);
        window.history.pushState({}, '', '/');
    };

    const handleCategoryChange = (categoryId: string) => {
        if (categoryId === selectedCategory) {
            if (products.length > 0) setAccumulatedProducts(products);
            return;
        }
        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId);
        window.history.pushState({}, '', `/?${params.toString()}`);
        setSelectedCategory(categoryId);
        setPage(1);
        setAccumulatedProducts([]);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            setIsLoadingMore(true);
            setPage(prev => prev + 1);
        }
    };

    const displayProducts = useMemo(() => {
        return accumulatedProducts.length > 0 ? accumulatedProducts : products;
    }, [accumulatedProducts, products]);

    const selectedCategoryName = useMemo(() => {
        if (!selectedCategory) return '';
        const cat = categories.find((c: any) => c._id === selectedCategory);
        return cat?.name || '';
    }, [selectedCategory, categories]);

    // The page shell (hero, trust strip, categories, product grid) always
    // renders — it no longer blanks the entire page behind the products query.
    return (
        <div
            className="min-h-screen"
            style={{
                background:
                    'radial-gradient(55% 45% at 88% 0%, rgba(248,86,6,0.06), transparent 70%),' +
                    'radial-gradient(45% 40% at 0% 22%, rgba(248,86,6,0.04), transparent 70%),' +
                    '#F8FAFC',
            }}
        >
            <HeroSection />
            <TrustStrip />
            <CategoryExpertise />
            {!searchTerm && !selectedCategory && (
                <>
                    <FlashSale />
                    <DealsRow />
                    <BestSellers />
                </>
            )}

            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">

                {/* Text Search Results Banner */}
                {searchTerm && (
                    <div className="mb-4 sm:mb-6 bg-white border border-gray-200 rounded-md p-3 sm:p-5 shadow-sm animate-fadeIn">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-lightest)' }}>
                                    <LuSearch style={{ color: 'var(--color-primary)' }} size={15} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                                        Results for &quot;<span style={{ color: 'var(--color-primary)' }}>{searchTerm}</span>&quot;
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Found <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{meta?.total || displayProducts.length}</span> products
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearTextSearch}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md text-xs font-semibold transition-colors flex-shrink-0"
                            >
                                <LuX size={12} />
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Category Title */}
                {selectedCategory && (
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{selectedCategoryName || 'Category'}</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Showing all products in this category</p>
                        </div>
                        <button
                            onClick={() => handleCategoryChange('')}
                            className="text-xs sm:text-sm font-medium hover:underline flex-shrink-0 ml-2"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            View all →
                        </button>
                    </div>
                )}

                {/* Popular Products */}
                <div className="text-center mb-5 sm:mb-8 mt-4 sm:mt-6">
                    <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                        <span className="h-px w-6 sm:w-8 bg-[var(--color-primary)]/30" />
                        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-primary)] uppercase">What&apos;s Hot Right Now</span>
                        <span className="h-px w-6 sm:w-8 bg-[var(--color-primary)]/30" />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Popular Products</h3>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 max-w-md mx-auto hidden sm:block">Trending items loved by our customers worldwide.</p>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 transition-opacity duration-200 ${(isFetching && page === 1) ? 'opacity-60' : 'opacity-100'}`}>
                    {displayProducts.slice(0, 12).map((product: any) => (
                        <NewProductCard
                            key={product._id}
                            product={{
                                id: product._id,
                                slug: product.slug,
                                name: product.name,
                                image: product.thumbnail || product.images?.[0] || '',
                                price: product.price,
                                originalPrice: product.originalPrice || undefined,
                                discount: product.discount,
                                rating: product.rating,
                                reviews: product.reviewCount,
                                warranty: product.tagline || product.brand || 'Lower price than others but quality higher',
                                categoryName: product.category?.name || '',
                                priceType: product.priceType || 'negotiable',
                                sold: product.totalSold || 0,
                                likeCount: product.likeCount || 0,
                                commentCount: product.commentCount || 0,
                                shareCount: product.shareCount || 0,
                                viewCount: product.viewCount || 0,
                                reviewCount: product.reviewCount || 0,
                            }}
                        />
                    ))}
                </div>

                <div className="mt-6 flex justify-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                        View All Products <span aria-hidden>→</span>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                {/* New Arrivals */}
                <div className="text-center mb-5 sm:mb-8 mt-4 sm:mt-6">
                    <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                        <span className="h-px w-6 sm:w-8 bg-[var(--color-primary)]/30" />
                        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-primary)] uppercase">Just Landed</span>
                        <span className="h-px w-6 sm:w-8 bg-[var(--color-primary)]/30" />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">New Arrivals</h3>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 max-w-md mx-auto hidden sm:block">Freshly added products you don&apos;t want to miss.</p>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 transition-opacity duration-200 ${(isFetching && page === 1) ? 'opacity-60' : 'opacity-100'}`}>
                    {[...displayProducts].reverse().slice(0, 12).map((product: any) => (
                        <NewProductCard
                            key={`new-${product._id}`}
                            product={{
                                id: product._id,
                                slug: product.slug,
                                name: product.name,
                                image: product.thumbnail || product.images?.[0] || '',
                                price: product.price,
                                originalPrice: product.originalPrice || undefined,
                                discount: product.discount,
                                rating: product.rating,
                                reviews: product.reviewCount,
                                warranty: product.tagline || product.brand || 'Lower price than others but quality higher',
                                categoryName: product.category?.name || '',
                                priceType: product.priceType || 'negotiable',
                                sold: product.totalSold || 0,
                                likeCount: product.likeCount || 0,
                                commentCount: product.commentCount || 0,
                                shareCount: product.shareCount || 0,
                                viewCount: product.viewCount || 0,
                                reviewCount: product.reviewCount || 0,
                            }}
                        />
                    ))}
                </div>

                <div className="mt-6 flex justify-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                        View All Products <span aria-hidden>→</span>
                    </Link>
                </div>

                {/* Empty State */}
                {!isFetching && displayProducts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                        <p className="text-gray-500 mb-6">Try browsing another category</p>
                        <button
                            onClick={() => handleCategoryChange('')}
                            className="px-8 py-3 text-white rounded-full font-semibold transition-colors"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            View All Products
                        </button>
                    </div>
                )}

                {/* See More Products */}
                {page < totalPages && displayProducts.length > 0 && (
                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore || isFetching}
                            className="group relative px-10 py-3.5 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full">
                                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-in-out" />
                            </div>
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoadingMore || isFetching ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <LuSearch size={16} />
                                        See More Products
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                )}

                {/* Loading more skeleton */}
                {isLoadingMore && (
                    <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={`skeleton-${i}`} className="bg-white border border-gray-200 rounded-md overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-200" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <QualityFeatures />

            <CtaBanner />
        </div>
    );
};

export default NewHomePage;
