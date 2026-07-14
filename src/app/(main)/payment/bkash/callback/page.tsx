"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LuLoader, LuCircleX } from 'react-icons/lu';
import { useExecuteBkashMutation } from '@/redux/api/paymentApi';

/**
 * bKash tokenized-checkout callback landing page.
 * bKash redirects here (callbackURL configured in payment.service) with
 * ?paymentID=...&status=success|failure|cancel. We run the execute step and
 * route to the shared success/fail/cancel pages. Nothing is shown long — this
 * is a transient hop while we finalize the payment.
 */
const BkashCallbackInner = () => {
    const params = useSearchParams();
    const router = useRouter();
    const [executeBkash] = useExecuteBkashMutation();
    const [failed, setFailed] = useState(false);
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const paymentID = params.get('paymentID') || '';
        const status = (params.get('status') || '').toLowerCase();

        // bKash tells us the user cancelled/failed before we even execute.
        if (status === 'cancel' || status === 'failure') {
            router.replace('/payment/cancel');
            return;
        }
        if (!paymentID) {
            setFailed(true);
            return;
        }

        (async () => {
            try {
                const res = await executeBkash({ paymentID }).unwrap();
                const txnId = res?.data?.transactionId || '';
                const ok = res?.data?.status === 'success';
                if (ok) {
                    router.replace(`/payment/success${txnId ? `?txn=${encodeURIComponent(txnId)}` : ''}`);
                } else {
                    router.replace(`/payment/fail${txnId ? `?txn=${encodeURIComponent(txnId)}` : ''}`);
                }
            } catch {
                setFailed(true);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                {failed ? (
                    <>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-4">
                            <LuCircleX size={24} />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">Could not confirm your bKash payment</h1>
                        <p className="text-sm text-gray-500 mt-1">You can retry the payment from My Orders.</p>
                        <button
                            onClick={() => router.replace('/dashboard/user/orders')}
                            className="mt-5 w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:brightness-95 transition"
                        >
                            Go to My Orders
                        </button>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] mb-4">
                            <LuLoader size={24} className="animate-spin" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">Confirming your bKash payment…</h1>
                        <p className="text-sm text-gray-500 mt-1">Please wait, this only takes a moment.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default function BkashCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
            <BkashCallbackInner />
        </Suspense>
    );
}
