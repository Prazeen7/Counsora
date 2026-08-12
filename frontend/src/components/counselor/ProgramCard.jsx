import { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    Grid,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import {
    School as SchoolIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    ArrowForward as ArrowIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

function ProgramCard({ program, institutionData }) {
    const [isIntakesOpen, setIsIntakesOpen] = useState(false);

    // Show first 2 intakes by default 
    const visibleIntakes = program.intakes.slice(0, 2);
    const hiddenIntakes = program.intakes.slice(2);
    const hasMoreIntakes = hiddenIntakes.length > 0;

    // Access language_requirements from the program object
    const languageRequirements = {
        IELTS: program.ielts,
        TOEFL: program.toefl,
        PTE: program.pte,
    };

    // Avatar
    const avatarImage = institutionData?.profilePicture;

    return (
        <Card
            variant="outlined"
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 550,
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                overflow: 'hidden',
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                },
            }}
        >
            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2, pb: 1, overflow: 'hidden' }}>
                {/* Header with Avatar and Program Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                    <Avatar
                        sx={{ width: 56, height: 56, bgcolor: "#4f46e5", flexShrink: 0 }}
                        alt={program.institution}
                        src={avatarImage} 
                    >
                        {!avatarImage && program.institution[0]} 
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography 
                            variant="h6" 
                            fontWeight="bold"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                lineHeight: 1.3
                            }}
                        >
                            {program.program}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                lineHeight: 1.4
                            }}
                        >
                            {program.institution}
                        </Typography>
                    </Box>
                </Box>

                <Divider />

                {/* Level, Campus, and Duration in a Row */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1, minWidth: 0 }}>
                    {/* Campus */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, flex: '1 1 auto' }}>
                        <LocationIcon sx={{ fontSize: 18, color: "#4f46e5", flexShrink: 0, mt: 0.2 }} />
                        <Typography 
                            variant="body2"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                minWidth: 0
                            }}
                        >
                            {program.campus}
                        </Typography>
                    </Box>

                    {/* Level */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, flex: '1 1 auto' }}>
                        <SchoolIcon sx={{ fontSize: 18, color: "#4f46e5", flexShrink: 0, mt: 0.2 }} />
                        <Typography 
                            variant="body2"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                minWidth: 0
                            }}
                        >
                            {program.level}
                        </Typography>
                    </Box>

                    {/* Duration */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, flex: '1 1 100%' }}>
                        <TimeIcon sx={{ fontSize: 18, color: "#4f46e5", flexShrink: 0, mt: 0.2 }} />
                        <Typography 
                            variant="body2"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                minWidth: 0
                            }}
                        >
                            {program.duration}
                        </Typography>
                    </Box>
                </Box>

                {/* Program Details in Two Columns */}
                <Grid container spacing={2}>
                    {/* Left Column */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={2}>
                            {/* Intakes */}
                            <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        Intakes:
                                    </Typography>
                                    {hasMoreIntakes && (
                                        <IconButton
                                            size="small"
                                            onClick={() => setIsIntakesOpen(!isIntakesOpen)}
                                            sx={{ p: 0 }}
                                        >
                                            {isIntakesOpen ? (
                                                <ExpandLessIcon fontSize="small" color="action" />
                                            ) : (
                                                <ExpandMoreIcon fontSize="small" color="action" />
                                            )}
                                        </IconButton>
                                    )}
                                </Box>

                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {visibleIntakes.map((intake, index) => (
                                        <Chip
                                            key={index}
                                            label={intake}
                                            size="small"
                                            sx={{
                                                borderRadius: 1,
                                                backgroundColor: "#e0e7ff",
                                                color: "#4f46e5",
                                            }}
                                        />
                                    ))}
                                    {!isIntakesOpen && hasMoreIntakes && (
                                        <Chip
                                            label={`+${hiddenIntakes.length} more`}
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setIsIntakesOpen(true)}
                                            sx={{
                                                borderRadius: 1,
                                                cursor: "pointer",
                                                "&:hover": {
                                                    backgroundColor: "rgba(224, 231, 255, 0.5)",
                                                },
                                            }}
                                        />
                                    )}
                                </Box>

                                <Collapse in={isIntakesOpen}>
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                                        {hiddenIntakes.map((intake, index) => (
                                            <Chip
                                                key={index}
                                                label={intake}
                                                size="small"
                                                sx={{
                                                    borderRadius: 1,
                                                    backgroundColor: "#e0e7ff",
                                                    color: "#4f46e5",
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Collapse>
                            </Box>

                            {/* Language Requirements */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Language Requirements:
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1,
                                        alignItems: "center",
                                    }}
                                >
                                    {languageRequirements.IELTS && (
                                        <Chip
                                            label={`IELTS: ${languageRequirements.IELTS}`}
                                            size="small"
                                            sx={{
                                                borderRadius: 1,
                                                backgroundColor: "#e0e7ff",
                                                color: "#4f46e5",
                                            }}
                                        />
                                    )}
                                    {languageRequirements.TOEFL && (
                                        <Chip
                                            label={`TOEFL: ${languageRequirements.TOEFL}`}
                                            size="small"
                                            sx={{
                                                borderRadius: 1,
                                                backgroundColor: "#e0f2fe",
                                                color: "#0369a1",
                                            }}
                                        />
                                    )}
                                    {languageRequirements.PTE && (
                                        <Chip
                                            label={`PTE: ${languageRequirements.PTE}`}
                                            size="small"
                                            sx={{
                                                borderRadius: 1,
                                                backgroundColor: "#f3e8ff",
                                                color: "#7c3aed",
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            {/* GPA */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    GPA Requirement:
                                </Typography>
                                <Typography variant="body2">
                                    {(() => {
                                        const level = program.level.toLowerCase();
                                        const entryReqs = institutionData?.entryRequirements;
                                        
                                        if (level === "undergraduate" && entryReqs?.undergraduate?.gpa) {
                                            const gpaData = entryReqs.undergraduate.gpa;
                                            return gpaData.type && gpaData.score 
                                                ? `${gpaData.score} (${gpaData.type})`
                                                : gpaData.score || "Not specified";
                                        } else if (level === "postgraduate" && entryReqs?.postgraduate?.gpa) {
                                            const gpaData = entryReqs.postgraduate.gpa;
                                            return gpaData.type && gpaData.score 
                                                ? `${gpaData.score} (${gpaData.type})`
                                                : gpaData.score || "Not specified";
                                        }
                                        
                                        // Fallback to program's entry requirements
                                        return program.entry_requirements?.academic || "Not specified";
                                    })()}
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={2}>
                            {/* Tuition Fees */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Tuition Fees:
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {parseInt(program.fees.replace("$", "")).toLocaleString()} per year
                                </Typography>
                            </Box>

                            {/* Application Fees */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Application Fees:
                                </Typography>
                                <Typography variant="body2">
                                    {institutionData?.applicationFee?.amount 
                                        ? `${institutionData.applicationFee.amount} ${institutionData.applicationFee.currency || ''}`.trim()
                                        : program.applicationFees || "N/A"}
                                </Typography>
                            </Box>

                            {/* Funds Required */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Funds Required:
                                </Typography>
                                <Typography variant="body2">
                                    {program.requiredFunds ? `$${parseInt(program.requiredFunds).toLocaleString()}` : "N/A"}
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
            
            {/* Learn More */}
            <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowIcon />}
                    href={program.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        backgroundColor: "#4f46e5",
                        "&:hover": {
                            backgroundColor: "#4338ca",
                        },
                    }}
                >
                    Learn More
                </Button>
            </Box>
        </Card>
    );
}

export default ProgramCard;