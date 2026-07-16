import { baseApi } from './baseApi';

export const imageSearchApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: is AI vision configured? — Backend route: GET /api/image-search/status
        getImageSearchStatus: builder.query({
            query: () => '/image-search/status',
        }),
        // Public: search products by an analysed image — Backend route: POST /api/image-search
        // body: { colors: string[], labels?: string[], imageData?: dataURL, limit?: number }
        imageSearch: builder.mutation({
            query: (body: { colors: string[]; labels?: string[]; imageData?: string; limit?: number }) => ({
                url: '/image-search',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetImageSearchStatusQuery,
    useImageSearchMutation,
} = imageSearchApi;
