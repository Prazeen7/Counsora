import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Avatar,
    Tabs,
    Tab,
    Button,
    IconButton,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    CircularProgress,
    TextField,
    Paper,
    Card,
    CardContent,
    Grid,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Alert,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import Loading from "../../components/Loading";
import InstitutionTabsContent from "../../components/counselor/InstitutionTabsContent";
import { getInstitutionById } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";
import { getDisplayCampuses } from "../../utils/DisplayCampuses";
import LanguageRequirementFields from "../../components/admin/LanguageRequirementFields";

const INSTITUTION_TYPE_OPTIONS = ["Public", "Private", "Community", "Other"];

const LEVEL_OPTIONS = [
    "Foundation",
    "Diploma",
    "Bachelor",
    "Master",
    "PhD",
    "Doctoral",
    "Research",
];

const FIELD_OPTIONS = [
    "Allied Health",
    "Management, Business and Accounting",
    "Creative, Performing and Visual Arts",
    "Creative Media, Communication and Arts",
    "Education, Teaching and Childcare",
    "Engineering, Built Environment and Aviation",
    "English and Study Pathways",
    "Information Systems and Technology",
    "Law, Criminology and Justice",
    "Nursing, Paramedicine and Health",
    "Psychology, Social Work and Community Services",
    "Safety Sciences",
    "Science, Environment and Agriculture",
    "Service Industries",
    "Trades",
    "Other",
];

const MIN_QUALIFICATION_OPTIONS = [
    "Higher Secondary",
    "Diploma",
    "Bachelor",
    "Master",
    "Doctoral",
];

const SCORE_TYPE_OPTIONS = [
    "GPA",
    "Percentage",
];

const CEFR_OPTIONS = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
];

const PROGRAM_FORMAT_OPTIONS = [
    "Full-time",
    "Part-time",
    "Full-time / Part-time",
    "Online",
    "Hybrid",
    "Distance Learning",
    "Other",
];

const DEFAULT_MENU_PROPS = {
    disableAutoFocusItem: true,
    autoFocus: false,
    getContentAnchorEl: null,
    anchorOrigin: {
        vertical: "bottom",
        horizontal: "left",
    },
    transformOrigin: {
        vertical: "top",
        horizontal: "left",
    },
    PaperProps: {
        style: {
            maxHeight: 220,
            overflowY: "auto",
        },
        sx: {
            maxHeight: "220px !important",
            overflowY: "auto !important",
            mt: 0.5,
            boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
            "& .MuiMenuItem-root": {
                py: 0.75,
                fontSize: "0.875rem",
            },
        },
    },
    MenuListProps: {
        style: {
            maxHeight: 220,
            overflowY: "auto",
            paddingTop: 4,
            paddingBottom: 4,
        },
        sx: {
            maxHeight: "220px !important",
            overflowY: "auto !important",
        },
    },
};

// --- Dialog Components with Isolated Local State ---

