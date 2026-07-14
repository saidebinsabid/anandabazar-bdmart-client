import React from 'react';

/**
 * Anandabazar BDMart brand logo — a modern typographic wordmark.
 *
 * "Ananda" in ink + "bazar" in the brand orange, with a small "BD MART"
 * subtitle right-aligned so it ends exactly where "bazar" ends. Every text
 * run is pinned with SVG `textLength`, so the mark renders identically on
 * all devices/fonts and can never overflow or clip.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** On a dark background — render the wordmark in white so it stays legible. */
    light?: boolean;
    /** Wrap the (ink) wordmark in a white rounded chip. */
    boxed?: boolean;
    /** Kept for API compatibility (no-op). */
    showTagline?: boolean;
    /** Render only the compact "a" monogram (no wordmark). */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the logo (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

const ORANGE = '#F85606';
const INK = '#1f2937';
const SUB = '#9ca3af';
const SUB_ON_DARK = '#cbd5e1';
const FONT = "'Poppins', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";

// Wordmark geometry (viewBox 0 0 234 60): text spans x=2..230.
const W_ANANDA = 132; // pinned width of "Ananda"
const W_BAZAR = 96;   // pinned width of "bazar" → wordmark ends at x=230
const RIGHT_EDGE = 2 + W_ANANDA + W_BAZAR;

const Logo: React.FC<LogoProps> = ({
    size = 40,
    light = false,
    boxed = false,
    iconOnly = false,
    className,
    imgClassName,
}) => {
    const heightStyle = imgClassName ? undefined : { height: size };
    const svgStyle: React.CSSProperties = { ...heightStyle, width: 'auto', display: 'block' };

    // On a dark background (light, not chipped) the primary text flips to white.
    const onDark = light && !boxed;
    const primary = onDark ? '#ffffff' : INK;
    const subtitle = onDark ? SUB_ON_DARK : SUB;

    const svg = iconOnly ? (
        <svg viewBox="0 0 64 64" role="img" aria-label="Anandabazar BDMart" className={imgClassName} style={svgStyle}>
            <rect x="2" y="2" width="60" height="60" rx="17" fill={ORANGE} />
            <text x="32" y="47" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="40" fill="#fff">a</text>
        </svg>
    ) : (
        <svg viewBox="0 0 234 60" role="img" aria-label="Anandabazar BDMart" className={imgClassName} style={svgStyle}>
            <text x="2" y="36" fontFamily={FONT} fontWeight="700" fontSize="33">
                <tspan fill={primary} textLength={W_ANANDA} lengthAdjust="spacingAndGlyphs">Ananda</tspan>
                <tspan fill={ORANGE} textLength={W_BAZAR} lengthAdjust="spacingAndGlyphs">bazar</tspan>
            </text>
            <text
                x={RIGHT_EDGE}
                y="54"
                textAnchor="end"
                fontFamily={FONT}
                fontWeight="600"
                fontSize="11"
                letterSpacing="4"
                fill={subtitle}
            >
                BD MART
            </text>
        </svg>
    );

    if (boxed) {
        return (
            <span
                className={className}
                style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '6px 12px' }}
            >
                {svg}
            </span>
        );
    }

    return (
        <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {svg}
        </span>
    );
};

/** Compact brand mark — same logo API, used where space is tight. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;
