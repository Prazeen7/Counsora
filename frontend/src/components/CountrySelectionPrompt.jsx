import { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCountry } from '../context/CountryContext';
import { getCountries } from '../services/countryService';
import Loading from './Loading';

export default function CountrySelectionPrompt({ title, message }) {
    const { setSelectedCountry } = useCountry();
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        getCountries()
            .then(data => { if (active) setCountries(data); })
            .catch(() => { if (active) setError(true); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);

    return (
        <Paper variant="outlined" sx={{ maxWidth: 640, mx: 'auto', p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
            <Stack spacing={2.5}>
                <Typography component="h1" variant="h5" fontWeight={700}>{title}</Typography>
                <Alert severity="info">{message}</Alert>
                <Autocomplete
                    options={countries}
                    value={null}
                    onChange={(_, country) => { if (country) setSelectedCountry(country); }}
                    getOptionLabel={country => country.name}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    loading={loading}
                    loadingText={<Loading size={28} label="Loading countries" />}
                    noOptionsText={error ? "Countries couldn't be loaded" : 'No countries available'}
                    renderOption={({ key, ...props }, country) => (
                        <Box component="li" key={key} {...props} sx={{ gap: 1.5 }}>
                            {country.code && <Box component="img"
                                src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                alt="" loading="lazy"
                                sx={{ width: 24, height: 18, objectFit: 'contain', flexShrink: 0, borderRadius: '2px' }} />}
                            {country.name}
                        </Box>
                    )}
                    renderInput={params => <TextField {...params} label="Select country" placeholder="Search countries" />}
                />
                {error && <Alert severity="error" action={<Button color="inherit" onClick={() => {
                    setLoading(true);
                    setError(false);
                    setAttempt(value => value + 1);
                }}>Retry</Button>}>Couldn't load countries. Please try again.</Alert>}
            </Stack>
        </Paper>
    );
}
