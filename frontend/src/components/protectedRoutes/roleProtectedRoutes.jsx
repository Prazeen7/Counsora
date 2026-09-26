import Loading from '../Loading';
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasVerifiedSession } from "../../utils/authAccess";

export default function ProtectedRoute({ allowedRoles, children }) {
    const { user, isLoggedIn, authLoading } = useAuth();
    if (authLoading) return <Loading fullPage aria-label="Loading account" />;

    // Not logged in
    if (!hasVerifiedSession(isLoggedIn, user)) {
        return <Navigate to="/login" replace state={user ? { message: "Please verify your email before continuing." } : null} />;
    }

    // Logged in but wrong role
    if (!allowedRoles.includes(user.role)) {
        if (["admin", "superAdmin"].includes(user.role)) {
            return <Navigate to="/admin/dashboard" replace />;
        }

        if (user.role === "counselor") {
            return <Navigate to="/" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}
