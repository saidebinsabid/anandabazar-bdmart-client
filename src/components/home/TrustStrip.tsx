"use client";

import React from 'react';
import { LuShield, LuTruck, LuRefreshCcw } from 'react-icons/lu';

const items = [
    {
        icon: LuShield,
        label: 'Safe Payment',
        sub: '100% secure & encrypted transactions',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        ring: 'group-hover:ring-emerald-200',
    },
    {
        icon: LuTruck,
        label: 'Fast Delivery',
        sub: 'Quick doorstep delivery nationwide',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
        ring: 'group-hover:ring-orange-200',
    },
    {
        icon: LuRefreshCcw,
        label: 'Free Return',
        sub: 'Easy 7-day return & refund policy',
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        ring: 'group-hover:ring-sky-200',
    },
];

/**
 * Trust strip — three compact, centred cards (Safe Payment | Fast Delivery |
 * Free Return): icon badge on top, then title, then supporting line. On hover
 * or touch, a brand-orange border draws in from the top-left and bottom-right
 * corners and meets in the middle (see `.card-draw` in globals.css).
 */
const TrustStrip: React.FC = () => {
    return (
        <div className="container mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 my-2 sm:my-4">
                {items.map(({ icon: Icon, label, sub, iconBg, iconColor, ring }) => (
                    <div
                        key={label}
                        tabIndex={0}
                        className="card-draw group relative mx-auto flex w-full max-w-[230px] flex-col items-center gap-2 sm:gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-4 sm:px-4 sm:py-6 text-center shadow-sm outline-none transition-shadow duration-300 hover:shadow-md"
                    >
                        {/* Icon on top */}
                        <div
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${iconBg} ring-4 ring-transparent ${ring} transition-all duration-300`}
                        >
                            <Icon className={`${iconColor} w-4 h-4 sm:w-[22px] sm:h-[22px]`} />
                        </div>
                        {/* Title */}
                        <p className="text-[11px] sm:text-sm font-semibold text-slate-800 leading-tight">
                            {label}
                        </p>
                        {/* Description */}
                        <p className="hidden sm:block text-xs text-slate-500 leading-snug">
                            {sub}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustStrip;
