import { useState } from "react";
import { Alert, Box, IconButton, Tooltip } from "@mui/material";
import { PushPin, PushPinOutlined, VisibilityOff, VisibilityOffOutlined } from "@mui/icons-material";
import { apiRequest } from "../../services/api";

export default function ListingFlags({ item, resource, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = async (field, checked) => {
        setSaving(true);
        setError("");
        try {
            const flags = {
                isPinned: field === "isPinned" && checked,
                isDimmed: field === "isDimmed" && checked,
            };
            await apiRequest(`/${resource}/${item._id}`, {
                method: "PUT",
                body: JSON.stringify(flags),
            });
            onSaved({ ...item, ...flags });
        } catch (err) {
            setError(err.message || "Unable to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box onClick={(event) => event.stopPropagation()} sx={{ textAlign: "right" }}>
            <Box role="group" aria-label="Listing visibility and priority" sx={{
                display: "inline-flex", gap: 0.25, p: 0.25,
                border: "1px solid", borderColor: "divider", borderRadius: 2,
                bgcolor: "background.paper",
            }}>
                {[
                    { field: "isPinned", label: "Pin to top", activeLabel: "Unpin", Icon: PushPinOutlined, ActiveIcon: PushPin, color: "#6d28d9", background: "#ede9fe" },
                    { field: "isDimmed", label: "Dim and disable", activeLabel: "Restore interaction", Icon: VisibilityOffOutlined, ActiveIcon: VisibilityOff, color: "#b45309", background: "#fef3c7" },
                ].map(({ field, label, activeLabel, Icon, ActiveIcon, color, background }) => {
                    // Older records may have both flags set; Dim takes precedence.
                    const active = field === "isPinned"
                        ? Boolean(item.isPinned && !item.isDimmed)
                        : Boolean(item.isDimmed);
                    const action = active ? activeLabel : label;
                    return (
                        <Tooltip key={field} title={action} arrow>
                            <span>
                                <IconButton size="small" disabled={saving}
                                    aria-label={`${action}: ${item.name || item.degree_name || "program"}`}
                                    aria-pressed={active}
                                    onClick={() => update(field, !active)}
                                    sx={{ width: 26, height: 26, borderRadius: 1,
                                        color: active ? color : "text.secondary",
                                        bgcolor: active ? background : "transparent",
                                        "&:hover": { bgcolor: active ? background : "action.hover" },
                                    }}>
                                    {active ? <ActiveIcon sx={{ fontSize: 16 }} /> : <Icon sx={{ fontSize: 16 }} />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    );
                })}
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
        </Box>
    );
}
