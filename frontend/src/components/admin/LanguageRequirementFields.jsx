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
            id: Date.now(),
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

    const handleRemoveTest = (id) => {
        onChange(requirements.filter((req) => req.id !== id));
    };

    const handleTestChange = (id, key, newValue) => {
        onChange(
            requirements.map((req) =>
                req.id === id ? { ...req, [key]: newValue } : req
            )
        );
    };

    return (
        <Box sx={{ width: "100%" }}>
            {requirements.map((requirement, index) => {
                const fields = languageTests[requirement.testType] || [];

                return (
                    <Box
                        key={requirement.id}
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
                                <InputLabel>Test</InputLabel>
                                <Select
                                    value={requirement.testType || ""}
                                    label="Test"
                                    onChange={(e) =>
                                        handleTestChange(requirement.id, "testType", e.target.value)
                                    }
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: 300,
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
                                        handleTestChange(requirement.id, "testName", e.target.value)
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
                                    handleTestChange(requirement.id, "overall", e.target.value)
                                }
                                placeholder="e.g., 6.5"
                            />

                            <TextField
                                label="Minimum Score"
                                size="small"
                                sx={{ minWidth: 100, flex: { xs: '1 1 100%', sm: '1' } }}
                                value={requirement.minimum || ""}
                                onChange={(e) =>
                                    handleTestChange(requirement.id, "minimum", e.target.value)
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
                                                requirement.id,
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
                                onClick={() => handleRemoveTest(requirement.id)}
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
                                                    requirement.id,
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