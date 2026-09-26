import { Box, Typography } from '@mui/material';

export default function AdditionalRequirementsContent({ requirements }) {
    return (
        <Box tabIndex={0} role="region" aria-label="Additional requirements" sx={{
            py: 0.5,
            pr: 0.5,
            maxHeight: 'min(160px, calc(100dvh - 64px))',
            overflowY: 'auto',
            overflowWrap: 'anywhere',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,.5) transparent',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,.5)', borderRadius: 6 },
        }}>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {requirements.map((requirement, index) => (
                    <Typography component="li" variant="body2" key={index}
                        sx={{ lineHeight: 1.5, mb: 0.75, '&:last-child': { mb: 0 } }}>
                        {requirement}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}
