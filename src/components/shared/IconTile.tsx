"use client";

import React from 'react';
import type { IconType } from 'react-icons';

/**
 * IconTile — the site-wide "colored tile" icon treatment.
 * An icon sits inside a soft, tinted rounded tile (app / dashboard style).
 * Use it for showcase icons: feature cards, stat cards, category tiles,
 * empty states, section highlights. Do NOT use it for tiny inline/functional
 * icons (close ×, chevrons, arrows, search-bar, star ratings) — those stay bare.
 */

export type IconTone =
    | 'primary' | 'blue' | 'purple' | 'amber' | 'pink'
    | 'teal' | 'cyan' | 'rose' | 'green' | 'gray';

const TONES: Record<IconTone, { bg: string; fg: string }> = {
    primary: { bg: 'var(--color-primary-lightest)', fg: 'var(--color-primary)' },
    blue: { bg: '#EFF6FF', fg: '#2563EB' },
    purple: { bg: '#F5F3FF', fg: '#7C3AED' },
    amber: { bg: '#FFF7ED', fg: '#D97706' },
    pink: { bg: '#FDF2F8', fg: '#DB2777' },
    teal: { bg: '#ECFDF5', fg: '#059669' },
    cyan: { bg: '#ECFEFF', fg: '#0891B2' },
    rose: { bg: '#FEF2F2', fg: '#E11D48' },
    green: { bg: '#F0FDF4', fg: '#16A34A' },
    gray: { bg: '#F3F4F6', fg: '#4B5563' },
};

/** Pleasant, non-repeating order for coloring lists of tiles by index. */
const CYCLE: IconTone[] = ['primary', 'blue', 'teal', 'pink', 'amber', 'purple', 'cyan', 'rose'];

export const toneByIndex = (i: number): IconTone =>
    CYCLE[((i % CYCLE.length) + CYCLE.length) % CYCLE.length];

interface IconTileProps {
    icon: IconType;
    tone?: IconTone;
    /** Outer tile size in px (default 44). */
    size?: number;
    /** Icon glyph size in px (defaults to ~46% of tile). */
    iconSize?: number;
    /** Corner radius in px (defaults to ~28% of tile for a soft square). */
    radius?: number;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
}

const IconTile: React.FC<IconTileProps> = ({
    icon: Icon,
    tone = 'primary',
    size = 44,
    iconSize,
    radius,
    className = '',
    style,
    title,
}) => {
    const t = TONES[tone] || TONES.primary;
    return (
        <span
            className={className}
            title={title}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: radius ?? Math.round(size * 0.28),
                background: t.bg,
                color: t.fg,
                flexShrink: 0,
                ...style,
            }}
        >
            <Icon size={iconSize ?? Math.round(size * 0.46)} />
        </span>
    );
};

export default IconTile;
