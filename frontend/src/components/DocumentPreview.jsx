import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { getDocumentPreview } from "../services/documentService";

export default function DocumentPreview({ record, onClose }) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        let objectUrl;
        getDocumentPreview(record._id).then((blob) => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
        }).catch((err) => { if (active) setError(err.message); });
        return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [record._id]);

    return <Dialog open onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Preview: {record.title}</DialogTitle>
        <DialogContent dividers>
            {error ? <Alert severity="error">{error}</Alert> : !url ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress aria-label="Loading preview" /></Box> :
                record.preview.mimeType === "application/pdf" ?
                    <Box component="iframe" title={record.title} src={url} sx={{ width: "100%", height: "70vh", border: 0 }} /> :
                    <Box component="img" alt={record.title} src={url} sx={{ display: "block", maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", mx: "auto" }} />}
        </DialogContent>
        <DialogActions>
            {url && <Button component="a" href={url} download={record.preview.name}>Download {record.preview.mimeType === "application/pdf" ? "PDF" : "image"}</Button>}
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>;
}
