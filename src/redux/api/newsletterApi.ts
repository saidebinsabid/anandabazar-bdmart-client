import { baseApi } from "./baseApi";

export const newsletterApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: subscribe an email — Backend route: POST /api/newsletter/subscribe
        subscribeNewsletter: builder.mutation({
            query: (email: string) => ({
                url: '/newsletter/subscribe',
                method: 'POST',
                body: { email },
            }),
            invalidatesTags: ['Newsletter'],
        }),
        // Admin: paginated subscriber list — Backend route: GET /api/newsletter
        getNewsletterSubscribers: builder.query({
            query: (params) => ({
                url: '/newsletter',
                method: 'GET',
                params,
            }),
            providesTags: ['Newsletter'],
        }),
    }),
});

export const {
    useSubscribeNewsletterMutation,
    useGetNewsletterSubscribersQuery,
} = newsletterApi;
