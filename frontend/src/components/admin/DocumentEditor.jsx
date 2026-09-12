import { useEffect, useState } from "react";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { getDocumentPreview, saveDocument } from "../../services/documentService";

export default function DocumentEditor({ record, countries, defaultCountry, defaultType, sections = [], defaultSection = "", onClose, onSaved }) {
    const [fields, setFields] = useState({
        country: record?.country?._id || defaultCountry || "",
        type: record?.type || defaultType,
        title: record?.title || "",
        section: record ? record.section || "" : defaultSection,
        source: record?.source || "",
        timeline: record?.timeline || "",
        details: record?.details || "",
        order: record?.order ?? 0,
        removePreview: false,
    });
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fileError, setFileError] = useState("");
    const [selectedPreviewUrls, setSelectedPreviewUrls] = useState([]);
    const [existingPreviewUrls, setExistingPreviewUrls] = useState([]);
    const [removedExistingIndexes, setRemovedExistingIndexes] = useState([]);
    const process = fields.type === "process_flow";
    const existingPreview = Array.isArray(record?.preview) ? record.preview[0] : record?.preview;
    const existingPreviews = Array.isArray(record?.preview) ? record.preview : (record?.preview ? [record.preview] : []);
    useEffect(() => {
        const urls = files.map((file) => file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
        setSelectedPreviewUrls(urls);
        return () => urls.forEach((url) => url && URL.revokeObjectURL(url));
    }, [files]);
    useEffect(() => {
        let active = true;
        const urls = [];
        Promise.all(existingPreviews.map(async (_preview, index) => {
            try {
                const blob = await getDocumentPreview(record._id, index);
                const url = URL.createObjectURL(blob);
                urls[index] = url;
            } catch { urls[index] = ""; }
        })).then(() => { if (active) setExistingPreviewUrls(urls); });
        return () => { active = false; urls.forEach((url) => url && URL.revokeObjectURL(url)); };
    }, [record?._id, existingPreviews.length]);
    const countryOptions = record?.country?._id && !countries.some((country) => country._id === record.country._id)
        ? [...countries, record.country] : countries;
    const change = (field) => (event) => setFields((current) => ({ ...current, [field]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        if (fileError || saving) return;
        setSaving(true);
        setError("");
        try {
            await saveDocument(record?._id, { ...fields, removePreviewIndexes: JSON.stringify(removedExistingIndexes) }, files);
            onSaved();
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
        <Box component="form" onSubmit={submit}>
            <DialogTitle>{record ? "Edit" : "Add"} {process ? "Stage / Process Flow" : "Required Document"}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField select required fullWidth label="Country" value={fields.country} onChange={change("country")} disabled={saving}>
                        {countryOptions.map((country) => <MenuItem key={country._id} value={country._id}>{country.name}</MenuItem>)}
                    </TextField>
                    <TextField select required label="Type" value={fields.type} onChange={change("type")} disabled={saving}>
                        <MenuItem value="required_documents">Required Documents</MenuItem>
                        <MenuItem value="process_flow">Stage / Process Flow</MenuItem>
                    </TextField>
                    <TextField required label={process ? "Stage" : "Document"} value={fields.title} onChange={change("title")} disabled={saving} slotProps={{ htmlInput: { maxLength: 300 } }} />
                    <Autocomplete freeSolo options={sections} inputValue={fields.section} disabled={saving}
                        onInputChange={(_event, value) => setFields((current) => ({ ...current, section: value }))}
                        renderInput={(params) => <TextField {...params} label="Main section" helperText="Choose an existing heading or type a new one. Leave blank for General."
                            slotProps={{ htmlInput: { ...params.inputProps, maxLength: 200 } }} />} />
                    <TextField label={process ? "Timeline" : "Source"} value={process ? fields.timeline : fields.source} onChange={change(process ? "timeline" : "source")} disabled={saving} slotProps={{ htmlInput: { maxLength: 1000 } }} />
                    <TextField label="Details" multiline minRows={4} value={fields.details} onChange={change("details")} disabled={saving} slotProps={{ htmlInput: { maxLength: 20000 } }} />
                    <TextField label="Display order" type="number" value={fields.order} onChange={change("order")} disabled={saving} required slotProps={{ htmlInput: { min: 0, step: 1 } }} helperText="Lower numbers appear first. Use this to arrange stages in sequence." />
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview attachment</Typography>
                        <Button component="label" variant="outlined" disabled={saving}>
                            {files.length || (existingPreview && !fields.removePreview) ? "Choose other files" : "Upload files"}
                            <input hidden multiple type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => {
                                const selected = [...(event.target.files || [])];
                                event.target.value = "";
                                if (!selected.length) return;
                                const combined = [...files, ...selected];
                                if (combined.length > 5 || combined.some((file) => file.size > 5 * 1024 * 1024 || !/\.(jpg|jpeg|png|pdf)$/i.test(file.name))) {
                                    setFileError("Choose up to 5 JPG, JPEG, PNG, or PDF files. Each must be 5 MB or smaller.");
                                    return;
                                }
                                setFiles(combined);
                                setFileError("");
                                setFields((current) => ({ ...current, removePreview: false }));
                            }} />
                        </Button>
                        {(files.length || (existingPreview && !fields.removePreview)) && <Button disabled={saving} onClick={() => {
                            setFiles([]);
                            setFileError("");
                            setFields((current) => ({ ...current, removePreview: true }));
                        }}>Remove file</Button>}
                        <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
                            {files.length ? `${files.length} file(s) selected` : (existingPreview?.name || "Optional: up to 5 JPG, JPEG, PNG, or PDF files.")}
                        </Typography>
                        {files.length > 0 && <Stack spacing={1} sx={{ mt: 1 }}>
                            {files.map((file, index) => <Stack key={`${file.name}-${file.lastModified}-${index}`} direction="row" spacing={1} alignItems="center" sx={{ p: 0.75, border: "1px solid", borderColor: "divider", borderRadius: 1, maxWidth: 420 }}>
                                {selectedPreviewUrls[index] ? <Box component="img" src={selectedPreviewUrls[index]} alt={`Selected preview ${index + 1}`} sx={{ width: 56, height: 44, objectFit: "contain" }} /> : <Typography variant="caption" sx={{ width: 56, textAlign: "center" }}>PDF</Typography>}
                                <Typography variant="body2" sx={{ flex: 1, overflowWrap: "anywhere" }}>{file.name}</Typography>
                                <IconButton size="small" aria-label={`Remove ${file.name}`} disabled={saving} onClick={() => setFiles((current) => current.filter((_item, itemIndex) => itemIndex !== index))}><Close fontSize="small" /></IconButton>
                            </Stack>)}
                        </Stack>}
                        {files.length === 0 && existingPreviews.length > 0 && <Stack spacing={1} sx={{ mt: 1 }}>
                            {existingPreviews.map((preview, index) => removedExistingIndexes.includes(index) ? null : <Stack key={`${preview.name}-${index}`} direction="row" spacing={1} alignItems="center" sx={{ p: 0.75, border: "1px solid", borderColor: "divider", borderRadius: 1, maxWidth: 420 }}>
                                {existingPreviewUrls[index] && preview.mimeType?.startsWith("image/") ? <Box component="img" src={existingPreviewUrls[index]} alt={`Uploaded preview ${index + 1}`} sx={{ width: 56, height: 44, objectFit: "contain" }} /> : <Typography variant="caption" sx={{ width: 56, textAlign: "center" }}>{preview.mimeType === "application/pdf" ? "PDF" : "FILE"}</Typography>}
                                <Typography variant="body2" sx={{ flex: 1, overflowWrap: "anywhere" }}>{preview.name}</Typography>
                                <IconButton size="small" aria-label={`Remove ${preview.name}`} disabled={saving} onClick={() => setRemovedExistingIndexes((current) => [...new Set([...current, index])])}><Close fontSize="small" /></IconButton>
                            </Stack>)}
                        </Stack>}
                        {fileError && <Alert severity="error" onClose={() => setFileError("")} sx={{ mt: 1 }}>{fileError}</Alert>}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saving || Boolean(fileError)}>{saving ? "Saving…" : "Save"}</Button>
            </DialogActions>
        </Box>
    </Dialog>;
}
