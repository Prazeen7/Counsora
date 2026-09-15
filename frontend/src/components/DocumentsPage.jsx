import { useEffect, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Tab, Tabs, TextField, InputAdornment, Tooltip, Typography } from "@mui/material";
import { Add, DeleteOutlineOutlined as DeleteOutline, EditOutlined, ExpandMore, VisibilityOutlined, Search, DescriptionOutlined } from "@mui/icons-material";
import { useCountry } from "../context/CountryContext";
import { getCountries } from "../services/countryService";
import { getDocuments, deleteDocument } from "../services/documentService";
import DocumentEditor from "./admin/DocumentEditor";
import DocumentPreview from "./DocumentPreview";

const sectionStyle = { border: '1px solid', borderColor: 'divider', borderRadius: '6px !important', boxShadow: 'none', overflow: 'hidden', '&:before': { display: 'none' } };

function EmptyDocuments({ search, process }) {
    return <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
        <DescriptionOutlined sx={{ color: 'text.secondary', fontSize: 36, mb: 1 }} />
        <Typography fontWeight={600}>{search.trim() ? 'No matching entries' : `No ${process ? 'process stages' : 'documents'} yet`}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{search.trim() ? 'Try another keyword or clear the search to see all entries.' : 'Entries will appear here when they are added for this country.'}</Typography>
    </Paper>;
}

