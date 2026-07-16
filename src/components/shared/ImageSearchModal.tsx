"use client";

import React, { useCallback, useRef, useState } from 'react';
import { LuX, LuUpload, LuCamera, LuSparkles, LuImage, LuTriangleAlert } from 'react-icons/lu';
import NewProductCard from '@/components/shared/NewProductCard';
import { analyzeImageFile, colorHex } from '@/lib/imageAnalysis';
import { useGetImageSearchStatusQuery, useImageSearchMutation } from '@/redux/api/imageSearchApi';

type Phase = 'idle' | 'analyzing' | 'results' | 'error';

const mapProduct = (p: any) => ({
    id: p._id,
    slug: p.slug,
    name: p.name,
    image: p.thumbnail || p.images?.[0] || '',
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    mrp: p.originalPrice || undefined,
    discount: p.discount,
    rating: p.rating,
    reviews: p.reviewCount,
    reviewCount: p.reviewCount,
    categoryName: p.category?.name || '',
    priceType: p.priceType || 'negotiable',
    sold: p.totalSold || 0,
    matchScore: p.matchScore || 0,
});

const ImageSearchModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [preview, setPreview] = useState<string>('');
    const [detected, setDetected] = useState<{ colors: string[]; labels: string[] }>({ colors: [], labels: [] });
    const [results, setResults] = useState<any[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [source, setSource] = useState<'ai' | 'smart'>('smart');
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { data: statusRes } = useGetImageSearchStatusQuery(undefined, { skip: !open });
    const aiEnabled = Boolean(statusRes?.data?.aiEnabled);
    const providerLabel = statusRes?.data?.providerLabel as string | undefined;
    const [runImageSearch] = useImageSearchMutation();

    const reset = () => {
        setPhase('idle'); setPreview(''); setResults([]); setDetected({ colors: [], labels: [] });
        setMatchedCount(0); setErrorMsg('');
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleClose = () => { reset(); onClose(); };

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) { setErrorMsg('Please choose an image file.'); setPhase('error'); return; }
        if (file.size > 8 * 1024 * 1024) { setErrorMsg('Image must be under 8MB.'); setPhase('error'); return; }
        setErrorMsg('');
        setPhase('analyzing');
        try {
            // 1) Real, in-browser visual analysis (dominant colours + downscaled image).
            const analysis = await analyzeImageFile(file);
            setPreview(analysis.dataUrl);
            // Small, deliberate beat so the "scanning" read is legible even on fast machines.
            await new Promise((r) => setTimeout(r, 650));
            // 2) Match against the catalogue (AI provider adds labels server-side when configured).
            const res = await runImageSearch({
                colors: analysis.colors,
                imageData: analysis.dataUrl,
                limit: 24,
            }).unwrap();
            const data = res?.data || {};
            setDetected(data.detected || { colors: analysis.colors, labels: [] });
            setResults((data.products || []).map(mapProduct));
            setMatchedCount(data.matchedCount || 0);
            setSource(data.source === 'ai' ? 'ai' : 'smart');
            setPhase('results');
        } catch {
            setErrorMsg('Could not search by this image. Please try another.');
            setPhase('error');
        }
    }, [runImageSearch]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    if (!open) return null;

    const matched = results.slice(0, matchedCount);
    const alsoLike = results.slice(matchedCount);

    return (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                            <LuCamera size={18} className="text-white" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Search by Image</h2>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <LuSparkles size={11} className="text-[var(--color-primary)]" />
                                {aiEnabled ? `AI Visual Search${providerLabel ? ` · ${providerLabel}` : ''}` : 'Smart visual match'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <LuX size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* ── IDLE: dropzone ── */}
                    {phase === 'idle' && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            onClick={() => fileRef.current?.click()}
                            className={`cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center py-14 px-6 transition-colors ${
                                dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.04]' : 'border-gray-200 hover:border-[var(--color-primary)] hover:bg-gray-50'
                            }`}
                        >
                            <span className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                                <LuUpload size={26} className="text-[var(--color-primary)]" />
                            </span>
                            <h3 className="text-base font-bold text-gray-800 mb-1">Drop an image or click to upload</h3>
                            <p className="text-[13px] text-gray-400 max-w-xs">
                                Snap or upload a photo of a product and we&apos;ll find the closest matches in the store.
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg" style={{ background: 'var(--color-primary)' }}>
                                <LuImage size={14} /> Choose image
                            </span>
                            <p className="mt-3 text-[11px] text-gray-300">PNG, JPG or WEBP · up to 8MB</p>
                        </div>
                    )}

                    {/* ── ANALYZING: preview + scan animation ── */}
                    {phase === 'analyzing' && (
                        <div className="flex flex-col items-center py-6">
                            <div className="relative w-56 h-56 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                {preview && <img src={preview} alt="uploaded" className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 img-scan-overlay" />
                                <div className="absolute inset-x-0 img-scan-line" />
                            </div>
                            <p className="mt-5 text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <LuSparkles size={15} className="text-[var(--color-primary)] animate-pulse" />
                                Analyzing image…
                            </p>
                            <p className="text-[12px] text-gray-400 mt-1">Detecting colours &amp; matching products</p>
                        </div>
                    )}

                    {/* ── RESULTS ── */}
                    {phase === 'results' && (
                        <div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start mb-5">
                                {preview && (
                                    <img src={preview} alt="your image" className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold text-gray-800 mb-2">
                                        {matchedCount > 0
                                            ? `${matchedCount} visual match${matchedCount > 1 ? 'es' : ''} found`
                                            : 'No exact match — showing similar products'}
                                    </p>
                                    {/* Detected attributes */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {detected.colors.map((c) => (
                                            <span key={c} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-full pl-1.5 pr-2.5 py-0.5">
                                                <span className="w-3 h-3 rounded-full border border-gray-200" style={{ background: colorHex(c) }} />
                                                {c}
                                            </span>
                                        ))}
                                        {detected.labels.slice(0, 6).map((l) => (
                                            <span key={l} className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/[0.08] rounded-full px-2.5 py-0.5">
                                                {l}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                                        <LuSparkles size={11} className="text-[var(--color-primary)]" />
                                        {source === 'ai'
                                            ? `Matched with AI vision${providerLabel ? ` (${providerLabel})` : ''}`
                                            : 'Matched by detected colours & keywords'}
                                    </p>
                                </div>
                                <button onClick={reset} className="text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg px-3 py-1.5 hover:bg-[var(--color-primary)]/[0.06] transition-colors flex-shrink-0">
                                    New image
                                </button>
                            </div>

                            {results.length === 0 ? (
                                <div className="text-center py-12 text-sm text-gray-400">No products to show.</div>
                            ) : (
                                <>
                                    {matched.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-5">
                                            {matched.map((product: any) => (
                                                <div key={product.id} className="relative">
                                                    <span className="absolute top-1.5 left-1.5 z-10 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow" style={{ background: 'var(--color-primary)' }}>
                                                        {product.matchScore}% match
                                                    </span>
                                                    <NewProductCard product={product} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {alsoLike.length > 0 && (
                                        <>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="w-[3px] h-4 rounded-full" style={{ background: 'var(--color-primary)' }} />
                                                <h4 className="text-sm font-bold text-gray-800">You may also like</h4>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {alsoLike.map((product: any) => (
                                                    <NewProductCard key={product.id} product={product} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── ERROR ── */}
                    {phase === 'error' && (
                        <div className="flex flex-col items-center text-center py-14">
                            <span className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <LuTriangleAlert size={24} className="text-red-500" />
                            </span>
                            <h3 className="text-base font-bold text-gray-700 mb-1">Something went wrong</h3>
                            <p className="text-sm text-gray-400 mb-5">{errorMsg || 'Please try another image.'}</p>
                            <button onClick={reset} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
                                Try again
                            </button>
                        </div>
                    )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <style>{`
                @keyframes imgScan { 0% { top: 0%; } 100% { top: 100%; } }
                .img-scan-line {
                    position: absolute; height: 2px; left: 0; right: 0;
                    background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
                    box-shadow: 0 0 12px 2px var(--color-primary);
                    animation: imgScan 1.1s ease-in-out infinite alternate;
                }
                .img-scan-overlay {
                    background-image: linear-gradient(var(--color-primary) 1px, transparent 1px),
                                      linear-gradient(90deg, var(--color-primary) 1px, transparent 1px);
                    background-size: 22px 22px; opacity: 0.10;
                }
            `}</style>
        </div>
    );
};

export default ImageSearchModal;
