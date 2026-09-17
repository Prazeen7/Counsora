import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { TablePagination } from "@mui/material";
import { createCountry, updateCountry, deleteCountry } from "../../services/countryService";
import useAdminList from "../../hooks/useAdminList";
import ListSearch from "../../components/admin/ListSearch";

const schemaFields = ["code", "name", "currency", "isActive"];

function displayValue(value) {
    if (value === undefined) return "—";
    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default function Countries() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [search, setSearch] = useState("");
    const [retry, setRetry] = useState(0);
    const query = new URLSearchParams({ page, limit, search }).toString();
    const { data, loading, error } = useAdminList("/country/all", query, retry);
    const countries = data?.countries || [];
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
            if (isCreating) await createCountry(changes);
            else await updateCountry(editing._id, changes);
            setPage(1);
            setRetry(value => value + 1);
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
            if (countries.length === 1 && page > 1) setPage(value => value - 1);
            setRetry(value => value + 1);
            setDeleting(null);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const retryFetch = () => {
        setRetry((value) => value + 1);
    };

    const fields = schemaFields;

    return <Box sx={{ p: { xs: 2, md: 4 }, mt: { xs: 7, lg: 0 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={1}>Countries</Typography>
        <Typography color="text.secondary" mb={3}>Manage country code, name, currency, and active status.</Typography>
        <Button variant="contained" sx={{ mb: 3 }} disabled={loading || Boolean(error)} onClick={() => { setActionError(""); setEditing({ code: "", name: "", currency: "", isActive: true }); }}>Add country</Button>
        <ListSearch label="Search countries" placeholder="Name, code, or currency" onSearch={value => { setSearch(value); setPage(1); }} />
        {error ? <Alert severity="error" action={<Button onClick={retryFetch}>Retry</Button>}>{error}</Alert>
            : loading ? <CircularProgress aria-label="Loading countries" />
                : <>
                    <Typography mb={2}>{data.total} countries{search ? ` matching “${search}”` : ""}</Typography>
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
                    <TablePagination component="div" count={data.total} page={page - 1} rowsPerPage={limit} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, next) => setPage(next + 1)} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(1); }} />
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
