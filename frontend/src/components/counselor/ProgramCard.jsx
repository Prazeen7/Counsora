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
    IconButton,
    Tooltip,
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
    const academic = program.entry_requirements?.academic;
    const additionalRequirements = (program.entry_requirements?.additional_requirements || [])
        .filter(requirement => typeof requirement === "string" && requirement.trim());
    const additionalRequirementsText = additionalRequirements.join(" | ");
    const scrollAdditionalRequirements = additionalRequirementsText.length > 48;

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
                        sx={{
                            width: 56,
                            height: 56,
                            flexShrink: 0,
                            "& img": {
                                objectFit: "contain",
                            },
                        }}
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
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, maxWidth: '100%', flex: '0 1 auto' }}>
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
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, maxWidth: '100%', flex: '0 1 auto' }}>
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
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0, maxWidth: '100%', flex: '0 1 auto' }}>
                        <TimeIcon sx={{ fontSize: 18, color: "#4f46e5", flexShrink: 0, mt: 0.2 }} />
                        <Typography
                            variant="body2"
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                minWidth: 0
                            }}
                        >
                            {program.duration}{/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(String(program.duration).trim()) ? " years" : ""}
                        </Typography>
                    </Box>
                </Box>

                {/* Program Details in Two Columns */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2, "& > *": { minWidth: 0, overflowWrap: "anywhere" } }}>
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

                            {/* Academic and field requirements */}
                            <Box sx={{ overflowWrap: "anywhere" }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Academic:
                                </Typography>
                                <Typography variant="body2">
                                    {academic?.minimum_qualification || "Not specified"}
                                </Typography>
                            </Box>
                            <Box sx={{ overflowWrap: "anywhere" }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Field:
                                </Typography>
                                <Typography variant="body2">
                                    {academic?.field_requirement || "Not specified"}
                                </Typography>
                            </Box>

                            {/* GPA */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    GPA Requirement:
                                </Typography>
                                <Typography variant="body2">
                                    {(() => {
                                        if (academic?.score != null) {
                                            return `${academic.score}${academic.scale ? ` / ${academic.scale}` : ""}${academic.score_type ? ` (${academic.score_type})` : ""}`;
                                        }
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
                                        return "Not specified";
                                    })()}
                                </Typography>
                            </Box>

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

                            {/* Additional requirements */}
                            <Box sx={{ gridColumn: "1 / -1" }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Additional Requirements:
                                </Typography>
                                {additionalRequirements.length ? (
                                    <Tooltip arrow placement="top" title={
                                        <Box tabIndex={0} sx={{
                                            py: 0.5,
                                            pr: 0.5,
                                            borderRadius: "6px",
                                            maxHeight: "min(240px, calc(100vh - 64px))",
                                            overflowY: "auto",
                                            overflowWrap: "anywhere",
                                            overscrollBehavior: "contain",
                                            scrollbarWidth: "thin",
                                            scrollbarColor: "rgba(255, 255, 255, 0.5) transparent",
                                            "&::-webkit-scrollbar": { width: 6 },
                                            "&::-webkit-scrollbar-track": { background: "transparent", marginBlock: "6px" },
                                            "&::-webkit-scrollbar-thumb": {
                                                backgroundColor: "rgba(255, 255, 255, 0.5)",
                                                borderRadius: "999px",
                                            },
                                        }}>
                                            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                            {additionalRequirements.map((requirement, index) => (
                                                <Typography component="li" variant="body2" key={index} sx={{ lineHeight: 1.5, mb: 0.75 }}>
                                                    {requirement}
                                                </Typography>
                                            ))}
                                            </Box>
                                        </Box>
                                    }>
                                        <Box tabIndex={0} sx={{
                                            width: "100%", overflow: "hidden", whiteSpace: "nowrap", cursor: "help",
                                            "@keyframes programAdditionalRequirementsTicker": {
                                                from: { transform: "translateX(0)" },
                                                to: { transform: "translateX(-50%)" },
                                            },
                                            "&:hover .additional-requirements-ticker, &:focus .additional-requirements-ticker": {
                                                animationPlayState: "paused",
                                            },
                                        }}>
                                            <Typography component="div" variant="body2" className="additional-requirements-ticker" sx={{
                                                display: "inline-flex", width: "max-content",
                                                ...(scrollAdditionalRequirements && {
                                                    animation: `programAdditionalRequirementsTicker ${Math.max(22, additionalRequirementsText.length * 0.42)}s linear infinite`,
                                                }),
                                                "@media (prefers-reduced-motion: reduce)": {
                                                    animation: "none", width: "100%", whiteSpace: "normal",
                                                    "& > [aria-hidden]": { display: "none" },
                                                },
                                            }}>
                                                <Box component="span" sx={{ pr: scrollAdditionalRequirements ? 4 : 0 }}>
                                                    {additionalRequirementsText}{scrollAdditionalRequirements && " |"}
                                                </Box>
                                                {scrollAdditionalRequirements && (
                                                    <Box component="span" sx={{ pr: 4 }} aria-hidden="true">
                                                        {additionalRequirementsText} |
                                                    </Box>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                ) : (
                                    <Typography variant="body2">Not specified</Typography>
                                )}
                            </Box>

                            {/* Funds Required
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Funds Required:
                                </Typography>
                                <Typography variant="body2">
                                    {program.requiredFunds ? `$${parseInt(program.requiredFunds).toLocaleString()}` : "N/A"}
                                </Typography>
                            </Box>
                            */}
                </Box>
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
