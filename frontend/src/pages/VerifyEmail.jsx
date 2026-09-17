import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import Card from "../components/auth/AuthCard";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { hasVerifiedSession } from "../utils/authAccess";
import { endVerificationFlow, isVerificationFlowActive, markEmailVerified } from "../utils/verificationFlow";

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn, user, login } = useAuth();
    const [token] = useState(() => {
        const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
        return value;
    });
    useEffect(() => {
        if (token) window.history.replaceState(window.history.state, "", window.location.pathname);
    }, [token]);
    const [email, setEmail] = useState(location.state?.email || "");
    const [message, setMessage] = useState(location.state?.message || "");
    const [severity, setSeverity] = useState(location.state?.emailSent === false ? "warning" : "info");
    const [busy, setBusy] = useState(false);
    const [tokenStatus, setTokenStatus] = useState("pending");

    // Ask the server as well: email links may open in another browser or device.
    useEffect(() => {
        const statusToken = location.state?.verificationStatusToken;
        if (token || !statusToken) return;
        let cancelled = false;
        let checking = false;
        const check = async () => {
            if (checking || cancelled) return;
            checking = true;
            try {
                const result = await apiRequest("/auth/verification-status", {
                    method: "POST", body: JSON.stringify({ statusToken }),
                });
                if (!cancelled && !result.isVerified && result.emailDelivery) {
                    const messages = {
                        sending: "Sending your verification email… Temporary delivery failures are retried automatically.",
                        sent: "Verification email sent. Check your inbox and spam folder.",
                        failed: "We couldn't send your verification email. Please try resending it.",
                    };
                    setMessage(messages[result.emailDelivery]);
                    setSeverity(result.emailDelivery === "failed" ? "warning" : result.emailDelivery === "sent" ? "success" : "info");
                }
                if (!cancelled && result.isVerified && result.token && result.user) {
                    if (result.user.isApproved !== true) {
                        endVerificationFlow();
                        navigate("/login", { replace: true, state: {
                            message: "Email verified successfully. Your account is awaiting superadmin approval.", severity: "info",
                        } });
                        return;
                    }
                    login(result.token, result.user);
                    endVerificationFlow();
                    navigate(["admin", "superAdmin"].includes(result.user.role) ? "/admin/dashboard" : "/", { replace: true });
                }
            } catch { /* Retry transient connection failures on the next check. */ }
            finally { checking = false; }
        };
        check();
        const timer = window.setInterval(check, 3000);
        window.addEventListener("focus", check);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
            window.removeEventListener("focus", check);
        };
    }, [token, location.state?.verificationStatusToken, navigate, login]);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        apiRequest("/auth/verification-status", {
            method: "POST", body: JSON.stringify({ token }),
        }).then((result) => {
            if (!cancelled) setTokenStatus(result.valid ? "valid" : "invalid");
        }).catch(() => {
            if (!cancelled) setTokenStatus("invalid");
        });
        return () => { cancelled = true; };
    }, [token]);

    const goToLogin = (message) => {
        endVerificationFlow();
        navigate("/login", { replace: true, state: message ? { message, severity: "success" } : null });
    };

    const submit = async (event, verify) => {
        event.preventDefault();
        setBusy(true);
        try {
            const result = await apiRequest(verify ? "/auth/verify-email" : "/auth/verification-email", {
                method: "POST", body: JSON.stringify(verify ? { token } : { email, statusToken: location.state?.verificationStatusToken }),
            });
            setMessage(result.message);
            setSeverity(result.emailSent === false ? "warning" : result.emailSent === null ? "info" : "success");
            if (verify) {
                if (result.user?.isApproved !== true) {
                    endVerificationFlow();
                    navigate("/login", { replace: true, state: {
                        message: "Email verified successfully. Your account is awaiting superadmin approval.", severity: "info",
                    } });
                    return;
                }
                login(result.token, result.user);
                markEmailVerified(result.email);
                endVerificationFlow();
                navigate(["admin", "superAdmin"].includes(result.user.role) ? "/admin/dashboard" : "/", { replace: true });
            } else {
                setEmail(result.email);
                navigate("/verify-email", { replace: true, state: {
                    ...location.state, email: result.email, message: result.message, emailSent: result.emailSent,
                } });
            }
        } catch (error) {
            setMessage(error.message);
            setSeverity("error");
        } finally {
            setBusy(false);
        }
    };

    if (hasVerifiedSession(isLoggedIn, user)) return <Navigate to={["admin", "superAdmin"].includes(user?.role) ? "/admin/dashboard" : "/"} replace />;
    if ((!token && !isVerificationFlowActive(location.state?.flowId)) || tokenStatus === "invalid") {
        return <Navigate to="/login" replace />;
    }
    if (token && tokenStatus === "pending") return <Typography role="status">Checking verification link…</Typography>;

    return (
        <Stack sx={{ minHeight: "100vh", p: 3, justifyContent: "center", alignItems: "center" }}>
            <Card variant="outlined">
                <Typography variant="h4" component="h1">
                    {token ? "Verify your email" : "Check your email"}
                </Typography>
                {message && <Alert severity={severity}>{message}</Alert>}
                <>
                    <Typography>
                        {token ? "Confirm your email address to finish signing up." : "Open the verification link in your inbox to activate your account. Check your spam folder too. Links expire after 24 hours."}
                    </Typography>
                    {token && <Button variant="contained" disabled={busy} onClick={(event) => submit(event, true)}>
                        {busy ? "Please wait…" : "Verify email"}
                    </Button>}
                    {!token && <Box component="form" onSubmit={(event) => submit(event, false)} sx={{ display: "grid", gap: 2 }}>
                        <TextField label="Email address" type="email" required disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} helperText="Entered the wrong address? Update it here before verifying." />
                        <Button type="submit" disabled={busy}>{busy ? "Sending…" : email.trim().toLowerCase() !== location.state?.email?.trim().toLowerCase() ? "Update email and send verification" : "Resend verification email"}</Button>
                    </Box>}
                </>
                {!token && <Button disabled={busy} onClick={() => goToLogin()}>Go to login</Button>}
            </Card>
        </Stack>
    );
}
