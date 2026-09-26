import Loading from '../Loading';
import ProgramFieldSelect from "./ProgramFieldSelect";
import { useEffect, useState } from "react";
import {
    Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent,
    DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack,
    TextField, Typography,
} from "@mui/material";

function fieldLabel(value) {
    return String(value).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function StructuredField({ label, value, onChange }) {
    if (Array.isArray(value)) {
        return (
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
                <Stack spacing={1.5}>
                    {value.map((entry, index) => (
                        <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <Box sx={{ flex: 1 }}>
                                <StructuredField
                                    label={`${label} ${index + 1}`}
                                    value={entry}
                                    onChange={(next) => onChange(value.map((item, i) => i === index ? next : item))}
                                />
                            </Box>
                            <Button color="error" size="small" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</Button>
                        </Box>
                    ))}
                    {!value.length && <Typography variant="body2" color="text.secondary">None provided</Typography>}
                    <Button size="small" onClick={() => onChange([...value, ""])}>Add item</Button>
                </Stack>
            </Paper>
        );
    }

    if (value && typeof value === "object") {
        return (
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{label}</Typography>
                <Stack spacing={1.5}>
                    {Object.entries(value).map(([key, entry]) => (
                        <StructuredField
                            key={key}
                            label={fieldLabel(key)}
                            value={entry}
                            onChange={(next) => onChange({ ...value, [key]: next })}
                        />
                    ))}
                </Stack>
            </Paper>
        );
    }

    if (typeof value === "boolean") {
        return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox checked={value} onChange={(event) => onChange(event.target.checked)} />
                <Typography>{label}</Typography>
            </Box>
        );
    }

    return (
        <TextField
            label={label}
            value={value ?? ""}
            type={typeof value === "number" ? "number" : "text"}
            onChange={(event) => onChange(typeof value === "number" ? Number(event.target.value) : event.target.value)}
            fullWidth
        />
    );
}

