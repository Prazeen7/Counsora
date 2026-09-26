import Box from '@mui/material/Box';
import logo from '../assets/Logo.png';
import './Loading.css';

/** Shared brand loader for pages, dialogs, and compact button states. */
export default function Loading({
    loading = true, size, overlay = false, fullPage = false, centered = false,
    label = 'Loading…', 'aria-label': ariaLabel, sx, children,
}) {
    if (!loading) return children ?? null;
    return (
        <Box component="span" role="status" aria-label={ariaLabel || label}
            sx={[{
                display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                ...(centered && { minHeight: '50dvh', width: '100%' }),
                ...(fullPage && { minHeight: '100dvh', width: '100%' }),
                ...(overlay && {
                    position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,.85)',
                    zIndex: 1301, borderRadius: 'inherit',
                }),
            }, ...(Array.isArray(sx) ? sx : [sx])]}>
            <span className="brand-loader" style={{ width: size, height: size }} aria-hidden="true">
                <img className="brand-loader__logo" src={logo} alt="" />
            </span>
        </Box>
    );
}
