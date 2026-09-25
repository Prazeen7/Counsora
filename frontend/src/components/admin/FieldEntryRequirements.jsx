import { useState } from "react";
import { Box, Button, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { FIELD_OPTIONS } from "../../constants/programFields";
import InstitutionEntryRequirementsFields from "./InstitutionEntryRequirementsFields";

export default function FieldEntryRequirements({ value = [], onChange }) {
    const [field, setField] = useState("");
    const [level, setLevel] = useState("undergraduate");
    const available = FIELD_OPTIONS.filter(option => !value.some(item => item.field === option && item.level === level));
    return <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">Field-specific Requirements</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apply requirements automatically to programs with the selected field and study level. Program-specific requirements take precedence; empty values use the general requirements.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <TextField select label="Study Level" value={level} onChange={event => { setLevel(event.target.value); setField(""); }} sx={{ minWidth: 200 }}>
                <MenuItem value="diploma">Diploma</MenuItem>
                <MenuItem value="undergraduate">Undergraduate</MenuItem>
                <MenuItem value="postgraduate">Postgraduate</MenuItem>
            </TextField>
            <TextField select label="Field of Study" value={field} onChange={event => setField(event.target.value)} sx={{ flex: 1, minWidth: 240 }}>
                {available.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <Button disabled={!available.includes(field)} onClick={() => {
                onChange([...value, { field, level, requirements: {} }]);
                setField("");
            }}>Add Field Requirements</Button>
        </Box>
        {value.map((item, index) => <Box key={`${item.field}-${item.level}`} sx={{ mt: 2 }}>
            <InstitutionEntryRequirementsFields title={`${item.field} — ${item.level === "diploma" ? "Diploma" : item.level === "postgraduate" ? "Postgraduate" : "Undergraduate"}`}
                value={item.requirements} onChange={requirements => onChange(value.map((entry, i) => i === index ? { ...entry, requirements } : entry))} />
            <Button color="error" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove Field Requirements</Button>
        </Box>)}
    </Paper>;
}
