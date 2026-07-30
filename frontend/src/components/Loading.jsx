import React from 'react';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Styled component with optional size and color props
const StyledCircularProgress = styled(CircularProgress)(({ theme, size, color }) => ({
    color: color || '#4f46e5', 
    width: size || 24,
    height: size || 24,
}));

// Loading container with optional overlay
const LoadingContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'overlay'
})(({ theme, overlay }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...(overlay && {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 9999,
    }),
}));

export default function CircularLoading({
    loading = true,
    color,
    size,
    overlay = false,
    children
}) {
    if (!loading) return children || null;

    return (
        <LoadingContainer overlay={overlay}>
            <StyledCircularProgress size={size} color={color} />
        </LoadingContainer>
    );
}