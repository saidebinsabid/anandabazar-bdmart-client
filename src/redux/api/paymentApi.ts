import { baseApi } from "./baseApi";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ===== Customer / gateway endpoints =====
        // What checkout may offer + how each method collects money —
        // Backend route: GET /api/payments/methods
        // data: { methods: [{ id, label, mode: 'gateway'|'manual'|'cod', live, number?, accountType? }], instructions }
        getPaymentMethods: builder.query({
            query: () => ({
                url: '/payments/methods',
                method: 'GET',
            }),
            providesTags: ['Payments'],
        }),
        // Init a payment for an order — Backend route: POST /api/payments/init
        // Body: { orderId, method }  →  data: { redirectUrl, transactionId }
        initPayment: builder.mutation({
            query: (data) => ({
                url: '/payments/init',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payments'],
        }),
        // Verify a transaction — Backend route: GET /api/payments/verify/:transactionId
        // data: { transaction, orderPaymentStatus, order }
        verifyPayment: builder.query({
            query: (transactionId) => ({
                url: `/payments/verify/${transactionId}`,
                method: 'GET',
            }),
            providesTags: (result, error, transactionId) => [{ type: 'Payments', id: transactionId }],
        }),
        // My payment history — Backend route: GET /api/payments/my  →  data: Transaction[]
        getMyPayments: builder.query({
            query: (params) => ({
                url: '/payments/my',
                method: 'GET',
                params,
            }),
            providesTags: ['Payments'],
        }),
        // Retry a failed/cancelled payment — Backend route: POST /api/payments/:transactionId/retry
        // data: { redirectUrl, transactionId }
        retryPayment: builder.mutation({
            query: (transactionId) => ({
                url: `/payments/${transactionId}/retry`,
                method: 'POST',
            }),
            invalidatesTags: ['Payments'],
        }),
        // bKash execute step — Backend route: POST /api/payments/bkash/execute
        // Called by /payment/bkash/callback once bKash returns a paymentID.
        // Body: { paymentID }  →  data: { transactionId, status }
        executeBkash: builder.mutation({
            query: (data) => ({
                url: '/payments/bkash/execute',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payments', 'Orders'],
        }),
        // DEV-SIMULATION confirm — Backend route: POST /api/payments/simulate/confirm
        // Body: { transactionId, outcome: 'success' | 'fail' | 'cancel' }  →  data: { transactionId, status }
        confirmSimulatedPayment: builder.mutation({
            query: (data) => ({
                url: '/payments/simulate/confirm',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, arg) => [
                'Payments',
                { type: 'Payments', id: arg?.transactionId },
                'Orders',
            ],
        }),

    }),
});

export const {
    // Customer / gateway hooks
    useGetPaymentMethodsQuery,
    useInitPaymentMutation,
    useVerifyPaymentQuery,
    useGetMyPaymentsQuery,
    useRetryPaymentMutation,
    useConfirmSimulatedPaymentMutation,
    useExecuteBkashMutation,
} = paymentApi;
