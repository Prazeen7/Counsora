import Loading from '../Loading';
import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete as DeleteOutline, Edit } from "@mui/icons-material";
import { saveCostSheet, deleteCostSheet } from "../../services/costEstimationService";

const newKey = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
const newItem = () => ({ key: newKey('cost'), label: '', amount: '', currency: 'NPR', note: '' });
const newStage = () => ({ key: newKey('stage'), title: '', items: [newItem()] });

export default function CostSheetManager({ countryId, countryName, countryCurrency, sheet, onChanged }) {
    const [draft, setDraft] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const openEditor = () => {
        setError('');
        setDraft(sheet ? { title: sheet.title, stages: sheet.stages.map((stage) => ({
            key: stage.key, title: stage.title, items: stage.items.map((item) => ({
                key: item.key, label: item.label, amount: item.defaultAmount ?? '', currency: item.currency || 'NPR', note: item.note || '',
                ...(item.unit !== undefined ? { unit: item.unit } : {}),
                ...(item.includeInTotal !== undefined ? { includeInTotal: item.includeInTotal } : {}),
                ...(item.calculation ? { calculation: item.calculation } : {}),
            })),
        })) } : { title: `${countryName} Cost Sheet`, stages: [newStage()] });
    };
    const updateStage = (index, changes) => setDraft((previous) => ({ ...previous, stages: previous.stages.map((stage, i) => i === index ? { ...stage, ...changes } : stage) }));
    const submit = async (event) => {
        event.preventDefault();
        const payload = { title: draft.title.trim(), stages: draft.stages.map((stage) => ({ key: stage.key, title: stage.title.trim(), items: stage.items.map((item) => ({ ...item, label: item.label.trim(), currency: item.currency || 'NPR', note: item.note || '', amount: item.calculation || item.amount === '' ? null : Number(item.amount) })) })) };
        if (!payload.title || !payload.stages.length || payload.stages.some((stage) => !stage.title || !stage.items.length || stage.items.some((item) => !item.label || (item.amount !== null && (!Number.isFinite(item.amount) || item.amount < 0 || item.amount > 1e12 || Number(item.amount.toFixed(2)) !== item.amount))))) {
            setError('Provide a sheet title, stage names, and field labels. Amounts must be blank or non-negative numbers with up to two decimal places (maximum NPR 1 trillion).');
            return;
        }
        setBusy(true); setError('');
        try { await saveCostSheet(countryId, payload); setDraft(null); onChanged(); }
        catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };
    return <>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
            <Button variant="outlined" startIcon={sheet ? <Edit /> : <Add />} onClick={openEditor}>{sheet ? 'Edit cost sheet' : 'Create cost sheet'}</Button>
            {sheet && <Button color="error" startIcon={<DeleteOutline />} onClick={() => { setError(''); setConfirmDelete(true); }}>Delete cost sheet</Button>}
        </Stack>
        <Dialog open={Boolean(draft)} onClose={() => { if (!busy) setDraft(null); }} maxWidth="md" fullWidth>
            <DialogTitle>{sheet ? 'Edit' : 'Create'} cost sheet · {countryName}</DialogTitle>
            {draft && <Box component="form" onSubmit={submit}>
                <DialogContent dividers>
                    <Box component="fieldset" disabled={busy} sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Alert severity="info" sx={{ mb: 3 }}>These defaults are shared with all counselors. Leave an amount blank when the user needs to enter it.</Alert>
                        <TextField fullWidth required label="Cost sheet title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} slotProps={{ htmlInput: { maxLength: 500 } }} />
                        {draft.stages.map((stage, index) => <Paper key={stage.key} variant="outlined" sx={{ my: 3, p: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <Typography sx={{ flexShrink: 0 }}>Stage {index + 1}</Typography>
                                <TextField fullWidth required label="Stage name" value={stage.title} onChange={(event) => updateStage(index, { title: event.target.value })} slotProps={{ htmlInput: { maxLength: 500 } }} />
                                <IconButton aria-label={`Remove stage ${index + 1}`} disabled={draft.stages.length === 1} onClick={() => setDraft({ ...draft, stages: draft.stages.filter((_, i) => i !== index) })}><DeleteOutline /></IconButton>
                            </Stack>
                            {stage.items.map((item, fieldIndex) => <Box key={item.key} sx={{ borderTop: '1px solid #e2e8f0', py: 2 }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <TextField fullWidth required label="Field label" value={item.label} onChange={(event) => updateStage(index, { items: stage.items.map((field, i) => i === fieldIndex ? { ...field, label: event.target.value } : field) })} slotProps={{ htmlInput: { maxLength: 500 } }} />
                                    <TextField select label="Currency" value={item.currency || 'NPR'} onChange={(event) => updateStage(index, { items: stage.items.map((field, i) => i === fieldIndex ? { ...field, currency: event.target.value } : field) })} sx={{ minWidth: 150 }}><MenuItem value="NPR">NPR</MenuItem>{countryCurrency && countryCurrency !== 'NPR' && <MenuItem value={countryCurrency}>{countryCurrency}</MenuItem>}</TextField>
                                    <TextField label={item.calculation ? 'Calculated amount' : `Default ${item.unit === 'percent' ? 'rate (%)' : `amount (${item.currency || 'NPR'})`}`} disabled={Boolean(item.calculation)} type="number" value={item.amount} onChange={(event) => updateStage(index, { items: stage.items.map((field, i) => i === fieldIndex ? { ...field, amount: event.target.value } : field) })} slotProps={{ htmlInput: { min: 0, max: item.unit === 'percent' ? 100 : 1e12, step: '0.01' } }} />
                                    <IconButton aria-label={`Remove field ${fieldIndex + 1} from stage ${index + 1}`} disabled={stage.items.length === 1} onClick={() => updateStage(index, { items: stage.items.filter((_, i) => i !== fieldIndex) })}><DeleteOutline /></IconButton>
                                </Stack>
                                <TextField fullWidth size="small" label="Note (optional)" value={item.note} sx={{ mt: 2 }} onChange={(event) => updateStage(index, { items: stage.items.map((field, i) => i === fieldIndex ? { ...field, note: event.target.value } : field) })} slotProps={{ htmlInput: { maxLength: 1000 } }} />
                            </Box>)}
                            <Button startIcon={<Add />} disabled={stage.items.length >= 50} onClick={() => updateStage(index, { items: [...stage.items, newItem()] })}>Add cost field</Button>
                        </Paper>)}
                        <Button startIcon={<Add />} disabled={draft.stages.length >= 20} onClick={() => setDraft({ ...draft, stages: [...draft.stages, newStage()] })}>Add stage</Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? <><Loading size={20} sx={{ display: 'inline-flex', mr: 1 }} label="Saving…" />Saving…</> : 'Save cost sheet'}</Button></DialogActions>
            </Box>}
        </Dialog>
        <Dialog open={confirmDelete} onClose={() => { if (!busy) setConfirmDelete(false); }}>
            <DialogTitle>Delete {countryName} cost sheet?</DialogTitle>
            <DialogContent><Typography>This removes the shared cost sheet, including all stages and fields. Cost estimation will be unavailable for this country until a new sheet is created.</Typography>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent>
            <DialogActions><Button disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button><Button color="error" disabled={busy} onClick={async () => {
                setBusy(true); setError('');
                try { await deleteCostSheet(countryId); setConfirmDelete(false); onChanged(); }
                catch (err) { setError(err.message); }
                finally { setBusy(false); }
            }}>{busy ? <><Loading size={20} sx={{ display: 'inline-flex', mr: 1 }} label="Deleting…" />Deleting…</> : 'Delete cost sheet'}</Button></DialogActions>
        </Dialog>
    </>;
}
