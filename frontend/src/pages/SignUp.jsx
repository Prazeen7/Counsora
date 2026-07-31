import React, { useEffect, useState } from 'react';
import Card from '../components/auth/AuthCard';
import PrimaryButton from '../components/auth/PrimaryButton';
import { NavLink, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

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

// customized container
const SignUpContainer = styled(Stack)(({ theme }) => ({
    minHeight: '100vh',
    padding: theme.spacing(2),
    backgroundImage:
        'radial-gradient(circle, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
}));

export default function SignUp() {

    const [nameError, setNameError] = useState(false);
    const [nameErrorMessage, setNameErrorMessage] = useState('');

    const [lastNameError, setLastNameError] = useState(false);
    const [lastNameErrorMessage, setLastNameErrorMessage] = useState('');

    const [organizationNameError, setOrganizationNameError] = useState(false);
    const [organizationNameErrorMessage, setOrganizationNameErrorMessage] = useState('');

    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');

    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [confirmPasswordError, setConfirmPasswordError] = useState(false);
    const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [role, setRole] = useState("counselor");

    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const URL = import.meta.env.VITE_BACKEND_URL;

    const navigate = useNavigate();

    // Toggle password visibility
    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    // validate inputs
    const validateInputs = () => {
        let isValid = true;

        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const organizationName = document.getElementById('organizationName');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        // Reset all errors
        setEmailError(false);
        setEmailErrorMessage('');
        setPasswordError(false);
        setPasswordErrorMessage('');
        setConfirmPasswordError(false);
        setConfirmPasswordErrorMessage('');
        setNameError(false);
        setNameErrorMessage('');
        setLastNameError(false);
        setLastNameErrorMessage('');

        // First Name validation
        if (!firstName.value || firstName.value.trim().length < 1) {
            setNameError(true);
            setNameErrorMessage('First name is required.');
            isValid = false;
        }

        // Last Name validation
        if (!lastName.value || lastName.value.trim().length < 1) {
            setLastNameError(true);
            setLastNameErrorMessage('Last name is required.');
            isValid = false;
        }

        // Organization name validation
        if (role === 'counselor') {
            if (!organizationName.value || organizationName.value.trim().length < 1) {
                setOrganizationNameError(true);
                setOrganizationNameErrorMessage('Organization name is required.')
                isValid = false;
            }
        }

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

        // Confirm Password validation
        if (password.value !== confirmPassword.value) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage('Passwords do not match.');
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
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            role,
            organizationName:
                role === "counselor"
                    ? formData.get("organizationName")
                    : undefined,
        };

        setIsLoading(true);

        // Signing up
        try {
            await registerUser(data);

            setAlertSeverity("success");
            setAlertMessage("Successfully Registered");
            clearForm(form);
            navigate("/login");
        } catch (err) {
            setAlertSeverity("error");
            setAlertMessage(err.message);
        } finally {
            setIsLoading(false);
        }

    }

    // clear form function
    const clearForm = (form) => {
        form.reset();
        setRole("counselor");

        setNameError(false);
        setLastNameError(false);
        setOrganizationNameError(false);
        setEmailError(false);
        setPasswordError(false);
        setConfirmPasswordError(false);

        setNameErrorMessage("");
        setLastNameErrorMessage("");
        setOrganizationNameErrorMessage("");
        setEmailErrorMessage("");
        setPasswordErrorMessage("");
        setConfirmPasswordErrorMessage("");
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
            <SignUpContainer direction="column">
                <Card variant="outlined">
                    {/* Sign up header */}
                    <Typography component="h1" variant="h4" fontWeight="bold" sx={{ textAlign: 'center' }}>
                        Sign up
                    </Typography>

                    {/* Alert Message */}
                    {alertMessage && (
                        <Stack sx={{ width: '100%' }} spacing={2}>
                            <Alert severity={alertSeverity}>{alertMessage}</Alert>
                        </Stack>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* select role */}
                        <FormControl>
                            <FormLabel>Register as</FormLabel>
                            <RadioGroup
                                row
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <FormControlLabel value="counselor" control={<Radio />} label="Counselor" />
                                <FormControlLabel value="admin" control={<Radio />} label="Admin" />
                            </RadioGroup>
                        </FormControl>

                        {/* first and last name */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 2,
                            }}
                        >
                            <FormControl sx={{ textAlign: "left" }}>
                                <TextField
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    placeholder="First Name"
                                    error={nameError}
                                    helperText={nameErrorMessage}
                                    color={nameError ? "error" : "primary"}
                                />
                            </FormControl>

                            <FormControl sx={{ textAlign: "left" }}>
                                <TextField
                                    autoComplete="family-name"
                                    name="lastName"
                                    required
                                    fullWidth
                                    id="lastName"
                                    placeholder="Last Name"
                                    error={lastNameError}
                                    helperText={lastNameErrorMessage}
                                    color={lastNameError ? "error" : "primary"}
                                />
                            </FormControl>
                        </Box>

                        {/* organization name */}
                        {role === "counselor" && (
                            <FormControl sx={{ textAlign: "left" }}>
                                <TextField
                                    name="organizationName"
                                    required
                                    fullWidth
                                    id="organizationName"
                                    placeholder="Organization Name"
                                    error={organizationNameError}
                                    helperText={organizationNameErrorMessage}
                                    color={organizationNameError ? "error" : "primary"}
                                />
                            </FormControl>
                        )}

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

                        {/* Password and confirm password */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 2,
                            }}
                        >

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

                            {/* Confirm Password */}
                            <FormControl sx={{ textAlign: 'left' }}>
                                <TextField
                                    required
                                    fullWidth
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    autoComplete="confirmPassword"
                                    variant="outlined"
                                    error={confirmPasswordError}
                                    helperText={confirmPasswordErrorMessage}
                                    color={confirmPasswordError ? 'error' : 'primary'}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowConfirmPassword}
                                                        edge="end"
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </FormControl>
                        </Box>

                        {/* sign up button */}
                        <PrimaryButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Sign up'
                            )}
                        </PrimaryButton>
                    </Box>

                    {/* Login navigation */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ textAlign: 'center' }}>
                            Already have an account?{' '}
                            <NavLink to="/login" variant="body2" sx={{ alignSelf: 'center' }}>
                                Login
                            </NavLink>
                        </Typography>

                    </Box>
                </Card>
            </SignUpContainer >
        </>
    )
}