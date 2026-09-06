import { Box, Tooltip, Typography } from "@mui/material";

export default function ProgramDetailsTicker({ items }) {
    const text = items.join(" | ");
    const scroll = text.length > 38;
    return (
        <Tooltip arrow placement="top" title={
            <Box component="ul" sx={{ m: 0, pl: 2, py: 0.5, overflowWrap: "anywhere" }}>
                {items.map((item, index) => (
                    <Typography component="li" variant="body2" key={index} sx={{ mb: 0.5 }}>{item}</Typography>
                ))}
            </Box>
        }>
            <Box tabIndex={0} sx={{
                width: "100%", minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", cursor: "help",
                "@keyframes programDetailsTicker": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-50%)" },
                },
                "&:hover .program-details-ticker, &:focus .program-details-ticker": { animationPlayState: "paused" },
            }}>
                <Typography component="div" variant="body2" className="program-details-ticker" sx={{
                    display: "inline-flex", width: "max-content",
                    ...(scroll && { animation: `programDetailsTicker ${Math.max(22, text.length * 0.42)}s linear infinite` }),
                    "@media (prefers-reduced-motion: reduce)": {
                        animation: "none", width: "100%", whiteSpace: "normal", overflowWrap: "anywhere",
                        "& > [aria-hidden]": { display: "none" },
                    },
                }}>
                    <Box component="span" sx={{ pr: scroll ? 4 : 0 }}>{text}{scroll && " |"}</Box>
                    {scroll && <Box component="span" sx={{ pr: 4 }} aria-hidden="true">{text} |</Box>}
                </Typography>
            </Box>
        </Tooltip>
    );
}

