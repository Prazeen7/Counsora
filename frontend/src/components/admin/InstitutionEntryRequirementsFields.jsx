import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, MenuItem, Paper, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LanguageScoreInputGroup from "./LanguageScoreInputGroup";

const QUALIFICATIONS = ["Higher Secondary", "Diploma", "Bachelor", "Master", "Doctoral"];
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TESTS = [
    ["IELTS", "english", "ielts", "IELTS (Overall & Band Scores)"],
    ["TOEFL", "english", "toefl", "TOEFL (Overall & Section Scores)"],
    ["PTE", "english", "pte", "PTE (Overall & Section Scores)"],
    ["Duolingo", "english", "duolingo", "Duolingo (Overall & Sub-scores)"],
    ["TestDaF", "german", "testdaf", "German TestDaF (Overall & TDN Sub-scores)"],
    ["DSH", "german", "dsh", "German DSH (Overall & Sub-scores)"],
];

export default function InstitutionEntryRequirementsFields({ title, value = {}, onChange }) {
    const [selectedTest, setSelectedTest] = useState("");
    const [expandedTests, setExpandedTests] = useState([]);
    const academic = value?.gpa || {};
    const languages = value?.languageRequirement || [];
    const updateAcademic = (key, nextValue) => onChange({ ...value, gpa: { ...academic, [key]: nextValue } });
    const updateTest = (testType, key, nextValue) => {
        const existing = languages.find(test => test.testType === testType);
        const updated = { ...existing, testType, [key]: nextValue };
        if (key === "minimum_band") updated.minimum = nextValue;
        updated.hasIndividualScores = ["listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"]
            .some(field => updated[field] !== undefined && updated[field] !== null && updated[field] !== "");
        onChange({ ...value, languageRequirement: existing
            ? languages.map(test => test === existing ? updated : test)
            : [...languages, updated] });
    };
    const availableTests = [...TESTS.map(([name]) => name), "German CEFR"]
        .filter(name => !languages.some(test => test.testType === name));
    const addTest = () => {
        if (!availableTests.includes(selectedTest)) return;
        onChange({ ...value, languageRequirement: [...languages, { testType: selectedTest }] });
        setExpandedTests(previous => [...previous, selectedTest]);
        setSelectedTest("");
    };
    const removeTest = (index) => {
        const name = languages[index].testType;
        onChange({ ...value, languageRequirement: languages.filter((_, itemIndex) => itemIndex !== index) });
        setExpandedTests(previous => previous.filter(test => test !== name));
    };

    return <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{title}</Typography>
        <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>Academic Requirements</Typography>
        <Box>
            <TextField select fullWidth label="Minimum Qualification" value={academic.minimumQualification || ""}
                onChange={event => updateAcademic("minimumQualification", event.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {[...new Set([...QUALIFICATIONS, academic.minimumQualification].filter(Boolean))].map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
            <TextField select fullWidth label="Score Type" value={academic.type || ""} onChange={event => updateAcademic("type", event.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {["GPA", "Percentage", ...(academic.type === "Qualification" ? ["Qualification"] : [])].map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Score" value={academic.score ?? ""} onChange={event => updateAcademic("score", event.target.value)} />
            <TextField fullWidth label="Scale (e.g., 4.0, 100)" value={academic.scale ?? ""} onChange={event => updateAcademic("scale", event.target.value)} />
        </Box>
        <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mt: 3, mb: 2 }}>Language Requirements & Individual Band Scores</Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField select label="Language Test" value={selectedTest} sx={{ flex: 1, minWidth: 200 }}
            disabled={!availableTests.length}
            onChange={event => setSelectedTest(event.target.value)}>
            <MenuItem value=""><em>Select a test</em></MenuItem>
            {availableTests.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
        </TextField>
        <Button variant="outlined" onClick={addTest} disabled={!availableTests.includes(selectedTest)}>Add Language Test</Button>
        </Box>
        {languages.map((scores, index) => {
            const name = scores.testType;
            const [, language = "custom", test = name, label = scores.testName || name] = TESTS.find(([testName]) => testName === name) || [];
            return <Accordion key={`${name}-${index}`} expanded={expandedTests.includes(name)}
                onChange={(_event, expanded) => setExpandedTests(previous => expanded
                    ? [...previous, name] : previous.filter(testName => testName !== name))}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="medium">{name === "Other" ? scores.testName || name : name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
        {name === "German CEFR" ? <TextField select fullWidth label="German CEFR Level" sx={{ mb: 2 }}
            value={scores.overall || ""}
            onChange={event => updateTest(name, "overall", event.target.value)}>
            <MenuItem value=""><em>None</em></MenuItem>
            {CEFR_LEVELS.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField> : <Grid container spacing={2}>
                <LanguageScoreInputGroup title={label} lang={language} test={test}
                    data={{ [language]: { [test]: { ...scores, minimum_band: scores.minimum_band ?? scores.minimum } } }}
                    onChange={(_language, _test, field, nextValue) => updateTest(name, field, nextValue)} />
        </Grid>}
                <Button color="error" sx={{ mt: 1 }} onClick={() => removeTest(index)}>Remove {name === "Other" ? scores.testName || name : name}</Button>
                </AccordionDetails>
            </Accordion>;
        })}
    </Paper>;
}
