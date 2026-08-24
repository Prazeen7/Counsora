import { useEffect, useState } from "react";
import {
    Grid,
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
    IconButton,
    Button,
    Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const LanguageRequirementFields = ({ value = [], onChange }) => {
    const languageTests = {
        IELTS: ["Listening", "Reading", "Writing", "Speaking"],
        PTE: ["Listening", "Reading", "Writing", "Speaking"],
        TOEFL: ["Listening", "Reading", "Writing", "Speaking"],
        Duolingo: ["Literacy", "Comprehension", "Conversation", "Production"],
        Other: ["Listening", "Reading", "Writing", "Speaking"],
    };

    // Ensure value is always an array
    const requirements = Array.isArray(value) ? value : [];

    const handleAddTest = () => {
        const newTest = {
            id: `test_${Date.now()}_${Math.random()}`,
            testType: "",
            testName: "", // For custom test name when "Other" is selected
            overall: "",
            minimum: "",
            hasIndividualScores: false,
            listening: "",
            reading: "",
            writing: "",
            speaking: "",
            literacy: "",
            comprehension: "",
            conversation: "",
            production: "",
        };
        onChange([...requirements, newTest]);
    };

    const handleRemoveTest = (index) => {
        onChange(requirements.filter((_, i) => i !== index));
    };

    const handleTestChange = (index, key, newValue) => {
        onChange(
            requirements.map((req, i) =>
                i === index ? { ...req, [key]: newValue } : req
            )
        );
    };

    return (
        <Box sx={{ width: "100%" }}>
            {requirements.map((requirement, index) => {
                const fields = languageTests[requirement.testType] || [];
                const itemKey = requirement.id || requirement._id || `req_${index}`;

                return (
                    <Box
                        key={itemKey}
                        sx={{
                            mb: 2,
                            pb: 2,
                            borderBottom:
                                index < requirements.length - 1 ? "1px solid" : "none",
                            borderColor: "divider",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                alignItems: "center",
                                mb: requirement.hasIndividualScores ? 2 : 0,
                            }}
                        >
                            <FormControl size="small" sx={{ minWidth: 120, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
                                <InputLabel id={`test-type-label-${itemKey}`}>Test</InputLabel>
                                <Select
                                    labelId={`test-type-label-${itemKey}`}
                                    id={`test-type-select-${itemKey}`}
                                    value={requirement.testType || ""}
                                    label="Test"
                                    onChange={(e) =>
                                        handleTestChange(index, "testType", e.target.value)
                                    }
                                    MenuProps={{
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
                                            },
                                        },
                                        MenuListProps: {
                                            style: {
                                                maxHeight: 220,
                                                overflowY: "auto",
                                            },
                                            sx: {
                                                maxHeight: "220px !important",
                                                overflowY: "auto !important",
                                            },
                                        },
                                    }}
                                >
                                    {Object.keys(languageTests).map((test) => (
                                        <MenuItem key={test} value={test}>
                                            {test}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {requirement.testType === "Other" && (
                                <TextField
                                    label="Test Name"
                                    size="small"
                                    sx={{ minWidth: 150, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
                                    value={requirement.testName || ""}
                                    onChange={(e) =>
                                        handleTestChange(index, "testName", e.target.value)
                                    }
                                    placeholder="e.g., Cambridge"
                                />
                            )}

                            <TextField
                                label="Overall Score"
                                size="small"
                                sx={{ minWidth: 100, flex: { xs: '1 1 100%', sm: '1' } }}
                                value={requirement.overall || ""}
                                onChange={(e) =>
                                    handleTestChange(index, "overall", e.target.value)
                                }
                                placeholder="e.g., 6.5"
                            />

                            <TextField
                                label="Minimum Score"
                                size="small"
                                sx={{ minWidth: 100, flex: { xs: '1 1 100%', sm: '1' } }}
                                value={requirement.minimum || ""}
                                onChange={(e) =>
                                    handleTestChange(index, "minimum", e.target.value)
                                }
                                placeholder="e.g., 6.0"
                            />

                            <FormControlLabel
                                sx={{ m: 0, flex: '0 0 auto' }}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={requirement.hasIndividualScores || false}
                                        onChange={(e) =>
                                            handleTestChange(
                                                index,
                                                "hasIndividualScores",
                                                e.target.checked
                                            )
                                        }
                                    />
                                }
                                label="Individual scores"
                            />

                            <IconButton
                                size="small"
                                sx={{ flex: '0 0 auto' }}
                                onClick={() => handleRemoveTest(index)}
                                disabled={requirements.length === 1}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {requirement.hasIndividualScores && (
                            <Grid container spacing={1.5}>
                                {fields.map((field) => (
                                    <Grid item xs={6} sm={3} key={field}>
                                        <TextField
                                            label={field}
                                            size="small"
                                            fullWidth
                                            value={requirement[field.toLowerCase()] || ""}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    field.toLowerCase(),
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                );
            })}

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddTest}
                >
                    {requirements.length === 0 ? "Add Language Test" : "Add Another Test"}
                </Button>
            </Box>
        </Box>
    );
};

export default LanguageRequirementFields;