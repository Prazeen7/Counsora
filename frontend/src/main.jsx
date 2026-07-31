import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CountryProvider } from "./context/CountryContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <CountryProvider>
        <CssBaseline enableColorScheme />
        <App />
      </CountryProvider>
    </AuthProvider>
  </BrowserRouter>
);