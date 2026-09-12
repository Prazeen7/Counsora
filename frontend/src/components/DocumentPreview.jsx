import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { getDocumentPreview } from "../services/documentService";

export default function DocumentPreview({ record, onClose }) {
    const [url, setUrl] = useState("");
    const [index, setIndex] = useState(0);
    const [error, setError] = useState("");
    const previews = Array.isArray(record.preview) ? record.preview : (record.preview ? [record.preview] : []);
    const currentPreview = previews[index] || {};
    useEffect(() => {
        let active = true;
        let objectUrl;
        getDocumentPreview(record._id, index).then((blob) => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
        }).catch((err) => { if (active) setError(err.message); });
        return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [record._id, index]);

    return <Dialog open onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Preview: {record.title} {previews.length > 1 && <Typography component="span" color="text.secondary">({index + 1} of {previews.length})</Typography>}</DialogTitle>
        <DialogContent dividers>
            <Box sx={{ position: "relative", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {previews.length > 1 && <IconButton aria-label="Previous preview" disabled={index === 0} onClick={() => { setUrl(""); setIndex((value) => value - 1); }} sx={{ position: "absolute", left: 4, top: "50%", zIndex: 2, bgcolor: "background.paper", boxShadow: 2, "&:hover": { bgcolor: "action.hover" } }}><ChevronLeft /></IconButton>}
                {error ? <Alert severity="error">{error}</Alert> : !url ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress aria-label="Loading preview" /></Box> :
                    currentPreview.mimeType === "application/pdf" ?
                        <Box component="iframe" title={record.title} src={url} sx={{ width: "100%", height: "70vh", border: 0 }} /> :
                        <Box component="img" alt={record.title} src={url} sx={{ display: "block", maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", mx: "auto" }} />}
                {previews.length > 1 && <IconButton aria-label="Next preview" disabled={index === previews.length - 1} onClick={() => { setUrl(""); setIndex((value) => value + 1); }} sx={{ position: "absolute", right: 4, top: "50%", zIndex: 2, bgcolor: "background.paper", boxShadow: 2, "&:hover": { bgcolor: "action.hover" } }}><ChevronRight /></IconButton>}
            </Box>
        </DialogContent>
        <DialogActions>
            {url && <Button component="a" href={url} download={previews[index]?.name}>Download</Button>}
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>;
}
