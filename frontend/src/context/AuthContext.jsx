import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isVerifiedUser } from "../utils/authAccess";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const revision = useRef(0);

    const navigate = useNavigate();

    useEffect(() => {
        let disposed = false;
        const refreshUser = async () => {
            const requestRevision = ++revision.current;
            const token = localStorage.getItem("token");
            try {
                if (!token) {
                    setIsLoggedIn(false);
                    setUser(null);
                    return;
                }
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
                });
                const data = await response.json();
                if (disposed || requestRevision !== revision.current || token !== localStorage.getItem("token")) return;
                if (!response.ok || !isVerifiedUser(data.user)) {
                    if (response.ok || response.status === 401 || response.status === 403) {
                        sessionStorage.setItem("logoutMessage", data.error || "Please log in again.");
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setIsLoggedIn(false);
                        setUser(null);
                    }
                    return;
                }
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setIsLoggedIn(true);
            } catch {
                // Keep an existing session during temporary connection failures.
            } finally {
                if (!disposed && requestRevision === revision.current) setAuthLoading(false);
            }
        };
        refreshUser();
        window.addEventListener("focus", refreshUser);
        const onStorage = (event) => { if (event.key === "token") refreshUser(); };
        window.addEventListener("storage", onStorage);
        return () => {
            disposed = true;
            window.removeEventListener("focus", refreshUser);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const login = useCallback((token, userData) => {
        revision.current++;
        if (!token || !isVerifiedUser(userData)) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsLoggedIn(false);
            setUser(null);
            setAuthLoading(false);
            throw new Error("Please verify your email before continuing.");
        }
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsLoggedIn(true);
        setUser(userData);
        setAuthLoading(false);
    }, []);

    const logout = () => {
        revision.current++;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setUser(null);
        setAuthLoading(false);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, authLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
