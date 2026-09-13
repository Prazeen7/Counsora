import { Fragment, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, InputAdornment,
    LinearProgress, Stack, Tab, Tabs, TextField, Typography, Paper, CardHeader, CardActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Calculate, Download, RestartAlt, School, AccountBalance, Flight, ArrowForward, Description } from "@mui/icons-material";
import { useCountry } from "../context/CountryContext";
import { useAuth } from "../context/AuthContext";
import CostSheetManager from "./admin/CostSheetManager";

import { estimateCosts, getCostSheet } from "../services/costEstimationService";

const money = (amount) => new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 2 }).format(amount);
const primaryColor = "#4f46e5";
const stageColors = [primaryColor, "#0284c7", "#d97706"];
const stageIcons = [<School />, <AccountBalance />, <Flight />];

function CountryEstimate({ countryId, countryName, canManage }) {
    const [sheet, setSheet] = useState(null);
    const [values, setValues] = useState({});
    const [result, setResult] = useState(null);
    const [activeStage, setActiveStage] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [missingSheet, setMissingSheet] = useState(false);
    const request = useRef(null);
    const revision = useRef(0);
    const resultsRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        if (!result) return;
        const frame = requestAnimationFrame(() => {
            resultsRef.current?.focus({ preventScroll: true });
            resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        });
        return () => cancelAnimationFrame(frame);
    }, [result]);

    useEffect(() => {
        const abort = new AbortController();
        getCostSheet(countryId, abort.signal).then((data) => {
            setSheet(data);
            setResult(null);
        }).catch((err) => { if (!abort.signal.aborted) { setError(err.message); setMissingSheet(err.code === 'COST_SHEET_NOT_FOUND'); } })
            .finally(() => { if (!abort.signal.aborted) setLoading(false); });
        return () => { abort.abort(); request.current?.abort(); };
    }, [countryId, attempt]);

    const changeValue = (key, value) => {
        revision.current += 1;
        request.current?.abort();
        setCalculating(false);
        setValues((previous) => ({ ...previous, [key]: value }));
        setResult(null);
        setError("");
    };

    const calculate = async (event) => {
        event.preventDefault();
        const numeric = {};
        for (const [key, value] of Object.entries(values)) {
            if (value === "") continue;
            const amount = Number(value);
            if (!Number.isFinite(amount) || amount < 0 || amount > 1e12 || Number(amount.toFixed(2)) !== amount) {
                setError("Enter non-negative amounts with up to two decimal places (maximum NPR 1 trillion).");
                return;
            }
            numeric[key] = amount;
        }
        request.current?.abort();
        const abort = new AbortController();
        request.current = abort;
        const currentRevision = revision.current;
        setCalculating(true);
        setError("");
        try {
            const data = await estimateCosts(countryId, numeric, abort.signal);
            if (!abort.signal.aborted && currentRevision === revision.current) setResult(data);
        } catch (err) { if (!abort.signal.aborted) setError(err.message); }
        finally { if (!abort.signal.aborted) setCalculating(false); }
    };

    const reload = () => {
        revision.current += 1; request.current?.abort(); setCalculating(false);
        setLoading(true); setSheet(null); setResult(null); setValues({}); setActiveStage(0);
        setMissingSheet(false); setError(''); setAttempt((value) => value + 1);
    };
    const management = canManage && (sheet || missingSheet) ? <CostSheetManager countryId={countryId} countryName={countryName} sheet={sheet} onChanged={reload} /> : null;
    if (loading) return <Box sx={{ py: 8, textAlign: "center" }} role="status"><CircularProgress /><Typography>Loading cost sheet…</Typography></Box>;
    if (!sheet) return <Stack spacing={3}>{management}<Alert severity="info" action={<Button onClick={reload}>Retry</Button>}>{error || "No cost sheet available for this country."}</Alert></Stack>;

    const allItems = sheet.stages.flatMap((stage) => stage.items);
    const filled = allItems.filter((item) => (values[item.key] !== undefined && values[item.key] !== "") || item.defaultAmount !== null).length;
    const stage = sheet.stages[activeStage];
    const progress = Math.round((activeStage + 1) / sheet.stages.length * 100);
    return <>{management}<Box ref={formRef} component="form" onSubmit={calculate} noValidate sx={{ scrollMarginTop: '90px' }}>
        <Paper elevation={3} sx={{ bgcolor: primaryColor, color: "white", p: { xs: 2.5, sm: 3 }, borderRadius: 2, mb: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Calculate sx={{ fontSize: 32 }} />
                <Typography variant="h4" component="h1" fontWeight="bold" sx={{ fontSize: { xs: "1.6rem", sm: "2.125rem" } }}>Study Abroad Cost Calculator</Typography>
            </Stack>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 3 }}>Plan your education journey with our comprehensive cost estimator</Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption">{progress}%</Typography>
                <Typography variant="caption">Stage {activeStage + 1} of {sheet.stages.length}: {stage.title}</Typography>
            </Stack>
            <LinearProgress aria-label="Stage progress" variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,.2)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }} />
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mt: 3 }}>
                <Typography fontWeight={600}>{sheet.country.name}</Typography>
                
                <Button type="submit" color="inherit" variant="contained" disabled={calculating} startIcon={calculating ? <CircularProgress size={18} /> : <Calculate />}
                    sx={{ bgcolor: "white", color: primaryColor, "&:hover": { bgcolor: "#eef2ff" }, "&.Mui-disabled": { bgcolor: "#e0e7ff", color: primaryColor } }}>{calculating ? "Calculating…" : "Calculate Total"}</Button>
            </Stack>
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box>
                <Tabs value={activeStage} onChange={(_, value) => setActiveStage(value)} variant="scrollable" scrollButtons="auto" aria-label="Cost stages"
                    sx={{ borderBottom: 1, borderColor: "divider", mb: 3, "& .MuiTab-root": { minWidth: { xs: 140, sm: 200 }, flex: 1, py: 2, textTransform: "none" }, "& .Mui-selected": { color: primaryColor }, "& .MuiTabs-indicator": { bgcolor: primaryColor } }}>
                    {sheet.stages.map((item, index) => <Tab key={item.key} id={`cost-tab-${index}`} aria-controls={`cost-panel-${index}`}
                        icon={<Box sx={{ bgcolor: `${primaryColor}18`, color: primaryColor, borderRadius: "50%", p: 1, display: "flex" }}>{stageIcons[index % stageIcons.length]}</Box>}
                        label={`Stage ${index + 1}: ${item.title}`} />)}
                </Tabs>
            <Card elevation={2} sx={{ borderRadius: 2, minWidth: 0 }} role="tabpanel" id={`cost-panel-${activeStage}`} aria-labelledby={`cost-tab-${activeStage}`}>
                <CardHeader avatar={<Box sx={{ display: "flex", p: 1, bgcolor: `${primaryColor}18`, color: primaryColor, borderRadius: "50%" }}>{stageIcons[activeStage % stageIcons.length]}</Box>}
                    title={stage.title} subheader={`${sheet.country.name} · Stage ${activeStage + 1}`} sx={{ bgcolor: `${primaryColor}08`, borderBottom: "1px solid #e5e7eb", "& .MuiCardHeader-title": { fontWeight: 600, fontSize: "1.15rem" } }} />
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Use the suggested amounts or enter your own. Blank fields use the suggested amount when available.</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                        {stage.items.map((item) => <Paper key={item.key} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "#fafaff", borderColor: "#e0e7ff" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1} sx={{ mb: 2.5 }}>
                                <Typography fontWeight={600}>{item.label}</Typography>
                                <Chip size="small" label={item.defaultAmount === null ? "Your amount" : "Estimated"} sx={{ bgcolor: `${primaryColor}12`, color: primaryColor }} />
                            </Stack>
                            <TextField fullWidth label="Amount"
                            value={values[item.key] ?? (item.defaultAmount ?? "")}
                            onChange={(event) => changeValue(item.key, event.target.value)}
                            type="number" onFocus={(event) => event.target.select()} onWheel={(event) => event.target.blur()}
                            slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start">NPR</InputAdornment> }, htmlInput: { "aria-label": item.label, min: 0, max: 1e12, step: "0.01" } }}
                            helperText={[item.note, item.defaultAmount === null ? "Enter your amount; zero is allowed." : `Suggested: ${money(item.defaultAmount)}`].filter(Boolean).join(" · ")} />
                        </Paper>)}
                    </Box>
                    <Alert severity="info" sx={{ mt: 3, bgcolor: `${primaryColor}08` }}>{filled} of {allItems.length} amounts available. All amounts are in Nepalese rupees (NPR).</Alert>
                </CardContent>
                <CardActions sx={{ bgcolor: "#f8f9fb", p: 2, justifyContent: "space-between", borderTop: "1px solid #e5e7eb" }}>
                        <Button disabled={activeStage === 0} onClick={() => setActiveStage((value) => value - 1)}>Previous stage</Button>
                        {activeStage < sheet.stages.length - 1 ? <Button variant="contained" endIcon={<ArrowForward />} onClick={() => setActiveStage((value) => value + 1)}>Next stage</Button>
                            : <Button type="submit" variant="contained" startIcon={<Calculate />} disabled={calculating}>Calculate Total</Button>}
                </CardActions>
            </Card>
            {result && <Card ref={resultsRef} tabIndex={-1} aria-label="Cost estimation results" elevation={3} sx={{ borderRadius: 2, mt: 4, overflow: "hidden", scrollMarginTop: '90px' }}>
                <CardHeader avatar={<Description sx={{ color: primaryColor }} />} title="Cost Estimation Results" subheader="A detailed breakdown of your study abroad budget"
                    sx={{ background: "linear-gradient(to right, #eef2ff, #faf5ff)", borderBottom: "1px solid #e0e7ff", "& .MuiCardHeader-title": { fontSize: "1.4rem", fontWeight: 700 } }} />
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box aria-live="polite">
                        <Chip size="small" color={result.isComplete ? "success" : "warning"} label={result.isComplete ? "Complete estimate" : "Partial estimate"} sx={{ mb: 2 }} />
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
                            {result.stages.map((item, index) => <Paper variant="outlined" key={item.key} sx={{ p: 2, borderRadius: 2, bgcolor: `${stageColors[index % 3]}09`, borderColor: `${stageColors[index % 3]}35` }}>
                                <Box sx={{ color: stageColors[index % 3], mb: 1 }}>{stageIcons[index % 3]}</Box>
                                <Typography variant="overline" color="text.secondary">Stage {index + 1}</Typography>
                                <Button onClick={() => setActiveStage(index)} sx={{ p: 0, textAlign: "left", justifyContent: "flex-start", textTransform: "none", color: stageColors[index % 3] }}>{item.title}</Button>
                                <Typography variant="h6" fontWeight={700}>{money(item.subtotal)}</Typography>
                                {!item.isComplete && <Typography variant="caption">Missing amounts</Typography>}
                            </Paper>)}
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table aria-label="Detailed cost breakdown" sx={{ minWidth: 520 }}>
                                <TableHead sx={{ bgcolor: primaryColor }}><TableRow>
                                    {['Stage', 'Description', 'Amount (NPR)'].map((label, index) => <TableCell key={label} align={index === 2 ? "right" : "left"} sx={{ color: "white", fontWeight: 600 }}>{label}</TableCell>)}
                                </TableRow></TableHead>
                                <TableBody>
                                    {result.stages.map((group, index) => <Fragment key={group.key}>
                                        {group.items.map((item, itemIndex) => <TableRow key={item.key} sx={{ bgcolor: `${stageColors[index % 3]}08` }}>
                                            {itemIndex === 0 && <TableCell rowSpan={group.items.length} sx={{ verticalAlign: "top", fontWeight: 600, width: "25%" }}>{group.title}</TableCell>}
                                            <TableCell>{item.label}{item.note && <Typography variant="caption" display="block" color="text.secondary">{item.note}</Typography>}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{item.amount === null ? "Input required" : money(item.amount)}</TableCell>
                                        </TableRow>)}
                                    </Fragment>)}
                                    <TableRow sx={{ bgcolor: `${primaryColor}12` }}>
                                        <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>{result.isComplete ? "TOTAL ESTIMATED COST" : "PARTIAL ESTIMATED COST"}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.25rem", color: primaryColor, whiteSpace: "nowrap" }}>{money(result.total)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {!result.isComplete && <Alert severity="warning" sx={{ my: 2 }}>Still needed: {allItems.filter((item) => result.missingFields.includes(item.key)).map((item) => item.label).join(", ")}. These amounts are excluded from the total.</Alert>}
                    </Box>
                </CardContent>
                <CardActions sx={{ p: 3, gap: 2, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', '& > :not(style) ~ :not(style)': { ml: 0 }, borderTop: "1px solid #e0e7ff", background: "linear-gradient(to right, #eef2ff, #faf5ff)" }}>
                    <Button type="button" variant="outlined" startIcon={<RestartAlt />} disabled={downloading} sx={{ width: { xs: '100%', sm: 'auto' } }} onClick={() => {
                        revision.current += 1; request.current?.abort(); setCalculating(false);
                        setValues({}); setResult(null); setError(""); setActiveStage(0);
                        formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                    }}>Reset to defaults</Button>
                    <Button type="button" variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }} startIcon={<Download />} disabled={downloading || calculating} onClick={async () => {
                        setDownloading(true); setError("");
                        try { const { downloadCostReport } = await import("../utils/costReport"); await downloadCostReport(result); }
                        catch { setError("Unable to generate the PDF. Please try again."); }
                        finally { setDownloading(false); }
                    }}>{downloading ? "Preparing PDF…" : "Download Detailed Report (PDF)"}</Button>
                </CardActions>
            </Card>}
        </Box>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 3 }}>Planning estimates include blocked funds, deposits and travel cash. Confirm fees before payment. Your changes apply to this estimate only and are cleared when you switch countries or leave the page.</Typography>
    </Box></>;
}

export default function CostEstimationPage() {
    const { selectedCountry } = useCountry();
    const { user } = useAuth();
    return <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, mt: { xs: 5, lg: 0 }, "& .MuiButton-containedPrimary": { bgcolor: primaryColor }, "& .MuiTextField-root .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: primaryColor } }}>
        {selectedCountry?._id
            ? <CountryEstimate key={selectedCountry._id} countryId={selectedCountry._id} countryName={selectedCountry.name} canManage={['admin', 'superAdmin'].includes(user?.role)} />
            : <Alert severity="info">Select a country from the navigation menu to view its cost estimate.</Alert>}
    </Container>;
}
