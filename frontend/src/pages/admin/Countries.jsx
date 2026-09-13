import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { getAllCountries, createCountry, updateCountry, deleteCountry } from "../../services/countryService";

const schemaFields = ["code", "name", "currency", "isActive"];

function displayValue(value) {
    if (value === undefined) return "—";
    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default function Countries() {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");
    const isCreating = Boolean(editing && !editing._id);

    const closeDialog = () => {
        if (saving) return;
        setEditing(null);
        setDeleting(null);
        setActionError("");
    };

    const saveCountry = async (event) => {
        event.preventDefault();
        setSaving(true);
        setActionError("");
        try {
            const changes = Object.fromEntries(schemaFields.filter((field) => editing[field] !== undefined).map((field) => [field, editing[field]]));
            const updated = isCreating ? await createCountry(changes) : await updateCountry(editing._id, changes);
            setCountries((items) => (isCreating ? [...items, updated] : items.map((item) => item._id === updated._id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name)));
            setEditing(null);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        setSaving(true);
        setActionError("");
        try {
            await deleteCountry(deleting._id);
            setCountries((items) => items.filter((item) => item._id !== deleting._id));
            setDeleting(null);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        getAllCountries()
            .then((data) => { if (!cancelled) setCountries(data); })
            .catch((err) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [retry]);

    const retryFetch = () => {
        setLoading(true);
        setError("");
        setRetry((value) => value + 1);
    };

    const fields = schemaFields;

    return <Box sx={{ p: { xs: 2, md: 4 }, mt: { xs: 7, lg: 0 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={1}>Countries</Typography>
        <Typography color="text.secondary" mb={3}>Manage country code, name, currency, and active status.</Typography>
        <Button variant="contained" sx={{ mb: 3 }} disabled={loading || Boolean(error)} onClick={() => { setActionError(""); setEditing({ code: "", name: "", currency: "", isActive: true }); }}>Add country</Button>
        {error ? <Alert severity="error" action={<Button onClick={retryFetch}>Retry</Button>}>{error}</Alert>
            : loading ? <CircularProgress aria-label="Loading countries" />
                : <>
                    <Typography mb={2}>{countries.length} countries</Typography>
                    <TableContainer component={Paper}>
                        <Table aria-label="Countries">
                            <TableHead>
                                <TableRow>{fields.map((field) => <TableCell key={field} sx={{ fontWeight: "bold" }}>{field}</TableCell>)}<TableCell>Actions</TableCell></TableRow>
                            </TableHead>
                            <TableBody>
                                {countries.map((country) => <TableRow key={country._id} hover>
                                    {fields.map((field) => <TableCell key={field} sx={{ whiteSpace: "pre-wrap", minWidth: 120 }}>{displayValue(country[field])}</TableCell>)}
                                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                                        <Button onClick={() => { setActionError(""); setEditing({ ...country }); }}>Edit</Button>
                                        <Button color="error" onClick={() => { setActionError(""); setDeleting(country); }}>Delete</Button>
                                    </TableCell>
                                </TableRow>)}
                                {!countries.length && <TableRow><TableCell colSpan={fields.length + 1}>No countries found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>}
        <Dialog open={Boolean(editing)} onClose={closeDialog} fullWidth maxWidth="sm">
            <Box component="form" onSubmit={saveCountry}>
                <DialogTitle>{isCreating ? "Add country" : "Edit country"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {actionError && <Alert severity="error">{actionError}</Alert>}
                    {schemaFields.filter((field) => field !== "isActive").map((field) => <TextField
                        key={field} label={field} value={editing?.[field] ?? ""} disabled={saving}
                        required={field === "name" || field === "code"}
                        type={field === "__v" ? "number" : "text"}
                        slotProps={{ htmlInput: field === "code" ? { minLength: 2, maxLength: 2, pattern: "[A-Za-z]{2}" } : {} }}
                        helperText={field === "createdAt" || field === "updatedAt" ? "ISO date and time, e.g. 2026-09-10T12:00:00.000Z" : field === "code" ? "Two-letter country code, e.g. NP" : field === "currency" ? "Optional, e.g. NPR" : undefined}
                        onChange={(event) => setEditing((current) => ({ ...current, [field]: event.target.value }))}
                    />)}
                    <FormControlLabel label="isActive" control={<Switch checked={editing?.isActive === true} disabled={saving} onChange={(event) => setEditing((current) => ({ ...current, isActive: event.target.checked }))} />} />
                </DialogContent>
                <DialogActions><Button onClick={closeDialog} disabled={saving}>Cancel</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving…" : isCreating ? "Add country" : "Save"}</Button></DialogActions>
            </Box>
        </Dialog>
        <Dialog open={Boolean(deleting)} onClose={closeDialog} fullWidth maxWidth="xs">
            <DialogTitle>Delete country?</DialogTitle>
            <DialogContent>
                {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
                <Typography>Delete {deleting?.name} ({deleting?.code})? This permanently removes the country.</Typography>
            </DialogContent>
            <DialogActions><Button onClick={closeDialog} disabled={saving}>Cancel</Button><Button color="error" variant="contained" onClick={confirmDelete} disabled={saving}>{saving ? "Deleting…" : "Delete"}</Button></DialogActions>
        </Dialog>
    </Box>;
}
