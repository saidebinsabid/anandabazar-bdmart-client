import { baseApi } from './baseApi';

export interface ICourierPackage {
    orderId: string;
    orderNo: string;
    status: string;
    subtotal: number;
    itemCount: number;
    items: { thumbnail?: string; name?: string; quantity?: number; color?: string; size?: string }[];
    consignmentId: string;
    trackingNumber: string;
    courierStatus: string;
    carrier: string;
    booked: boolean;
    paymentMethod: string;
    paymentStatus: string;
    codAmount: number;
    customer: string;
    phone: string;
    city: string;
    createdAt: string;
}

export interface IBulkResult {
    total: number;
    booked?: number;
    ok?: number;
    failed: number;
    results: { orderId: string; ok: boolean; trackingNumber?: string; courierStatus?: string; needsConfirmation?: boolean; error?: string }[];
}

// Steadfast (Packzy) courier — admin/superadmin book orders & sync status.
export const courierApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // GET /courier/orders — flat order list (Shipments board)
        getCourierPackages: builder.query<
            { data: ICourierPackage[]; meta: { total: number; page: number; limit: number; totalPages: number } },
            { state?: string; search?: string; page?: number; limit?: number }
        >({
            query: (params) => ({ url: '/courier/orders', params }),
            providesTags: ['Orders'],
        }),

        // POST /courier/bulk-book — book many selected orders at once
        bulkBookCourier: builder.mutation<{ data: IBulkResult }, { orderIds: string[] }>({
            query: (body) => ({ url: '/courier/bulk-book', method: 'POST', body }),
            invalidatesTags: ['Orders'],
        }),

        // POST /courier/bulk-status — refresh status of many selected orders
        bulkRefreshCourier: builder.mutation<{ data: IBulkResult }, { orderIds: string[] }>({
            query: (body) => ({ url: '/courier/bulk-status', method: 'POST', body }),
            invalidatesTags: ['Orders'],
        }),

        // POST /courier/orders/:orderId/book
        bookCourierPackage: builder.mutation<any, { orderId: string }>({
            query: ({ orderId }) => ({ url: `/courier/orders/${orderId}/book`, method: 'POST' }),
            invalidatesTags: ['Orders'],
        }),

        // GET /courier/orders/:orderId/status — pull latest delivery status
        refreshCourierStatus: builder.mutation<any, { orderId: string }>({
            query: ({ orderId }) => ({ url: `/courier/orders/${orderId}/status`, method: 'GET' }),
            invalidatesTags: ['Orders'],
        }),

        // GET /courier/balance — Steadfast account balance
        getCourierBalance: builder.query<any, void>({
            query: () => '/courier/balance',
        }),
    }),
});

export const {
    useGetCourierPackagesQuery,
    useBulkBookCourierMutation,
    useBulkRefreshCourierMutation,
    useBookCourierPackageMutation,
    useRefreshCourierStatusMutation,
    useGetCourierBalanceQuery,
} = courierApi;
