import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DocumentsPage from "../../components/DocumentsPage";
import Navbar from "../../components/counselor/NavBar";
import { useCountry } from "../../context/CountryContext";
import { Alert, Container } from "@mui/material";

export default function Documents() {
    const { user } = useAuth();
    const { selectedCountry } = useCountry();
    if (["admin", "superAdmin"].includes(user?.role)) {
        return <Navigate to="/admin/documents" replace />;
    }
    return <><Navbar />{selectedCountry ? <DocumentsPage /> : <Container sx={{ mt: 5 }}><Alert severity="info">Select a country from the navigation menu to view country-specific documents.</Alert></Container>}</>;
}
