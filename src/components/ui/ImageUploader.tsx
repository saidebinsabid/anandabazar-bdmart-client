"use client";

import React, { useRef, useState } from 'react';
import { LuCloudUpload, LuX, LuImage } from 'react-icons/lu';
import { useUploadImageMutation, useUploadImagesMutation } from '@/redux/api/uploadApi';

/* ════════════════════════════════════════════
   SINGLE IMAGE UPLOADER
   Usage:
     <SingleImageUploader value={url} onChange={setUrl} label="Thumbnail" />
════════════════════════════════════════════ */
export function SingleImageUploader({
    label,
    value,
    onChange,
    required = false,
    folder = 'image',
}: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    required?: boolean;
    folder?: string;
}) {
    const [uploadImage, { isLoading }] = useUploadImageMutation();
    const [error, setError] = useState('');
    const ref = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return; }
        setError('');
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await uploadImage(fd).unwrap();
            onChange(res.data.url);
        } catch {
            setError('Upload failed. Try again.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                {label} {required && <span style={{ color: 'var(--color-secondary)' }}>*</span>}
            </label>

            {/* Upload Zone */}
            <div
                onClick={() => !isLoading && ref.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                style={{
                    border: `2px dashed ${error ? '#fca5a5' : value ? '#86efac' : '#d1d5db'}`,
                    borderRadius: '10px', padding: '20px', textAlign: 'center',
                    cursor: isLoading ? 'wait' : 'pointer',
                    background: value ? 'var(--color-primary-lightest)' : '#fafafa',
                    transition: 'all 0.2s ease', position: 'relative',
                    minHeight: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Uploading...</span>
                    </div>
                ) : value ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={value} alt="preview" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onChange(''); }}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                        >
                            <LuX size={12} />
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <LuCloudUpload size={28} color="#9ca3af" />
                        <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 500 }}>Click or drag image here</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>JPG, PNG, WebP — max 10MB</span>
                    </div>
                )}
            </div>

            {error && <p style={{ fontSize: '11.5px', color: '#ef4444', margin: '4px 0 0', fontWeight: 500 }}>{error}</p>}
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>
    );
}


/* ════════════════════════════════════════════
   MULTIPLE IMAGE UPLOADER
   Usage:
     <MultipleImageUploader values={urls} onChange={setUrls} label="Extra Images" />
════════════════════════════════════════════ */
export function MultipleImageUploader({
    label,
    values,
    onChange,
    max = 8,
}: {
    label: string;
    values: string[];
    onChange: (urls: string[]) => void;
    max?: number;
}) {
    const [uploadImages, { isLoading }] = useUploadImagesMutation();
    const [error, setError] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const ref = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList) => {
        if (!files.length) return;
        if (values.length + files.length > max) {
            setError(`Maximum ${max} images allowed`);
            return;
        }
        setError('');
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('images', f));
        try {
            const res = await uploadImages(fd).unwrap();
            onChange([...values, ...res.data.urls]);
        } catch {
            setError('Upload failed. Try again.');
        }
    };

    const removeImage = (i: number) => onChange(values.filter((_, j) => j !== i));

    // Drag-to-reorder: move the dragged image to the drop position.
    const moveImage = (from: number, to: number) => {
        if (from === to || from == null || to == null) return;
        const next = [...values];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
    };

    return (
        <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                {label} <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>({values.length}/{max})</span>
            </label>
            {values.length > 1 && (
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>Drag to reorder · the first image is the main one</p>
            )}

            {/* Existing images */}
            {values.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {values.map((url, i) => (
                        <div
                            key={i}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragEnter={() => setOverIndex(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => { if (dragIndex !== null) moveImage(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                            title="Drag to reorder"
                            style={{
                                position: 'relative', width: '72px', height: '72px', cursor: 'grab',
                                opacity: dragIndex === i ? 0.4 : 1,
                                outline: overIndex === i && dragIndex !== null && dragIndex !== i ? '2px solid var(--color-primary)' : 'none',
                                outlineOffset: '2px', borderRadius: '8px', transition: 'opacity 0.15s ease',
                            }}
                        >
                            <img src={url} alt={`img-${i}`} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', pointerEvents: 'none' }} />
                            {i === 0 && (
                                <span style={{ position: 'absolute', bottom: '3px', left: '3px', background: 'var(--color-primary)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.03em' }}>MAIN</span>
                            )}
                            <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                <LuX size={10} />
                            </button>
                        </div>
                    ))}

                    {/* Add more slot */}
                    {values.length < max && (
                        <button type="button" onClick={() => ref.current?.click()} style={{ width: '72px', height: '72px', border: '2px dashed #d1d5db', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            {isLoading ? <div style={{ width: '18px', height: '18px', border: '2px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <LuImage size={20} />}
                        </button>
                    )}
                </div>
            )}

            {/* Upload zone (when empty) */}
            {values.length === 0 && (
                <div
                    onClick={() => !isLoading && ref.current?.click()}
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    onDragOver={e => e.preventDefault()}
                    style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: isLoading ? 'wait' : 'pointer', background: '#fafafa', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '24px', height: '24px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Uploading...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <LuCloudUpload size={26} color="#9ca3af" />
                            <span style={{ fontSize: '12.5px', color: '#6b7280', fontWeight: 500 }}>Click or drag images</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Up to {max} images — max 10MB each</span>
                        </div>
                    )}
                </div>
            )}

            {error && <p style={{ fontSize: '11.5px', color: '#ef4444', margin: '4px 0 0', fontWeight: 500 }}>{error}</p>}
            <input ref={ref} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
        </div>
    );
}
