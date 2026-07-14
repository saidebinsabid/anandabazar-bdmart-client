"use client";

import React from 'react';
import { LuGlobe, LuShield, LuLock, LuTruck, LuRefreshCw, LuEye } from 'react-icons/lu';
import IconTile, { toneByIndex } from '@/components/shared/IconTile';

const features = [
    {
        icon: LuGlobe,
        title: 'Worldwide Purchase',
        desc: 'No boundaries — buy from sellers around the world.',
    },
    {
        icon: LuShield,
        title: 'Verified Sellers',
        desc: 'Every seller is vetted so you always get quality products.',
    },
    {
        icon: LuLock,
        title: 'Safe Payments',
        desc: 'Bank-grade security on every transaction, every time.',
    },
    {
        icon: LuTruck,
        title: 'Fast Delivery',
        desc: 'Optimized logistics so your order arrives quickly.',
    },
    {
        icon: LuRefreshCw,
        title: 'Easy Refunds',
        desc: 'Hassle-free refunds whenever something is not right.',
    },
    {
        icon: LuEye,
        title: 'Full Transparency',
        desc: 'Clarity, accountability, and ethical business at every step.',
    },
];

const QualityFeatures: React.FC = () => {
    return (
        <section className="w-full bg-white py-12 sm:py-14">
            <div className="container mx-auto px-4">

                    {/* Header — centered kicker + title + subtitle */}
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="h-px w-8 bg-[var(--color-primary)]/30" />
                            <span className="text-[11px] font-semibold tracking-[0.25em] text-[var(--color-primary)] uppercase">
                                Why Choose Us
                            </span>
                            <span className="h-px w-8 bg-[var(--color-primary)]/30" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Quality Choices, Affordable Prices
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                            Why thousands of customers trust Anandabazar BDMart for their shopping needs.
                        </p>
                    </div>

                    {/* Feature Cards — minimal, monochrome */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {features.map((item, idx) => (
                            <div
                                key={idx}
                                className="group relative flex flex-col items-center text-center bg-white border border-gray-100 rounded-2xl p-5 transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <IconTile
                                    icon={item.icon}
                                    tone={toneByIndex(idx)}
                                    size={52}
                                    iconSize={24}
                                    radius={14}
                                    className="mb-3 transition-transform duration-300 group-hover:scale-110"
                                />
                                <h4 className="text-[13px] font-bold text-gray-900 mb-1">
                                    {item.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
            </div>
        </section>
    );
};

export default QualityFeatures;
