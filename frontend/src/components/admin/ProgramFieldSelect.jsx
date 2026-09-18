import { Autocomplete, TextField } from "@mui/material";
import { FIELD_OPTIONS, normalizeProgramFields } from "../../constants/programFields";

export default function ProgramFieldSelect({ value, onChange, size, disabled = false }) {
    const fields = normalizeProgramFields(value);
    return (
        <Autocomplete
            multiple
            disableCloseOnSelect
            fullWidth
            size={size}
            disabled={disabled}
            options={[...new Set([...FIELD_OPTIONS, ...fields])]}
            value={fields}
            onChange={(_, selected) => onChange(selected)}
            renderInput={(params) => (
                <TextField {...params} label="Fields of study" helperText="Select all that apply" />
            )}
        />
    );
}
