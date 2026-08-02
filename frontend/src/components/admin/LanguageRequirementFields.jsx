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
} from "@mui/material";

const LanguageRequirementFields = ({ value = {}, onChange }) => {
    const languageTests = {
        IELTS: ["Listening", "Reading", "Writing", "Speaking"],
        PTE: ["Listening", "Reading", "Writing", "Speaking"],
        TOEFL: ["Listening", "Reading", "Writing", "Speaking"],
        Duolingo: ["Literacy", "Comprehension", "Conversation", "Production"],
    };

    const [overallInput, setOverallInput] = useState("");

    useEffect(() => {
        if (value.minimum !== undefined && value.minimum !== "") {
            setOverallInput(`${value.overall || ""}/${value.minimum}`);
        } else {
            setOverallInput(value.overall || "");
        }
    }, [value.overall, value.minimum]);

    const handleChange = (key, newValue) => {
        onChange({
            ...value,
            [key]: newValue,
        });
    };

    const handleOverallChange = (e) => {
        const input = e.target.value;
        setOverallInput(input);

        const parts = input.split("/");

        onChange({
            ...value,
            overall: parts[0] || "",
            minimum: parts.length > 1 ? parts.slice(1).join("/") : "",
        });
    };

    const fields = languageTests[value.testType] || [];

    return (
        <Box sx={{ width: "100%", mb: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
                    <InputLabel>Test</InputLabel>
                    <Select
                        value={value.testType || ""}
                        label="Test"
                        onChange={(e) => handleChange("testType", e.target.value)}
                    >
                        {Object.keys(languageTests).map((test) => (
                            <MenuItem key={test} value={test}>
                                {test}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Overall / Minimum"
                    size="small"
                    sx={{ minWidth: 180, flex: 1 }}
                    value={overallInput}
                    onChange={handleOverallChange}
                    placeholder="6.5/6.0"
                />

                <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                        <Checkbox
                            size="small"
                            checked={value.hasIndividualScores || false}
                            onChange={(e) =>
                                handleChange("hasIndividualScores", e.target.checked)
                            }
                        />
                    }
                    label="Individual scores"
                />
            </Box>

            {value.hasIndividualScores && (
                <Grid container spacing={1.5}>
                    {fields.map((field) => (
                        <Grid item xs={6} sm={3} key={field}>
                            <TextField
                                label={field}
                                size="small"
                                fullWidth
                                value={value[field.toLowerCase()] || ""}
                                onChange={(e) =>
                                    handleChange(field.toLowerCase(), e.target.value)
                                }
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default LanguageRequirementFields;