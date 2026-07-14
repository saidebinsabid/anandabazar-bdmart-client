import { store } from '@/redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Range { from?: string; to?: string }

/**
 * Download the finance report as PDF or Excel (.xlsx) and trigger a browser
 * download. Replicates baseApi auth (Bearer token from redux, falling back to
 * localStorage). SSR-safe. Throws on a non-ok response so callers can toast.
 */
async function downloadFinance(format: 'pdf' | 'excel', range: Range = {}): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const token =
        store.getState().auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const qs = new URLSearchParams();
    if (range.from) qs.set('from', range.from);
    if (range.to) qs.set('to', range.to);
    const url = `${API_URL}/finance/report/${format}${qs.toString() ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
        throw new Error(`Failed to download report (status ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `Anandabazar-BDMart-Finance-${stamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
}

export const downloadFinancePdf = (range?: Range) => downloadFinance('pdf', range);
export const downloadFinanceExcel = (range?: Range) => downloadFinance('excel', range);
