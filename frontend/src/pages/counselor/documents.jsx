import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DocumentsPage from "../../components/DocumentsPage";
import Navbar from "../../components/counselor/NavBar";

export default function Documents() {
    const { user } = useAuth();
    if (["admin", "superAdmin"].includes(user?.role)) {
        return <Navigate to="/admin/documents" replace />;
    }
    return <><Navbar /><DocumentsPage /></>;
}