function ScholarshipDialog({ open, onClose, scholarship, onSave }) {
    const [formData, setFormData] = useState({ name: "", value: "", description: "", url: "" });

    useEffect(() => {
        if (open) {
            if (scholarship) {
                setFormData({
                    name: scholarship.name || "",
                    value: scholarship.value || scholarship.amount || "",
                    description: scholarship.description || "",
                    url: scholarship.url || "",
                    _id: scholarship._id,
                    _clientId: scholarship._clientId,
                });
            } else {
                setFormData({ name: "", value: "", description: "", url: "" });
            }
        }
    }, [scholarship, open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {formData._id || formData._clientId ? "Edit Scholarship" : "Add Scholarship"}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Scholarship Name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Scholarship Value"
                            value={formData.value}
                            onChange={(e) => handleChange("value", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="url"
                            label="Scholarship URL"
                            value={formData.url}
                            onChange={(e) => handleChange("url", e.target.value)}
                            placeholder="https://www.example.edu/scholarships/..."
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: "#4f46e5" }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function LocationDialog({ open, onClose, location, institution, onSave }) {
    const [formData, setFormData] = useState({
        name: "",
        city: "",
        country: "",
        address: "",
        contactNumber: "",
        email: "",
        mapEmbedUrl: "",
        useInstitutionContact: false,
        useInstitutionEmail: false,
    });

    useEffect(() => {
        if (open) {
            if (location) {
                setFormData({
                    name: location.name || "",
                    city: location.city || "",
                    country: location.country || "",
                    address: location.address || "",
                    contactNumber: location.contactNumber || "",
                    email: location.email || "",
                    mapEmbedUrl: location.mapEmbedUrl || "",
                    useInstitutionContact: location.useInstitutionContact || false,
                    useInstitutionEmail: location.useInstitutionEmail || false,
                    _id: location._id,
                    _clientId: location._clientId,
                });
            } else {
                setFormData({
                    name: "",
                    city: "",
                    country: "",
                    address: "",
                    contactNumber: "",
                    email: "",
                    mapEmbedUrl: "",
                    useInstitutionContact: false,
                    useInstitutionEmail: false,
                });
            }
        }
    }, [location, open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{formData._id || formData._clientId ? "Edit Campus" : "Add Campus"}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Campus Name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="City"
                            value={formData.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            value={formData.country}
                            onChange={(e) => handleChange("country", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Address"
                            value={formData.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <TextField
                                fullWidth
                                label="Contact Number"
                                value={formData.contactNumber}
                                onChange={(e) => handleChange("contactNumber", e.target.value)}
                                placeholder="e.g., +49 30 1234567"
                                disabled={formData.useInstitutionContact}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.useInstitutionContact || false}
                                        onChange={(e) => {
                                            const useInst = e.target.checked;
                                            setFormData((prev) => ({
                                                ...prev,
                                                useInstitutionContact: useInst,
                                                contactNumber: useInst
                                                    ? institution?.contactNumber || ""
                                                    : prev.contactNumber,
                                            }));
                                        }}
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary">
                                        Use institution contact:{" "}
                                        <strong>{institution?.contactNumber || "N/A"}</strong>
                                    </Typography>
                                }
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="e.g., campus@university.edu"
                                disabled={formData.useInstitutionEmail}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.useInstitutionEmail || false}
                                        onChange={(e) => {
                                            const useInst = e.target.checked;
                                            setFormData((prev) => ({
                                                ...prev,
                                                useInstitutionEmail: useInst,
                                                email: useInst
                                                    ? institution?.email || ""
                                                    : prev.email,
                                            }));
                                        }}
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary">
                                        Use institution email:{" "}
                                        <strong>{institution?.email || "N/A"}</strong>
                                    </Typography>
                                }
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Google Maps Embed URL"
                            value={formData.mapEmbedUrl}
                            onChange={(e) => handleChange("mapEmbedUrl", e.target.value)}
                            placeholder="e.g., https://www.google.com/maps/embed?pb=..."
                            helperText="Paste the embed URL from Google Maps (Share > Embed a map > Copy HTML > extract the src URL)"
                            multiline
                            rows={2}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: "#4f46e5" }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function LanguageScoreInputGroup({ title, lang, test, data, onChange }) {
    const scores = data?.[lang]?.[test] || {};
    return (
        <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: "#f8fafc" }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, color: "text.primary" }}>
                    {title}
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Overall Score"
                            value={scores.overall ?? ""}
                            onChange={(e) => onChange(lang, test, "overall", e.target.value)}
                            placeholder="e.g. 6.5"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Listening"
                            value={scores.listening ?? ""}
                            onChange={(e) => onChange(lang, test, "listening", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Reading"
                            value={scores.reading ?? ""}
                            onChange={(e) => onChange(lang, test, "reading", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Writing"
                            value={scores.writing ?? ""}
                            onChange={(e) => onChange(lang, test, "writing", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Speaking"
                            value={scores.speaking ?? ""}
                            onChange={(e) => onChange(lang, test, "speaking", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    );
}

function ProgramDialog({ open, onClose, program, onSave, saving }) {
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (open) {
            const base = program
                ? { ...program }
                : {
                    degree_name: "",
                    level: "",
                    field: "",
                    credits: [],
                    format: "",
                    scholarship: { available: false, description: "", url: "" },
                    intakes: [],
                    campuses: [],
                    duration: "",
                    accreditation: "",
                    entry_requirements: {
                        academic: {
                            minimum_qualification: "",
                            field_requirement: "",
                            score_type: "",
                            score: "",
                            scale: "",
                        },
                        language_requirements: {
                            english: {
                                ielts: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                                toefl: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                                pte: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                                duolingo: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                                cambridge: "",
                                cefr: "",
                            },
                            german: {
                                cefr: "",
                                testdaf: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                                dsh: { overall: "", listening: "", reading: "", writing: "", speaking: "" },
                            },
                            other_languages: [],
                        },
                        additional_requirements: [],
                    },
                    tuition_fees: [],
                    application_fees: "",
                    application_deadline: "",
                    url: "",
                    isActive: true,
                };

            setFormData({
                ...base,
                isActive: base.isActive !== false,
                field_other: base.field_other || (base.field && !FIELD_OPTIONS.includes(base.field) ? base.field : ""),
                field_requirement_other:
                    base.entry_requirements?.academic?.field_requirement &&
                    !FIELD_OPTIONS.includes(base.entry_requirements.academic.field_requirement)
                        ? base.entry_requirements.academic.field_requirement
                        : "",
                field: base.field && FIELD_OPTIONS.includes(base.field) ? base.field : (base.field ? "Other" : ""),
                level: base.level && LEVEL_OPTIONS.includes(base.level) ? base.level : (base.level || ""),
                credits_raw: Array.isArray(base.credits)
                    ? base.credits.join(", ")
                    : base.credits || "",
                intakes_raw: Array.isArray(base.intakes)
                    ? base.intakes.join(", ")
                    : base.intakes || "",
                campuses_raw: Array.isArray(base.campuses)
                    ? base.campuses.join(", ")
                    : base.campuses || "",
                tuition_fees_raw: Array.isArray(base.tuition_fees)
                    ? base.tuition_fees
                        .map((fee) => `${fee?.credits || ""}: ${fee?.annual_fee_eur ?? ""}`)
                        .join("\n")
                    : typeof base.tuition_fees === "string"
                        ? base.tuition_fees
                        : "",
                additional_requirements_raw: Array.isArray(
                    base.entry_requirements?.additional_requirements
                )
                    ? base.entry_requirements.additional_requirements.join("\n")
                    : typeof base.entry_requirements?.additional_requirements === "string"
                        ? base.entry_requirements.additional_requirements
                        : "",
            });
        } else {
            setFormData(null);
        }
    }, [program, open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLanguageScoreChange = (lang, test, scoreField, val) => {
        setFormData((prev) => {
            const prevEr = prev.entry_requirements || {};
            const prevLr = prevEr.language_requirements || {};
            const prevLangObj = prevLr[lang] || {};
            const prevTestObj = prevLangObj[test] || {};

            return {
                ...prev,
                entry_requirements: {
                    ...prevEr,
                    language_requirements: {
                        ...prevLr,
                        [lang]: {
                            ...prevLangObj,
                            [test]: {
                                ...prevTestObj,
                                [scoreField]: val,
                            },
                        },
                    },
                },
            };
        });
    };

    const handleSave = () => {
        if (!formData) return;

        const parseScoreNumber = (val) => {
            if (val === null || val === undefined || val === "") return null;
            const n = Number(val);
            return Number.isNaN(n) ? null : n;
        };

        const mapLanguageScoreObject = (obj) => {
            if (!obj || typeof obj !== "object") return {};
            return {
                overall: parseScoreNumber(obj.overall),
                listening: parseScoreNumber(obj.listening),
                reading: parseScoreNumber(obj.reading),
                writing: parseScoreNumber(obj.writing),
                speaking: parseScoreNumber(obj.speaking),
            };
        };

        const payload = {
            ...formData,
            level: formData.level && LEVEL_OPTIONS.includes(formData.level) ? formData.level : null,
            field: formData.field === "Other"
                ? (formData.field_other?.trim() || "Other")
                : (formData.field || null),
            field_other: null,
            credits:
                typeof formData.credits_raw === "string"
                    ? formData.credits_raw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : formData.credits || [],
            intakes:
                typeof formData.intakes_raw === "string"
                    ? formData.intakes_raw
                        .split(",")
                        .map((i) => i.trim())
                        .filter(Boolean)
                    : formData.intakes || [],
            campuses:
                typeof formData.campuses_raw === "string"
                    ? formData.campuses_raw
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean)
                    : formData.campuses || [],
            tuition_fees:
                typeof formData.tuition_fees_raw === "string"
                    ? formData.tuition_fees_raw
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => {
                            const [credits, fee] = line.split(":");
                            const parsedFee = Number(fee?.trim());
                            return {
                                credits: credits?.trim() || null,
                                annual_fee_eur:
                                    fee?.trim() && !Number.isNaN(parsedFee)
                                        ? parsedFee
                                        : null,
                            };
                        })
                    : formData.tuition_fees || [],
            entry_requirements: {
                ...formData.entry_requirements,
                academic: {
                    ...formData.entry_requirements?.academic,
                    minimum_qualification:
                        formData.entry_requirements?.academic?.minimum_qualification || null,
                    score_type:
                        formData.entry_requirements?.academic?.score_type || null,
                    score: parseScoreNumber(formData.entry_requirements?.academic?.score),
                    scale: parseScoreNumber(formData.entry_requirements?.academic?.scale),
                    field_requirement:
                        formData.entry_requirements?.academic?.field_requirement === "Other"
                            ? (formData.field_requirement_other || "Other")
                            : FIELD_OPTIONS.includes(formData.entry_requirements?.academic?.field_requirement)
                            ? formData.entry_requirements.academic.field_requirement
                            : (formData.entry_requirements?.academic?.field_requirement ? "Other" : null),
                },
                language_requirements: {
                    ...formData.entry_requirements?.language_requirements,
                    english: {
                        ...formData.entry_requirements?.language_requirements?.english,
                        ielts: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.english?.ielts
                        ),
                        toefl: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.english?.toefl
                        ),
                        pte: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.english?.pte
                        ),
                        duolingo: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.english?.duolingo
                        ),
                    },
                    german: {
                        ...formData.entry_requirements?.language_requirements?.german,
                        cefr:
                            formData.entry_requirements?.language_requirements?.german?.cefr ||
                            null,
                        testdaf: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.german?.testdaf
                        ),
                        dsh: mapLanguageScoreObject(
                            formData.entry_requirements?.language_requirements?.german?.dsh
                        ),
                    },
                },
                additional_requirements:
                    typeof formData.additional_requirements_raw === "string"
                        ? formData.additional_requirements_raw
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                        : formData.entry_requirements?.additional_requirements || [],
            },
        };

        delete payload.credits_raw;
        delete payload.intakes_raw;
        delete payload.campuses_raw;
        delete payload.tuition_fees_raw;
        delete payload.additional_requirements_raw;
        delete payload.name;
        delete payload.tuitionFee;

        onSave(payload);
    };

    if (!open || !formData) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {formData._id && !formData._id.startsWith("temp_")
                    ? "Edit Program"
                    : "Add Program"}
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        mt: 1,
                        width: "100%",
                    }}
                >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Fill in all program details. For arrays, use comma‑separated values or one per line as indicated.
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Basic Info */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Program Name / Degree Name"
                                value={formData.degree_name || ""}
                                onChange={(e) => handleChange("degree_name", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="program-level-label">Level</InputLabel>
                                <Select
                                    labelId="program-level-label"
                                    id="program-level-select"
                                    value={formData.level || ""}
                                    label="Level"
                                    onChange={(e) => handleChange("level", e.target.value)}
                                    MenuProps={DEFAULT_MENU_PROPS}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {LEVEL_OPTIONS.map((lvl) => (
                                        <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="program-field-label">Field of Study</InputLabel>
                                <Select
                                    labelId="program-field-label"
                                    id="program-field-select"
                                    value={formData.field || ""}
                                    label="Field of Study"
                                    onChange={(e) => handleChange("field", e.target.value)}
                                    MenuProps={DEFAULT_MENU_PROPS}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {FIELD_OPTIONS.map((fld) => (
                                        <MenuItem key={fld} value={fld}>{fld}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.field === "Other" && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Specify Other Field"
                                    value={formData.field_other || ""}
                                    onChange={(e) => handleChange("field_other", e.target.value)}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Duration (years)"
                                value={formData.duration || ""}
                                onChange={(e) => handleChange("duration", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Credits (comma-separated)"
                                value={formData.credits_raw ?? ""}
                                onChange={(e) => handleChange("credits_raw", e.target.value)}
                                placeholder="e.g., 120 ECTS, 60 ECTS"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel id="program-format-label">Format</InputLabel>
                                <Select
                                    labelId="program-format-label"
                                    id="program-format-select"
                                    value={formData.format || ""}
                                    label="Format"
                                    onChange={(e) => handleChange("format", e.target.value)}
                                    MenuProps={DEFAULT_MENU_PROPS}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {PROGRAM_FORMAT_OPTIONS.map((fmt) => (
                                        <MenuItem key={fmt} value={fmt}>{fmt}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Scholarship */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.scholarship?.available || false}
                                        onChange={(e) =>
                                            handleChange("scholarship", {
                                                ...formData.scholarship,
                                                available: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Scholarship Available"
                            />
                            {formData.scholarship?.available && (
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Scholarship Description"
                                            value={formData.scholarship?.description || ""}
                                            onChange={(e) =>
                                                handleChange("scholarship", {
                                                    ...formData.scholarship,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Scholarship URL"
                                            value={formData.scholarship?.url || ""}
                                            onChange={(e) =>
                                                handleChange("scholarship", {
                                                    ...formData.scholarship,
                                                    url: e.target.value,
                                                })
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>

                        {/* Intakes, Campuses, URL */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Intakes (comma-separated)"
                                value={formData.intakes_raw ?? ""}
                                onChange={(e) => handleChange("intakes_raw", e.target.value)}
                                placeholder="e.g., October, January"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Campuses (comma-separated)"
                                value={formData.campuses_raw ?? ""}
                                onChange={(e) => handleChange("campuses_raw", e.target.value)}
                                placeholder="e.g., Bad Homburg, Berlin"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Program URL"
                                value={formData.url || ""}
                                onChange={(e) => handleChange("url", e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isActive !== false}
                                        onChange={(e) => handleChange("isActive", e.target.checked)}
                                    />
                                }
                                label="Program is active"
                            />
                        </Grid>

                        {/* Tuition Fees */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Tuition Fees (one per line: credits: amount)"
                                value={formData.tuition_fees_raw ?? ""}
                                onChange={(e) => handleChange("tuition_fees_raw", e.target.value)}
                                placeholder="e.g. 120 ECTS: 23520"
                            />
                        </Grid>

                        {/* Application Fees & Deadline, Accreditation */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Application Fees"
                                value={formData.application_fees || ""}
                                onChange={(e) => handleChange("application_fees", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Application Deadline"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.application_deadline || ""}
                                onChange={(e) => handleChange("application_deadline", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Accreditation"
                                value={formData.accreditation || ""}
                                onChange={(e) => handleChange("accreditation", e.target.value)}
                            />
                        </Grid>

                        {/* Entry Requirements - Academic */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ color: "primary.main", mt: 1 }}>
                                Academic Requirements
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="program-min-qual-label">Minimum Qualification</InputLabel>
                                        <Select
                                            labelId="program-min-qual-label"
                                            id="program-min-qual-select"
                                            value={
                                                formData.entry_requirements?.academic
                                                    ?.minimum_qualification || ""
                                            }
                                            label="Minimum Qualification"
                                            onChange={(e) =>
                                                handleChange("entry_requirements", {
                                                    ...formData.entry_requirements,
                                                    academic: {
                                                        ...formData.entry_requirements?.academic,
                                                        minimum_qualification: e.target.value || null,
                                                    },
                                                })
                                            }
                                            MenuProps={DEFAULT_MENU_PROPS}
                                        >
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {MIN_QUALIFICATION_OPTIONS.map((q) => (
                                                <MenuItem key={q} value={q}>{q}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="academic-field-requirement-label">Field Requirement</InputLabel>
                                        <Select
                                        labelId="academic-field-requirement-label"
                                        label="Field Requirement"
                                        value={
                                            FIELD_OPTIONS.includes(formData.entry_requirements?.academic?.field_requirement)
                                                ? formData.entry_requirements.academic.field_requirement
                                                : (formData.entry_requirements?.academic?.field_requirement ? "Other" : "")
                                        }
                                        onChange={(e) =>
                                            handleChange("entry_requirements", {
                                                ...formData.entry_requirements,
                                                academic: {
                                                    ...formData.entry_requirements?.academic,
                                                    field_requirement: e.target.value,
                                                },
                                            })
                                        }
                                        >
                                            <MenuItem value=""><em>Not specified</em></MenuItem>
                                            {FIELD_OPTIONS.map((fieldOption) => (
                                                <MenuItem key={fieldOption} value={fieldOption}>
                                                    {fieldOption}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {formData.entry_requirements?.academic?.field_requirement === "Other" && (
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Specify Other Field Requirement"
                                            value={formData.field_requirement_other || ""}
                                            onChange={(e) => handleChange("field_requirement_other", e.target.value)}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="program-score-type-label">Score Type</InputLabel>
                                        <Select
                                            labelId="program-score-type-label"
                                            id="program-score-type-select"
                                            value={
                                                formData.entry_requirements?.academic?.score_type || ""
                                            }
                                            label="Score Type"
                                            onChange={(e) =>
                                                handleChange("entry_requirements", {
                                                    ...formData.entry_requirements,
                                                    academic: {
                                                        ...formData.entry_requirements?.academic,
                                                        score_type: e.target.value || null,
                                                    },
                                                })
                                            }
                                            MenuProps={DEFAULT_MENU_PROPS}
                                        >
                                            <MenuItem value=""><em>None (Null)</em></MenuItem>
                                            {SCORE_TYPE_OPTIONS.map((st) => (
                                                <MenuItem key={st} value={st}>{st}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Score"
                                        value={formData.entry_requirements?.academic?.score ?? ""}
                                        onChange={(e) =>
                                            handleChange("entry_requirements", {
                                                ...formData.entry_requirements,
                                                academic: {
                                                    ...formData.entry_requirements?.academic,
                                                    score: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Scale (e.g., 4.0, 100)"
                                        value={formData.entry_requirements?.academic?.scale ?? ""}
                                        onChange={(e) =>
                                            handleChange("entry_requirements", {
                                                ...formData.entry_requirements,
                                                academic: {
                                                    ...formData.entry_requirements?.academic,
                                                    scale: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Entry Requirements - Language */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ color: "primary.main", mt: 1 }}>
                                Language Requirements & Individual Band Scores
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel id="program-german-cefr-label">German CEFR Level</InputLabel>
                                        <Select
                                            labelId="program-german-cefr-label"
                                            id="program-german-cefr-select"
                                            value={
                                                formData.entry_requirements?.language_requirements
                                                    ?.german?.cefr || ""
                                            }
                                            label="German CEFR Level"
                                            onChange={(e) =>
                                                handleChange("entry_requirements", {
                                                    ...formData.entry_requirements,
                                                    language_requirements: {
                                                        ...formData.entry_requirements
                                                            ?.language_requirements,
                                                        german: {
                                                            ...formData.entry_requirements
                                                                ?.language_requirements?.german,
                                                            cefr: e.target.value || null,
                                                        },
                                                    },
                                                })
                                            }
                                            MenuProps={DEFAULT_MENU_PROPS}
                                        >
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {CEFR_OPTIONS.map((lvl) => (
                                                <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* English Language Tests with Individual Band Scores */}
                                <LanguageScoreInputGroup
                                    title="IELTS (Overall & Band Scores)"
                                    lang="english"
                                    test="ielts"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />

                                <LanguageScoreInputGroup
                                    title="TOEFL (Overall & Section Scores)"
                                    lang="english"
                                    test="toefl"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />

                                <LanguageScoreInputGroup
                                    title="PTE (Overall & Section Scores)"
                                    lang="english"
                                    test="pte"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />

                                <LanguageScoreInputGroup
                                    title="Duolingo (Overall & Sub-scores)"
                                    lang="english"
                                    test="duolingo"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />

                                {/* German Language Tests with Sub-scores */}
                                <LanguageScoreInputGroup
                                    title="German TestDaF (Overall & TDN Sub-scores)"
                                    lang="german"
                                    test="testdaf"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />

                                <LanguageScoreInputGroup
                                    title="German DSH (Overall & Sub-scores)"
                                    lang="german"
                                    test="dsh"
                                    data={formData.entry_requirements?.language_requirements}
                                    onChange={handleLanguageScoreChange}
                                />
                            </Grid>
                        </Grid>

                        {/* Additional requirements */}
                        <Grid
                            item
                            xs={12}
                            sx={{
                                width: "100%",
                            }}
                        >
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                label="Additional Requirements (one per line)"
                                value={formData.additional_requirements_raw ?? ""}
                                onChange={(e) =>
                                    handleChange(
                                        "additional_requirements_raw",
                                        e.target.value
                                    )
                                }
                                placeholder="e.g., Motivation letter&#10;CV&#10;Proof of work experience"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{ backgroundColor: "#4f46e5" }}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// --- Memoized Edit Tab Views ---

const OverviewEditTab = React.memo(({ editedInstitution, onChange, onAwardsChange }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                Edit Institution Overview
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                    label="Institution Name"
                    fullWidth
                    value={editedInstitution?.name || ""}
                    onChange={(e) => onChange("name", e.target.value)}
                />

                <FormControl fullWidth>
                    <InputLabel id="institution-type-label">Institution Type</InputLabel>
                    <Select
                        labelId="institution-type-label"
                        id="institution-type-select"
                        value={editedInstitution?.type || ""}
                        label="Institution Type"
                        onChange={(e) => onChange("type", e.target.value)}
                        MenuProps={DEFAULT_MENU_PROPS}
                    >
                        <MenuItem value=""><em>Select Type</em></MenuItem>
                        {INSTITUTION_TYPE_OPTIONS.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Website"
                    fullWidth
                    value={editedInstitution?.website || ""}
                    onChange={(e) => onChange("website", e.target.value)}
                />

                <TextField
                    label="Email"
                    fullWidth
                    value={editedInstitution?.email || ""}
                    onChange={(e) => onChange("email", e.target.value)}
                />

                <TextField
                    label="Contact Number"
                    fullWidth
                    value={editedInstitution?.contactNumber || ""}
                    onChange={(e) => onChange("contactNumber", e.target.value)}
                />

                <TextField
                    label="Application Fee (Amount)"
                    fullWidth
                    type="number"
                    value={
                        typeof editedInstitution?.applicationFee === "object"
                            ? editedInstitution.applicationFee?.amount ?? ""
                            : editedInstitution?.applicationFee ?? ""
                    }
                    onChange={(e) => onChange("applicationFee", {
                        ...(typeof editedInstitution?.applicationFee === "object" ? editedInstitution.applicationFee : {}),
                        amount: e.target.value,
                    })}
                />

                <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={6}
                    value={editedInstitution?.description || ""}
                    onChange={(e) => onChange("description", e.target.value)}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold">
                    Awards & Recognition
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        const newAward = {
                            _id: `temp_${Date.now()}_${Math.random()}`,
                            title: "",
                            issuer: "",
                            year: "",
                            description: "",
                        };
                        onAwardsChange([...(editedInstitution?.awards || []), newAward]);
                    }}
                >
                    Add Award
                </Button>

                {editedInstitution?.awards?.map((award, index) => (
                    <Box
                        key={award._id || `award_${index}`}
                        sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 2, position: "relative" }}
                    >
                        <IconButton
                            size="small"
                            sx={{ position: "absolute", top: 5, right: 5 }}
                            onClick={() => {
                                onAwardsChange(
                                    editedInstitution.awards.filter((_, i) => i !== index)
                                );
                            }}
                        >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Award Title"
                                    value={award.title || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onAwardsChange(
                                            editedInstitution.awards.map((a, i) =>
                                                i === index ? { ...a, title: val } : a
                                            )
                                        );
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Issuer"
                                    value={award.issuer || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onAwardsChange(
                                            editedInstitution.awards.map((a, i) =>
                                                i === index ? { ...a, issuer: val } : a
                                            )
                                        );
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Year"
                                    value={award.year || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onAwardsChange(
                                            editedInstitution.awards.map((a, i) =>
                                                i === index ? { ...a, year: val } : a
                                            )
                                        );
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Description"
                                    value={award.description || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onAwardsChange(
                                            editedInstitution.awards.map((a, i) =>
                                                i === index ? { ...a, description: val } : a
                                            )
                                        );
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                ))}
            </Box>
        </Box>
    );
});

const CampusesEditTab = React.memo(({ campuses, onAddCampus, onEditCampus, onDeleteCampus }) => {
    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
                    Campuses
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddCampus}
                    sx={{ backgroundColor: "#4f46e5" }}
                >
                    Add Campus
                </Button>
            </Box>
            <Grid container spacing={3}>
                {campuses?.map((location, index) => (
                    <Grid item xs={12} sm={6} md={4} key={location._id || location._clientId || index}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 3,
                                position: "relative",
                                opacity: location.markedForDeletion ? 0.6 : 1,
                                border: location.markedForDeletion ? "2px dashed red" : "none",
                            }}
                        >
                            {location.markedForDeletion && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: "rgba(255,0,0,0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 1,
                                    }}
                                >
                                    <Typography variant="body2" color="error">
                                        Marked for deletion
                                    </Typography>
                                </Box>
                            )}
                            {!location.markedForDeletion && (
                                <Box sx={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEditCampus(location)}
                                        sx={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteCampus(location._id || location._clientId)}
                                        sx={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                    >
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Box>
                            )}
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: "medium", textAlign: "center" }}>
                                    {location.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                    {location.city}, {location.country}
                                </Typography>
                                {location.address && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                        {location.address}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
});

const ScholarshipsEditTab = React.memo(({ scholarships, onAddScholarship, onEditScholarship, onDeleteScholarship }) => {
    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
                    Scholarships
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddScholarship}
                    sx={{ backgroundColor: "#4f46e5" }}
                >
                    Add Scholarship
                </Button>
            </Box>
            <Grid container spacing={3}>
                {scholarships?.map((scholarship, index) => (
                    <Grid item xs={12} sm={6} md={4} key={scholarship._id || scholarship._clientId || index}>
                        <Card
                            sx={{
                                minHeight: 100,
                                minWidth: 200,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                borderRadius: 2,
                                boxShadow: 3,
                                position: "relative",
                                opacity: scholarship.markedForDeletion ? 0.6 : 1,
                                border: scholarship.markedForDeletion ? "2px dashed red" : "none",
                            }}
                        >
                            {scholarship.markedForDeletion && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: "rgba(255,0,0,0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 1,
                                    }}
                                >
                                    <Typography variant="body2" color="error">
                                        Marked for deletion
                                    </Typography>
                                </Box>
                            )}
                            {!scholarship.markedForDeletion && (
                                <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 1, zIndex: 2 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEditScholarship(scholarship)}
                                        sx={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteScholarship(scholarship._id || scholarship._clientId)}
                                        sx={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                    >
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Box>
                            )}
                            <CardContent sx={{ p: 2, flexGrow: 1, pt: 4 }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: "medium",
                                        textAlign: "center",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {scholarship.name}
                                </Typography>
                                {(scholarship.value || scholarship.amount) && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                        Value: {scholarship.value || scholarship.amount}
                                    </Typography>
                                )}
                                {scholarship.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                        {scholarship.description}
                                    </Typography>
                                )}
                                {scholarship.url && (
                                    <Button
                                        href={scholarship.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        sx={{ mt: 1, display: "flex", mx: "auto" }}
                                    >
                                        View scholarship
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
});

const EntryRequirementsEditTab = React.memo(({ entryRequirements, onUndergradChange, onPostgradChange }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                Edit Entry Requirements
            </Typography>

            <Grid container spacing={3}>
                {/* Undergraduate Requirements */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, border: "1px solid #e0e0e0" }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Undergraduate Requirements
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="undergrad-score-type-label">Score Type</InputLabel>
                                        <Select
                                            labelId="undergrad-score-type-label"
                                            id="undergrad-score-type-select"
                                            value={entryRequirements?.undergraduate?.gpa?.type || ""}
                                            label="Score Type"
                                            onChange={(e) => {
                                                const type = e.target.value;
                                                const score = type === "Qualification" ? "University entrance qualification" : "";
                                                onUndergradChange({
                                                    ...entryRequirements?.undergraduate,
                                                    gpa: {
                                                        ...entryRequirements?.undergraduate?.gpa,
                                                        type,
                                                        score,
                                                    },
                                                });
                                            }}
                                            MenuProps={DEFAULT_MENU_PROPS}
                                        >
                                            <MenuItem value="GPA">GPA</MenuItem>
                                            <MenuItem value="Percentage">Percentage</MenuItem>
                                            <MenuItem value="Qualification">Qualification</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label={
                                            entryRequirements?.undergraduate?.gpa?.type === "Percentage"
                                                ? "Percentage"
                                                : entryRequirements?.undergraduate?.gpa?.type === "Qualification"
                                                    ? "Qualification"
                                                    : "GPA"
                                        }
                                        fullWidth
                                        value={entryRequirements?.undergraduate?.gpa?.score || ""}
                                        onChange={(e) => {
                                            const score = e.target.value;
                                            onUndergradChange({
                                                ...entryRequirements?.undergraduate,
                                                gpa: {
                                                    ...entryRequirements?.undergraduate?.gpa,
                                                    score,
                                                },
                                            });
                                        }}
                                        placeholder={
                                            entryRequirements?.undergraduate?.gpa?.type === "Percentage"
                                                ? "e.g. 75%"
                                                : entryRequirements?.undergraduate?.gpa?.type === "Qualification"
                                                    ? "University entrance qualification"
                                                    : "e.g. 3.0/4.0"
                                        }
                                    />
                                </Grid>
                            </Grid>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Language Requirements
                                </Typography>
                                <LanguageRequirementFields
                                    value={
                                        Array.isArray(entryRequirements?.undergraduate?.languageRequirement)
                                            ? entryRequirements.undergraduate.languageRequirement
                                            : []
                                    }
                                    onChange={(value) => {
                                        onUndergradChange({
                                            ...entryRequirements?.undergraduate,
                                            languageRequirement: value,
                                        });
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Postgraduate Requirements */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, border: "1px solid #e0e0e0" }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Postgraduate Requirements
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="postgrad-score-type-label">Score Type</InputLabel>
                                        <Select
                                            labelId="postgrad-score-type-label"
                                            id="postgrad-score-type-select"
                                            value={entryRequirements?.postgraduate?.gpa?.type || ""}
                                            label="Score Type"
                                            onChange={(e) => {
                                                const type = e.target.value;
                                                const score = type === "Qualification" ? "Bachelor's degree" : "";
                                                onPostgradChange({
                                                    ...entryRequirements?.postgraduate,
                                                    gpa: {
                                                        ...entryRequirements?.postgraduate?.gpa,
                                                        type,
                                                        score,
                                                    },
                                                });
                                            }}
                                            MenuProps={DEFAULT_MENU_PROPS}
                                        >
                                            <MenuItem value="GPA">GPA</MenuItem>
                                            <MenuItem value="Percentage">Percentage</MenuItem>
                                            <MenuItem value="Qualification">Qualification</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label={
                                            entryRequirements?.postgraduate?.gpa?.type === "Percentage"
                                                ? "Percentage"
                                                : entryRequirements?.postgraduate?.gpa?.type === "Qualification"
                                                    ? "Qualification"
                                                    : "GPA"
                                        }
                                        fullWidth
                                        value={entryRequirements?.postgraduate?.gpa?.score || ""}
                                        onChange={(e) => {
                                            const score = e.target.value;
                                            onPostgradChange({
                                                ...entryRequirements?.postgraduate,
                                                gpa: {
                                                    ...entryRequirements?.postgraduate?.gpa,
                                                    score,
                                                },
                                            });
                                        }}
                                        placeholder={
                                            entryRequirements?.postgraduate?.gpa?.type === "Percentage"
                                                ? "e.g. 75%"
                                                : entryRequirements?.postgraduate?.gpa?.type === "Qualification"
                                                    ? "Bachelor's degree"
                                                    : "e.g. 3.0/4.0"
                                        }
                                    />
                                </Grid>
                            </Grid>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Language Requirements
                                </Typography>
                                <LanguageRequirementFields
                                    value={
                                        Array.isArray(entryRequirements?.postgraduate?.languageRequirement)
                                            ? entryRequirements.postgraduate.languageRequirement
                                            : []
                                    }
                                    onChange={(value) => {
                                        onPostgradChange({
                                            ...entryRequirements?.postgraduate,
                                            languageRequirement: value,
                                        });
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
});

const DeadlinesEditTab = React.memo(({ deadlines, onChange }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                Edit Application Deadlines
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Last Application Deadline"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={deadlines?.lastApplicationDeadline || ""}
                        onChange={(e) => onChange("lastApplicationDeadline", e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Document Submission Deadline"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={deadlines?.documentSubmissionDeadline || ""}
                        onChange={(e) => onChange("documentSubmissionDeadline", e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Scholarship Application Deadline"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={deadlines?.scholarshipDeadline || ""}
                        onChange={(e) => onChange("scholarshipDeadline", e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Offer Acceptance Deadline"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={deadlines?.offerAcceptanceDeadline || ""}
                        onChange={(e) => onChange("offerAcceptanceDeadline", e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Orientation / Enrollment Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={deadlines?.orientationDate || ""}
                        onChange={(e) => onChange("orientationDate", e.target.value)}
                    />
                </Grid>
            </Grid>
        </Box>
    );
});

const DocumentsEditTab = React.memo(({ documents, onChange }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                Edit Financial Document Requirements
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Income Sources (one per line)"
                        value={documents?.incomeSources ?? ""}
                        onChange={(e) => onChange("incomeSources", e.target.value)}
                        helperText="Enter each income source on a new line"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Accepted Sponsors (one per line)"
                        value={documents?.sponsors ?? ""}
                        onChange={(e) => onChange("sponsors", e.target.value)}
                        helperText="Enter each sponsor type on a new line"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Accepted Banks (one per line)"
                        value={documents?.banks ?? ""}
                        onChange={(e) => onChange("banks", e.target.value)}
                        helperText="Enter each bank name on a new line"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Minimum Sponsor Count"
                            type="number"
                            value={documents?.minSponsorCount ?? ""}
                            onChange={(e) => onChange("minSponsorCount", e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Minimum Income Amount"
                            value={documents?.minIncomeAmount || ""}
                            onChange={(e) => onChange("minIncomeAmount", e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Previous Visa Refusal"
                            value={documents?.previousVisaRefusal || ""}
                            onChange={(e) => onChange("previousVisaRefusal", e.target.value)}
                        />

                        <FormControl fullWidth>
                            <InputLabel id="level-change-refusal-label">Level Change After Refusal</InputLabel>
                            <Select
                                labelId="level-change-refusal-label"
                                id="level-change-refusal-select"
                                value={documents?.levelChangeAfterRefusal ? "yes" : "no"}
                                label="Level Change After Refusal"
                                onChange={(e) => onChange("levelChangeAfterRefusal", e.target.value === "yes")}
                                MenuProps={DEFAULT_MENU_PROPS}
                            >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="yes">Yes</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
});

// --- Main Page Component ---

export default function AdminInstitutionPage({ institution: institutionProp, onClose }) {
    const { institutionId: routeInstitutionId } = useParams();
    const navigate = useNavigate();

    const institutionId = institutionProp?._id || routeInstitutionId;

    const [institution, setInstitution] = useState(institutionProp || null);
    const [programs, setPrograms] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("all");
    const [selectedField, setSelectedField] = useState("all");
    const [selectedIntake, setSelectedIntake] = useState("all");
    const [selectedTuition, setSelectedTuition] = useState("all");

    // Edit mode states
    const [editMode, setEditMode] = useState(false);
    const [editedInstitution, setEditedInstitution] = useState(null);
    const [saving, setSaving] = useState(false);
    const [pendingDeletions, setPendingDeletions] = useState({
        locations: [],
        programs: [],
        scholarships: [],
        bannerImages: [],
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState("");
    const [editingProgram, setEditingProgram] = useState(null);
    const [editingScholarship, setEditingScholarship] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [programToDelete, setProgramToDelete] = useState(null);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [programSaving, setProgramSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let institutionData = institutionProp;

                if (!institutionProp && institutionId) {
                    institutionData = await getInstitutionById(institutionId);
                    setInstitution(institutionData);
                }

                if (institutionId) {
                    const programData = await getProgramsByInstitution(institutionId);
                    setPrograms(programData.programs || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        window.scrollTo({ top: 0, behavior: "smooth" });

        if (institutionId) {
            fetchData();
        }
    }, [institutionId, institutionProp]);

    // Helper function to extract level from degree_name
    const extractLevel = useCallback((degreeName) => {
        if (!degreeName) return "Other";
        const lower = degreeName.toLowerCase();
        if (lower.includes("master") || lower.includes("msc") || lower.includes("ma ") || lower.includes("mba")) return "Master";
        if (lower.includes("bachelor") || lower.includes("bsc") || lower.includes("ba ") || lower.includes("bba")) return "Bachelor";
        if (lower.includes("phd") || lower.includes("doctorate")) return "PhD";
        if (lower.includes("diploma") || lower.includes("certificate")) return "Diploma";
        return "Other";
    }, []);

    // Helper function to extract field from degree_name
    const extractField = useCallback((degreeName) => {
        if (!degreeName) return "General";
        const lower = degreeName.toLowerCase();

        if (lower.includes("computer") || lower.includes("computing") || lower.includes("it ")) return "Computer Science";
        if (lower.includes("business") || lower.includes("management") || lower.includes("mba")) return "Business";
        if (lower.includes("engineering")) return "Engineering";
        if (lower.includes("science")) return "Science";
        if (lower.includes("arts") || lower.includes(" art ")) return "Arts";
        if (lower.includes("health") || lower.includes("medicine") || lower.includes("nursing")) return "Health";
        if (lower.includes("education")) return "Education";
        if (lower.includes("law")) return "Law";

        return "General";
    }, []);

    // Helper function to parse tuition fee
    const parseTuitionFee = useCallback((tuitionFees) => {
        if (!Array.isArray(tuitionFees) || tuitionFees.length === 0) {
            return 0;
        }

        const firstFee = tuitionFees[0];

        if (!firstFee || typeof firstFee !== "object") {
            return 0;
        }

        return Number(firstFee.annual_fee_eur) || 0;
    }, []);

    // Transform programs to match old structure for compatibility
    const transformedPrograms = useMemo(() => {
        return programs.map((program) => ({
            ...program,
            name: program.degree_name,
            level: program.level || extractLevel(program.degree_name),
            field: program.field || extractField(program.degree_name),
            tuitionFee: {
                value: parseTuitionFee(program.tuition_fees),
                currency: institution?.country?.currency || "USD",
            },
        }));
    }, [programs, institution?.country?.currency, extractLevel, extractField, parseTuitionFee]);

    const levels = useMemo(
        () => [...new Set(transformedPrograms.map((p) => p.level).filter(Boolean))],
        [transformedPrograms]
    );
    const fields = useMemo(
        () => [...new Set(transformedPrograms.map((p) => p.field).filter(Boolean))],
        [transformedPrograms]
    );
    const intakes = useMemo(
        () => [
            ...new Set(
                transformedPrograms.flatMap((p) => {
                    if (Array.isArray(p.intakes)) return p.intakes;
                    if (typeof p.intakes === "string") {
                        return p.intakes
                            .split(",")
                            .map((i) => i.trim())
                            .filter(Boolean);
                    }
                    return [];
                })
            ),
        ],
        [transformedPrograms]
    );

    const filteredPrograms = useMemo(() => {
        return transformedPrograms.filter((program) => {
            const matchesSearch = program.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());

            const matchesLevel =
                selectedLevel === "all" || program.level === selectedLevel;

            const matchesField =
                selectedField === "all" || program.field === selectedField;

            const programIntakes = Array.isArray(program.intakes)
                ? program.intakes
                : typeof program.intakes === "string"
                    ? program.intakes
                        .split(",")
                        .map((i) => i.trim())
                        .filter(Boolean)
                    : [];

            const matchesIntake =
                selectedIntake === "all" || programIntakes.includes(selectedIntake);

            const fee = Number(program.tuitionFee?.value || 0);

            const matchesTuition =
                selectedTuition === "all" ||
                (selectedTuition === "under20000" && fee < 20000) ||
                (selectedTuition === "20000to30000" && fee >= 20000 && fee <= 30000) ||
                (selectedTuition === "above30000" && fee > 30000);

            return (
                matchesSearch &&
                matchesLevel &&
                matchesField &&
                matchesIntake &&
                matchesTuition
            );
        });
    }, [transformedPrograms, searchQuery, selectedLevel, selectedField, selectedIntake, selectedTuition]);

    const displayCampuses = useMemo(() => getDisplayCampuses(institution, programs), [institution, programs]);

    const handleEditInstitution = useCallback(() => {
        const clone = JSON.parse(JSON.stringify(institution));
        clone.campuses = (clone.campuses || []).map((campus, index) => ({
            ...campus,
            _clientId: campus._id || `campus_${index}`,
        }));
        clone.scholarships = (clone.scholarships || []).map((scholarship, index) => ({
            ...scholarship,
            _clientId: scholarship._id || `scholarship_${index}`,
        }));
        if (clone.documents) {
            clone.documents.incomeSources = Array.isArray(clone.documents.incomeSources)
                ? clone.documents.incomeSources.join("\n")
                : clone.documents.incomeSources || "";
            clone.documents.sponsors = Array.isArray(clone.documents.sponsors)
                ? clone.documents.sponsors.join("\n")
                : clone.documents.sponsors || "";
            clone.documents.banks = Array.isArray(clone.documents.banks)
                ? clone.documents.banks.join("\n")
                : clone.documents.banks || "";
        }
        setEditedInstitution(clone);
        setEditMode(true);
    }, [institution]);

    const toggleEditMode = useCallback(() => {
        if (editMode) {
            setEditedInstitution(null);
            setPendingDeletions({
                locations: [],
                programs: [],
                scholarships: [],
                bannerImages: [],
            });
            setEditMode(false);
        } else {
            handleEditInstitution();
        }
    }, [editMode, handleEditInstitution]);

    const handleCancelEdit = useCallback(() => {
        setEditMode(false);
        setEditedInstitution(null);
        setPendingDeletions({
            locations: [],
            programs: [],
            scholarships: [],
            bannerImages: [],
        });
    }, []);

    const handleSaveEdit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            // Filter out marked items and format fields
            const toSave = {
                ...editedInstitution,
                applicationFee: {
                    amount: Number(
                        typeof editedInstitution.applicationFee === "object"
                            ? editedInstitution.applicationFee?.amount || 0
                            : editedInstitution.applicationFee || 0
                    ),
                    currency:
                        (typeof editedInstitution.applicationFee === "object"
                            ? editedInstitution.applicationFee?.currency
                            : null) || institution?.country?.currency || "",
                },
                campuses: editedInstitution.campuses?.filter(
                    (loc) =>
                        !pendingDeletions.locations.includes(loc._id || loc._clientId) &&
                        !loc.markedForDeletion
                ),
                scholarships: editedInstitution.scholarships?.filter(
                    (scholarship) =>
                        !pendingDeletions.scholarships.includes(scholarship._id || scholarship._clientId) &&
                        !scholarship.markedForDeletion
                ),
                documents: editedInstitution.documents
                    ? {
                        ...editedInstitution.documents,
                        incomeSources:
                            typeof editedInstitution.documents.incomeSources ===
                                "string"
                                ? editedInstitution.documents.incomeSources
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : editedInstitution.documents.incomeSources || [],
                        sponsors:
                            typeof editedInstitution.documents.sponsors === "string"
                                ? editedInstitution.documents.sponsors
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : editedInstitution.documents.sponsors || [],
                        banks:
                            typeof editedInstitution.documents.banks === "string"
                                ? editedInstitution.documents.banks
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : editedInstitution.documents.banks || [],
                        minSponsorCount:
                            editedInstitution.documents.minSponsorCount !== "" &&
                                editedInstitution.documents.minSponsorCount !== null &&
                                editedInstitution.documents.minSponsorCount !== undefined
                                ? Number(editedInstitution.documents.minSponsorCount)
                                : undefined,
                    }
                    : editedInstitution.documents,
            };

            const formData = new FormData();

            Object.keys(toSave).forEach((key) => {
                if (toSave[key] === undefined) {
                    return;
                }
                if (key === "logo" && typeof toSave[key] === "object") {
                    return;
                }
                if (typeof toSave[key] === "object") {
                    formData.append(key, JSON.stringify(toSave[key]));
                } else {
                    formData.append(key, toSave[key]);
                }
            });

            const response = await fetch(`${apiUrl}/institution/${institutionId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to update institution");
            }

            const data = await response.json();

            setInstitution(data);
            setEditedInstitution(null);
            setPendingDeletions({
                locations: [],
                programs: [],
                scholarships: [],
                bannerImages: [],
            });
            setEditMode(false);
            setSnackbar({
                open: true,
                message: "Changes saved successfully!",
                severity: "success",
            });
        } catch (error) {
            console.error("Error updating institution:", error);
            setSnackbar({
                open: true,
                message: `Error saving changes: ${error.message}`,
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = useCallback((field, itemId) => {
        setPendingDeletions((prev) => ({
            ...prev,
            [field]: [...prev[field], itemId],
        }));

        setEditedInstitution((prev) => ({
            ...prev,
            [field === "locations" ? "campuses" : field]: prev[
                field === "locations" ? "campuses" : field
            ]?.map((item) =>
                (item._id || item._clientId) === itemId ? { ...item, markedForDeletion: true } : item
            ),
        }));

        setSnackbar({
            open: true,
            message: `${field.slice(0, -1)} marked for deletion. Save to confirm.`,
            severity: "info",
        });
    }, []);

    const handleInputChange = useCallback((field, value) => {
        setEditedInstitution((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    // Location editing
    const openLocationDialog = useCallback((location = null) => {
        setEditingLocation(location);
        setDialogType("location");
        setOpenDialog(true);
    }, []);

    const saveLocationChanges = useCallback((savedLocation) => {
        setEditedInstitution((prev) => {
            const updatedLocations = [...(prev?.campuses || [])];
            const savedId = savedLocation._id || savedLocation._clientId;
            if (savedId) {
                const index = updatedLocations.findIndex((location) => (location._id || location._clientId) === savedId);
                if (index !== -1) {
                    updatedLocations[index] = savedLocation;
                }
            } else {
                updatedLocations.push({
                    ...savedLocation,
                    _clientId: `campus_temp_${Date.now()}`,
                });
            }
            return {
                ...prev,
                campuses: updatedLocations,
            };
        });
        setOpenDialog(false);
        setEditingLocation(null);
    }, []);

    // Scholarship editing
    const openScholarshipDialog = useCallback((scholarship = null) => {
        setEditingScholarship(scholarship);
        setDialogType("scholarship");
        setOpenDialog(true);
    }, []);

    const saveScholarshipChanges = useCallback((savedScholarship) => {
        setEditedInstitution((prev) => {
            const updatedScholarships = [...(prev?.scholarships || [])];
            const savedId = savedScholarship._id || savedScholarship._clientId;
            if (savedId) {
                const index = updatedScholarships.findIndex((scholarship) => (scholarship._id || scholarship._clientId) === savedId);
                if (index !== -1) {
                    updatedScholarships[index] = savedScholarship;
                }
            } else {
                updatedScholarships.push({
                    ...savedScholarship,
                    _clientId: `scholarship_temp_${Date.now()}`,
                });
            }
            return {
                ...prev,
                scholarships: updatedScholarships,
            };
        });
        setSnackbar({
            open: true,
            message: `Scholarship "${savedScholarship.name}" ${savedScholarship._id ? "updated" : "added"}. Save changes to confirm.`,
            severity: "success",
        });
        setOpenDialog(false);
        setEditingScholarship(null);
    }, []);

    // Program editing
    const openProgramDialog = useCallback((program = null) => {
        setEditingProgram(program);
        setDialogType("program");
        setOpenDialog(true);
    }, []);

    const saveProgramChanges = async (payload) => {
        try {
            setProgramSaving(true);
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            const payloadToSave = { ...payload };
            delete payloadToSave.name;
            delete payloadToSave.tuitionFee;

            if (payloadToSave._id && !payloadToSave._id.startsWith("temp_")) {
                const response = await fetch(`${apiUrl}/program/${payloadToSave._id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payloadToSave),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to update program");
                }

                const updatedProgram = await response.json();

                setPrograms((prevPrograms) =>
                    prevPrograms.map((p) =>
                        p._id === updatedProgram._id ? updatedProgram : p
                    )
                );

                setSnackbar({
                    open: true,
                    message: "Program updated successfully!",
                    severity: "success",
                });
            } else {
                delete payloadToSave._id;
                const response = await fetch(`${apiUrl}/program`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...payloadToSave,
                        institutionId: institutionId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to create program");
                }

                const newProgram = await response.json();

                setPrograms((prevPrograms) => [...prevPrograms, newProgram]);

                setSnackbar({
                    open: true,
                    message: "Program created successfully!",
                    severity: "success",
                });
            }

            setOpenDialog(false);
            setEditingProgram(null);
        } catch (error) {
            console.error("Error saving program:", error);
            setSnackbar({
                open: true,
                message: `Error saving program: ${error.message}`,
                severity: "error",
            });
        } finally {
            setProgramSaving(false);
        }
    };

    const handleDeleteProgram = async () => {
        if (!programToDelete) return;

        try {
            setProgramSaving(true);
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(`${apiUrl}/program/${programToDelete._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete program");
            }

            setPrograms((prevPrograms) =>
                prevPrograms.filter((p) => p._id !== programToDelete._id)
            );

            setSnackbar({
                open: true,
                message: "Program deleted successfully!",
                severity: "success",
            });

            setConfirmDeleteDialog(false);
            setProgramToDelete(null);
        } catch (error) {
            console.error("Error deleting program:", error);
            setSnackbar({
                open: true,
                message: `Error deleting program: ${error.message}`,
                severity: "error",
            });
        } finally {
            setProgramSaving(false);
        }
    };

    // Image handling
    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("image", file);

            const apiUrl = import.meta.env.VITE_BACKEND_URL;
            fetch(`${apiUrl}/upload`, {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    setEditedInstitution((prev) => ({
                        ...prev,
                        logo: data,
                    }));
                    setSnackbar({
                        open: true,
                        message: "Logo uploaded successfully!",
                        severity: "success",
                    });
                })
                .catch((error) => {
                    console.error("Error uploading logo:", error);
                    setSnackbar({
                        open: true,
                        message: "Error uploading logo. Please try again.",
                        severity: "error",
                    });
                });
        }
    };

    const handleDeleteInstitution = useCallback(() => {
        if (
            confirm(
                `Are you sure you want to delete ${institution?.name}?\n\nThis will permanently delete:\n• Institution details\n• All programs (${programs.length} programs)\n• All related data\n\nThis action cannot be undone.`
            )
        ) {
            alert("Delete functionality will be implemented soon.");
        }
    }, [institution?.name, programs.length]);

    const handleAddPrograms = useCallback(() => {
        openProgramDialog();
    }, [openProgramDialog]);

    const handleExportData = useCallback(() => {
        const dataStr = JSON.stringify({ institution, programs }, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${institution?.name?.replace(/\s+/g, "-") || "institution"}-data.json`;
        link.click();
    }, [institution, programs]);

    const speedDialActions = useMemo(
        () => [
            { icon: <EditIcon />, name: "Edit Institution", onClick: handleEditInstitution },
            { icon: <AddIcon />, name: "Add Programs", onClick: handleAddPrograms },
            { icon: <DownloadIcon />, name: "Export Data", onClick: handleExportData },
            { icon: <DeleteIcon />, name: "Delete Institution", onClick: handleDeleteInstitution },
        ],
        [handleEditInstitution, handleAddPrograms, handleExportData, handleDeleteInstitution]
    );

    if (!institution) {
        return <Loading loading={true} />;
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", pb: 10 }}>
            <Container sx={{ py: 4 }}>
                {/* Header with Back Button */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <IconButton
                        onClick={onClose || (() => navigate("/admin/institutions"))}
                        sx={{ mr: 1 }}
                        disabled={saving}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Box sx={{ position: "relative" }}>
                        <Avatar
                            src={editMode ? editedInstitution?.logo?.url : institution.logo?.url}
                            alt={editMode ? editedInstitution?.name : institution.name}
                            sx={{
                                width: 100,
                                height: 100,
                                border: "2px solid #4f46e5",
                                boxShadow: 3,
                                "& img": { objectFit: "contain" },
                            }}
                        />
                        {editMode && (
                            <IconButton
                                component="label"
                                sx={{
                                    position: "absolute",
                                    bottom: -5,
                                    right: -5,
                                    backgroundColor: "rgba(79, 70, 229, 0.9)",
                                    color: "white",
                                    "&:hover": { backgroundColor: "#4338ca" },
                                }}
                            >
                                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight="bold">
                            {editMode ? editedInstitution?.name || institution.name : institution.name}
                        </Typography>

                        <Typography color="text.secondary">
                            {institution.country?.name} • {institution.type}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {displayCampuses.length} campuses • {programs.length} programs
                        </Typography>

                        {(institution.applicationFee?.amount || Number(institution.applicationFee) || 0) > 0 && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Application Fee: {institution.country?.currency || "USD"}{" "}
                                {institution.applicationFee?.amount || institution.applicationFee}
                            </Typography>
                        )}
                    </Box>

                    {/* Edit Mode Buttons */}
                    {editMode ? (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                startIcon={<CancelIcon />}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSaveEdit}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </Box>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEditInstitution}
                            sx={{ height: "fit-content" }}
                        >
                            Edit
                        </Button>
                    )}
                </Box>

                <Tabs
                    value={tabIndex}
                    onChange={(e, newIndex) => setTabIndex(newIndex)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,
                        "& .MuiTab-root": { fontWeight: "bold" },
                        "& .Mui-selected": { color: "#4f46e5 !important" },
                    }}
                >
                    {[
                        "Overview",
                        "Locations",
                        "Programs",
                        "Intakes",
                        "Scholarships",
                        "Entry Requirements",
                        "Deadlines",
                        "Documents",
                    ].map((label, index) => (
                        <Tab key={index} label={label} />
                    ))}
                </Tabs>

                {editMode ? (
                    <Box>
                        {tabIndex === 0 ||
                            tabIndex === 1 ||
                            tabIndex === 4 ||
                            tabIndex === 5 ||
                            tabIndex === 6 ||
                            tabIndex === 7 ? (
                            <Paper sx={{ p: 3, mb: 3 }}>
                                {tabIndex === 0 && (
                                    <OverviewEditTab
                                        editedInstitution={editedInstitution}
                                        onChange={handleInputChange}
                                        onAwardsChange={(newAwards) =>
                                            setEditedInstitution((prev) => ({ ...prev, awards: newAwards }))
                                        }
                                    />
                                )}

                                {tabIndex === 1 && (
                                    <CampusesEditTab
                                        campuses={editedInstitution?.campuses}
                                        onAddCampus={() => openLocationDialog()}
                                        onEditCampus={openLocationDialog}
                                        onDeleteCampus={(id) => deleteItem("locations", id)}
                                    />
                                )}

                                {tabIndex === 4 && (
                                    <ScholarshipsEditTab
                                        scholarships={editedInstitution?.scholarships}
                                        onAddScholarship={() => openScholarshipDialog()}
                                        onEditScholarship={openScholarshipDialog}
                                        onDeleteScholarship={(id) => deleteItem("scholarships", id)}
                                    />
                                )}

                                {tabIndex === 5 && (
                                    <EntryRequirementsEditTab
                                        entryRequirements={editedInstitution?.entryRequirements}
                                        onUndergradChange={(undergrad) =>
                                            setEditedInstitution((prev) => ({
                                                ...prev,
                                                entryRequirements: {
                                                    ...prev?.entryRequirements,
                                                    undergraduate: undergrad,
                                                },
                                            }))
                                        }
                                        onPostgradChange={(postgrad) =>
                                            setEditedInstitution((prev) => ({
                                                ...prev,
                                                entryRequirements: {
                                                    ...prev?.entryRequirements,
                                                    postgraduate: postgrad,
                                                },
                                            }))
                                        }
                                    />
                                )}

                                {tabIndex === 6 && (
                                    <DeadlinesEditTab
                                        deadlines={editedInstitution?.deadlines}
                                        onChange={(field, val) =>
                                            setEditedInstitution((prev) => ({
                                                ...prev,
                                                deadlines: {
                                                    ...prev?.deadlines,
                                                    [field]: val,
                                                },
                                            }))
                                        }
                                    />
                                )}

                                {tabIndex === 7 && (
                                    <DocumentsEditTab
                                        documents={editedInstitution?.documents}
                                        onChange={(field, val) =>
                                            setEditedInstitution((prev) => ({
                                                ...prev,
                                                documents: {
                                                    ...prev?.documents,
                                                    [field]: val,
                                                },
                                            }))
                                        }
                                    />
                                )}
                            </Paper>
                        ) : (
                            <InstitutionTabsContent
                                activeTab={tabIndex}
                                institution={institution}
                                programs={transformedPrograms}
                                filteredPrograms={filteredPrograms}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                selectedLevel={selectedLevel}
                                setSelectedLevel={setSelectedLevel}
                                selectedField={selectedField}
                                setSelectedField={setSelectedField}
                                selectedIntake={selectedIntake}
                                setSelectedIntake={setSelectedIntake}
                                selectedTuition={selectedTuition}
                                setSelectedTuition={setSelectedTuition}
                                levels={levels}
                                fields={fields}
                                intakes={intakes}
                                navigate={navigate}
                                isAdmin={true}
                                isEditMode={true}
                                onEditProgram={openProgramDialog}
                                onDeleteProgram={(program) => {
                                    setProgramToDelete(program);
                                    setConfirmDeleteDialog(true);
                                }}
                            />
                        )}
                    </Box>
                ) : (
                    <InstitutionTabsContent
                        activeTab={tabIndex}
                        institution={institution}
                        programs={transformedPrograms}
                        filteredPrograms={filteredPrograms}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedLevel={selectedLevel}
                        setSelectedLevel={setSelectedLevel}
                        selectedField={selectedField}
                        setSelectedField={setSelectedField}
                        selectedIntake={selectedIntake}
                        setSelectedIntake={setSelectedIntake}
                        selectedTuition={selectedTuition}
                        setSelectedTuition={setSelectedTuition}
                        levels={levels}
                        fields={fields}
                        intakes={intakes}
                        navigate={navigate}
                        isAdmin={true}
                        isEditMode={editMode}
                        onEditProgram={openProgramDialog}
                        onDeleteProgram={(program) => {
                            setProgramToDelete(program);
                            setConfirmDeleteDialog(true);
                        }}
                    />
                )}
            </Container>

            {/* Admin Speed Dial - Only show when not in edit mode */}
            {!editMode && (
                <SpeedDial
                    ariaLabel="Admin actions"
                    sx={{ position: "fixed", bottom: 16, right: 16 }}
                    icon={<SpeedDialIcon />}
                >
                    {speedDialActions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            title={action.name}
                            onClick={action.onClick}
                        />
                    ))}
                </SpeedDial>
            )}

            {/* Modals & Dialogs */}
            <ScholarshipDialog
                open={openDialog && dialogType === "scholarship"}
                onClose={() => {
                    setOpenDialog(false);
                    setEditingScholarship(null);
                }}
                scholarship={editingScholarship}
                onSave={saveScholarshipChanges}
            />

            <LocationDialog
                open={openDialog && dialogType === "location"}
                onClose={() => {
                    setOpenDialog(false);
                    setEditingLocation(null);
                }}
                location={editingLocation}
                institution={institution}
                onSave={saveLocationChanges}
            />

            <ProgramDialog
                open={openDialog && dialogType === "program"}
                onClose={() => {
                    setOpenDialog(false);
                    setEditingProgram(null);
                }}
                program={editingProgram}
                onSave={saveProgramChanges}
                saving={programSaving}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmDeleteDialog}
                onClose={() => {
                    setConfirmDeleteDialog(false);
                    setProgramToDelete(null);
                }}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the program "
                        {programToDelete?.degree_name || programToDelete?.name}"?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setConfirmDeleteDialog(false);
                            setProgramToDelete(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteProgram}
                        color="error"
                        variant="contained"
                        disabled={programSaving}
                    >
                        {programSaving ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{
                    top: { xs: 80, sm: 100 },
                    "& .MuiAlert-root": {
                        width: "100%",
                        maxWidth: "600px",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        fontSize: "1rem",
                    },
                    zIndex: 100,
                }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
