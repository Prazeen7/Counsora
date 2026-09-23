import { Grid, Paper, Typography, TextField } from "@mui/material";

export default function LanguageScoreInputGroup({ title, lang, test, data, onChange }) {
    const scores = data?.[lang]?.[test] || {};
    return (
        <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: "#f8fafc" }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, color: "text.primary" }}>
                    {title}
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Overall Score"
                            value={scores.overall ?? ""}
                            onChange={(e) => onChange(lang, test, "overall", e.target.value)}
                            placeholder="e.g. 6.5"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Minimum Band"
                            type="number"
                            slotProps={{ htmlInput: { min: 0, step: "any" } }}
                            value={scores.minimum_band ?? ""}
                            onChange={(e) => onChange(lang, test, "minimum_band", e.target.value)}
                            placeholder="e.g. 6.0"
                            helperText="Minimum score required in each component"
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Listening"
                            value={scores.listening ?? ""}
                            onChange={(e) => onChange(lang, test, "listening", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Reading"
                            value={scores.reading ?? ""}
                            onChange={(e) => onChange(lang, test, "reading", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Writing"
                            value={scores.writing ?? ""}
                            onChange={(e) => onChange(lang, test, "writing", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Speaking"
                            value={scores.speaking ?? ""}
                            onChange={(e) => onChange(lang, test, "speaking", e.target.value)}
                            placeholder="e.g. 6.0"
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    );
}
