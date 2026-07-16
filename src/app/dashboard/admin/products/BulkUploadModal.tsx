'use client';

import React, { useRef, useState } from 'react';
import { LuX, LuCloudUpload, LuFileText, LuCircleCheck, LuTriangleAlert, LuDownload } from 'react-icons/lu';
import { useBulkUploadProductsMutation } from '@/redux/api/productApi';
import { toast } from 'react-hot-toast';

// Columns parsed from the CSV.
// `category`/`subCategory` accept the category NAME (e.g. "Electronics") or its id.
// Pipe-separated columns (images/tags/colors/sizes) take multiple values: a|b|c.
const COLUMNS = [
    // core
    'name', 'price', 'originalPrice', 'costPrice', 'thumbnail', 'images',
    'category', 'subCategory', 'description', 'stock', 'status',
    // specs
    'brand', 'model', 'weight', 'boxSize', 'insideTheBox',
    // filters + image search
    'tags', 'colors', 'sizes',
];

const NUMERIC = new Set(['price', 'stock', 'originalPrice', 'costPrice']);
const PIPE_ARRAYS = new Set(['images', 'tags', 'colors', 'sizes']);

type ParsedRow = Record<string, any> & { __rowIndex: number; __errors: string[] };

// Minimal RFC-ish CSV line splitter that honours double-quoted fields.
function splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
            } else cur += ch;
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            out.push(cur); cur = '';
        } else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
}

