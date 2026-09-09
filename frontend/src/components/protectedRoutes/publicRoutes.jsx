import { Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../../context/AuthContext";
import { hasVerifiedSession } from "../../utils/authAccess";

const PublicRoute = ({ children }) => {
    const { isLoggedIn, user, authLoading } = useAuth();
    if (authLoading) return <CircularProgress aria-label="Loading account" />;

    return hasVerifiedSession(isLoggedIn, user) ? <Navigate to={user.role === "counselor" ? "/" : "/admin/dashboard"} replace /> : children;
};

export default PublicRoute;
