import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/counselor/NavBar";
import CostEstimationPage from "../../components/CostEstimationPage";

export default function CostEstimation() {
    const { user } = useAuth();
    if (["admin", "superAdmin"].includes(user?.role)) return <Navigate to="/admin/cost-estimation" replace />;
    return <><Navbar /><CostEstimationPage /></>;
}
