import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Autocomplete, Box, Button, Container, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { ArrowForward, Calculate, Description, MenuBook, Public, School, TravelExplore } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useCountry } from "../../context/CountryContext";
import { getCountries } from "../../services/countryService";
import { getInstitutions } from "../../services/institutionService";
import { apiRequest } from "../../services/api";

const actions = [
    { title: "Find institutions", description: "Explore universities, campuses, and entry requirements.", to: "/institutions", icon: School },
    { title: "Explore programs", description: "Find courses that fit your student's academic profile.", to: "/programs", icon: TravelExplore },
    { title: "View required documents", description: "Prepare for applications with country-specific requirements.", to: "/documents", icon: Description },
    { title: "Estimate costs", description: "Plan tuition, living expenses, and study budgets.", to: "/cost-estimation", icon: Calculate },
    { title: "Read study guides", description: "Get familiar with the destination before advising a student.", to: "/study-guide", icon: MenuBook },
];
const focusStyle = { outline: "3px solid #4f46e5", outlineOffset: 3 };

function CountryIcon({ country }) {
    return country?.code ? (
        <Box component="img" src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} alt="" sx={{ width: 24, height: 18, objectFit: "contain", flexShrink: 0, borderRadius: "2px" }} />
    ) : <Public sx={{ color: "#4f46e5", fontSize: 20 }} />;
}

function ActionCard({ action, compact = false }) {
    const Icon = action.icon;
    return (
        <Paper component={Link} to={action.to} variant="outlined" sx={{ display: "flex", flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "flex-start", gap: 2, p: 2.5, borderRadius: 3, textDecoration: "none", color: "inherit", minWidth: 0, transition: "border-color 150ms, box-shadow 150ms", "&:hover": { borderColor: "#818cf8", boxShadow: "0 4px 16px #4f46e512" }, "&:focus-visible": focusStyle }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, bgcolor: "#eef2ff", color: "#4f46e5", borderRadius: 2 }}><Icon /></Box>
            <Box sx={{ flex: 1 }}>
                <Typography component="h3" variant="subtitle1" fontWeight={700}>{action.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{action.description}</Typography>
            </Box>
            <ArrowForward sx={{ color: "#4f46e5", fontSize: 20, flexShrink: 0, alignSelf: compact ? "center" : "flex-end" }} />
        </Paper>
    );
}

function CountryOverview({ country }) {
    const [counts, setCounts] = useState(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const countryId = country._id || country.id;

    useEffect(() => {
        let active = true;
        Promise.all([
            getInstitutions({ country: countryId, page: 1, limit: 1 }),
            apiRequest(`/program/get?limit=1&offset=0&country=${encodeURIComponent(countryId)}`),
        ]).then(([institutions, programs]) => {
            if (active) setCounts({ institutions: institutions.pagination.total, programs: programs.pagination.total });
        }).catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [countryId, attempt]);

    return (
        <Box component="section" aria-label={`${country.name} overview`} sx={{ pt: 3, mt: 3, borderTop: "1px solid #e0e7ff" }}>
            <Box sx={{ display: "flex", alignItems: "center", columnGap: "12px", mb: 2 }}>
                <CountryIcon country={country} />
                <Typography component="h3" variant="subtitle1" fontWeight={700}>{country.name} at a glance</Typography>
            </Box>
            {error ? <Alert severity="warning" action={<Button color="inherit" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Retry</Button>}>
                We couldn't load the overview. You can still use the study options and resources.
            </Alert> : <Box aria-live="polite" aria-busy={!counts} sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2 }}>
                {[{ key: "institutions", label: "Institutions", to: "/institutions" }, { key: "programs", label: "Programs", to: "/programs" }].map(item => (
                    <Box key={item.key} component={Link} to={item.to} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, textDecoration: "none", color: "#0f172a", "&:hover": { bgcolor: "#eef2ff" }, "&:focus-visible": focusStyle }}>
                        {counts ? <Typography variant="h4" fontWeight={700}>{counts[item.key].toLocaleString()}</Typography> : <Skeleton width={70} height={42} aria-label={`Loading ${item.label.toLowerCase()}`} />}
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{item.label} <ArrowForward sx={{ fontSize: 14, verticalAlign: "middle" }} /></Typography>
                    </Box>
                ))}
            </Box>}
            {counts && (counts.institutions === 0 || counts.programs === 0) && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {counts.institutions === 0 ? "No institutions are listed for this country yet. " : ""}
                {counts.programs === 0 ? "No programs are listed for this country yet." : ""}
            </Typography>}
        </Box>
    );
}

