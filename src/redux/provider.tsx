"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateCart } from './slices/cartSlice';
import { hydrateWishlist } from './slices/wishlistSlice';

interface ReduxProviderProps {
    children: React.ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
    useEffect(() => {
        store.dispatch(hydrateCart());
        store.dispatch(hydrateWishlist());
    }, []);

    return <Provider store={store}>{children}</Provider>;
};
