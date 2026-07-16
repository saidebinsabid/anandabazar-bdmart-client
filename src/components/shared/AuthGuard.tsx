"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

type Role = 'superadmin' | 'admin' | 'user';

interface AuthGuardProps {
    children: ReactNode;
    requiredRole?: Role | Role[];
}

// Role-based route guard (Daraz-style).
// - While auth state hydrates on first mount, shows a lightweight loader (no redirect flash).
// - Unauthenticated users -> /login?redirect=<currentPath>.
// - Authenticated users without an allowed role -> /.
// - Otherwise renders children.
function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, token, isAuthenticated, isRestoring } = useSelector((state: RootState) => state.auth);

    // Hydration flag: avoid SSR mismatch and don't flash a redirect before
    // the persisted auth state / localStorage token is available on the client.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // On a refresh the saved token is still in localStorage but the user has to
    // be fetched again (see restoreSession in redux/provider). Until that
    // settles we know nothing — deciding now would log a signed-in user out.
    const settling = !mounted || isRestoring;

    // Resolve a token from either Redux or localStorage (in case the slice
    // hasn't rehydrated the token yet but it persists in storage).
    const hasToken = (() => {
        if (token) return true;
        if (typeof window !== 'undefined') {
            return !!window.localStorage.getItem('token');
        }
        return false;
    })();

    const authed = (isAuthenticated || hasToken) && !!user;

    const allowedRoles: Role[] | null = requiredRole
        ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole])
        : null;

    // Superadmin is a strict superset of admin — it can access everything an admin can,
    // including admin-only routes. A superadmin-only route still excludes plain admins.
    const roleAllowed =
        !allowedRoles ||
        user?.role === 'superadmin' ||
        (!!user?.role && allowedRoles.includes(user.role));

    useEffect(() => {
        if (settling) return;

        if (!authed) {
            const redirect = encodeURIComponent(pathname || '/');
            router.replace(`/login?redirect=${redirect}`);
            return;
        }

        if (!roleAllowed) {
            router.replace('/');
        }
    }, [settling, authed, roleAllowed, pathname, router]);

    // Still hydrating / restoring the session: render a lightweight loader.
    if (settling) {
        return (
            <div style={{
                minHeight: '60vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#94A3B8', fontSize: '14px',
            }}>
                Loading...
            </div>
        );
    }

    // Not authenticated or not authorized: render nothing while redirecting.
    if (!authed || !roleAllowed) {
        return null;
    }

    return <>{children}</>;
}

export default AuthGuard;
