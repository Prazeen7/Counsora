import { Box, Typography } from "@mui/material";
import ProgramDetailsTicker from "./ProgramDetailsTicker";

const GeneralNote = () => <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: "normal", ml: 0.5 }}>(General)</Box>;

export default function ProgramEntryRequirements({ requirements }) {
    if (!requirements.academic.length && !requirements.languages.length) return <Typography variant="body2">Not specified</Typography>;
    return <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        {requirements.academic.map(row => <Box key={row.label}>
            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}><b>{row.label}:</b> {row.value}{row.general && <GeneralNote />}</Typography>
        </Box>)}
        {requirements.languages.length > 0 && <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight="medium">Language:{requirements.generalLanguage && <GeneralNote />}</Typography>
            <ProgramDetailsTicker items={requirements.languages} />
        </Box>}
    </Box>;
}
