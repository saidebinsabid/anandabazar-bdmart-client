import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    cartReducer,
    authReducer,
    wishlistReducer,
    themeReducer,
    productReducer,
    uiReducer,
    savedForLaterReducer
} from './slices';

import { baseApi } from './api/baseApi';

const rootReducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    cart: cartReducer,
    auth: authReducer,
    wishlist: wishlistReducer,
    theme: themeReducer,
    products: productReducer,
    ui: uiReducer,
    savedForLater: savedForLaterReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(baseApi.middleware),
    // autoBatch: use microtask ('tick') flushing instead of the default
    // requestAnimationFrame. RTK Query flags its fulfilled actions for
    // auto-batching; under Next 16 / Turbopack the rAF-based subscriber flush
    // could be throttled and never fire, leaving RTK Query hooks frozen on their
    // pending snapshot even though the store held the fulfilled data (plain
    // useSelector was unaffected). 'tick' flushes on the microtask queue —
    // independent of paint/visibility — while keeping the batching optimization.
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers({ autoBatch: { type: 'tick' } }),
    devTools: process.env.NODE_ENV !== 'production',
});


// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
