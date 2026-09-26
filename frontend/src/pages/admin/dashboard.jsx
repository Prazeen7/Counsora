import Loading from '../../components/Loading';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useCountry } from '../../context/CountryContext';
import { apiRequest } from '../../services/api';

const categories = [
    { key: 'institutions', label: 'Institutions', path: '/admin/institutions', color: '#4f46e5' },
    { key: 'documents', label: 'Documents', path: '/admin/documents', color: '#0284c7' },
    { key: 'costSheets', label: 'Cost sheets', path: '/admin/cost-estimation', color: '#059669' },
    { key: 'studyGuides', label: 'Study guides', path: '/admin/study-guide', color: '#9333ea' },
];
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date unavailable';

function DashboardChart({ data, days, onDaysChange }) {
    const step = Math.max(1, Math.ceil(Math.max(...categories.flatMap(({ key }) => [data[key].total, data[key].addedRecently])) / 4));
    const maximum = step * 4;
    const series = [
        { key: 'total', label: 'Total', color: '#4f46e5' },
        { key: 'addedRecently', label: `Added in the last ${days} days`, color: '#059669' },
    ];

    return <Paper component="section" aria-labelledby="dashboard-chart-title" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography id="dashboard-chart-title" component="h2" variant="h6" fontWeight={700}>Content by category</Typography>
            <ToggleButtonGroup value={days} exclusive size="small" aria-label="Recent additions period" onChange={(_event, value) => { if (value !== null) onDaysChange(value); }}>
                <ToggleButton value={7}>Last 7 days</ToggleButton>
                <ToggleButton value={30}>Last 30 days</ToggleButton>
            </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={2} sx={{ mt: 1, mb: 3 }}>
            {series.map(item => <Stack key={item.key} direction="row" spacing={1} alignItems="center">
                <Box aria-hidden="true" sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: item.color }} />
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Stack>)}
        </Stack>
        <Box tabIndex={0} role="region" aria-label="Vertical bar chart of content counts" sx={{ overflowX: 'auto', pb: 1, mb: 1 }}>
            <Box sx={{ minWidth: 560, display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', columnGap: 1.5, pt: 4 }}>
                <Box aria-hidden="true" sx={{ position: 'relative', height: 260, minWidth: '6ch' }}>
                    {[0, 1, 2, 3, 4].map(tick => <Typography key={tick} variant="caption" color="text.secondary" sx={{ position: 'absolute', right: 0, bottom: `${tick * 25}%`, transform: 'translateY(50%)' }}>{(tick * step).toLocaleString()}</Typography>)}
                </Box>
                <Box sx={{ position: 'relative', height: 260, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {[1, 2, 3, 4].map(tick => <Box key={tick} aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: `${tick * 25}%`, borderTop: '1px dashed', borderColor: 'divider' }} />)}
                    <Box sx={{ position: 'relative', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2, px: 1 }}>
                        {categories.map(category => <Box key={category.key} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1.5, height: '100%' }}>
                            {series.map(item => <Box key={item.key} role="img" aria-label={`${category.label}: ${item.label}, ${data[category.key][item.key].toLocaleString()}`} sx={{ position: 'relative', height: `${data[category.key][item.key] / maximum * 100}%`, width: '40%', maxWidth: 56, bgcolor: item.color, borderRadius: '4px 4px 0 0' }}>
                                <Typography aria-hidden="true" variant="caption" fontWeight={600} sx={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', pb: 0.5, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{data[category.key][item.key].toLocaleString()}</Typography>
                            </Box>)}
                        </Box>)}
                    </Box>
                </Box>
                <Box />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2, px: 1, pt: 1.5 }}>
                    {categories.map(category => <Typography key={category.key} fontWeight={600} variant="body2" textAlign="center">{category.label}</Typography>)}
                </Box>
            </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">Number of entries · Documents count once per country</Typography>
    </Paper>;
}

export default function Dashboard() {
    const { selectedCountry } = useCountry();
    return <DashboardContent key={selectedCountry?._id || 'worldwide'} country={selectedCountry} />;
}

function DashboardContent({ country }) {
    const { setSelectedCountry } = useCountry();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);
    const [days, setDays] = useState(30);
    const countryId = country?._id;

    useEffect(() => {
        let active = true;
        apiRequest(`/dashboard?days=${days}${countryId ? `&country=${encodeURIComponent(countryId)}` : ''}`)
            .then(result => { if (active) setData(result); })
            .catch(err => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [countryId, version, days]);

    const refresh = () => { setLoading(true); setError(''); setVersion(value => value + 1); };
    const changeDays = value => { if (value !== days) { setLoading(true); setError(''); setDays(value); } };
    const openCategory = (category, record) => {
        if (record.country) setSelectedCountry(record.country);
        navigate(category.key === 'institutions' ? `${category.path}/${encodeURIComponent(record._id)}` : category.path);
    };

    return <Box sx={{ maxWidth: 1440, mx: 'auto', minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box>
                <Typography component="h1" variant="h4" fontWeight={700}>Dashboard</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>{country?.name || 'All countries'} · Content overview</Typography>
            </Box>
            <Button startIcon={<Refresh />} onClick={refresh} disabled={loading}>Refresh</Button>
        </Stack>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><Loading centered aria-label="Loading dashboard" /></Box> : error ?
            <Alert severity="error" action={<Button onClick={refresh}>Retry</Button>}>{error}</Alert> : data && <>
                <DashboardChart data={data} days={days} onDaysChange={changeDays} />
                <Typography variant="h6" component="h2" fontWeight={700}>Newly added</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The five latest additions in each category, newest first. Documents are grouped by country.</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                    {categories.map(category => <Paper key={category.key} variant="outlined" sx={{ borderRadius: 3, minWidth: 0 }}>
                        <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>{category.label}</Typography>
                        {data[category.key].latest.length ? data[category.key].latest.map(record => <Box key={record._id} sx={{ p: 2, '& + &': { borderTop: '1px solid', borderColor: 'divider' } }}>
                            <Button onClick={() => openCategory(category, record)} sx={{ p: 0, minWidth: 0, textTransform: 'none', textAlign: 'left', justifyContent: 'flex-start', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{record.name || record.title}</Button>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{record.country?.name || 'Country unavailable'} · Added {formatDate(record.createdAt)}{record.type === 'process_flow' ? ' · Process overview' : ''}</Typography>
                        </Box>) : <Typography color="text.secondary" sx={{ p: 3 }}>No {category.label.toLowerCase()} added yet.</Typography>}
                    </Paper>)}
                </Box>
            </>}
    </Box>;
}
