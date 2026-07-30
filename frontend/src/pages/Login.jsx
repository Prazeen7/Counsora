import React, { useEffect, useState } from 'react';
import Card from '../components/auth/AuthCard';
import PrimaryButton from '../components/auth/PrimaryButton';
import { NavLink, useNavigate } from "react-router-dom";

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

export default function SignUp() {

    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');

    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [rememberMe, setRememberMe] = React.useState(false)

    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPasswordOpen = () => setOpen(true)
    const handleForgotPasswordClose = () => setOpen(false)

    const URL = 'http://localhost:5000/api/auth/login';

    const navigate = useNavigate();

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
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        setIsLoading(true);

        // Signing up
        try {
            const response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            // Throw error if respone is not 201
            if (!response.ok) {
                throw new Error(result.error);
            }

            setIsLoading(false);
            setAlertSeverity("success");
            setAlertMessage("Successfully Logged in");
            clearForm(form);
        } catch (err) {
            setIsLoading(false);
            console.error("Error during registration:", err);

            const errorMessage = err.message;

            if (err.response?.data?.error) {
                errorMessage = err.message;

                if (errorMessage === "Email is already registered") {
                    setEmailError(true);
                    setEmailErrorMessage("Email is already registered.");
                } else if (errorMessage.includes("Password must be")) {
                    setPasswordError(true);
                    setPasswordErrorMessage(errorMessage);
                }

                setAlertMessage(errorMessage);
                setAlertSeverity("error");
            }

            setAlertMessage(errorMessage);
            setAlertSeverity("error");
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

                        {/* Google Login button */}
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            sx={{
                                textTransform: "none",
                                fontWeight: "bold",
                                color: "#444",
                                borderColor: "#ccc",
                                "&:hover": {
                                    borderColor: "#999",
                                },
                            }}
                        >
                            Login with Google
                        </Button>

                    </Box>

                    <Link component="button" onClick={handleForgotPasswordClick} variant="body2" sx={{ alignSelf: "left" }}>
                        Forgot your password?
                    </Link>

                    {/* Login navigation */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ textAlign: 'center' }}>
                            Don't have an account?{' '}
                            <NavLink to="/login" variant="body2" sx={{ alignSelf: 'center' }}>
                                Sign up
                            </NavLink>
                        </Typography>

                    </Box>
                </Card>
            </LoginContainer >
        </>
    )
}