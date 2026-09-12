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
    const [type, setType] = useState("required_documents");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [version, setVersion] = useState(0);
    const [editor, setEditor] = useState(null);
    const [preview, setPreview] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const process = type === "process_flow";
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
        getDocuments({ country: countryId, type }).then((data) => {
            if (active) setDocuments(data.documents);
        }).catch((err) => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [countryId, type, version]);

    const remove = async () => {
        setDeleteBusy(true);
        setDeleteError("");
        try {
            await deleteDocument(deleting._id);
            setDeleting(null);
            setVersion((value) => value + 1);
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleteBusy(false); }
    };

    return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 3 }}>
            <Box>
                <Typography variant="h4" fontWeight={700}>Documents</Typography>
                <Typography color="text.secondary">Required documents and process stages by country.</Typography>
            </Box>
            {isAdmin && <Button variant="contained" startIcon={<Add />} onClick={() => setEditor({ record: null })} disabled={!countries.length}>
                {process ? "Add stage" : "Add document"}
            </Button>}
        </Stack>
        {countryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{countryError}</Alert>}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Tabs value={type} onChange={(_event, value) => setType(value)} variant="scrollable" allowScrollButtonsMobile aria-label="Document type">
                <Tab label="Required Documents" value="required_documents" />
                <Tab label="Stage / Process Flow" value="process_flow" />
            </Tabs>
            {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress aria-label="Loading documents" /></Box> : error ?
                <Alert severity="error" action={<Button onClick={() => setVersion((value) => value + 1)}>Retry</Button>}>{error}</Alert> :
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
                            {isAdmin && <Box sx={{ p: 1, textAlign: "right" }}><Button size="small" startIcon={<Add />}
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
                            <TableCell><Tooltip title={record.preview ? "Open preview" : "No preview available"}><span><IconButton size="small" disabled={!record.preview} aria-label={`Preview ${record.title}`} onClick={() => setPreview(record)}><VisibilityOutlined fontSize="small" /></IconButton></span></Tooltip></TableCell>
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
        {editor && <DocumentEditor record={editor.record} countries={countries} defaultCountry={countryId} defaultType={type}
            sections={sections.filter((section) => section !== "General")} defaultSection={editor.section || ""}
            onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setVersion((value) => value + 1); }} />}
        {preview && <DocumentPreview key={preview._id} record={preview} onClose={() => setPreview(null)} />}
        <Dialog open={Boolean(deleting)} onClose={deleteBusy ? undefined : () => setDeleting(null)}>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogContent>{deleteError && <Alert severity="error">{deleteError}</Alert>}Delete “{deleting?.title}” and its preview attachment?</DialogContent>
            <DialogActions><Button disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={deleteBusy} onClick={remove}>{deleteBusy ? "Deleting…" : "Delete"}</Button></DialogActions>
        </Dialog>
    </Box>;
}
