"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateCart } from './slices/cartSlice';
import { hydrateWishlist } from './slices/wishlistSlice';
import { loginSuccess, logout, sessionRestoreFinished } from './slices/authSlice';

interface ReduxProviderProps {
    children: React.ReactNode;
}

/**
 * Restore the signed-in user after a refresh.
 *
 * Redux state is gone on every page load, but the access token survives in
 * localStorage — so without this the app looked logged-out on refresh and
 * bounced the user to /login. Exchange the saved token for the user once on
 * mount; if the token is stale the session is cleared properly instead.
 */
const restoreSession = async () => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('token');
    if (!token) {
        store.dispatch(sessionRestoreFinished());
        return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
        const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('session expired');

        const json = await res.json();
        const u = json?.data;
        if (!u?._id) throw new Error('malformed profile');

        store.dispatch(loginSuccess({
            user: {
                id: u._id,
                name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                email: u.email,
                phone: u.phone || '',
                role: u.role || 'user',
                avatar: u.avatar || '',
            },
            token,
        }));
    } catch {
        // Expired / revoked / unreachable — drop the dead token so the user gets
        // a clean login rather than a half-signed-in state.
        window.localStorage.removeItem('token');
        store.dispatch(logout());
    }
};

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
    useEffect(() => {
        store.dispatch(hydrateCart());
        store.dispatch(hydrateWishlist());
        restoreSession();
    }, []);

    return <Provider store={store}>{children}</Provider>;
};
