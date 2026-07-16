import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: 'user' | 'admin' | 'superadmin';
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    /**
     * True until the stored session has been checked on first load. Redux state
     * is lost on every refresh, so a saved token has to be exchanged for the
     * user again — guards must wait for this instead of assuming logged-out.
     */
    isRestoring: boolean;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isRestoring: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;
            state.isRestoring = false;
        },

        loginFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = action.payload;
            state.isRestoring = false;
        },

        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
            state.isRestoring = false;
        },

        /** No saved session to restore, or the check finished/failed. */
        sessionRestoreFinished: (state) => {
            state.isRestoring = false;
        },

        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },

        updateAddress: (state, action: PayloadAction<User['address']>) => {
            if (state.user) {
                state.user.address = action.payload;
            }
        },

        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    sessionRestoreFinished,
    updateUser,
    updateAddress,
    clearError
} = authSlice.actions;

export default authSlice.reducer;
