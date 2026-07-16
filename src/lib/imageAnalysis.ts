/**
 * Client-side visual analysis for image search.
 *
 * Runs entirely in the browser (free, no API): it draws the uploaded image to a
 * canvas, reads the actual pixels, and extracts the dominant colours — the same
 * signal a shopper sees. Those named colours are sent to the backend matcher.
 * When an AI vision provider is configured server-side, the downscaled data URL
 * is ALSO forwarded so the AI can add object/label detection.
 *
 * Palette kept in sync with the backend (imageSearch.provider.ts NAMED_COLORS).
 */

const NAMED_COLORS: { name: string; r: number; g: number; b: number }[] = [
    { name: 'red', r: 225, g: 29, b: 29 },
    { name: 'orange', r: 249, g: 115, b: 22 },
    { name: 'yellow', r: 234, g: 179, b: 8 },
    { name: 'green', r: 22, g: 163, b: 74 },
    { name: 'teal', r: 20, g: 184, b: 166 },
    { name: 'blue', r: 37, g: 99, b: 235 },
    { name: 'navy', r: 30, g: 58, b: 138 },
    { name: 'purple', r: 147, g: 51, b: 234 },
    { name: 'pink', r: 236, g: 72, b: 153 },
    { name: 'brown', r: 146, g: 64, b: 14 },
    { name: 'beige', r: 214, g: 199, b: 161 },
    { name: 'black', r: 17, g: 17, b: 17 },
    { name: 'white', r: 248, g: 248, b: 248 },
    { name: 'gray', r: 107, g: 114, b: 128 },
    { name: 'silver', r: 192, g: 192, b: 192 },
    { name: 'gold', r: 212, g: 175, b: 55 },
];

const COLOR_HEX: Record<string, string> = {
    red: '#e11d1d', orange: '#f97316', yellow: '#eab308', green: '#16a34a',
    teal: '#14b8a6', blue: '#2563eb', navy: '#1e3a8a', purple: '#9333ea',
    pink: '#ec4899', brown: '#92400e', beige: '#d6c7a1', black: '#111111',
    white: '#f8f8f8', gray: '#6b7280', silver: '#c0c0c0', gold: '#d4af37',
};

export const colorHex = (name: string): string => COLOR_HEX[name] || '#cccccc';

function nearestNamedColor(r: number, g: number, b: number): string {
    let best = NAMED_COLORS[0];
    let bestDist = Infinity;
    for (const c of NAMED_COLORS) {
        const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
        if (d < bestDist) { bestDist = d; best = c; }
    }
    return best.name;
}

export interface ImageAnalysis {
    colors: string[];   // dominant named colours, most-dominant first
    dataUrl: string;    // downscaled JPEG data URL (preview + AI forwarding)
    width: number;
    height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not read image'));
        img.src = src;
    });
}

/**
 * Analyse an uploaded image File → dominant colours + a downscaled data URL.
 */
export async function analyzeImageFile(file: File): Promise<ImageAnalysis> {
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImage(objectUrl);

        // ── Downscaled JPEG (max 640px) for preview + AI provider forwarding ──
        const maxSide = 640;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const dw = Math.max(1, Math.round(img.width * scale));
        const dh = Math.max(1, Math.round(img.height * scale));
        const big = document.createElement('canvas');
        big.width = dw; big.height = dh;
        const bctx = big.getContext('2d');
        let dataUrl = '';
        if (bctx) {
            bctx.drawImage(img, 0, 0, dw, dh);
            dataUrl = big.toDataURL('image/jpeg', 0.72);
        }

        // ── Colour histogram on a tiny 64px canvas (fast, representative) ──
        const sample = 64;
        const sScale = Math.min(1, sample / Math.max(img.width, img.height));
        const sw = Math.max(1, Math.round(img.width * sScale));
        const sh = Math.max(1, Math.round(img.height * sScale));
        const c = document.createElement('canvas');
        c.width = sw; c.height = sh;
        const ctx = c.getContext('2d', { willReadFrequently: true });

        const counts: Record<string, number> = {};
        if (ctx) {
            ctx.drawImage(img, 0, 0, sw, sh);
            const { data } = ctx.getImageData(0, 0, sw, sh);
            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a < 128) continue; // skip transparent
                const name = nearestNamedColor(data[i], data[i + 1], data[i + 2]);
                counts[name] = (counts[name] || 0) + 1;
            }
        }

        const totalPx = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
        // Rank colours by dominance. Demote near-ubiquitous white/gray/silver a touch —
        // those are usually the product-photo background, not the product colour — but
        // still keep them so a genuinely white product ranks.
        const bgish = new Set(['white', 'gray', 'silver']);
        const ranked = Object.entries(counts)
            .map(([name, n]) => {
                const share = n / totalPx;
                const weight = bgish.has(name) && share < 0.85 ? n * 0.45 : n;
                return { name, n, share, weight };
            })
            .sort((a, b) => b.weight - a.weight);

        // Keep the top colours that each hold a meaningful share (>=6%), max 4.
        const colors = ranked
            .filter((c) => c.share >= 0.06)
            .slice(0, 4)
            .map((c) => c.name);

        return {
            colors: colors.length ? colors : ranked.slice(0, 2).map((c) => c.name),
            dataUrl,
            width: img.width,
            height: img.height,
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