export default function SpreadsheetImportReview({ open, stage, items, countries, busy, loadingMessage, error, progress, onClose, onBack, onContinue }) {
    const [drafts, setDrafts] = useState([]);

    useEffect(() => {
        setDrafts((items || []).map((item) => ({ ...item, approved: item.approved !== false })));
    }, [items, stage]);

    const update = (index, field, value) => {
        setDrafts((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };
    const approved = drafts.filter((item) => item.approved);
    const allApproved = (drafts.length > 0 && approved.length === drafts.length) || (stage === "programs" && drafts.length === 0);

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Review AI-extracted {stage === "institutions" ? "institutions" : "programs"}
                <Typography variant="body2" color="text.secondary">
                    Groq structured these records from the spreadsheet. Review and edit them before approval.
                </Typography>
                {progress?.total > 0 && (
                    <Typography variant="caption" color="primary">
                        Institution {progress.current} of {progress.total}{progress.label ? ` · ${progress.label}` : ""}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    {busy && (
                        <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <Loading />
                            <Typography>{loadingMessage || `Loading ${stage}...`}</Typography>
                            <Typography variant="body2" color="text.secondary">Please wait. Previously reviewed records will not be submitted again.</Typography>
                        </Box>
                    )}
                    {!busy && !drafts.length && <Alert severity="warning">No {stage} were found in the file.</Alert>}
                    {!busy && drafts.map((item, index) => (
                        <Paper variant="outlined" sx={{ p: 2 }} key={item.importKey || `${item.degree_name}-${index}`}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
                                <Checkbox checked={item.approved} onChange={(e) => update(index, "approved", e.target.checked)} />
                                <Typography fontWeight={600}>{stage === "institutions" ? item.name : item.degree_name}</Typography>
                            </Box>
                            {stage === "institutions" ? (
                                <Stack spacing={2}>
                                    <TextField label="Institution name" value={item.name || ""} onChange={(e) => update(index, "name", e.target.value)} fullWidth />
                                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                        <Autocomplete
                                            fullWidth
                                            options={Array.isArray(countries) ? countries : []}
                                            value={(Array.isArray(countries) ? countries : []).find((country) => String(country._id) === String(item.country)) || null}
                                            getOptionLabel={(country) => `${country.name}${country.code ? ` (${country.code})` : ""}`}
                                            isOptionEqualToValue={(option, value) => String(option._id) === String(value._id)}
                                            onChange={(_event, country) => {
                                                setDrafts((current) => current.map((draft, i) => i === index ? {
                                                    ...draft,
                                                    country: country?._id || "",
                                                    countryName: country?.name || "",
                                                    currency: country?.currency || draft.currency,
                                                } : draft));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Country"
                                                    helperText={`${Array.isArray(countries) ? countries.length : 0} countries available`}
                                                />
                                            )}
                                        />
                                        <FormControl fullWidth>
                                            <InputLabel>Type</InputLabel>
                                            <Select value={item.type || "Other"} label="Type" onChange={(e) => update(index, "type", e.target.value)}>
                                                {['Public', 'Private', 'Community', 'Other'].map((type) => <MenuItem value={type} key={type}>{type}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <TextField label="Website" value={item.website || ""} onChange={(e) => update(index, "website", e.target.value)} fullWidth />
                                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                        <TextField label="Email" value={item.email || ""} onChange={(e) => update(index, "email", e.target.value)} fullWidth />
                                        <TextField label="Contact number" value={item.contactNumber || ""} onChange={(e) => update(index, "contactNumber", e.target.value)} fullWidth />
                                    </Box>
                                    <TextField label="Description" value={item.description || ""} onChange={(e) => update(index, "description", e.target.value)} fullWidth multiline minRows={2} />
                                    <StructuredField label="Application fee" value={item.applicationFee || { amount: null, currency: item.currency || "" }} onChange={(value) => update(index, "applicationFee", value)} />
                                    <StructuredField label="Campuses" value={item.campuses || []} onChange={(value) => update(index, "campuses", value)} />
                                    <StructuredField label="Entry requirements" value={item.entryRequirements || { undergraduate: {}, postgraduate: {} }} onChange={(value) => update(index, "entryRequirements", value)} />
                                    <StructuredField label="Required financial documents" value={item.documents || {}} onChange={(value) => update(index, "documents", value)} />
                                    <StructuredField label="Scholarships" value={item.scholarships || []} onChange={(value) => update(index, "scholarships", value)} />
                                    <StructuredField label="Awards" value={item.awards || []} onChange={(value) => update(index, "awards", value)} />
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Checkbox checked={item.isActive !== false} onChange={(e) => update(index, "isActive", e.target.checked)} />
                                        <Typography>Active institution</Typography>
                                    </Box>
                                </Stack>
                            ) : (
                                <Stack spacing={2}>
                                    <TextField label="Degree name" value={item.degree_name || ""} onChange={(e) => update(index, "degree_name", e.target.value)} fullWidth />
                                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                        <TextField label="Level" value={item.level || ""} onChange={(e) => update(index, "level", e.target.value || null)} fullWidth />
                                        <ProgramFieldSelect value={item.field} onChange={(field) => update(index, "field", field)} />
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                        <TextField label="Format" value={item.format || ""} onChange={(e) => update(index, "format", e.target.value || null)} fullWidth />
                                        <TextField label="Duration" value={item.duration || ""} onChange={(e) => update(index, "duration", e.target.value || null)} fullWidth />
                                        <TextField label="Accreditation" value={item.accreditation || ""} onChange={(e) => update(index, "accreditation", e.target.value || null)} fullWidth />
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                        <TextField label="Application fees" value={item.application_fees || ""} onChange={(e) => update(index, "application_fees", e.target.value || null)} fullWidth />
                                        <TextField label="Application deadline" value={item.application_deadline || ""} onChange={(e) => update(index, "application_deadline", e.target.value || null)} fullWidth />
                                    </Box>
                                    <TextField label="Program URL" value={item.url || ""} onChange={(e) => update(index, "url", e.target.value)} fullWidth />
                                    <StructuredField label="Credits" value={item.credits || []} onChange={(value) => update(index, "credits", value)} />
                                    <StructuredField label="Intakes" value={item.intakes || []} onChange={(value) => update(index, "intakes", value)} />
                                    <StructuredField label="Campuses" value={item.campuses || []} onChange={(value) => update(index, "campuses", value)} />
                                    <StructuredField label="Scholarship" value={item.scholarship || { available: false, description: null, url: null }} onChange={(value) => update(index, "scholarship", value)} />
                                    <StructuredField label="Entry requirements" value={item.entry_requirements || {}} onChange={(value) => update(index, "entry_requirements", value)} />
                                    <StructuredField label="Tuition fees" value={item.tuition_fees || []} onChange={(value) => update(index, "tuition_fees", value)} />
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Checkbox checked={item.isActive !== false} onChange={(e) => update(index, "isActive", e.target.checked)} />
                                        <Typography>Active program</Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Paper>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={busy}>Cancel</Button>
                {stage === "programs" && (
                    <Button variant="outlined" onClick={onBack} disabled={busy}>
                        Back to institution review
                    </Button>
                )}
                <Button variant="contained" disabled={busy || Boolean(error) || !allApproved} onClick={() => onContinue(approved.map(({ approved: _approved, ...item }) => item))}>
                    {busy ? "Processing..." : stage === "institutions" ? "Approve all & generate programs" : drafts.length ? "Approve all & import" : "Import institution without programs"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
