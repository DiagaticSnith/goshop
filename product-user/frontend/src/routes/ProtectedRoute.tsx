import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMeQuery } from "../features/auth/api/me";

export const ProtectedRoute = () => {
    const { currentUser, isLoading, token } = useAuth();
    const location = useLocation();
    const { isLoading: meLoading, isError } = useMeQuery(token);

    if (isLoading || meLoading) {
        return <div className="container p-8">Loading…</div>;
    }

    // If backend says hidden (403 handled by hook as isError), block
    if (!currentUser || isError) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return currentUser ? (
        <Outlet />
    ) : (
        <Navigate to="/auth/login" state={{ from: location }} replace />
    );
};
