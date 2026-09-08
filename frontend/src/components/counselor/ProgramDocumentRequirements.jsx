import { useState } from "react";
import { Box, Chip, MenuItem, TextField, Tooltip, Typography } from "@mui/material";

export default function ProgramDocumentRequirements({ requirements, totalPrograms }) {
    const [requirementType, setRequirementType] = useState("common");
    if (!requirements.length) {
        return (
            <Box sx={{ p: 3, mt: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                <Typography fontWeight="medium">Document requirements are not available yet.</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    This institution and its programs have no document requirements listed.
                </Typography>
            </Box>
        );
    }

    const visibleRequirements = requirements.filter((item) =>
        requirementType === "common" ? item.programs.length > 1 : item.programs.length === 1
    );

    return (
        <Box sx={{ mt: 2 }}>
            <TextField
                select
                label="Requirement type"
                value={requirementType}
                onChange={(event) => setRequirementType(event.target.value)}
                size="small"
                sx={{ width: { xs: "100%", sm: 260 }, mb: 2 }}
            >
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="program-specific">Program-specific</MenuItem>
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Based on the requirements listed by programs. Hover over or focus on an item to see which programs it applies to.
            </Typography>
                <Box sx={{ mb: 3 }}>
                    <Typography component="h3" variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                        {requirementType === "common" ? "Common Additional Requirements" : "Program-specific Requirements"}
                    </Typography>
                    {visibleRequirements.length === 0 && (
                        <Typography color="text.secondary" variant="body2" role="status">
                            {requirementType === "common"
                                ? "No requirements are shared by multiple programs. Select Program-specific to view the available requirements."
                                : "No program-specific requirements are listed. Select Common to view shared requirements."}
                        </Typography>
                    )}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5, alignItems: "start" }}>
                        {visibleRequirements.map((requirement) => (
                            <Tooltip
                                key={requirement.text}
                                arrow
                                describeChild
                                enterTouchDelay={0}
                                leaveTouchDelay={5000}
                                slotProps={{ tooltip: { sx: { maxWidth: "min(360px, calc(100vw - 32px))", p: 0 } } }}
                                title={
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Applicable programs</Typography>
                                        <Box tabIndex={0} role="region" aria-label="Applicable programs" sx={{
                                            minHeight: 120, maxHeight: "min(280px, 50vh)", overflowY: "auto",
                                            overscrollBehavior: "contain", scrollbarGutter: "stable",
                                            scrollbarWidth: "thin",
                                            scrollbarColor: "rgba(255, 255, 255, 0.35) transparent",
                                            "&::-webkit-scrollbar": { width: 6 },
                                            "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
                                            "&::-webkit-scrollbar-thumb": {
                                                backgroundColor: "rgba(255, 255, 255, 0.35)", borderRadius: 8,
                                            },
                                            "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "rgba(255, 255, 255, 0.55)" },
                                            "&::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
                                            "&:focus-visible": { outline: "2px solid currentColor", outlineOffset: 2 },
                                        }}>
                                            <Box component="ul" sx={{ m: 0, pl: 2.5, pr: 1 }}>
                                                {requirement.programs.map((program) => (
                                                    <Box component="li" key={program.id} sx={{ mb: 1, overflowWrap: "anywhere" }}>
                                                        <Typography variant="body2">{program.name}</Typography>
                                                        {program.level && <Typography variant="caption" sx={{ opacity: 0.8 }}>{program.level}</Typography>}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                }
                            >
                                <Box tabIndex={0} sx={{
                                    border: 1, borderColor: "divider", borderRadius: 2, minWidth: 0,
                                    minHeight: 104, boxSizing: "border-box",
                                    p: 2, cursor: "help", overflowWrap: "anywhere",
                                    "&:hover": { borderColor: "primary.main" },
                                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2, borderRadius: 2 },
                                }}>
                                    <Typography component="span" variant="body2" fontWeight="medium">
                                        {requirement.text}
                                    </Typography>
                                    <Box component="span" sx={{ display: "block", mt: 1 }}>
                                        <Chip size="small" variant="outlined" color={requirement.programs.length > 1 ? "primary" : "default"}
                                            label={requirement.programs.length === totalPrograms && totalPrograms > 1
                                                ? `All ${totalPrograms} programs`
                                                : `${requirement.programs.length} ${requirement.programs.length === 1 ? "program" : "programs"}`} />
                                    </Box>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
        </Box>
    );
}
