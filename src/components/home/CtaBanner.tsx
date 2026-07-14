"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

const CtaBanner: React.FC = () => {
    return (
        <section className="w-full relative overflow-hidden">
            {/* Background — indigo gradient */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(120deg, var(--color-primary) 0%, var(--color-primary-dark) 55%, var(--color-primary) 100%)' }}
            />
            {/* Decorative blobs */}
            <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-white/[0.05]" />

            {/* Content */}
            <div className="relative container mx-auto px-4 py-16 text-center">
                <span className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Join the marketplace
                </span>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                    Are you prepared to begin?
                </h2>
                <p className="text-sm md:text-base text-white/75 mb-8 max-w-xl mx-auto leading-relaxed">
                    Explore thousands of quality products and get them delivered to customers across Bangladesh today!
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary)] font-bold text-sm px-7 py-3 rounded-md hover:bg-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        Shop Now <LuArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CtaBanner;