export default function DocumentsPage({ isAdmin = false }) {
    const { selectedCountry } = useCountry();
    const countryId = selectedCountry?._id || "";
    const [countries, setCountries] = useState([]);
    const [countryError, setCountryError] = useState("");
    const [type, setType] = useState("process_flow");
    const [documents, setDocuments] = useState([]);
    const [stageDocuments, setStageDocuments] = useState([]);
    const [processStages, setProcessStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [version, setVersion] = useState(0);
    const [editor, setEditor] = useState(null);
    const [preview, setPreview] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [search, setSearch] = useState('');
    const process = type === "process_flow";
    const byStage = type === "by_stage";
    const sections = [...new Set(documents.map((record) => record.section?.trim() || "General"))];
    const matches = (record) => [record.title, record.details, record.source, record.timeline, record.section, record.stage].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase());
    const visibleDocuments = documents.filter(matches);
    const visibleSections = sections.filter(section => visibleDocuments.some(record => (record.section?.trim() || 'General') === section));
    const stageGroups = processStages.map(stage => ({ ...stage, items: stageDocuments.filter(document => document.stage?.trim() === stage.title) }));
    const unassigned = stageDocuments.filter(document => !processStages.some(stage => stage.title === document.stage?.trim()));
    if (unassigned.length) stageGroups.push({ _id: 'unassigned', title: 'Other documents', items: unassigned });
    const visibleStageGroups = stageGroups.map(stage => ({ ...stage, items: stage.items.filter(matches) })).filter(stage => !search.trim() || stage.items.length);
    const renderEntry = (record, index) => {
        const previewCount = Array.isArray(record.preview) ? record.preview.length : Number(Boolean(record.preview));
        return <Box component="article" key={record._id} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(180px, 0.8fr) minmax(0, 1.7fr) auto' }, alignItems: 'start', columnGap: 2, rowGap: 0.5, px: 1.5, py: 1, '& + &': { borderTop: '1px solid', borderColor: 'divider' }, '&:hover': { bgcolor: 'action.hover' } }}>
            <Typography component="h3" variant="body2" fontWeight={600} sx={{ pt: 0.5, overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.disabled', mr: 1, fontWeight: 400 }}>{index + 1}.</Box>{record.title}</Typography>
            <Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', md: 'auto' }, gridRow: { xs: 2, md: 'auto' }, fontSize: 13 }}>
                {process && record.timeline && <Typography variant="caption" color="primary" sx={{ display: 'block', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{record.timeline}</Typography>}
                {!process && record.source && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere' }}>Source: {record.source}</Typography>}
                {record.details && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{record.details}</Typography>}
            </Box>
            <Stack direction="row" spacing={0.25} sx={{ gridColumn: { xs: 2, md: 3 }, gridRow: 1 }}>
                {previewCount > 0 && <Tooltip title={`View ${previewCount} attachment${previewCount === 1 ? '' : 's'}`}><IconButton size="small" aria-label={`Preview ${record.title}`} onClick={() => setPreview(record)}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>}
                {isAdmin && <>
                    <Tooltip title="Edit"><IconButton size="small" aria-label={`Edit ${record.title}`} onClick={() => setEditor({ record })}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" aria-label={`Delete ${record.title}`} onClick={() => { setDeleteError(''); setDeleting(record); }}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
                </>}
            </Stack>
        </Box>;
    };

    useEffect(() => {
        if (!isAdmin) return;
        let active = true;
        getCountries().then((data) => {
            if (active) { setCountries(data); setCountryError(""); }
        }).catch((err) => { if (active) setCountryError(err.message); });
        return () => { active = false; };
    }, [isAdmin, version]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        const request = byStage || type === "required_documents"
            ? Promise.all([getDocuments({ country: countryId, type: "required_documents" }), getDocuments({ country: countryId, type: "process_flow" })])
            : getDocuments({ country: countryId, type });
        request.then((data) => {
            if (!active) return;
            if (byStage || type === "required_documents") {
                setStageDocuments(data[0].documents);
                setProcessStages(data[1].documents);
                if (type === "required_documents") setDocuments(data[0].documents);
            }
            else setDocuments(data.documents);
        }).catch((err) => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [countryId, type, version, byStage]);

    const remove = async () => {
        setDeleteBusy(true);
        setDeleteError("");
        try {
            await deleteDocument(deleting._id);
            setDocuments((current) => current.filter((record) => record._id !== deleting._id));
            setDeleting(null);
            setVersion(value => value + 1);
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleteBusy(false); }
    };

    if (!selectedCountry) return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 5 } }}><Alert severity="info">Select a country from the navigation menu to view its required documents and process stages.</Alert></Box>;
    return <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1.5, md: 2 }, pb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
            <Box>
                <Typography variant="h6" component="h1" fontWeight={700}>Documents <Typography component="span" variant="body2" color="text.secondary">· {selectedCountry.name}</Typography></Typography>
            </Box>
            {isAdmin && !byStage && <Button size="small" variant="contained" disableElevation startIcon={<Add />} onClick={() => setEditor({ record: null })} disabled={!countries.length} sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                {process ? "Add stage" : "Add document"}
            </Button>}
        </Stack>
        {countryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{countryError}</Alert>}
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden", mb: 1.5, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between" }}>
            <Tabs value={type} onChange={(_event, value) => { setType(value); setSearch(''); }} variant="scrollable" allowScrollButtonsMobile aria-label="Document type" sx={{ px: 0.5, minHeight: 42, minWidth: 0, '& .MuiTab-root': { textTransform: 'none', minHeight: 42, py: 1 } }}>
                <Tab label="Process overview" value="process_flow" />
                <Tab label="All documents" value="required_documents" />
                <Tab label="Documents by stage" value="by_stage" />
            </Tabs>
            <Box sx={{ p: 0.75 }}>
                <TextField size="small" placeholder="Search documents…" value={search} onChange={event => setSearch(event.target.value)} sx={{ width: { xs: '100%', sm: 280 }, flexShrink: 0 }} slotProps={{ htmlInput: { 'aria-label': 'Search documents and stages' }, input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
            </Box>
        </Paper>
            {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress aria-label="Loading documents" /></Box> : error ?
                <Alert severity="error" action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{error}</Alert> :
                byStage ? <Stack spacing={1}>{visibleStageGroups.length ? visibleStageGroups.map((stage, stageIndex) =>
                    <Accordion key={`${countryId}:${stage._id}:${Boolean(search.trim())}`} defaultExpanded={Boolean(search.trim()) || stageIndex === 0} disableGutters sx={sectionStyle}>
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 1.5, minHeight: 42, '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography component="h2" variant="body2" fontWeight={600}>{stage.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{stage.items.length} {stage.items.length === 1 ? 'document' : 'documents'}</Typography></Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, py: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                            {stage.items.length ? stage.items.map(renderEntry) : <Typography color="text.secondary" sx={{ py: 3 }}>No documents assigned to this stage yet.</Typography>}
                        </AccordionDetails>
                    </Accordion>) : <EmptyDocuments search={search} />}</Stack> :
                !visibleDocuments.length ? <EmptyDocuments search={search} process={process} /> :
                <Stack spacing={1}>{visibleSections.map((section, sectionIndex) => {
                    const sectionDocuments = visibleDocuments.filter(record => (record.section?.trim() || 'General') === section);
                    return <Accordion key={`${countryId}:${type}:${section}:${Boolean(search.trim())}`} defaultExpanded={Boolean(search.trim()) || sectionIndex === 0} disableGutters sx={sectionStyle}>
                        <AccordionSummary expandIcon={<ExpandMore />} id={`document-section-${sectionIndex}-header`} aria-controls={`document-section-${sectionIndex}-content`} sx={{ px: 1.5, minHeight: 42, '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography component="h2" variant="body2" fontWeight={600}>{section}</Typography><Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{sectionDocuments.length} {process ? (sectionDocuments.length === 1 ? 'step' : 'steps') : (sectionDocuments.length === 1 ? 'document' : 'documents')}</Typography></Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, py: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                            {sectionDocuments.map(renderEntry)}
                            {isAdmin && <Box sx={{ px: 1.5, py: 0.5 }}><Button size="small" startIcon={<Add />} onClick={() => setEditor({ record: null, section: section === 'General' ? '' : section })}>{process ? 'Add stage to section' : 'Add document to section'}</Button></Box>}
                        </AccordionDetails>
                    </Accordion>;
                })}</Stack>}
        {editor && <DocumentEditor record={editor.record} countries={countries} stages={processStages} defaultCountry={countryId} defaultType={byStage ? "required_documents" : type}
            sections={sections.filter((section) => section !== "General")} defaultSection={editor.section || ""}
            onClose={() => setEditor(null)} onSaved={(saved) => {
                setDocuments((current) => editor.record
                    ? current.map((record) => record._id === saved._id ? saved : record)
                    : [...current, saved].sort((a, b) => (a.order || 0) - (b.order || 0)));
                setEditor(null); setVersion(value => value + 1);
            }} />}
        {preview && <DocumentPreview key={preview._id} record={preview} onClose={() => setPreview(null)} />}
        <Dialog open={Boolean(deleting)} onClose={deleteBusy ? undefined : () => setDeleting(null)}>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogContent>{deleteError && <Alert severity="error">{deleteError}</Alert>}Delete “{deleting?.title}” and its preview attachment?</DialogContent>
            <DialogActions><Button disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={deleteBusy} onClick={remove}>{deleteBusy ? "Deleting…" : "Delete"}</Button></DialogActions>
        </Dialog>
    </Box>;
}
