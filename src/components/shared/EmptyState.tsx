"use client";

import React from 'react';
import Link from 'next/link';
import { LuShoppingBag } from 'react-icons/lu';

interface EmptyStateProps {
    title: string;
    description: string;
    buttonText?: string;
    buttonLink?: string;
    icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    buttonText = 'Continue Shopping',
    buttonLink = '/',
    icon = <LuShoppingBag size={48} />
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 bg-[var(--color-primary-lightest)] rounded-[28px] flex items-center justify-center text-[var(--color-primary)] mb-6 ring-1 ring-[var(--color-primary-border)]">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-md mb-8">
                {description}
            </p>
            <Link
                href={buttonLink}
                className="inline-flex items-center justify-center px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-md hover:scale-105 transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
            >
                {buttonText}
            </Link>
        </div>
    );
};

export default EmptyState;
