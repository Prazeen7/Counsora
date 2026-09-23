import { tuitionFeeText } from '../../utils/tuitionFees';
import ProgramDetailsTicker from "./ProgramDetailsTicker";
import { resolveProgramRequirements } from "../../utils/resolveProgramRequirements";
import ProgramEntryRequirements from "./ProgramEntryRequirements";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    School as SchoolIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    ArrowForward as ArrowIcon,
} from "@mui/icons-material";

function ProgramCard({ program, institutionData }) {
    const requirements = resolveProgramRequirements(program, institutionData);
    const additionalRequirements = (program.entry_requirements?.additional_requirements || [])
        .filter(requirement => typeof requirement === "string" && requirement.trim());
    const additionalRequirementsText = additionalRequirements.join(" | ");
    const scrollAdditionalRequirements = additionalRequirementsText.length > 48;

    const specializations = (Array.isArray(program.specialization) ? program.specialization : [program.specialization])
        .filter(value => typeof value === "string" && value.trim()).map(value => value.trim());
    // Avatar
    const avatarImage = institutionData?.profilePicture;

    return (
        <Card
            inert={Boolean(program.isDimmed)}
            aria-disabled={Boolean(program.isDimmed)}
            variant="outlined"
            sx={{
                opacity: program.isDimmed ? 0.45 : 1,
                filter: program.isDimmed ? "grayscale(1)" : "none",
                pointerEvents: program.isDimmed ? "none" : "auto",
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

                {specializations.length > 0 && (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>Specializations:</Typography>
                        <ProgramDetailsTicker items={specializations} />
                    </Box>
                )}

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
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>Intakes:</Typography>
                                {program.intakes?.length > 0 ? (
                                    <ProgramDetailsTicker items={program.intakes} />
                                ) : (
                                    <Typography variant="body2">Not specified</Typography>
                                )}
                            </Box>
                            <Box sx={{ gridColumn: "1 / -1" }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>Entry Requirements:</Typography>
                                <ProgramEntryRequirements requirements={requirements} />
                            </Box>
                            {/* Tuition Fees */}
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                    Tuition Fees:
                                </Typography>
                                {program.tuition_fees?.length > 0 ? (
                                    program.tuition_fees.map((fee, index) => (
                                        <Typography key={index} variant="body2" fontWeight="bold" color="primary.main">
                                            {tuitionFeeText(fee)}
</Typography>
                                    ))
                                ) : (
                                    <Typography variant="body2">Not specified</Typography>
                                )}
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