export default function BulkUploadModal({ onClose }: { onClose: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [parseError, setParseError] = useState('');
    const [result, setResult] = useState<{ created: number; failed: { index: number; error: string }[] } | null>(null);

    const [bulkUpload, { isLoading }] = useBulkUploadProductsMutation();

    const buildRow = (cells: string[], headers: string[], rowIndex: number): ParsedRow => {
        const row: ParsedRow = { __rowIndex: rowIndex, __errors: [] };
        headers.forEach((h, i) => {
            const key = h.trim();
            let val: any = (cells[i] ?? '').trim();
            if (PIPE_ARRAYS.has(key)) {
                val = val ? String(val).split('|').map((u: string) => u.trim()).filter(Boolean) : [];
            } else if (NUMERIC.has(key)) {
                val = val === '' ? '' : Number(val);
            }
            row[key] = val;
        });
        // Client-side per-row checks (mirror backend rules)
        if (!row.name) row.__errors.push('name is required');
        if (row.price === '' || isNaN(Number(row.price)) || Number(row.price) <= 0) row.__errors.push('price must be positive');
        if (!row.thumbnail) row.__errors.push('thumbnail is required');
        if (!row.category) row.__errors.push('category is required');
        if (!row.description) row.__errors.push('description is required');
        const imgCount = [row.thumbnail, ...(Array.isArray(row.images) ? row.images : [])].filter(Boolean).length;
        if (imgCount < 3) row.__errors.push('at least 3 images required (thumbnail + 2 in images, pipe-separated)');
        // Optional numbers: only validated when a value was actually given.
        (['originalPrice', 'costPrice', 'stock'] as const).forEach((k) => {
            if (row[k] !== '' && row[k] !== undefined && (isNaN(Number(row[k])) || Number(row[k]) < 0)) {
                row.__errors.push(`${k} must be a number (0 or more)`);
            }
        });
        if (row.originalPrice !== '' && row.originalPrice !== undefined
            && Number(row.originalPrice) > 0 && Number(row.originalPrice) < Number(row.price)) {
            row.__errors.push('originalPrice should be higher than price (it is the struck-through price)');
        }
        if (row.status && !['active', 'draft', 'out-of-stock'].includes(String(row.status))) {
            row.__errors.push('status must be active, draft or out-of-stock');
        }
        return row;
    };

    const handleFile = (file: File) => {
        setResult(null);
        setParseError('');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result || '');
                const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
                if (lines.length < 2) {
                    setParseError('CSV must have a header row and at least one data row.');
                    setRows([]);
                    return;
                }
                const headers = splitCsvLine(lines[0]).map(h => h.trim());
                const known = headers.filter(h => COLUMNS.includes(h));
                if (known.length === 0) {
                    setParseError(`No recognised columns found. Expected header: ${COLUMNS.join(', ')}`);
                    setRows([]);
                    return;
                }
                const parsed = lines.slice(1).map((line, idx) => buildRow(splitCsvLine(line), headers, idx));
                setRows(parsed);
            } catch (err: any) {
                setParseError('Failed to parse CSV: ' + (err?.message || 'unknown error'));
                setRows([]);
            }
        };
        reader.readAsText(file);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const downloadTemplate = () => {
        const header = COLUMNS.join(',');
        // One realistic, filled-in example row so the format is obvious at a glance.
        const sample = [
            'Sony WH-1000XM4 Wireless Headphone', // name
            '28500',                              // price
            '32000',                              // originalPrice (struck-through)
            '24000',                              // costPrice (needed for net profit)
            'https://res.cloudinary.com/demo/image/upload/xm4-1.jpg',                                      // thumbnail
            'https://res.cloudinary.com/demo/image/upload/xm4-2.jpg|https://res.cloudinary.com/demo/image/upload/xm4-3.jpg', // images
            'Electronics',                        // category (NAME or id)
            '',                                   // subCategory (optional)
            '"Industry-leading noise cancelling, 30-hour battery and touch controls."', // description
            '25',                                 // stock
            'active',                             // status
            'Sony',                               // brand
            'WH-1000XM4',                         // model
            '254 g',                              // weight
            '25x20x8 cm',                         // boxSize
            '1x Headphone|1x Case|1x Cable',      // insideTheBox
            'headphone|audio|wireless|noise-cancelling', // tags
            'black|silver',                       // colors
            '',                                   // sizes
        ].join(',');
        const blob = new Blob([header + '\n' + sample + '\n'], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'product-bulk-template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const validRows = rows.filter(r => r.__errors.length === 0);
    const invalidRows = rows.filter(r => r.__errors.length > 0);

    const handleSubmit = async () => {
        if (validRows.length === 0) {
            toast.error('No valid rows to upload. Fix the highlighted errors first.');
            return;
        }
        // Drop blank cells so optional fields are OMITTED rather than sent as ""
        // (an empty string would fail the backend's number/enum validation).
        const products = validRows.map(({ __rowIndex, __errors, ...rest }) => {
            const clean: Record<string, any> = {};
            Object.entries(rest).forEach(([k, v]) => {
                if (v === '' || v === undefined || v === null) return;
                if (Array.isArray(v) && v.length === 0) return;
                clean[k] = v;
            });
            return clean;
        });
        try {
            const res: any = await bulkUpload({ products }).unwrap();
            const data = res?.data || res;
            setResult({ created: data?.created || 0, failed: data?.failed || [] });
            toast.success(`Bulk upload complete: ${data?.created || 0} created`);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Bulk upload failed');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <LuCloudUpload className="text-[#4F46E5]" size={20} />
                        <h2 className="text-lg font-bold text-gray-800">Bulk Upload Products (CSV)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md text-gray-500"><LuX size={18} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {!result && (
                        <>
                            {/* Instructions */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 text-xs text-indigo-700 space-y-1">
                                <p className="font-bold">Expected columns (header row):</p>
                                <p className="font-mono break-all">{COLUMNS.join(', ')}</p>
                                <p><strong>Required:</strong> name, price, thumbnail, category, description — everything else is optional (leave the cell blank to skip it).</p>
                                <p><strong>category / subCategory</strong> = just the category <strong>name</strong> (e.g. <span className="font-mono">Electronics</span>) — the id also works.</p>
                                <p><strong>images, tags, colors, sizes</strong> = pipe-separated (e.g. <span className="font-mono">url2|url3</span>). Thumbnail + images must total at least 3.</p>
                                <p><strong>costPrice</strong> = what you paid — required for the net-profit report. <strong>originalPrice</strong> = the struck-through “was” price.</p>
                                <p><strong>tags / colors</strong> power the filters and “search by image”, so fill them in when you can.</p>
                                <p><strong>status</strong> = <span className="font-mono">active</span> (default), <span className="font-mono">draft</span> or <span className="font-mono">out-of-stock</span>.</p>
                                <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md font-bold text-indigo-600 hover:bg-indigo-100">
                                    <LuDownload size={13} /> Download CSV template
                                </button>
                            </div>

                            {/* File picker */}
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center cursor-pointer hover:border-[#4F46E5] hover:bg-gray-50 transition-all"
                            >
                                <LuFileText className="mx-auto text-gray-400 mb-2" size={28} />
                                <p className="text-sm font-semibold text-gray-700">{fileName || 'Click to choose a .csv file'}</p>
                                <p className="text-xs text-gray-400 mt-1">Comma-separated, UTF-8</p>
                                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onInputChange} />
                            </div>

                            {parseError && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600 font-medium flex items-start gap-2">
                                    <LuTriangleAlert className="mt-0.5 shrink-0" /> {parseError}
                                </div>
                            )}

                            {/* Preview */}
                            {rows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="font-bold text-gray-700">{rows.length} row(s) parsed</span>
                                        <span className="text-green-600 font-bold">{validRows.length} valid</span>
                                        {invalidRows.length > 0 && <span className="text-red-500 font-bold">{invalidRows.length} with errors</span>}
                                    </div>
                                    <div className="border border-gray-100 rounded-md overflow-auto max-h-64">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold text-gray-500">#</th>
                                                    <th className="px-3 py-2 font-bold text-gray-500">Name</th>
                                                    <th className="px-3 py-2 font-bold text-gray-500">Price</th>
                                                    <th className="px-3 py-2 font-bold text-gray-500">Stock</th>
                                                    <th className="px-3 py-2 font-bold text-gray-500">Images</th>
                                                    <th className="px-3 py-2 font-bold text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {rows.map((r) => {
                                                    const imgCount = [r.thumbnail, ...(Array.isArray(r.images) ? r.images : [])].filter(Boolean).length;
                                                    return (
                                                        <tr key={r.__rowIndex} className={r.__errors.length ? 'bg-red-50/40' : ''}>
                                                            <td className="px-3 py-2 text-gray-400">{r.__rowIndex + 1}</td>
                                                            <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{r.name || <span className="text-red-400">—</span>}</td>
                                                            <td className="px-3 py-2 text-gray-700">{r.price === '' ? '—' : r.price}</td>
                                                            <td className="px-3 py-2 text-gray-700">{r.stock === '' ? 0 : r.stock}</td>
                                                            <td className="px-3 py-2 text-gray-700">{imgCount}</td>
                                                            <td className="px-3 py-2">
                                                                {r.__errors.length === 0
                                                                    ? <span className="text-green-600 font-bold">OK</span>
                                                                    : <span className="text-red-500" title={r.__errors.join('; ')}>{r.__errors[0]}{r.__errors.length > 1 ? ` (+${r.__errors.length - 1})` : ''}</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
                                <LuCircleCheck className="text-green-600" size={24} />
                                <div>
                                    <p className="font-bold text-green-700">{result.created} product(s) created</p>
                                    {result.failed.length > 0 && <p className="text-xs text-red-500 font-medium">{result.failed.length} row(s) failed</p>}
                                </div>
                            </div>
                            {result.failed.length > 0 && (
                                <div className="border border-red-100 rounded-md overflow-auto max-h-56">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-red-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 font-bold text-red-500">Row #</th>
                                                <th className="px-3 py-2 font-bold text-red-500">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-50">
                                            {result.failed.map((f, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2 text-gray-600">{f.index + 1}</td>
                                                    <td className="px-3 py-2 text-red-600">{f.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    {result ? (
                        <button onClick={onClose} className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-md font-bold hover:bg-[#4338CA] text-sm">Done</button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-md font-semibold text-gray-600 hover:bg-white text-sm">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || validRows.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] text-white rounded-md font-bold hover:bg-[#4338CA] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <LuCloudUpload size={16} />
                                {isLoading ? 'Uploading...' : `Upload ${validRows.length} product(s)`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
