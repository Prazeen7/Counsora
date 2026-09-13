import { useEffect, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { Add, DeleteOutlineOutlined as DeleteOutline, EditOutlined, ExpandMore, VisibilityOutlined } from "@mui/icons-material";
import { useCountry } from "../context/CountryContext";
import { getCountries } from "../services/countryService";
import { getDocuments, deleteDocument } from "../services/documentService";
import DocumentEditor from "./admin/DocumentEditor";
import DocumentPreview from "./DocumentPreview";

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
    const process = type === "process_flow";
    const byStage = type === "by_stage";
    const sections = [...new Set(documents.map((record) => record.section?.trim() || "General"))];

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
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleteBusy(false); }
    };

    if (!selectedCountry) return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 5 } }}><Alert severity="info">Select a country from the navigation menu to view its required documents and process stages.</Alert></Box>;
    return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 3 }}>
            <Box>
                <Typography variant="h4" fontWeight={700}>Documents</Typography>
                <Typography color="text.secondary">Required documents and process stages by country.</Typography>
            </Box>
            {isAdmin && !byStage && <Button size="small" variant="outlined" startIcon={<Add sx={{ fontSize: 15 }} />} onClick={() => setEditor({ record: null })} disabled={!countries.length} sx={{ minWidth: 0, height: 30, px: 1, py: 0, borderRadius: 1.25, fontSize: "0.75rem", lineHeight: 1, whiteSpace: "nowrap", "& .MuiButton-startIcon": { mr: 0.5 } }}>
                {process ? "Add stage" : "Add document"}
            </Button>}
        </Stack>
        {countryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{countryError}</Alert>}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Tabs value={type} onChange={(_event, value) => setType(value)} variant="scrollable" allowScrollButtonsMobile aria-label="Document type">
                <Tab label="Stage / Process Flow" value="process_flow" />
                <Tab label="Required Documents" value="required_documents" />
                <Tab label="Required Documents by Stage" value="by_stage" />
            </Tabs>
            {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress aria-label="Loading documents" /></Box> : error ?
                <Alert severity="error" action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{error}</Alert> :
                byStage ? <Box sx={{ p: { xs: 1, md: 2 } }}>{(processStages.length ? processStages : [{ _id: "unassigned", title: "Process stages have not been added yet" }]).map((stage, stageIndex) => {
                    const items = stageDocuments.filter((document) => document.stage?.trim() === stage.title);
                    return <Accordion key={stage._id} defaultExpanded={stageIndex === 0} disableGutters sx={{ mb: 1.5, border: "1px solid", borderColor: "divider", borderRadius: "12px !important", boxShadow: "none", "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMore />}><Stack direction="row" spacing={1.5} alignItems="center"><Typography fontWeight={600}>{stageIndex + 1}. {stage.title}</Typography><Chip size="small" label={items.length} /></Stack></AccordionSummary>
                        <AccordionDetails sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>{items.length ? items.map((item) => <Box key={item._id} sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}><Typography fontWeight={600}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.details || item.source || "No additional details"}</Typography></Box>) : <Typography color="text.secondary">No required documents assigned to this stage yet.</Typography>}</AccordionDetails>
                    </Accordion>;
                })}</Box> :
                !documents.length ? <Box sx={{ p: 5, textAlign: "center" }}>
                    <Typography color="text.secondary">No {process ? "process stages" : "required documents"} have been added{selectedCountry ? ` for ${selectedCountry.name}` : ""} yet.</Typography>
                    {isAdmin && <Typography variant="body2" sx={{ mt: 1 }}>Add an entry and choose its country to get started.</Typography>}
                </Box> : <Box sx={{ p: { xs: 1, md: 2 } }}>{sections.map((section, sectionIndex) => {
                    const sectionDocuments = documents.filter((record) => (record.section?.trim() || "General") === section);
                    return <Accordion key={`${countryId}:${type}:${section}`} defaultExpanded={sectionIndex === 0} disableGutters
                        sx={{ mb: 1.5, border: "1px solid", borderColor: "divider", borderRadius: "12px !important", boxShadow: "none", "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMore />} id={`document-section-${sectionIndex}-header`} aria-controls={`document-section-${sectionIndex}-content`}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Typography fontWeight={600}>{sectionIndex + 1}. {section}</Typography>
                                <Chip size="small" label={sectionDocuments.length} aria-label={`${sectionDocuments.length} entries`} />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, borderTop: "1px solid", borderColor: "divider" }}>
                            {isAdmin && <Box sx={{ p: 1, textAlign: "right" }}><Button size="small" variant="outlined" startIcon={<Add sx={{ fontSize: 14 }} />} sx={{ minHeight: 26, px: 1, py: 0.15, borderRadius: 1, fontSize: "0.72rem" }}
                                onClick={() => setEditor({ record: null, section: section === "General" ? "" : section })}>
                                {process ? "Add stage" : "Add document"}
                            </Button></Box>}
                            <TableContainer>
                    <Table sx={{ minWidth: 620, "& td": { verticalAlign: "top" } }}>
                        <TableHead><TableRow>
                            <TableCell width="48">#</TableCell><TableCell>{process ? "Stage" : "Document"}</TableCell><TableCell>Information</TableCell><TableCell width="100">Preview</TableCell>
                            {isAdmin && <TableCell align="right">Actions</TableCell>}
                        </TableRow></TableHead>
                        <TableBody>{sectionDocuments.map((record, index) => <TableRow key={record._id} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 170, maxWidth: 280, overflowWrap: "anywhere" }}>{record.title}</TableCell>
                            <TableCell sx={{ minWidth: 220, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                <Stack spacing={0.75}>
                                    {process && record.timeline && <Chip size="small" label={record.timeline} sx={{ alignSelf: "flex-start" }} />}
                                    {!process && record.source && <Typography variant="body2" color="primary" fontWeight={600}>{record.source}</Typography>}
                                    <Typography variant="body2" color="text.secondary">{record.details || "No additional details"}</Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>{(() => { const hasPreview = Array.isArray(record.preview) ? record.preview.length > 0 : Boolean(record.preview); return <Tooltip title={hasPreview ? "Open preview" : "No preview available"}><span><IconButton size="small" disabled={!hasPreview} aria-label={`Preview ${record.title}`} onClick={() => setPreview(record)}><VisibilityOutlined fontSize="small" /></IconButton></span></Tooltip>; })()}</TableCell>
                            {isAdmin && <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                <Tooltip title="Edit"><IconButton size="small" aria-label={`Edit ${record.title}`} onClick={() => setEditor({ record })}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton size="small" aria-label={`Delete ${record.title}`} onClick={() => { setDeleteError(""); setDeleting(record); }}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
                            </TableCell>}
                        </TableRow>)}</TableBody>
                    </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>;
                })}</Box>}
        </Paper>
        {editor && <DocumentEditor record={editor.record} countries={countries} stages={processStages} defaultCountry={countryId} defaultType={type}
            sections={sections.filter((section) => section !== "General")} defaultSection={editor.section || ""}
            onClose={() => setEditor(null)} onSaved={(saved) => {
                setDocuments((current) => editor.record
                    ? current.map((record) => record._id === saved._id ? saved : record)
                    : [...current, saved].sort((a, b) => (a.order || 0) - (b.order || 0)));
                setEditor(null);
            }} />}
        {preview && <DocumentPreview key={preview._id} record={preview} onClose={() => setPreview(null)} />}
        <Dialog open={Boolean(deleting)} onClose={deleteBusy ? undefined : () => setDeleting(null)}>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogContent>{deleteError && <Alert severity="error">{deleteError}</Alert>}Delete “{deleting?.title}” and its preview attachment?</DialogContent>
            <DialogActions><Button disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={deleteBusy} onClick={remove}>{deleteBusy ? "Deleting…" : "Delete"}</Button></DialogActions>
        </Dialog>
    </Box>;
}
