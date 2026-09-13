import { Routes, Route } from "react-router-dom";
import "./App.css";

import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Users from "./pages/admin/Users";
import Countries from "./pages/admin/Countries";
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
import Programs from "./pages/counselor/program";
import Documents from "./pages/counselor/documents";
import DocumentsPage from "./components/DocumentsPage";
import StudyGuide from "./pages/counselor/studyGuide";
import CostEstimation from "./pages/counselor/costEstimation";
import CostEstimationPage from "./components/CostEstimationPage";

function App() {
  return (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmail />} />
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
        path="/programs"
        element={
          <>
            <RoleProtectedRoutes allowedRoles={["counselor"]}>
              <Navbar />
              <Programs />
            </RoleProtectedRoutes>
          </>
        }
      />

      <Route
        path="/documents"
        element={<RoleProtectedRoutes allowedRoles={["counselor", "admin", "superAdmin"]}><Documents /></RoleProtectedRoutes>}
      />
      <Route path="/study-guide" element={<><Navbar /><RoleProtectedRoutes allowedRoles={["counselor"]}><StudyGuide /></RoleProtectedRoutes></>} />
      <Route path="/cost-estimation" element={<RoleProtectedRoutes allowedRoles={["counselor", "admin", "superAdmin"]}><CostEstimation /></RoleProtectedRoutes>} />


      <Route
        element={
          <RoleProtectedRoutes allowedRoles={["admin", "superAdmin"]}>
            <AdminLayout />
          </RoleProtectedRoutes>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<RoleProtectedRoutes allowedRoles={["superAdmin"]}><Users /></RoleProtectedRoutes>} />
        <Route path="/admin/countries" element={<RoleProtectedRoutes allowedRoles={["superAdmin"]}><Countries /></RoleProtectedRoutes>} />
        <Route path="/admin/institutions" element={<AdminInstitutions />} />
        <Route path="/admin/documents" element={<DocumentsPage isAdmin />} />
        <Route path="/admin/cost-estimation" element={<CostEstimationPage />} />
        <Route path="/admin/institutions/:institutionId/review-programs" element={<ReviewPrograms />} />
      </Route>
    </Routes >


  );
}

export default App;
