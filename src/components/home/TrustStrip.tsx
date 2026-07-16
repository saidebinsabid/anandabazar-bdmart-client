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
 * Trust strip — three wide cards (Safe Payment | Fast Delivery | Free Return).
 * Each card fills its column and lays the icon badge beside the title +
 * supporting line, giving a landscape card. On the narrow 3-up mobile grid
 * there is no room for that, so the icon stacks above centred text instead.
 * On hover or touch, a brand-orange border draws in from the top-left and
 * bottom-right corners and meets in the middle (see `.card-draw` in globals.css).
 */
const TrustStrip: React.FC = () => {
    return (
        <div className="container mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 my-2 sm:my-4">
                {items.map(({ icon: Icon, label, sub, iconBg, iconColor, ring }) => (
                    <div
                        key={label}
                        tabIndex={0}
                        className="card-draw group relative flex w-full flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-4 text-center shadow-sm outline-none transition-shadow duration-300 hover:shadow-md sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-4 sm:text-left"
                    >
                        {/* Icon — stacked on top on mobile, beside the text from sm: up */}
                        <div
                            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${iconBg} ring-4 ring-transparent ${ring} transition-all duration-300`}
                        >
                            <Icon className={`${iconColor} w-4 h-4 sm:w-[22px] sm:h-[22px]`} />
                        </div>
                        {/* Text block — sits to the right of the icon on wider screens */}
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-sm font-semibold text-slate-800 leading-tight">
                                {label}
                            </p>
                            <p className="hidden sm:block text-xs text-slate-500 leading-snug mt-0.5">
                                {sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustStrip;
