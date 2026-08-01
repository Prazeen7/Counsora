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
} from "@mui/material";

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
                                {institution?.campuses?.map((campus, index) => (
                                    <Chip
                                        key={index}
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
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Programs Offered
                    </Typography>

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
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="medium">
                                                {program.duration}
                                            </Typography>

                                            <Divider
                                                orientation="vertical"
                                                flexItem
                                                sx={{ height: 20 }}
                                            />

                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color="primary.main"
                                            >
                                                {program.tuitionFee?.currency} {program.tuitionFee?.value}
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ ml: 0.5 }}
                                                >
                                                    / {program.tuitionFee?.per}
                                                </Typography>
                                            </Typography>
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

                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>Qualification:</b>{" "}
                                                {isBachelor
                                                    ? program.entryRequirements?.undergraduate?.qualification
                                                    : program.entryRequirements?.postgraduate?.qualification}
                                            </Typography>

                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Minimum GPA:</b>{" "}
                                                {isBachelor
                                                    ? program.entryRequirements?.undergraduate?.gpa
                                                    : program.entryRequirements?.postgraduate?.gpa}
                                            </Typography>

                                            {/* Language Requirement */}
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: "block", mb: 1 }}
                                            >
                                                Language Requirement
                                            </Typography>

                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {program.entryRequirements?.language?.IELTS?.map((v, i) => (
                                                    <Chip
                                                        key={`ielts-${i}`}
                                                        label={`IELTS ${v}`}
                                                        size="small"
                                                    />
                                                ))}

                                                {program.entryRequirements?.language?.PTE?.map((v, i) => (
                                                    <Chip
                                                        key={`pte-${i}`}
                                                        label={`PTE ${v}`}
                                                        size="small"
                                                    />
                                                ))}

                                                {program.entryRequirements?.language?.Duolingo?.map(
                                                    (v, i) => (
                                                        <Chip
                                                            key={`duo-${i}`}
                                                            label={`Duolingo ${v}`}
                                                            size="small"
                                                        />
                                                    )
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Paper>
            );

        case 3:
            return (
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Available Intakes
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Select from the available admission periods for this institution.
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
                        {institution?.intakes?.map((intake, index) => (
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

                                <Typography
                                    variant="body1"
                                    fontWeight="medium"
                                >
                                    {intake}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                </Paper>
            );

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
                <Paper sx={{ p: 4, borderRadius: 3 }}> <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Institution Entry Requirements </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Minimum academic and language requirements for admission to this
                        institution.
                    </Typography>

                    {/* Undergraduate & Postgraduate */}
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
                                        Minimum GPA
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.undergraduate?.gpa || "N/A"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Required Qualification
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.undergraduate?.qualification ||
                                            "N/A"}
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
                                        Minimum GPA
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.postgraduate?.gpa || "N/A"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Required Qualification
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {institution?.entryRequirements?.postgraduate?.qualification ||
                                            "N/A"}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Language Requirements */}
                    <Card sx={{ borderRadius: 3, mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Language Requirements
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Accepted English proficiency tests and minimum score requirements.
                            </Typography>

                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {institution?.entryRequirements?.language?.IELTS?.map((v, i) => (
                                    <Chip
                                        key={`ielts-${i}`}
                                        label={`IELTS ${v}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}

                                {institution?.entryRequirements?.language?.TOEFL?.map((v, i) => (
                                    <Chip
                                        key={`toefl-${i}`}
                                        label={`TOEFL ${v}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}

                                {institution?.entryRequirements?.language?.PTE?.map((v, i) => (
                                    <Chip
                                        key={`pte-${i}`}
                                        label={`PTE ${v}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}

                                {institution?.entryRequirements?.language?.Duolingo?.map((v, i) => (
                                    <Chip
                                        key={`duo-${i}`}
                                        label={`Duolingo ${v}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
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
                        Required Documents
                    </Typography>

                    <List>
                        {institution?.requiredDocuments?.map((doc, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={doc} />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            );

        default:
            return null;

    }
}
