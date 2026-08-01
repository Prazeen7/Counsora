import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/sidebar";

export default function AdminLayout() {
    return (
        <Box sx={{ display: "flex" }}>
            <Sidebar />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    overflow: "auto",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}