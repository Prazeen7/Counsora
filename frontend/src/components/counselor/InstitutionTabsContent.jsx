import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Paper,
    TextField,
    Divider,
    List,
    ListItem,
    ListItemText,
    Link,
    MenuItem,
    Button,
    IconButton,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import {
    OpenInNew as OpenInNewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudDownload as ImportIcon,
} from "@mui/icons-material";
import { getDisplayCampuses } from "../../utils/DisplayCampuses";
import { formatLanguageRequirement, hasLanguageScore } from "../../utils/formatLanguageRequirement";
import ProgramDetailsTicker from "./ProgramDetailsTicker";
import ProgramDocumentRequirements from "./ProgramDocumentRequirements";
import { getProgramAdditionalRequirements, hasDocumentRequirements } from "../../utils/documentRequirements";

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const MONTH_NAMES = [
    ["january", "jan"], ["february", "feb"], ["march", "mar"],
    ["april", "apr"], ["may"], ["june", "jun"], ["july", "jul"],
    ["august", "aug"], ["september", "sep", "sept"],
    ["october", "oct"], ["november", "nov"], ["december", "dec"],
];

const getIntakeMonthIndex = (intake) => {
    const text = String(intake || "").toLowerCase();
    return MONTH_NAMES.findIndex((aliases) =>
        aliases.some((month) => new RegExp(`\\b${month}\\b`, "i").test(text))
    );
};

const sortIntakesByMonth = (values = []) => [...values].sort((left, right) => {
    const leftMonth = getIntakeMonthIndex(left);
    const rightMonth = getIntakeMonthIndex(right);
    if (leftMonth === -1 && rightMonth !== -1) return 1;
    if (leftMonth !== -1 && rightMonth === -1) return -1;
    if (leftMonth !== rightMonth) return leftMonth - rightMonth;
    return String(left).localeCompare(String(right), undefined, { numeric: true });
});

const isUndergraduateLevel = (level = "") =>
    /foundation|diploma|associate|bachelor|undergraduate/i.test(level);

const deriveLowestProgramRequirements = (programs, undergraduate) => {
    const matchingPrograms = programs.filter((program) =>
        undergraduate
            ? isUndergraduateLevel(program.level)
            : !isUndergraduateLevel(program.level)
    );

    const academicOptions = matchingPrograms
        .map((program) => program.entry_requirements?.academic)
        .filter(Boolean);
    const scoredAcademicOptions = academicOptions
        .map((academic) => ({ academic, numericScore: Number.parseFloat(academic.score) }))
        .filter(({ numericScore }) => Number.isFinite(numericScore))
        .sort((a, b) => a.numericScore - b.numericScore);
    const lowestAcademic = scoredAcademicOptions[0]?.academic || academicOptions.find(
        (academic) => hasValue(academic.minimum_qualification)
    );

    const tests = [
        ["IELTS", "english", "ielts"],
        ["TOEFL", "english", "toefl"],
        ["PTE", "english", "pte"],
        ["Duolingo", "english", "duolingo"],
        ["TestDaF", "german", "testdaf"],
        ["DSH", "german", "dsh"],
    ];
    const languageRequirement = tests.flatMap(([testType, language, testKey]) => {
        const options = matchingPrograms
            .map((program) => program.entry_requirements?.language_requirements?.[language]?.[testKey])
            .filter(hasLanguageScore)
            .map((test) => ({ test, numericOverall: Number.parseFloat(test.overall) }))
            .sort((a, b) => {
                if (Number.isFinite(a.numericOverall) && Number.isFinite(b.numericOverall)) {
                    return a.numericOverall - b.numericOverall;
                }
                return Number.isFinite(a.numericOverall) ? -1 : 1;
            });
        if (!options.length) return [];

        const test = options[0].test;
        const individualFields = ["listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"];
        return [{
            testType,
            overall: test.overall,
            minimum_band: test.minimum_band,
            ...Object.fromEntries(individualFields.map((field) => [field, test[field]])),
            hasIndividualScores: individualFields.some((field) => hasValue(test[field])),
        }];
    });

    return {
        gpa: lowestAcademic
            ? {
                type: lowestAcademic.score_type || "Score",
                score: lowestAcademic.score,
                scale: lowestAcademic.scale,
                minimumQualification: lowestAcademic.minimum_qualification,
                fieldRequirement: lowestAcademic.field_requirement,
            }
            : null,
        languageRequirement,
    };
};

const resolveEntryRequirement = (institutionEntry, programFallback) => {
    const institutionGpa = institutionEntry?.gpa;
    const institutionLanguages = (institutionEntry?.languageRequirement || []).filter(
        (test) => hasValue(test?.testType || test?.testName) || hasValue(test?.overall)
    );

    return {
        gpa: hasValue(institutionGpa?.score) ? institutionGpa : programFallback.gpa,
        languageRequirement: institutionLanguages.length
            ? institutionLanguages
            : programFallback.languageRequirement,
    };
};

