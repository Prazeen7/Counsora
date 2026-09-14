import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { saveStudyGuide } from '../../services/studyGuideService';

export default function StudyGuideEditor({ record, country, defaultOrder, onClose, onSaved }) {
    const [fields, setFields] = useState({
        country: country._id,
        label: record?.label || '', title: record?.title || '', description: record?.description || '',
        category: record?.category || '', introduction: record?.introduction || '',
        order: record?.order ?? defaultOrder,
        sections: record?.sections?.map(section => ({ title: section.title, content: section.content })) || [],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const change = key => event => setFields(current => ({ ...current, [key]: event.target.value }));
    const changeSection = (index, key, value) => setFields(current => ({ ...current, sections: current.sections.map((section, i) => i === index ? { ...section, [key]: value } : section) }));
    const moveSection = (index, offset) => setFields(current => {
        const sections = [...current.sections];
        [sections[index], sections[index + offset]] = [sections[index + offset], sections[index]];
        return { ...current, sections };
    });
    const submit = async event => {
        event.preventDefault();
        if (saving) return;
        if (!fields.introduction.trim() && !fields.sections.length) { setError('Add an introduction or at least one section.'); return; }
        setSaving(true); setError('');
        try { await onSaved(await saveStudyGuide(record?._id, { ...fields, order: Number(fields.order) })); }
        catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };
    return <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose}>
        <Box component="form" onSubmit={submit}>
            <DialogTitle>{record ? 'Edit topic' : 'Add topic'} — {country.name}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField label="Navigation label" required value={fields.label} onChange={change('label')} disabled={saving} inputProps={{ maxLength: 100 }} helperText="A short name, such as Living costs." />
                    <TextField label="Topic heading" required value={fields.title} onChange={change('title')} disabled={saving} inputProps={{ maxLength: 300 }} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField fullWidth label="Category" value={fields.category} onChange={change('category')} disabled={saving} inputProps={{ maxLength: 100 }} helperText="For example: Before you travel" />
                        <TextField label="Display order" type="number" required value={fields.order} onChange={change('order')} disabled={saving} inputProps={{ min: 0, step: 1 }} helperText="If occupied, this and later topics move down by one." />
                    </Stack>
                    <TextField label="Short description" multiline minRows={2} value={fields.description} onChange={change('description')} disabled={saving} inputProps={{ maxLength: 1000 }} />
                    <TextField label="Introduction" multiline minRows={4} value={fields.introduction} onChange={change('introduction')} disabled={saving} inputProps={{ maxLength: 20000 }} helperText="Always visible. Separate paragraphs with a blank line; start bullet lines with - ." />
                    <Typography variant="h6">Expandable sections</Typography>
                    {fields.sections.map((section, index) => <Stack key={index} spacing={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography sx={{ flex: 1 }}>Section {index + 1}</Typography>
                            <Button disabled={saving || index === 0} onClick={() => moveSection(index, -1)} aria-label={'Move section ' + (index + 1) + ' up'}>Up</Button>
                            <Button disabled={saving || index === fields.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label={'Move section ' + (index + 1) + ' down'}>Down</Button>
                            <Button color="error" disabled={saving} onClick={() => setFields(current => ({ ...current, sections: current.sections.filter((_, i) => i !== index) }))}>Remove</Button>
                        </Stack>
                        <TextField label="Section title" required value={section.title} disabled={saving} inputProps={{ maxLength: 300 }} onChange={event => changeSection(index, 'title', event.target.value)} />
                        <TextField label="Section content" required multiline minRows={5} value={section.content} disabled={saving} inputProps={{ maxLength: 20000 }} onChange={event => changeSection(index, 'content', event.target.value)} helperText="Separate paragraphs with a blank line; start bullet lines with - ." />
                    </Stack>)}
                    <Button variant="outlined" disabled={saving || fields.sections.length >= 50} onClick={() => setFields(current => ({ ...current, sections: [...current.sections, { title: '', content: '' }] }))}>Add section</Button>
                </Stack>
            </DialogContent>
            <DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button><Button variant="contained" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save topic'}</Button></DialogActions>
        </Box>
    </Dialog>;
}
