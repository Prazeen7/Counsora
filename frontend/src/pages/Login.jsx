import React, { useEffect, useState } from 'react';
import Card from '../components/auth/AuthCard';
import PrimaryButton from '../components/auth/PrimaryButton';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

// MUI imports
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox'
import Link from '@mui/material/Link'


// customized container
const LoginContainer = styled(Stack)(({ theme }) => ({
    minHeight: "100vh",
    padding: theme.spacing(2),
    backgroundImage: "radial-gradient(circle, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(4),
    },
}))

export default function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');

    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [rememberMe, setRememberMe] = React.useState(false)

    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPasswordOpen = () => setOpen(true)
    const handleForgotPasswordClose = () => setOpen(false)

    const URL = import.meta.env.VITE_BACKEND_URL;

    const { login } = useAuth();

    useEffect(() => {
        // Message passed through React Router
        if (location.state?.message) {
            setAlertMessage(location.state.message);
            setAlertSeverity("warning");
            return;
        }

        // Message stored by apiRequest during forced logout
        const logoutMessage = sessionStorage.getItem("logoutMessage");
        if (logoutMessage) {
            setAlertMessage(logoutMessage);
            setAlertSeverity("warning");
            sessionStorage.removeItem("logoutMessage");
        }
    }, [location.state]);

    // Toggle password visibility
    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    // validate inputs
    const validateInputs = () => {
        let isValid = true;

        const email = document.getElementById('email');
        const password = document.getElementById('password');

        // Reset all errors
        setEmailError(false);
        setEmailErrorMessage('');
        setPasswordError(false);
        setPasswordErrorMessage('');

        // Email validation
        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        }

        // Password validation
        if (!password.value || password.value.length < 8) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 8 characters long.');
            isValid = false;
        } else if (!/(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(password.value)) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must contain at least one uppercase letter and one special character.');
            isValid = false;
        }

        return isValid;
    }

    const setToken = (result) => {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        navigate("/");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validate inputs
        const isValid = validateInputs();
        if (!isValid) {
            return;
        }

        // Extracting form data
        const form = event.currentTarget;
        const formData = new FormData(form);
        const credentials = {
            email: formData.get("email"),
            password: formData.get("password"),
        };

        try {
            const result = await loginUser(credentials);

            login(result.token, result.user);
            setAlertSeverity("success");
            setAlertMessage("Successfully Logged in");
            clearForm(form);
            navigate("/");
        } catch (err) {
            setAlertSeverity("error");
            setAlertMessage(err.message);
        }

    }

    const handleForgotPasswordClick = (event) => {
        event.preventDefault()
        handleForgotPasswordOpen()
    }

    // clear form function
    const clearForm = (form) => {
        form.reset();

        setEmailError(false);
        setPasswordError(false);

        setEmailErrorMessage("");
        setPasswordErrorMessage("");
    }

    // clear alert messages after 5 seconds
    useEffect(() => {
        if (!alertMessage) return;

        const timer = setTimeout(() => {
            setAlertMessage("");
            setAlertSeverity(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [alertMessage]);

    return (
        <>
            <LoginContainer direction="column">
                <Card variant="outlined">
                    {/* Login header */}
                    <Typography component="h1" variant="h4" fontWeight="bold" sx={{ textAlign: 'center' }}>
                        Login
                    </Typography>

                    {/* Alert Message */}
                    {alertMessage && (
                        <Stack sx={{ width: '100%' }} spacing={2}>
                            <Alert severity={alertSeverity}>{alertMessage}</Alert>
                        </Stack>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* Email */}
                        <FormControl sx={{ textAlign: 'left' }}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                placeholder="Email"
                                name="email"
                                autoComplete="email"
                                variant="outlined"
                                error={emailError}
                                helperText={emailErrorMessage}
                                color={emailError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        {/* Password */}
                        <FormControl sx={{ textAlign: 'left' }}>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                placeholder="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                variant="outlined"
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                color={passwordError ? 'error' : 'primary'}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </FormControl>

                        {/* remember me checkbox */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    value="remember"
                                    color="primary"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                            }
                            label="Remember me"
                        />

                        {/* Login button */}
                        <PrimaryButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Login'
                            )}
                        </PrimaryButton>

                    </Box>

                    <Link component="button" onClick={handleForgotPasswordClick} variant="body2" sx={{ alignSelf: "left" }}>
                        Forgot your password?
                    </Link>

                    {/* Login navigation */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ textAlign: 'center' }}>
                            Don't have an account?{' '}
                            <NavLink to="/signup" variant="body2" sx={{ alignSelf: 'center' }}>
                                Sign up
                            </NavLink>
                        </Typography>

                    </Box>
                </Card>
            </LoginContainer >
        </>
    )
}