export default function InstitutionTabsContent({
    activeTab,
    institution,
    programs = [],
    filteredPrograms = [],
    searchQuery,
    setSearchQuery,
    selectedLevel,
    setSelectedLevel,
    selectedField,
    setSelectedField,
    selectedIntake,
    setSelectedIntake,
    selectedTuition,
    setSelectedTuition,
    levels = [],
    fields = [],
    intakes = [],
    isAdmin = false,
    isEditMode = false,
    onEditProgram = null,
    onDeleteProgram = null,
    onImportPrograms = null,
    importingPrograms = false,
}) {
    const [selectedCampus, setSelectedCampus] = useState(
        institution?.campuses?.[0] || null
    );

    useEffect(() => {
        const latestCampuses = getDisplayCampuses(institution, programs);

        setSelectedCampus((currentCampus) => {
            if (latestCampuses.length === 0) return null;

            const matchingCampus = latestCampuses.find((campus) =>
                currentCampus?._id && campus?._id
                    ? String(campus._id) === String(currentCampus._id)
                    : campus?.name === currentCampus?.name
            );

            return matchingCampus || latestCampuses[0];
        });
    }, [institution, programs]);

    const undergraduateEntry = resolveEntryRequirement(
        institution?.entryRequirements?.undergraduate,
        deriveLowestProgramRequirements(programs, true)
    );
    const postgraduateEntry = resolveEntryRequirement(
        institution?.entryRequirements?.postgraduate,
        deriveLowestProgramRequirements(programs, false)
    );
    const sortedIntakes = sortIntakesByMonth(intakes);

    switch (activeTab) {
        case 0:
            return (
                <>
                    {/* About Section */}
                    <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            About {institution?.name}
                        </Typography>

                        <Typography sx={{ mb: 3 }}>
                            {institution?.description}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight="bold">Institution Type</Typography>
                                <Typography>{institution?.type}</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography fontWeight="bold">Application Fee</Typography>
                                <Typography>
                                    {institution?.applicationFee?.currency} {institution?.applicationFee?.amount}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography fontWeight="bold">Official Website</Typography>
                                <Link
                                    href={institution?.website}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {institution?.website}
                                </Link>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Awards Section */}
                    <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Awards & Recognition
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {institution?.awards?.length > 0 ? (
                            institution.awards.map((award, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{ p: 2, mb: 2, borderRadius: 2 }}
                                >
                                    <Typography variant="h6" fontWeight="bold">
                                        {award.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        {award.issuer} {award.year ? `• ${award.year}` : ""}
                                    </Typography>

                                    {award.description && (
                                        <Typography sx={{ mt: 1 }}>
                                            {award.description}
                                        </Typography>
                                    )}
                                </Paper>
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                No awards available.
                            </Typography>
                        )}
                    </Paper>
                </>
            );

        case 1:
            const displayCampuses = getDisplayCampuses(institution, programs);
            const institutionCountry =
                typeof institution?.country === "object"
                    ? institution.country?.name
                    : institution?.country;
            const selectedCampusMapUrl = selectedCampus?.mapEmbedUrl
                ?.match(/^https?:\/\/[^\s\"]+/)?.[0];
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Campuses
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            gap: 3,
                            flexDirection: { xs: "column", md: "row" },
                            alignItems: "stretch",
                        }}
                    >
                        {/* Left side */}
                        <Box
                            sx={{
                                width: { xs: "100%", md: 320 },
                                flexShrink: 0,
                            }}
                        >
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {displayCampuses.map((campus, index) => (
                                    <Chip
                                        key={`${campus.name}-${index}`}
                                        label={campus.name}
                                        clickable
                                        color={
                                            selectedCampus?.name === campus.name ? "primary" : "default"
                                        }
                                        onClick={() => setSelectedCampus(campus)}
                                    />
                                ))}
                            </Box>

                            {selectedCampus && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {selectedCampus.name}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Address:</strong>{" "}
                                        {selectedCampus.address || "Not provided"}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>City:</strong>{" "}
                                        {selectedCampus.city || "Not provided"}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Country:</strong>{" "}
                                        {selectedCampus.country || institutionCountry || "Not provided"}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Phone:</strong>{" "}
                                        {selectedCampus.contactNumber ||
                                            institution?.contactNumber ||
                                            "Not provided"}
                                    </Typography>

                                    <Typography>
                                        <strong>Email:</strong>{" "}
                                        {selectedCampus.email || institution?.email || "Not provided"}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Right side */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {selectedCampus && selectedCampusMapUrl && (
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: 520,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        border: "1px solid #e5e7eb",
                                        boxShadow: 1,
                                    }}
                                >
                                    <iframe
                                        src={selectedCampusMapUrl}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title={selectedCampus.name}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Paper>
            );

        case 2:
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold">
                            Programs Offered
                        </Typography>

                        {isAdmin && (
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {onImportPrograms && (
                                    <Button
                                        variant="outlined"
                                        startIcon={importingPrograms ? <CircularProgress size={16} /> : <ImportIcon />}
                                        onClick={onImportPrograms}
                                        disabled={importingPrograms}
                                    >
                                        {importingPrograms ? "Importing..." : "Import from website"}
                                    </Button>
                                )}
                                {isEditMode && onEditProgram && (
                                    <Button
                                        variant="contained"
                                        startIcon={<OpenInNewIcon />}
                                        onClick={() => onEditProgram(null)}
                                        sx={{
                                            backgroundColor: "#4f46e5",
                                            "&:hover": { backgroundColor: "#4338ca" },
                                        }}
                                    >
                                        Add Program
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Filters */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                md: "repeat(3, 1fr)",
                                lg: "2fr 1fr 1fr 1fr 1fr",
                            },
                            gap: 2,
                            mb: 3,
                        }}
                    >
                        <TextField
                            fullWidth
                            placeholder="Search programs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <TextField
                            select
                            fullWidth
                            label="Level"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                        >
                            <MenuItem value="all">All Levels</MenuItem>

                            {levels.map((level) => (
                                <MenuItem key={level} value={level}>
                                    {level}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Field"
                            value={selectedField}
                            onChange={(e) => setSelectedField(e.target.value)}
                        >
                            <MenuItem value="all">All Fields</MenuItem>

                            {fields.map((field) => (
                                <MenuItem key={field} value={field}>
                                    {field}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Intake"
                            value={selectedIntake}
                            onChange={(e) => setSelectedIntake(e.target.value)}
                        >
                            <MenuItem value="all">All Intakes</MenuItem>

                            {sortedIntakes.map((intake) => (
                                <MenuItem key={intake} value={intake}>
                                    {intake}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Tuition Fee"
                            value={selectedTuition}
                            onChange={(e) => setSelectedTuition(e.target.value)}
                        >
                            <MenuItem value="all">Any Tuition</MenuItem>
                            <MenuItem value="under20000">
                                Under 20,000
                            </MenuItem>
                            <MenuItem value="20000to30000">
                                20,000 - 30,000
                            </MenuItem>
                            <MenuItem value="above30000">
                                Above 30,000
                            </MenuItem>
                        </TextField>
                    </Box>

                    {/* Program documents */}
                    {filteredPrograms.length === 0 ? (
                        <Typography
                            color="text.secondary"
                            sx={{ py: 4, textAlign: "center" }}
                        >
                            No programs found.
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, 1fr)",
                                    lg: "repeat(3, 1fr)",
                                },
                                gap: 3,
                            }}
                        >
                            {filteredPrograms.map((program) => {
                                /*
                                 * Each `program` is now an individual
                                 * Program MongoDB document.
                                 *
                                 * Example:
                                 *
                                 * {
                                 *   _id,
                                 *   institutionId,
                                 *   degree_name,
                                 *   level,
                                 *   field,
                                 *   duration,
                                 *   tuition_fees,
                                 *   intakes,
                                 *   entry_requirements,
                                 *   campuses,
                                 *   url
                                 * }
                                 */

                                const levelKey =
                                    program.level === "Bachelor" ||
                                        program.level === "Diploma"
                                        ? "undergraduate"
                                        : "postgraduate";

                                const institutionEntry =
                                    institution?.entryRequirements?.[levelKey];

                                const institutionGPA =
                                    institutionEntry?.gpa;

                                const institutionLanguage =
                                    institutionEntry?.languageRequirement || [];

                                const programAcademic =
                                    program.entry_requirements?.academic;

                                const programLanguage =
                                    program.entry_requirements
                                        ?.language_requirements;

                                const hasProgramAcademic =
                                    !!(
                                        programAcademic?.minimum_qualification ||
                                        programAcademic?.field_requirement ||
                                        programAcademic?.score != null
                                    );

                                const hasProgramLanguage =
                                    !!(
                                        hasLanguageScore(programLanguage?.english?.ielts) ||
                                        hasLanguageScore(programLanguage?.english?.toefl) ||
                                        hasLanguageScore(programLanguage?.english?.pte) ||
                                        hasLanguageScore(programLanguage?.english?.duolingo) ||
                                        programLanguage?.english?.cambridge ||
                                        programLanguage?.english?.cefr ||
                                        programLanguage?.german?.cefr ||
                                        hasLanguageScore(programLanguage?.german?.testdaf) ||
                                        hasLanguageScore(programLanguage?.german?.dsh)
                                    );

                                const hasInstitutionAcademic =
                                    institutionGPA?.score != null;

                                const showAcademic =
                                    hasProgramAcademic ||
                                    hasInstitutionAcademic;

                                const getIndividualLanguageScores = (score = {}) =>
                                    [
                                        ["Minimum", score?.minimum_band],
                                        ["Listening", score?.listening],
                                        ["Reading", score?.reading],
                                        ["Writing", score?.writing],
                                        ["Speaking", score?.speaking],
                                        ["Literacy", score?.literacy],
                                        ["Comprehension", score?.comprehension],
                                        ["Conversation", score?.conversation],
                                        ["Production", score?.production],
                                    ]
                                        .filter(([, value]) => value !== undefined && value !== null && value !== "")
                                        .map(([label, value]) => `${label}: ${value}`);

                                const languageRequirementItems = hasProgramLanguage
                                    ? [
                                        hasLanguageScore(programLanguage?.english?.ielts) && { label: `IELTS ${programLanguage.english.ielts.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.english.ielts) },
                                        hasLanguageScore(programLanguage?.english?.toefl) && { label: `TOEFL ${programLanguage.english.toefl.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.english.toefl) },
                                        hasLanguageScore(programLanguage?.english?.pte) && { label: `PTE ${programLanguage.english.pte.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.english.pte) },
                                        hasLanguageScore(programLanguage?.english?.duolingo) && { label: `Duolingo ${programLanguage.english.duolingo.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.english.duolingo) },
                                        programLanguage?.english?.cambridge && { label: `Cambridge ${programLanguage.english.cambridge}`, scores: [] },
                                        programLanguage?.english?.cefr && { label: `English CEFR ${programLanguage.english.cefr}`, scores: [] },
                                        programLanguage?.german?.cefr && { label: `German CEFR ${programLanguage.german.cefr}`, scores: [] },
                                        hasLanguageScore(programLanguage?.german?.testdaf) && { label: `TestDaF ${programLanguage.german.testdaf.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.german.testdaf) },
                                        hasLanguageScore(programLanguage?.german?.dsh) && { label: `DSH ${programLanguage.german.dsh.overall ?? ""}`, scores: getIndividualLanguageScores(programLanguage.german.dsh) },
                                    ].filter(Boolean)
                                    : institutionLanguage.map((test) => ({
                                        label: `${test.testType || "Test"}${test.overall ? ` ${test.overall}` : ""}`,
                                        scores: getIndividualLanguageScores(test),
                                    }));
                                const languageRequirements = languageRequirementItems.map((item) =>
                                    formatLanguageRequirement(item.label, item.scores)
                                );
                                const languageRequirementsText = languageRequirements.join(" | ");
                                const scrollLanguageRequirements = languageRequirementsText.length > 38;

                                const showLanguage = languageRequirements.length > 0;

                                const specializations = (
                                    Array.isArray(program.specialization)
                                        ? program.specialization
                                        : [program.specialization]
                                ).filter((value) => typeof value === "string" && value.trim())
                                    .map((value) => value.trim());
                                const specializationsText = specializations.join(" | ");
                                const scrollSpecializations = specializationsText.length > 48;

                                const rawAdditionalRequirements =
                                    program.entry_requirements
                                        ?.additional_requirements;
                                const additionalRequirements = (
                                    Array.isArray(rawAdditionalRequirements)
                                        ? rawAdditionalRequirements
                                        : typeof rawAdditionalRequirements === "string"
                                            ? rawAdditionalRequirements.split(/\r?\n|\s*\|\s*/)
                                            : []
                                )
                                    .map((requirement) => String(requirement).trim())
                                    .filter(Boolean);
                                const additionalRequirementsText =
                                    additionalRequirements.join(" | ");
                                const scrollAdditionalRequirements =
                                    additionalRequirementsText.length > 48;

                                const hasEntryRequirements =
                                    showAcademic ||
                                    showLanguage ||
                                    additionalRequirements.length > 0;

                                return (
                                    <Card
                                        key={program._id}
                                        sx={{
                                            borderRadius: 3,
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            position: "relative",
                                            transition: "0.2s",
                                            "&:hover": {
                                                boxShadow: 4,
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        {/* Admin actions */}
                                        {isAdmin &&
                                            isEditMode &&
                                            onEditProgram &&
                                            onDeleteProgram && (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        display: "flex",
                                                        gap: 1,
                                                        zIndex: 10,
                                                    }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            onEditProgram(program)
                                                        }
                                                        sx={{
                                                            backgroundColor:
                                                                "rgba(79, 70, 229, 0.9)",
                                                            color: "white",
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    "#4338ca",
                                                            },
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            onDeleteProgram(program)
                                                        }
                                                        sx={{
                                                            backgroundColor:
                                                                "rgba(239, 68, 68, 0.9)",
                                                            color: "white",
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    "#dc2626",
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}

                                        <CardContent
                                            sx={{
                                                p: 2.5,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1.25,
                                                flex: 1,
                                            }}
                                        >
                                            {/* Title */}
                                            <Box
                                                sx={{
                                                    pr:
                                                        isAdmin && isEditMode
                                                            ? 8
                                                            : 0,
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    fontWeight="bold"
                                                    sx={{
                                                        lineHeight: 1.3,
                                                        overflowWrap: "anywhere",
                                                    }}
                                                >
                                                    {program.degree_name ||
                                                        program.name}
                                                </Typography>

                                                {program.field && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            mt: 0.5,
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 1,
                                                            WebkitBoxOrient:
                                                                "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {program.field_other || program.field}
                                                    </Typography>
                                                )}
                                                {specializations.length > 0 && (
                                                    <Box sx={{ mt: 0.5, minWidth: 0 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Specializations:
                                                        </Typography>
                                                        <Tooltip arrow placement="top" title={
                                                            <Box component="ul" sx={{ m: 0, py: 0.5, pl: 2, overflowWrap: "anywhere" }}>
                                                                {specializations.map((specialization, index) => (
                                                                    <Typography component="li" variant="body2" key={index}
                                                                        sx={{ mb: index < specializations.length - 1 ? 0.5 : 0 }}>
                                                                        {specialization}
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        }>
                                                            <Box tabIndex={0} sx={{
                                                                width: "100%", overflow: "hidden", whiteSpace: "nowrap", cursor: "help",
                                                                "@keyframes specializationsTicker": {
                                                                    from: { transform: "translateX(0)" },
                                                                    to: { transform: "translateX(-50%)" },
                                                                },
                                                                "&:hover .specializations-ticker, &:focus .specializations-ticker": {
                                                                    animationPlayState: "paused",
                                                                },
                                                            }}>
                                                                <Typography component="div" variant="body2" color="text.secondary"
                                                                    className="specializations-ticker" sx={{
                                                                        display: "inline-flex", width: "max-content",
                                                                        ...(scrollSpecializations && {
                                                                            animation: `specializationsTicker ${Math.max(22, specializationsText.length * 0.42)}s linear infinite`,
                                                                        }),
                                                                        "@media (prefers-reduced-motion: reduce)": {
                                                                            animation: "none", width: "100%", whiteSpace: "normal", overflowWrap: "anywhere",
                                                                            "& > [aria-hidden]": { display: "none" },
                                                                        },
                                                                    }}>
                                                                    <Box component="span" sx={{ pr: scrollSpecializations ? 4 : 0 }}>
                                                                        {specializationsText}{scrollSpecializations && " |"}
                                                                    </Box>
                                                                    {scrollSpecializations && (
                                                                        <Box component="span" sx={{ pr: 4 }} aria-hidden="true">
                                                                            {specializationsText} |
                                                                        </Box>
                                                                    )}
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Box>

                                            <Divider />

                                            {/* Compact program metadata */}
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                                    gap: 1.5,
                                                    alignItems: "start",
                                                }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Level
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="medium" noWrap title={program.level || "Not specified"}>
                                                        {program.level || "—"}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                                                        Status
                                                    </Typography>
                                                    <Chip
                                                        label={program.isActive !== false ? "Active" : "Inactive"}
                                                        color={program.isActive !== false ? "success" : "default"}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 22, "& .MuiChip-label": { px: 1 } }}
                                                    />
                                                </Box>

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Duration
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="medium" noWrap title={program.duration || "Not specified"}>
                                                        {program.duration || "—"}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {program.tuition_fees?.length > 0 && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Tuition
                                                    </Typography>
                                                    {program.tuition_fees.map((fee, index) => (
                                                        <Typography key={index} variant="body2" fontWeight="bold" color="primary.main">
                                                            {fee?.credits}
                                                            {fee?.annual_fee_eur != null &&
                                                                ` · ${Number(fee.annual_fee_eur).toLocaleString()}${institution?.country?.currency ? ` ${institution.country.currency}` : ""}`}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Intakes */}
                                            {program.intakes?.length > 0 && (
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                        sx={{ mb: 0.5 }}
                                                    >
                                                        Intakes
                                                    </Typography>

                                                    <ProgramDetailsTicker items={sortIntakesByMonth(program.intakes)} />
                                                </Box>
                                            )}

                                            {/* Entry requirements */}
                                            {hasEntryRequirements && (
                                                <>
                                                    <Divider />

                                                    <Box>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            fontWeight="medium"
                                                            display="block"
                                                            sx={{ mb: 0.75 }}
                                                        >
                                                            Entry Requirements
                                                        </Typography>

                                                        {/* Academic */}
                                                        {showAcademic && (
                                                            <Box sx={{ mb: 1 }}>
                                                                {hasProgramAcademic ? (
                                                                    <>
                                                                        {programAcademic?.minimum_qualification && (
                                                                            <Typography variant="body2">
                                                                                <b>
                                                                                    Academic:
                                                                                </b>{" "}
                                                                                {
                                                                                    programAcademic.minimum_qualification
                                                                                }
                                                                            </Typography>
                                                                        )}

                                                                        {programAcademic?.field_requirement && (
                                                                            <Typography variant="body2">
                                                                                <b>
                                                                                    Field:
                                                                                </b>{" "}
                                                                                {
                                                                                    programAcademic.field_requirement
                                                                                }
                                                                            </Typography>
                                                                        )}

                                                                        {programAcademic?.score !=
                                                                            null && (
                                                                                <Typography variant="body2">
                                                                                    <b>
                                                                                        {programAcademic.score_type ||
                                                                                            "Score"}
                                                                                        :
                                                                                    </b>{" "}
                                                                                    {
                                                                                        programAcademic.score
                                                                                    }
                                                                                    {programAcademic.scale &&
                                                                                        ` / ${programAcademic.scale}`}
                                                                                </Typography>
                                                                            )}
                                                                    </>
                                                                ) : (
                                                                    <Typography variant="body2">
                                                                        <b>
                                                                            Minimum{" "}
                                                                            {institutionGPA?.type ||
                                                                                "GPA"}
                                                                            :
                                                                        </b>{" "}
                                                                        {
                                                                            institutionGPA?.score
                                                                        }
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* Language */}
                                                        {showLanguage && (
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight="medium"
                                                                    sx={{ mb: 0.5 }}
                                                                >
                                                                    Language:
                                                                </Typography>

                                                                <Tooltip
                                                                    arrow
                                                                    placement="top"
                                                                    title={
                                                                        <Box sx={{ py: 0.5 }}>
                                                                            {languageRequirementItems.map((requirement, index) => (
                                                                                <Box
                                                                                    key={index}
                                                                                    sx={{ mb: index < languageRequirementItems.length - 1 ? 1 : 0 }}
                                                                                >
                                                                                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.5 }}>
                                                                                        {requirement.label}
                                                                                    </Typography>
                                                                                    {requirement.scores.length > 0 && (
                                                                                        <Typography variant="caption" sx={{ display: "block", lineHeight: 1.5, opacity: 0.9 }}>
                                                                                            {requirement.scores.join(" | ")}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    }
                                                                >
                                                                    <Box
                                                                        sx={{
                                                                            width: "100%",
                                                                            overflow: "hidden",
                                                                            whiteSpace: "nowrap",
                                                                            cursor: "help",
                                                                            "@keyframes languageRequirementsTicker": {
                                                                                from: { transform: "translateX(0)" },
                                                                                to: { transform: "translateX(-50%)" },
                                                                            },
                                                                            "&:hover .language-requirements-ticker": {
                                                                                animationPlayState: "paused",
                                                                            },
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            className="language-requirements-ticker"
                                                                            variant="body2"
                                                                            component="div"
                                                                            sx={{
                                                                                display: "inline-flex",
                                                                                width: "max-content",
                                                                                ...(scrollLanguageRequirements && {
                                                                                    animation: `languageRequirementsTicker ${Math.max(
                                                                                        15,
                                                                                        languageRequirementsText.length * 0.28
                                                                                    )}s linear infinite`,
                                                                                }),
                                                                                "@media (prefers-reduced-motion: reduce)": {
                                                                                    animation: "none", width: "100%", whiteSpace: "normal", overflowWrap: "anywhere",
                                                                                    "& > [aria-hidden]": { display: "none" },
                                                                                },
                                                                            }}
                                                                        >
                                                                            <Box component="span" sx={{ pr: scrollLanguageRequirements ? 4 : 0 }}>
                                                                                {languageRequirementsText}
                                                                                {scrollLanguageRequirements && " |"}
                                                                            </Box>
                                                                            {scrollLanguageRequirements && (
                                                                                <Box component="span" sx={{ pr: 4 }} aria-hidden="true">
                                                                                    {languageRequirementsText} |
                                                                                </Box>
                                                                            )}
                                                                        </Typography>
                                                                    </Box>
                                                                </Tooltip>
                                                            </Box>
                                                        )}

                                                        {/* Additional */}
                                                        {additionalRequirements.length >
                                                            0 && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        fontWeight="medium"
                                                                    >
                                                                        Additional:
                                                                    </Typography>

                                                                    <Tooltip
                                                                        arrow
                                                                        placement="top"
                                                                        title={
                                                                            <Box sx={{ py: 0.5 }}>
                                                                                {additionalRequirements.map((requirement, index) => (
                                                                                    <Typography
                                                                                        key={index}
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            lineHeight: 1.5,
                                                                                            mb: index < additionalRequirements.length - 1 ? 0.75 : 0,
                                                                                        }}
                                                                                    >
                                                                                        {requirement}
                                                                                    </Typography>
                                                                                ))}
                                                                            </Box>
                                                                        }
                                                                    >
                                                                        <Box
                                                                            sx={{
                                                                                mt: 0.5,
                                                                                width: "100%",
                                                                                overflow: "hidden",
                                                                                whiteSpace: "nowrap",
                                                                                cursor: "help",
                                                                                "@keyframes additionalRequirementsTicker": {
                                                                                    from: { transform: "translateX(0)" },
                                                                                    to: { transform: "translateX(-50%)" },
                                                                                },
                                                                                "&:hover .additional-requirements-ticker": {
                                                                                    animationPlayState: "paused",
                                                                                },
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                className="additional-requirements-ticker"
                                                                                variant="body2"
                                                                                component="div"
                                                                                sx={{
                                                                                    display: "inline-flex",
                                                                                    width: "max-content",
                                                                                    ...(scrollAdditionalRequirements && {
                                                                                        animation: `additionalRequirementsTicker ${Math.max(
                                                                                            22,
                                                                                            additionalRequirementsText.length * 0.42
                                                                                        )}s linear infinite`,
                                                                                    }),
                                                                                }}
                                                                            >
                                                                                <Box component="span" sx={{ pr: scrollAdditionalRequirements ? 4 : 0 }}>
                                                                                    {additionalRequirementsText}
                                                                                    {scrollAdditionalRequirements && " |"}
                                                                                </Box>
                                                                                {scrollAdditionalRequirements && (
                                                                                    <Box component="span" sx={{ pr: 4 }} aria-hidden="true">
                                                                                        {additionalRequirementsText} |
                                                                                    </Box>
                                                                                )}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Tooltip>
                                                                </Box>
                                                            )}
                                                    </Box>
                                                </>
                                            )}

                                            {/* Campuses */}
                                            {program.campuses?.length > 0 && (
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                        sx={{ mb: 0.5 }}
                                                    >
                                                        Campuses
                                                    </Typography>

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: 0.5,
                                                        }}
                                                    >
                                                        {program.campuses
                                                            .slice(0, 4)
                                                            .map((campus, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={campus}
                                                                    size="small"
                                                                />
                                                            ))}

                                                        {program.campuses.length > 4 && (
                                                            <Chip
                                                                label={`+${program.campuses.length -
                                                                    4
                                                                    }`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* URL */}
                                            {program.url && (
                                                <Box
                                                    sx={{
                                                        mt: "auto",
                                                        pt: 1,
                                                    }}
                                                >
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        endIcon={
                                                            <OpenInNewIcon />
                                                        }
                                                        href={program.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            textTransform: "none",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Visit Program Page
                                                    </Button>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            );

        case 3: {
            const allIntakes = sortIntakesByMonth([
                ...new Set(
                    programs.flatMap((program) =>
                        Array.isArray(program.intakes)
                            ? program.intakes
                            : typeof program.intakes === "string"
                                ? program.intakes.split(",").map((intake) => intake.trim()).filter(Boolean)
                                : []
                    )
                ),
            ]);

            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Available Intakes
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Intakes available across all programs offered by this institution.
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(3, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {allIntakes.length ? (
                            allIntakes.map((intake, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                        }}
                                    />

                                    <Typography variant="body1" fontWeight="medium">
                                        {intake}
                                    </Typography>
                                </Paper>
                            ))
                        ) : (
                            <Typography color="text.secondary">No intake information available.</Typography>
                        )}
                    </Box>
                </Paper>
            );
        }

        case 4: {
            const hasInstitutionScholarshipValue = institution?.scholarships?.some(
                (scholarship) => hasValue(scholarship.value)
            );
            const normalizeScholarship = (value) => String(value).trim().replace(/\s+/g, " ").toLowerCase();
            const groupedScholarships = new Map();
            (hasInstitutionScholarshipValue ? [] : programs).forEach((program) => {
                if (!hasValue(program.scholarship?.description)) return;
                const value = program.scholarship.description.trim();
                const key = normalizeScholarship(value);
                if (!groupedScholarships.has(key)) {
                    groupedScholarships.set(key, {
                        name: "Program scholarship",
                        value,
                        description: value,
                        url: program.scholarship.url,
                        programNames: [],
                    });
                }
                const group = groupedScholarships.get(key);
                if (hasValue(program.name) && !group.programNames.includes(program.name)) {
                    group.programNames.push(program.name);
                }
                if (!group.url && program.scholarship.url) group.url = program.scholarship.url;
            });
            const programScholarships = [...groupedScholarships.values()];
            const fallbackValue = programScholarships.map(({ value }) => value).join("; ");
            const displayScholarships = institution?.scholarships?.length
                ? institution.scholarships.map((scholarship) => ({
                    ...scholarship,
                    value: hasValue(scholarship.value) ? scholarship.value : fallbackValue,
                    programNames: hasValue(scholarship.value)
                        ? groupedScholarships.get(normalizeScholarship(scholarship.value))?.programNames || []
                        : [...new Set(programScholarships.flatMap(({ programNames }) => programNames))],
                }))
                : programScholarships;

            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}> <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Scholarships </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Scholarships and financial aid opportunities available for eligible
                        international students.
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                lg: "repeat(3, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        {displayScholarships.map((scholarship, index) => (
                            <Card
                                key={index}
                                sx={{
                                    borderRadius: 3,
                                    minHeight: 380,
                                    height: 550,
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "0.2s",
                                    "&:hover": {
                                        boxShadow: 4,
                                        transform: "translateY(-2px)",
                                    },
                                }}
                            >
                                <CardContent
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        flex: 1,
                                        minHeight: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold">
                                        {scholarship.name}
                                    </Typography>

                                    {scholarship.value && String(scholarship.value).length > 24 && (
                                        <Tooltip title={String(scholarship.value)} arrow describeChild>
                                        <Box
                                            tabIndex={0}
                                            aria-label={`Scholarship value: ${scholarship.value}`}
                                            sx={{
                                                py: 0.75,
                                                overflow: "hidden",
                                                whiteSpace: "nowrap",
                                                bgcolor: "success.main",
                                                color: "success.contrastText",
                                                borderRadius: 5,
                                                "@keyframes scholarshipTickerRightToLeft": {
                                                    from: { transform: "translateX(0)" },
                                                    to: { transform: "translateX(-50%)" },
                                                },
                                                "&:hover .scholarship-ticker, &:focus .scholarship-ticker": {
                                                    animationPlayState: "paused",
                                                },
                                            }}
                                        >
                                            <Typography
                                                className="scholarship-ticker"
                                                variant="body2"
                                                sx={{
                                                    display: "inline-block",
                                                    width: "max-content",
                                                    fontWeight: 700,
                                                    animation: `scholarshipTickerRightToLeft ${Math.max(
                                                        35,
                                                        String(scholarship.value).length * 0.55
                                                    )}s linear infinite`,
                                                    willChange: "transform",
                                                }}
                                            >
                                                <Box component="span" sx={{ display: "inline-block", px: 1.5 }}>
                                                    {scholarship.value} &nbsp;|&nbsp; {scholarship.value} &nbsp;|&nbsp;
                                                </Box>
                                                <Box component="span" aria-hidden="true" sx={{ display: "inline-block", px: 1.5 }}>
                                                    {scholarship.value} &nbsp;|&nbsp; {scholarship.value} &nbsp;|&nbsp;
                                                </Box>
                                            </Typography>
                                        </Box>
                                        </Tooltip>
                                    )}

                                    {scholarship.value && String(scholarship.value).length <= 24 && (
                                        <Chip
                                            label={scholarship.value}
                                            color="success"
                                            size="small"
                                            sx={{ alignSelf: "flex-start", maxWidth: "100%" }}
                                        />
                                    )}

                                    <Divider />

                                    <Box
                                        sx={{
                                            flex: 1,
                                            minHeight: 0,
                                            overflowY: "auto",
                                            pr: 0.5,
                                            scrollbarWidth: "thin",
                                            "&::-webkit-scrollbar": { width: 6 },
                                            "&::-webkit-scrollbar-thumb": {
                                                bgcolor: "action.disabled",
                                                borderRadius: 3,
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 1 }}
                                        >
                                            Description
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{ textAlign: "justify", textJustify: "inter-word" }}
                                        >
                                            {scholarship.description}
                                        </Typography>
                                        {scholarship.programNames.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Programs ({scholarship.programNames.length})
                                                </Typography>
                                                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                                    {scholarship.programNames.map((name) => (
                                                        <Typography
                                                            component="li"
                                                            key={name}
                                                            variant="body2"
                                                            sx={{ mb: 0.75, overflowWrap: "anywhere" }}
                                                        >
                                                            {name}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>

                                    {scholarship.url && (
                                        <Button
                                            href={scholarship.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="outlined"
                                            size="small"
                                            endIcon={<OpenInNewIcon />}
                                            sx={{ mt: "auto", alignSelf: "flex-start" }}
                                        >
                                            View scholarship
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>

            );


        }
        case 5:
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Institution Entry Requirements
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Minimum academic and language requirements for admission to this institution.
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(2, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        {/* Undergraduate */}
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Undergraduate</Typography>
                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Minimum {undergraduateEntry.gpa?.type || "GPA"}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {hasValue(undergraduateEntry.gpa?.score)
                                            ? `${undergraduateEntry.gpa.score}${hasValue(undergraduateEntry.gpa?.scale) ? ` / ${undergraduateEntry.gpa.scale}` : ""}`
                                            : undergraduateEntry.gpa?.minimumQualification || "N/A"}
                                    </Typography>
                                    {undergraduateEntry.gpa?.minimumQualification && hasValue(undergraduateEntry.gpa?.score) && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {undergraduateEntry.gpa.minimumQualification}
                                        </Typography>
                                    )}
                                    {undergraduateEntry.gpa?.fieldRequirement && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Field: {undergraduateEntry.gpa.fieldRequirement}
                                        </Typography>
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Language Requirements
                                    </Typography>
                                    {undergraduateEntry.languageRequirement.length > 0 ? (
                                        undergraduateEntry.languageRequirement.map((test, idx) => (
                                            <Typography key={idx} variant="body2" fontWeight="medium">
                                                {test.testType || test.testName || 'Test'}{test.overall ? ` ${test.overall}` : ''}
                                                {test.hasIndividualScores && (
                                                    <span style={{ fontSize: '0.8rem', color: 'gray', marginLeft: 8 }}>
                                                        (indiv: {test.listening || ''} {test.reading || ''} {test.writing || ''} {test.speaking || ''})
                                                    </span>
                                                )}
                                            </Typography>
                                        ))
                                    ) : (
                                        <Typography variant="body2">N/A</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Postgraduate */}
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Postgraduate</Typography>
                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Minimum {postgraduateEntry.gpa?.type || "GPA"}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {hasValue(postgraduateEntry.gpa?.score)
                                            ? `${postgraduateEntry.gpa.score}${hasValue(postgraduateEntry.gpa?.scale) ? ` / ${postgraduateEntry.gpa.scale}` : ""}`
                                            : postgraduateEntry.gpa?.minimumQualification || "N/A"}
                                    </Typography>
                                    {postgraduateEntry.gpa?.minimumQualification && hasValue(postgraduateEntry.gpa?.score) && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {postgraduateEntry.gpa.minimumQualification}
                                        </Typography>
                                    )}
                                    {postgraduateEntry.gpa?.fieldRequirement && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Field: {postgraduateEntry.gpa.fieldRequirement}
                                        </Typography>
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Language Requirements
                                    </Typography>
                                    {postgraduateEntry.languageRequirement.length > 0 ? (
                                        postgraduateEntry.languageRequirement.map((test, idx) => (
                                            <Typography key={idx} variant="body2" fontWeight="medium">
                                                {test.testType || test.testName || 'Test'}{test.overall ? ` ${test.overall}` : ''}
                                                {test.hasIndividualScores && (
                                                    <span style={{ fontSize: '0.8rem', color: 'gray', marginLeft: 8 }}>
                                                        (indiv: {test.listening || ''} {test.reading || ''} {test.writing || ''} {test.speaking || ''})
                                                    </span>
                                                )}
                                            </Typography>
                                        ))
                                    ) : (
                                        <Typography variant="body2">N/A</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Paper>
            );


        case 6:
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}> <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Application Deadlines </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Important admission and application deadlines for this institution.
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                lg: "repeat(3, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                    Last Application Deadline
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                    {institution?.deadlines?.lastApplicationDeadline || "Not specified"}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                    Document Submission Deadline
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                    {institution?.deadlines?.documentSubmissionDeadline || "Not specified"}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                    Scholarship Application Deadline
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                    {institution?.deadlines?.scholarshipDeadline || "Not specified"}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                    Offer Acceptance Deadline
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                    {institution?.deadlines?.offerAcceptanceDeadline || "Not specified"}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">
                                    Orientation / Enrollment Date
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                                    {institution?.deadlines?.orientationDate || "Not specified"}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Paper>

            );


        case 7: {
            const hasDocuments = hasDocumentRequirements(institution?.documents);
            const programRequirements = hasDocuments ? [] : getProgramAdditionalRequirements(programs);
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Document Requirements
                    </Typography>

                    {!hasDocuments ? (
                        <ProgramDocumentRequirements requirements={programRequirements} totalPrograms={programs.length} />
                    ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography fontWeight="bold">Income Sources</Typography>
                            <List dense>
                                {institution?.documents?.incomeSources?.length ? (
                                    institution.documents.incomeSources.map((item, i) => (
                                        <ListItem key={i}>
                                            <ListItemText primary={item} />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="Not specified" />
                                    </ListItem>
                                )}
                            </List>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography fontWeight="bold">Accepted Sponsors</Typography>
                            <List dense>
                                {institution?.documents?.sponsors?.length ? (
                                    institution.documents.sponsors.map((item, i) => (
                                        <ListItem key={i}>
                                            <ListItemText primary={item} />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="Not specified" />
                                    </ListItem>
                                )}
                            </List>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography fontWeight="bold">Accepted Banks</Typography>
                            <List dense>
                                {institution?.documents?.banks?.length ? (
                                    institution.documents.banks.map((item, i) => (
                                        <ListItem key={i}>
                                            <ListItemText primary={item} />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="Not specified" />
                                    </ListItem>
                                )}
                            </List>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography fontWeight="bold">Minimum Sponsor Count</Typography>
                            <Typography>{institution?.documents?.minSponsorCount || "N/A"}</Typography>

                            <Box sx={{ mt: 2 }}>
                                <Typography fontWeight="bold">Minimum Income Amount</Typography>
                                <Typography>{institution?.documents?.minIncomeAmount || "N/A"}</Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography fontWeight="bold">Previous Visa Refusal</Typography>
                                <Typography>{institution?.documents?.previousVisaRefusal || "N/A"}</Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography fontWeight="bold">Level Change After Refusal</Typography>
                                <Typography>
                                    {institution?.documents?.levelChangeAfterRefusal ? "Yes" : "No"}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    )}
                </Paper>
            );
        }

        default:
            return null;

    }
}
