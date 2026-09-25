import { hasResolvedRequirements, resolveProgramRequirements } from "../../utils/resolveProgramRequirements";
import { resolveProgramLocations } from "../../utils/programLocations";
import ProgramEntryRequirements from "./ProgramEntryRequirements";
import { normalizeProgramFields } from "../../constants/programFields";
import { tuitionFeeText } from '../../utils/tuitionFees';
import React, { useEffect, useState } from "react";
import ListingFlags from "../admin/ListingFlags";
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
import { hasLanguageScore } from "../../utils/formatLanguageRequirement";
import ProgramDetailsTicker from "./ProgramDetailsTicker";
import ProgramLoadMore from "./ProgramLoadMore";
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
        gpa: [institutionGpa?.score, institutionGpa?.minimumQualification, institutionGpa?.fieldRequirement]
            .some(hasValue) ? institutionGpa : programFallback.gpa,
        languageRequirement: institutionLanguages.length
            ? institutionLanguages
            : programFallback.languageRequirement,
    };
};

export default function InstitutionTabsContent({
    onProgramFlagsSaved,
    activeTab,
    institution,
    programs = [],
    programList,
    programSummary,
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
    selectedStatus = "active",
    setSelectedStatus,
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
        const latestCampuses = institution?.campuses?.length ? institution.campuses : programSummary?.campuses || getDisplayCampuses(institution, programs);

        setSelectedCampus((currentCampus) => {
            if (latestCampuses.length === 0) return null;

            const matchingCampus = latestCampuses.find((campus) =>
                currentCampus?._id && campus?._id
                    ? String(campus._id) === String(currentCampus._id)
                    : campus?.name === currentCampus?.name
            );

            return matchingCampus || latestCampuses[0];
        });
    }, [institution, programs, programSummary]);

    const undergraduateEntry = resolveEntryRequirement(
        institution?.entryRequirements?.undergraduate,
        programSummary?.undergraduate || deriveLowestProgramRequirements(programs, true)
    );
    const postgraduateEntry = resolveEntryRequirement(
        institution?.entryRequirements?.postgraduate,
        programSummary?.postgraduate || deriveLowestProgramRequirements(programs, false)
    );
    const sortedIntakes = sortIntakesByMonth(intakes);

    if (programList && !programSummary && activeTab !== 2) {
        return <ProgramLoadMore loading={!programList.summaryError}
            error={programList.summaryError} retry={programList.reload} />;
    }

    switch (activeTab) {
        case 0:
            return (
                <>
                    <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Why {institution?.name || "this university"}?
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                            {institution?.whyUniversity?.trim() || "Reasons to choose this university have not been added yet."}
                        </Typography>
                    </Paper>

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
            const displayCampuses = institution?.campuses?.length ? institution.campuses : programSummary?.campuses || getDisplayCampuses(institution, programs);
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
                                lg: isAdmin && setSelectedStatus ? "2fr repeat(5, 1fr)" : "2fr 1fr 1fr 1fr 1fr",
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
                        {isAdmin && setSelectedStatus && (
                            <TextField
                                select
                                fullWidth
                                label="Program Status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Not Active</MenuItem>
                            </TextField>
                        )}

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
                            {programList?.loading || programList?.error ? "" : "No programs found."}
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
                            {[...filteredPrograms].sort((a, b) =>
                                Number(Boolean(a.isDimmed)) - Number(Boolean(b.isDimmed)) ||
                                Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))
                            ).map((program) => {
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

                                const requirements = resolveProgramRequirements(program, institution);
                                const programLocations = resolveProgramLocations(program, institution);
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
                                    hasResolvedRequirements(requirements) ||
                                    additionalRequirements.length > 0;

                                return (
                                    <Card
                                        key={program._id}
                                        inert={!isAdmin && Boolean(program.isDimmed || institution?.isDimmed)}
                                        aria-disabled={!isAdmin && Boolean(program.isDimmed || institution?.isDimmed)}
                                        sx={{
                                            opacity: !isAdmin && (program.isDimmed || institution?.isDimmed) ? 0.45 : 1,
                                            pointerEvents: !isAdmin && (program.isDimmed || institution?.isDimmed) ? "none" : "auto",
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
                                        {isAdmin && onProgramFlagsSaved && (
                                            <Box sx={{ p: 1, pr: isEditMode && onEditProgram && onDeleteProgram ? 11 : 1 }}>
                                            <ListingFlags item={program} resource="program" onSaved={onProgramFlagsSaved} />
                                            </Box>
                                        )}
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

                                                {normalizeProgramFields(program.field).length > 0 && (
                                                    <Box sx={{ mt: 0.5, minWidth: 0, color: "text.secondary" }}>
                                                        <ProgramDetailsTicker items={normalizeProgramFields(program.field)} />
                                                    </Box>
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
                                                            {tuitionFeeText(fee)}
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

                                                        {hasResolvedRequirements(requirements) && <ProgramEntryRequirements requirements={requirements} />}

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
                                            {programLocations.length > 0 && (
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
                                                        {programLocations
                                                            .slice(0, 4)
                                                            .map((campus, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={campus}
                                                                    size="small"
                                                                />
                                                            ))}

                                                        {programLocations.length > 4 && (
                                                            <Chip
                                                                label={`+${programLocations.length -
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
                    {programList && <ProgramLoadMore
                        loading={programList.loading}
                        error={programList.error}
                        hasMore={programList.pagination.hasMore}
                        loadMore={programList.loadMore}
                        retry={programList.retry}
                    />}
                </Paper>
            );

        case 3: {
            const allIntakes = sortIntakesByMonth(programSummary?.intakes || [
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
            const programScholarships = hasInstitutionScholarshipValue ? [] : programSummary?.scholarships || [...groupedScholarships.values()];
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

                    {[
                        { title: null, entries: [
                            ["Diploma", { ...institution?.entryRequirements?.diploma,
                                languageRequirement: institution?.entryRequirements?.diploma?.languageRequirement || [] }],
                            ["Undergraduate", undergraduateEntry], ["Postgraduate", postgraduateEntry],
                        ] },
                        {
                            title: "Field-specific Requirements",
                            entries: (institution?.entryRequirements?.fields || []).map(item => [
                                `${item.field} — ${item.level === "diploma" ? "Diploma" : item.level === "postgraduate" ? "Postgraduate" : "Undergraduate"}`,
                                { ...item.requirements, languageRequirement: item.requirements?.languageRequirement || [] },
                            ]),
                        },
                    ].filter(section => section.entries.length).map(section => <Box key={section.title || "general"} sx={{ mb: 3 }}>
                    {section.title && <>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>{section.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            These requirements apply to programs with the matching field and study level. Unspecified values use the general requirements; program-specific requirements take precedence.
                        </Typography>
                    </>}
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
                        {section.entries.map(([label, entry]) => (
                            <Card key={label} sx={{ borderRadius: 3 }}>
                                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">{label}</Typography>
                                    <Divider />
                                    <Typography variant="subtitle2" fontWeight="bold">Academic Requirements</Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2 }}>
                                        {[
                                            ["Minimum Qualification", entry.gpa?.minimumQualification],
                                            ["Score Type", entry.gpa?.type],
                                            ["Score", entry.gpa?.score],
                                            ["Scale", entry.gpa?.scale],
                                        ].map(([name, value]) => <Box key={name} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                                            <Typography variant="caption" color="text.secondary">{name}</Typography>
                                            <Typography variant="body2">{hasValue(value) ? value : "Not specified"}</Typography>
                                        </Box>)}
                                    </Box>
                                    <Divider />
                                    <Typography variant="subtitle2" fontWeight="bold">Language Requirements & Individual Band Scores</Typography>
                                    {entry.languageRequirement.length ? entry.languageRequirement.map((test, index) => (
                                        <Box key={index}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {test.testType === "Other" ? test.testName || "Other" : test.testType || test.testName || "Test"}
                                            </Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                {[
                                                    ["Overall", test.overall],
                                                    ["Minimum Band", test.minimum_band ?? test.minimum],
                                                    ...["listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"]
                                                        .map(field => [field[0].toUpperCase() + field.slice(1), test[field]]),
                                                ].filter(([, score]) => hasValue(score)).map(([name, score]) => (
                                                    <Typography key={name} variant="body2">{name}: {score}</Typography>
                                                ))}
                                            </Box>
                                        </Box>
                                    )) : <Typography variant="body2">Not specified</Typography>}
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                    </Box>)}
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
            const programRequirements = hasDocuments ? [] : programSummary?.documents || getProgramAdditionalRequirements(programs);
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Document Requirements
                    </Typography>

                    {!hasDocuments ? (
                        <ProgramDocumentRequirements requirements={programRequirements} totalPrograms={programSummary?.total ?? programs.length} />
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
