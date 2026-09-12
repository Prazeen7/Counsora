import { useState } from "react";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { saveDocument } from "../../services/documentService";

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
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fileError, setFileError] = useState("");
    const process = fields.type === "process_flow";
    const countryOptions = record?.country?._id && !countries.some((country) => country._id === record.country._id)
        ? [...countries, record.country] : countries;
    const change = (field) => (event) => setFields((current) => ({ ...current, [field]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        if (fileError || saving) return;
        setSaving(true);
        setError("");
        try {
            await saveDocument(record?._id, fields, file);
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
                            {file || (record?.preview && !fields.removePreview) ? "Replace file" : "Upload file"}
                            <input hidden type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => {
                                const selected = event.target.files?.[0];
                                event.target.value = "";
                                if (!selected) return;
                                if (selected.size > 5 * 1024 * 1024 || !/\.(jpg|jpeg|png|pdf)$/i.test(selected.name)) {
                                    setFileError("Choose a JPG, JPEG, PNG, or PDF file up to 5 MB.");
                                    return;
                                }
                                setFile(selected);
                                setFileError("");
                                setFields((current) => ({ ...current, removePreview: false }));
                            }} />
                        </Button>
                        {(file || (record?.preview && !fields.removePreview)) && <Button disabled={saving} onClick={() => {
                            setFile(null);
                            setFileError("");
                            setFields((current) => ({ ...current, removePreview: true }));
                        }}>Remove file</Button>}
                        <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
                            {file?.name || (!fields.removePreview && record?.preview?.name) || "Optional: JPG, JPEG, PNG, or PDF, up to 5 MB."}
                        </Typography>
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