export default function CounselorDashboard() {
    const { user } = useAuth();
    const { selectedCountry, setSelectedCountry } = useCountry();
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        getCountries().then(data => { if (active) setCountries(data); })
            .catch(() => { if (active) setError(true); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);

    return (
        <Box component="main" sx={{ bgcolor: "#f8fafc", minHeight: "calc(100vh - 90px)", py: { xs: 3, md: 5 } }}>
            <Container maxWidth="lg">
                <Typography variant="overline" sx={{ color: "#4f46e5", fontWeight: 700, letterSpacing: 1.5 }}>COUNSELOR WORKSPACE</Typography>
                <Typography component="h1" variant="h4" sx={{ fontWeight: 750, color: "#0f172a", mt: 0.5, mb: 1, fontSize: { xs: "1.8rem", md: "2.25rem" } }}>
                    Welcome back{user?.name ? `, ${user.name}` : ""}.
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3.5 }}>Choose a destination, explore study options, and prepare for your next counseling session.</Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(320px, 380px)" }, alignItems: "start", gap: 3 }}>
                <Paper component="section" aria-labelledby="destination-heading" variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, borderColor: "#c7d2fe", background: "linear-gradient(160deg, #eef2ff, #fff)", gridColumn: { md: 2 }, gridRow: { md: 1 } }}>
                    <Box sx={{ display: "grid", gap: 2.5 }}>
                        <Box>
                            <Typography component="h2" id="destination-heading" variant="h6" fontWeight={700} sx={{ color: "#1e1b4b", mb: 1 }}>Your destination</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>Select a country to tailor your study options and resources.</Typography>
                        </Box>
                        <Box>
                            <Autocomplete
                                options={countries}
                                value={selectedCountry}
                                onChange={(_, country) => setSelectedCountry(country)}
                                getOptionLabel={country => country.name}
                                isOptionEqualToValue={(option, value) => (option._id || option.id) === (value._id || value.id)}
                                loading={loading}
                                noOptionsText={error ? "Countries couldn't be loaded" : "No countries found"}
                                renderInput={params => <TextField {...params} label="Select country" placeholder="Search countries" helperText={selectedCountry ? `Currently advising for ${selectedCountry.name}` : "Worldwide — choose a country for local resources"} />}
                                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "white" } }}
                            />
                            {error && <Alert severity="warning" sx={{ mt: 1 }} action={<Button color="inherit" onClick={() => { setLoading(true); setError(false); setAttempt(value => value + 1); }}>Retry</Button>}>Couldn't load countries.</Alert>}
                        </Box>
                    </Box>
                    {selectedCountry ? <CountryOverview key={selectedCountry._id || selectedCountry.id} country={selectedCountry} /> : (
                        <Box sx={{ pt: 3, mt: 3, borderTop: "1px solid #e0e7ff" }}>
                            <Typography component="h3" variant="subtitle2" fontWeight={700}>A closer look at your destination</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>Choose a country above to see available institutions, programs, and country-specific guidance.</Typography>
                        </Box>
                    )}
                </Paper>

                <Box sx={{ minWidth: 0, gridColumn: { md: 1 }, gridRow: { md: 1 } }}>
                <Box component="section" aria-labelledby="quick-actions-heading" sx={{ mb: 3.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: "16px", rowGap: "12px", mb: 2 }}>
                        <Typography component="h2" id="quick-actions-heading" variant="h6" fontWeight={700}>Explore study options</Typography>
                        <Box sx={{ display: "inline-flex", alignItems: "center", columnGap: "8px", px: "12px", py: "6px", maxWidth: "100%", border: "1px solid #cbd5e1", borderRadius: "20px", bgcolor: "white" }}>
                            <CountryIcon country={selectedCountry} />
                            <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.4 }}>{selectedCountry?.name || "Worldwide"}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                        {actions.slice(0, 2).map(action => <ActionCard key={action.to} action={action} />)}
                    </Box>
                </Box>
                <Box component="section" aria-labelledby="resources-heading">
                    <Typography component="h2" id="resources-heading" variant="h6" fontWeight={700} sx={{ mb: 2 }}>Prepare for the next step</Typography>
                    <Stack gap={1.5}>
                        {actions.slice(2).map(action => <ActionCard key={action.to} action={action} compact />)}
                    </Stack>
                </Box>
                </Box>
                </Box>
            </Container>
        </Box>
    );
}
