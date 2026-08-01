import {
    Grid,
    TextField,
    Typography,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
} from "@mui/material";


const LanguageRequirementFields = ({
    value = {},
    onChange,
}) => {

    const languageTests = {
        IELTS: [
            "Listening",
            "Reading",
            "Writing",
            "Speaking",
        ],
        PTE: [
            "Listening",
            "Reading",
            "Writing",
            "Speaking",
        ],
        TOEFL: [
            "Listening",
            "Reading",
            "Writing",
            "Speaking",
        ],
        Duolingo: [
            "Literacy",
            "Comprehension",
            "Conversation",
            "Production",
        ],
    };


    const handleChange = (key, newValue) => {
        onChange({
            ...value,
            [key]: newValue,
        });
    };


    const handleOverallChange = (e) => {
        const input = e.target.value;

        const [overall, minimum] = input.split("/");

        onChange({
            ...value,
            overall: overall || "",
            minimum: minimum || "",
        });
    };


    const fields =
        languageTests[value.testType] || [];


    return (
        <Box sx={{ mb: 2 }}>

            <Grid container spacing={1.5}>

                {/* Test Type */}
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>
                            Test
                        </InputLabel>

                        <Select
                            value={value.testType || ""}
                            label="Test"
                            onChange={(e) =>
                                handleChange(
                                    "testType",
                                    e.target.value
                                )
                            }
                        >
                            {Object.keys(languageTests).map(
                                (test) => (
                                    <MenuItem
                                        key={test}
                                        value={test}
                                    >
                                        {test}
                                    </MenuItem>
                                )
                            )}
                        </Select>

                    </FormControl>
                </Grid>


                {/* Overall */}
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Overall"
                        size="small"
                        fullWidth
                        value={
                            value.minimum
                                ? `${value.overall}/${value.minimum}`
                                : value.overall || ""
                        }
                        onChange={handleOverallChange}
                        placeholder="6.5 or 6/5.5"
                    />
                </Grid>


                {/* Individual Toggle */}
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={
                                    value.hasIndividualScores || false
                                }
                                onChange={(e) =>
                                    handleChange(
                                        "hasIndividualScores",
                                        e.target.checked
                                    )
                                }
                            />
                        }
                        label="Individual scores"
                    />
                </Grid>


                {/* Individual Scores */}
                {value.hasIndividualScores &&
                    fields.map((field) => (
                        <Grid
                            item
                            xs={6}
                            sm={3}
                            key={field}
                        >
                            <TextField
                                label={field}
                                size="small"
                                fullWidth
                                value={
                                    value[
                                    field.toLowerCase()
                                    ] || ""
                                }
                                onChange={(e) =>
                                    handleChange(
                                        field.toLowerCase(),
                                        e.target.value
                                    )
                                }
                            />
                        </Grid>
                    ))
                }

            </Grid>

        </Box>
    );
};


export default LanguageRequirementFields;