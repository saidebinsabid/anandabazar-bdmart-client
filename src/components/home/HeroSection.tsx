"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

const SLIDE_INTERVAL = 6000; // ms per slide
const FADE_MS = 800;         // crossfade duration

type HeroSlide = { imageUrl: string; active?: boolean; order?: number };

/**
 * Hero — a clean, image-only banner carousel.
 *
 * Shows the admin's hero banners exactly as uploaded (Dashboard → Site Content
 * → Hero Slides, recommended 1920 × 540). No text/CTA overlay, so banners that
 * carry their own artwork/wording never conflict. Just a smooth crossfade,
 * autoplay (pauses on hover), glass arrows, progress dots and touch swipe.
 * Honors prefers-reduced-motion.
 */
const HeroSection: React.FC = () => {
    const { data, isLoading } = useGetSiteContentQuery(undefined);
    const reduce = !!useReducedMotion();

    // Only ever the admin's own banners — there is deliberately no stand-in image
    // to fall back on, because a placeholder banner would flash on every load
    // before the real ones arrive.
    const images = React.useMemo(() => {
        return ((data?.data?.heroSlides || []) as HeroSlide[])
            .filter((s) => s?.imageUrl && s.active !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((s) => s.imageUrl);
    }, [data]);

    const multiple = images.length > 1;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [cycle, setCycle] = useState(0); // restarts the progress bar after pause/manual nav

    // Each banner's own aspect ratio, measured on load — the frame adopts it so
    // the image shows fully (no cropping) at whatever size it was uploaded.
    const [ratios, setRatios] = useState<Record<number, number>>({});
    const DEFAULT_RATIO = 16 / 9;
    // Clamp to a sensible hero band so an odd upload can't break the layout.
    const activeRatio = Math.min(4, Math.max(1.4, ratios[active] ?? ratios[0] ?? DEFAULT_RATIO));
    const onImgLoad = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
        const el = e.currentTarget;
        if (el.naturalWidth && el.naturalHeight) {
            const r = el.naturalWidth / el.naturalHeight;
            setRatios((prev) => (prev[i] === r ? prev : { ...prev, [i]: r }));
        }
    };

    useEffect(() => { setActive(0); }, [images.length]);

    // Autoplay (pauses on hover, respects reduced motion).
    useEffect(() => {
        if (!multiple || paused || reduce) return;
        const t = setInterval(() => setActive((a) => (a + 1) % images.length), SLIDE_INTERVAL);
        return () => clearInterval(t);
    }, [multiple, paused, reduce, images.length, cycle]);

    const goTo = useCallback((i: number) => {
        setActive(((i % images.length) + images.length) % images.length);
        setCycle((c) => c + 1);
    }, [images.length]);

    // Touch swipe.
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multiple && Math.abs(dx) > 48) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    // While the banners are still loading, hold the space with a neutral
    // placeholder rather than a stand-in image — that is what used to flash the
    // old banner on every reload. (Every hook above has already run, so these
    // early returns are safe.)
    if (isLoading) {
        return (
            <section className="w-full" aria-label="Featured banners">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-5">
                    <div
                        className="w-full animate-pulse rounded-2xl bg-slate-100 ring-1 ring-black/5 max-h-[260px] sm:max-h-[340px] md:max-h-[420px] lg:max-h-[480px]"
                        style={{ aspectRatio: String(activeRatio) }}
                    />
                </div>
            </section>
        );
    }
    // Loaded, but the admin hasn't added any banners — show nothing at all.
    if (images.length === 0) return null;

    return (
        <section className="w-full" aria-label="Featured banners">
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-5">
                <div
                    className="group relative w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[0_14px_44px_-22px_rgba(15,23,42,0.4)] ring-1 ring-black/5"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    aria-roledescription="carousel"
                >
                    {/* Stage — adopts the banner's aspect ratio, but capped to a shorter
                        max-height so a tall (e.g. 16:9) banner stays a compact strip.
                        Wide banners stay under the cap and show fully. */}
                    <div
                        className="relative w-full max-h-[260px] overflow-hidden transition-[aspect-ratio] duration-500 ease-out sm:max-h-[340px] md:max-h-[420px] lg:max-h-[480px]"
                        style={{ aspectRatio: String(activeRatio) }}
                    >

                        {/* ── Crossfading banner images ── */}
                        {images.map((src, i) => {
                            const isActive = i === active;
                            return (
                                <motion.div
                                    key={`${src}-${i}`}
                                    className="absolute inset-0"
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0 }}
                                    transition={{ duration: reduce ? 0 : FADE_MS / 1000, ease: 'easeInOut' }}
                                    style={{ zIndex: isActive ? 2 : 1 }}
                                    aria-hidden={!isActive}
                                >
                                    <Link
                                        href="/products"
                                        aria-label="Shop now"
                                        tabIndex={isActive ? 0 : -1}
                                        className="block h-full w-full"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={src}
                                            alt=""
                                            draggable={false}
                                            loading={i === 0 ? 'eager' : 'lazy'}
                                            fetchPriority={i === 0 ? 'high' : undefined}
                                            onLoad={onImgLoad(i)}
                                            className="h-full w-full object-cover"
                                        />
                                    </Link>
                                </motion.div>
                            );
                        })}

                        {/* ── Arrows (glass, reveal on hover) ── */}
                        {multiple && (
                            <>
                                <button
                                    onClick={() => goTo(active - 1)}
                                    aria-label="Previous banner"
                                    className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => goTo(active + 1)}
                                    aria-label="Next banner"
                                    className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronRight size={18} />
                                </button>
                            </>
                        )}

                        {/* ── Progress dots ── */}
                        {multiple && (
                            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                                {images.map((_, i) => {
                                    const isOn = i === active;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            aria-label={`Go to banner ${i + 1}`}
                                            className={`relative h-[5px] overflow-hidden rounded-full shadow-sm ring-1 ring-black/5 transition-all duration-300 ${
                                                isOn ? 'w-9 bg-white/45' : 'w-[14px] bg-white/55 hover:bg-white/80'
                                            }`}
                                        >
                                            {isOn && (
                                                <AnimatePresence>
                                                    <motion.span
                                                        key={`${active}-${cycle}-${paused}`}
                                                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: paused || reduce ? '100%' : ['0%', '100%'] }}
                                                        transition={paused || reduce ? { duration: 0.3 } : { duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
                                                    />
                                                </AnimatePresence>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
