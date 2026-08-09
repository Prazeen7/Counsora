import { Routes, Route } from "react-router-dom";
import "./App.css";

import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Institutions from "./pages/counselor/institutionsList";
import Dashboard from "./pages/dashboard";
import InstitutionPage from "./pages/counselor/institutionPage";

import Navbar from "./components/counselor/NavBar";
import ProtectedRoutes from "./components/protectedRoutes/protectedRoute";
import PublicRoute from "./components/protectedRoutes/publicRoutes";
import RoleProtectedRoutes from "./components/protectedRoutes/roleProtectedRoutes";
import AdminDashboard from "./pages/admin/dashboard";
import Sidebar from "./components/admin/sidebar";
import AdminInstitutions from "./pages/admin/institutionsList";
import AdminLayout from "./layouts/adminLayout";
import ReviewPrograms from "./pages/admin/ReviewPrograms";

function App() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <>
              <Navbar />
              <SignUp />
            </>
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <>
              <Navbar />
              <Login />
            </>
          </PublicRoute>
        }
      />

      <Route
        path="/institutions"
        element={
          <>
            <Navbar />
            <ProtectedRoutes>
              <RoleProtectedRoutes allowedRoles={["counselor"]}>
                <Institutions />
              </RoleProtectedRoutes>
            </ProtectedRoutes>
          </>
        }
      />

      <Route
        path="/institutions/:institutionId"
        element={
          <>
            <Navbar />
            <ProtectedRoutes>
              <RoleProtectedRoutes allowedRoles={["counselor"]}>
                <InstitutionPage />
              </RoleProtectedRoutes>
            </ProtectedRoutes>
          </>
        }
      />

      <Route
        path="/"
        element={
          <>
            <RoleProtectedRoutes allowedRoles={["counselor"]}>
              <Navbar />
              <Dashboard />
            </RoleProtectedRoutes>
          </>
        }
      />


      <Route
        element={
          <RoleProtectedRoutes allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleProtectedRoutes>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/institutions" element={<AdminInstitutions />} />
        <Route path="/admin/institutions/:institutionId/review-programs" element={<ReviewPrograms />} />
      </Route>
    </Routes >


  );
}

export default App;