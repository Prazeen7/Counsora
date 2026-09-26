import Loading from '../Loading';
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasVerifiedSession } from "../../utils/authAccess";

const PublicRoute = ({ children }) => {
    const { isLoggedIn, user, authLoading } = useAuth();
    if (authLoading) return <Loading fullPage aria-label="Loading account" />;

    return hasVerifiedSession(isLoggedIn, user) ? <Navigate to={user.role === "counselor" ? "/" : "/admin/dashboard"} replace /> : children;
};

export default PublicRoute;
