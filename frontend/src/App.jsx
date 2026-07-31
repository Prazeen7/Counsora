import { Routes, Route } from "react-router-dom";
import "./App.css";

import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Institutions from "./pages/counselor/institutionsList";
import Dashboard from "./pages/dashboard";

import Navbar from "./components/NavBar";
import ProtectedRoutes from "./components/protectedRoute";
import PublicRoute from "./components/publicRoutes";
import InstitutionPage from "./pages/counselor/institutionPage";

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
              <Institutions />
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
              <InstitutionPage />
            </ProtectedRoutes>
          </>
        }
      />

      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Dashboard />
          </>
        }
      />
    </Routes>
  );
}

export default App;