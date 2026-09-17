import { useEffect, useRef, useState } from "react";
import { Box, Button, TextField } from "@mui/material";

export default function ListSearch({ label, placeholder, onSearch }) {
    const [value, setValue] = useState("");
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);
    const submit = (next) => {
        clearTimeout(timer.current);
        onSearch(next.trim());
    };
    return <Box component="form" onSubmit={event => { event.preventDefault(); submit(value); }} sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
        <TextField size="small" label={label} placeholder={placeholder} value={value} onChange={event => {
            const next = event.target.value;
            setValue(next);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => onSearch(next.trim()), 300);
        }} slotProps={{ htmlInput: { maxLength: 200 } }} sx={{ flex: "1 1 240px", maxWidth: 520 }} />
        <Button type="submit" variant="contained">Search</Button>
        {value && <Button onClick={() => { setValue(""); submit(""); }}>Clear</Button>}
    </Box>;
}
