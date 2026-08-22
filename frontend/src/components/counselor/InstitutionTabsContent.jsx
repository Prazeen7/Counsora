import React, { useState } from "react";
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
} from "@mui/material";
import {
    OpenInNew as OpenInNewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import { getDisplayCampuses } from "../../utils/DisplayCampuses";

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
}) {
    const [selectedCampus, setSelectedCampus] = useState(
        institution?.campuses?.[0] || null
    );

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
                                        <strong>Address:</strong> {selectedCampus.address}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>City:</strong> {selectedCampus.city}
                                    </Typography>

                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Phone:</strong> {selectedCampus.contactNumber}
                                    </Typography>

                                    <Typography>
                                        <strong>Email:</strong> {selectedCampus.email}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Right side */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {selectedCampus && (
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
                                        src={selectedCampus.mapEmbedUrl}
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
                <Paper sx={{ p: 4, borderRadius: 3, position: "relative" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Programs Offered
                        </Typography>
                        {isAdmin && isEditMode && onEditProgram && (
                            <Button
                                variant="contained"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => onEditProgram(null)}
                                sx={{
                                    backgroundColor: "#4f46e5",
                                    "&:hover": {
                                        backgroundColor: "#4338ca",
                                    },
                                }}
                            >
                                Add Program
                            </Button>
                        )}
                    </Box>

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
                            {intakes.map((intake) => (
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
                            <MenuItem value="under20000">Under 20,000</MenuItem>
                            <MenuItem value="20000to30000">20,000-30,000</MenuItem>
                            <MenuItem value="above30000">Above 30,000</MenuItem>
                        </TextField>
                    </Box>

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
                        {filteredPrograms?.map((program, index) => {
                            const isBachelor = program.level === "Bachelor";

                            return (
                                <Card
                                    key={index}
                                    sx={{
                                        borderRadius: 3,
                                        transition: "0.2s",
                                        position: "relative",
                                        "&:hover": {
                                            boxShadow: 4,
                                            transform: "translateY(-2px)",
                                        },
                                    }}
                                >
                                    {isAdmin && isEditMode && onEditProgram && onDeleteProgram && (
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
                                                onClick={() => onEditProgram(program)}
                                                sx={{
                                                    backgroundColor: "rgba(79, 70, 229, 0.9)",
                                                    color: "white",
                                                    "&:hover": {
                                                        backgroundColor: "#4338ca",
                                                    },
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => onDeleteProgram(program)}
                                                sx={{
                                                    backgroundColor: "rgba(239, 68, 68, 0.9)",
                                                    color: "white",
                                                    "&:hover": {
                                                        backgroundColor: "#dc2626",
                                                    },
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                    <CardContent
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        {/* Program Name */}
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            sx={{ lineHeight: 1.35, minHeight: 54 }}
                                        >
                                            {program.name}
                                        </Typography>

                                        <Divider />

                                        {/* Duration + Tuition */}
                                        <Box>
                                            {/* Duration */}
                                            {program.duration && (
                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                                    <b>Duration:</b> {program.duration}
                                                </Typography>
                                            )}

                                            {/* Tuition Fees */}
                                            {program.tuition_fees && program.tuition_fees.length > 0 ? (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                                                        <b>Tuition Fees:</b>
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                                                        {program.tuition_fees.map((fee, i) => (
                                                            <Typography
                                                                key={i}
                                                                variant="body2"
                                                                color="primary.main"
                                                                fontWeight="bold"
                                                            >
                                                                • {fee?.credits || "N/A"}
                                                                {fee?.annual_fee_eur != null
                                                                    ? ` - ${fee.annual_fee_eur.toLocaleString()} EUR`
                                                                    : ""}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            ) : (
                                                // Fallback to old format if tuition_fees doesn't exist
                                                program.tuitionFee?.value > 0 && (
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="bold"
                                                        color="primary.main"
                                                    >
                                                        <b>Tuition:</b> {program.tuitionFee?.currency} {program.tuitionFee?.value}
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ ml: 0.5 }}
                                                        >
                                                            / {program.tuitionFee?.per}
                                                        </Typography>
                                                    </Typography>
                                                )
                                            )}
                                        </Box>

                                        <Divider />

                                        {/* Intakes */}
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: "block", mb: 1 }}
                                            >
                                                Available Intakes
                                            </Typography>

                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {program.intakes?.map((intake, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={intake}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>

                                        <Divider />

                                        {/* Entry Requirement */}
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: "block", mb: 1 }}
                                            >
                                                Entry Requirement
                                            </Typography>

                                            {program.entry_requirements ? (
                                                <>
                                                    {program.entry_requirements.academic && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2">
                                                                <b>Academic:</b>{" "}
                                                                {program.entry_requirements.academic.minimum_qualification || "N/A"}
                                                            </Typography>

                                                            {program.entry_requirements.academic.field_requirement && (
                                                                <Typography variant="body2">
                                                                    <b>Field:</b>{" "}
                                                                    {program.entry_requirements.academic.field_requirement}
                                                                </Typography>
                                                            )}

                                                            {program.entry_requirements.academic.score != null && (
                                                                <Typography variant="body2">
                                                                    <b>
                                                                        {program.entry_requirements.academic.score_type || "Score"}:
                                                                    </b>{" "}
                                                                    {program.entry_requirements.academic.score}
                                                                    {program.entry_requirements.academic.scale
                                                                        ? ` / ${program.entry_requirements.academic.scale}`
                                                                        : ""}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {program.entry_requirements.language_requirements && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                Language Requirements:
                                                            </Typography>

                                                            {program.entry_requirements.language_requirements.english?.ielts?.overall != null && (
                                                                <Typography variant="body2">
                                                                    IELTS:{" "}
                                                                    {program.entry_requirements.language_requirements.english.ielts.overall}
                                                                </Typography>
                                                            )}

                                                            {program.entry_requirements.language_requirements.english?.toefl?.overall != null && (
                                                                <Typography variant="body2">
                                                                    TOEFL:{" "}
                                                                    {program.entry_requirements.language_requirements.english.toefl.overall}
                                                                </Typography>
                                                            )}

                                                            {program.entry_requirements.language_requirements.english?.pte?.overall != null && (
                                                                <Typography variant="body2">
                                                                    PTE:{" "}
                                                                    {program.entry_requirements.language_requirements.english.pte.overall}
                                                                </Typography>
                                                            )}

                                                            {program.entry_requirements.language_requirements.english?.duolingo?.overall != null && (
                                                                <Typography variant="body2">
                                                                    Duolingo:{" "}
                                                                    {program.entry_requirements.language_requirements.english.duolingo.overall}
                                                                </Typography>
                                                            )}

                                                            {program.entry_requirements.language_requirements.german?.cefr && (
                                                                <Typography variant="body2">
                                                                    German CEFR:{" "}
                                                                    {program.entry_requirements.language_requirements.german.cefr}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {!program.entry_requirements.academic && !program.entry_requirements.language && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No specific requirements listed
                                                        </Typography>
                                                    )}
                                                </>
                                            ) : (
                                                // Fallback to old logic if entry_requirements doesn't exist
                                                <>
                                                    {(() => {
                                                        const isUndergraduate = ["Certificate", "Diploma", "Bachelor"].includes(
                                                            program.level
                                                        );

                                                        const programReq = isUndergraduate
                                                            ? program.undergraduateRequirement
                                                            : program.postgraduateRequirement;

                                                        const institutionReq = isUndergraduate
                                                            ? institution?.entryRequirements?.undergraduate
                                                            : institution?.entryRequirements?.postgraduate;

                                                        // Use program requirement if available, otherwise institution requirement
                                                        const gpaType =
                                                            programReq?.gpa?.type || institutionReq?.gpa?.type || "GPA";

                                                        const gpaScore =
                                                            programReq?.gpa?.score || institutionReq?.gpa?.score || "N/A";

                                                        const languageTest =
                                                            programReq?.languageRequirement?.testType ||
                                                            institutionReq?.languageRequirement?.testType ||
                                                            "N/A";

                                                        const languageOverall =
                                                            programReq?.languageRequirement?.overall ||
                                                            institutionReq?.languageRequirement?.overall ||
                                                            "";

                                                        return (
                                                            <>
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <b>Minimum {gpaType}:</b> {gpaScore}
                                                                </Typography>

                                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                                    <b>Language:</b> {languageTest}
                                                                    {languageOverall ? ` ${languageOverall}` : ""}
                                                                </Typography>
                                                            </>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                        </Box>

                                        <Divider />

                                        {/* Campuses */}
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: "block", mb: 1 }}
                                            >
                                                Available Campuses
                                            </Typography>

                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {program.campuses?.length ? (
                                                    program.campuses.map((campus, i) => (
                                                        <Chip key={i} label={campus} size="small" />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2">All campuses</Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Visit Program Button */}
                                        {program.url && (
                                            <>
                                                <Divider />
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    endIcon={<OpenInNewIcon />}
                                                    href={program.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                        mt: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    Visit Program Page
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Paper>
            );

        case 3: {
            const allIntakes = [...new Set(programs.flatMap((p) => p.intakes || []))];

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

        case 4:
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
                        {institution?.scholarships?.map((scholarship, index) => (
                            <Card
                                key={index}
                                sx={{
                                    borderRadius: 3,
                                    height: "100%",
                                    transition: "0.2s",
                                    "&:hover": {
                                        boxShadow: 4,
                                        transform: "translateY(-2px)",
                                    },
                                }}
                            >
                                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        {scholarship.name}
                                    </Typography>

                                    <Box>
                                        <Chip
                                            label={scholarship.value}
                                            color="success"
                                            size="small"
                                        />
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 1 }}
                                        >
                                            Description
                                        </Typography>

                                        <Typography variant="body2">
                                            {scholarship.description}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 1 }}
                                        >
                                            Eligibility
                                        </Typography>

                                        <Typography variant="body2">
                                            {scholarship.eligibility}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>

            );


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
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Undergraduate
                                </Typography>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Minimum {institution?.entryRequirements?.undergraduate?.gpa?.type || "GPA"}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.undergraduate?.gpa?.score || "N/A"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Language Requirement
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.undergraduate?.languageRequirement?.testType || "N/A"}
                                        {institution?.entryRequirements?.undergraduate?.languageRequirement?.overall
                                            ? ` ${institution.entryRequirements.undergraduate.languageRequirement.overall}`
                                            : ""}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Postgraduate
                                </Typography>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Minimum {institution?.entryRequirements?.postgraduate?.gpa?.type || "GPA"}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.postgraduate?.gpa?.score || "N/A"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Language Requirement
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.postgraduate?.languageRequirement?.testType || "N/A"}
                                        {institution?.entryRequirements?.postgraduate?.languageRequirement?.overall
                                            ? ` ${institution.entryRequirements.postgraduate.languageRequirement.overall}`
                                            : ""}
                                    </Typography>
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


        case 7:
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Financial Document Requirements
                    </Typography>

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
                </Paper>
            );

        default:
            return null;

    }
}
