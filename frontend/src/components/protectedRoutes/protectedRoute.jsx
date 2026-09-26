import Loading from '../Loading';
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasVerifiedSession } from "../../utils/authAccess";

const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, user, authLoading } = useAuth();
    if (authLoading) return <Loading fullPage aria-label="Loading account" />;

    if (!hasVerifiedSession(isLoggedIn, user)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
