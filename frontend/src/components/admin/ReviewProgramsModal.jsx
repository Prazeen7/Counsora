import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    CircularProgress,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

const LEVEL_OPTIONS = [
    'Foundation',
    'Diploma',
    'Bachelor',
    'Master',
    'PhD',
    'Doctoral',
    'Research'
];

const FIELD_OPTIONS = [
    'Business and Accounting',
    'Computer Science and Information Technology',
    'Engineering and Built Environment',
    'Data Science and Artificial Intelligence',
    'Science and Mathematics',
    'Environment and Agriculture',
    'Health and Nursing',
    'Psychology and Social Sciences',
    'Education and Teaching',
    'Law and Justice',
    'Communication and Media',
    'Arts and Design',
    'Hospitality and Tourism',
    'Languages and Humanities',
    'Research',
    'Other'
];

export default function ReviewProgramsModal({
    open,
    programs,
    onClose,
    onApprove,
    onReject,
    approving = false,
}) {
    const [reviewPrograms, setReviewPrograms] = useState([]);
    const [editingProgramIndex, setEditingProgramIndex] = useState(null);
    const [editProgramForm, setEditProgramForm] = useState({});

    // Update local state when programs prop changes
    useEffect(() => {
        setReviewPrograms(programs || []);
    }, [programs]);

    // Handler for deleting a program from review
    const handleDeleteProgram = (index) => {
        setReviewPrograms(reviewPrograms.filter((_, i) => i !== index));
    };

    // Handler for editing a program
    const handleEditProgram = (index) => {
        setEditingProgramIndex(index);
        setEditProgramForm({ ...reviewPrograms[index] });
    };

    // Handler for saving edited program
    const handleSaveEditedProgram = () => {
        const updated = [...reviewPrograms];
        updated[editingProgramIndex] = editProgramForm;
        setReviewPrograms(updated);
        setEditingProgramIndex(null);
        setEditProgramForm({});
    };

    // Handler for approve button
    const handleApprove = () => {
        onApprove(reviewPrograms);
    };

    // Handler for close (reset state)
    const handleClose = () => {
        if (!approving) {
            setEditingProgramIndex(null);
            setEditProgramForm({});
            onClose();
        }
    };

    return (
        <>
            {/* Main Review Modal */}
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Review Crawled Programs</Typography>
                        <IconButton
                            onClick={handleClose}
                            disabled={approving}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Review, edit, or remove programs before saving. Total: {reviewPrograms.length} programs
                    </Typography>
                </DialogTitle>

                <DialogContent dividers sx={{ maxHeight: '60vh' }}>
                    {reviewPrograms.map((program, index) => {
                        console.log(program);
                        return(
                        <Card key={index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6">
                                        {program.degree_name}
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditProgram(index)}
                                            disabled={editingProgramIndex !== null || approving}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteProgram(index)}
                                            disabled={editingProgramIndex !== null || approving}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Level:</Typography>
                                        <Typography variant="body1">{program.level || 'N/A'}</Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Field:</Typography>
                                        <Typography variant="body1">{program.field || 'N/A'}</Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                                        <Typography variant="body1">{program.duration || 'N/A'}</Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Format:</Typography>
                                        <Typography variant="body1">{program.format || 'N/A'}</Typography>
                                    </Grid>

                                    {program.credits && program.credits.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Credits:</Typography>
                                            <Typography variant="body1">{program.credits.join(', ')}</Typography>
                                        </Grid>
                                    )}

                                    {program.tuition_fees && program.tuition_fees.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Tuition:</Typography>
                                            <Typography variant="body1">{program.tuition_fees.join(', ')}</Typography>
                                        </Grid>
                                    )}

                                    {program.intakes && program.intakes.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>Intakes:</Typography>
                                            <Box>
                                                {program.intakes.map((intake, i) => (
                                                    <Chip key={i} label={intake} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {program.campuses && program.campuses.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>Campuses:</Typography>
                                            <Box>
                                                {program.campuses.map((campus, i) => (
                                                    <Chip key={i} label={campus} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {program.url && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>Program URL:</Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                href={program.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ textTransform: 'none' }}
                                            >
                                                View Program Page →
                                            </Button>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )})}

                    {reviewPrograms.length === 0 && (
                        <Alert severity="info">
                            No programs to review. All programs have been deleted.
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={onReject}
                        color="error"
                        disabled={approving}
                    >
                        Reject All
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        onClick={handleClose}
                        disabled={approving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        variant="contained"
                        color="success"
                        disabled={reviewPrograms.length === 0 || approving}
                        startIcon={approving ? <CircularProgress size={20} /> : null}
                    >
                        {approving ? 'Approving...' : `Approve All (${reviewPrograms.length})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Program Dialog */}
            <Dialog 
                open={editingProgramIndex !== null} 
                onClose={() => !approving && setEditingProgramIndex(null)} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>Edit Program</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Degree Name"
                            fullWidth
                            value={editProgramForm.degree_name || ''}
                            onChange={(e) => setEditProgramForm({ ...editProgramForm, degree_name: e.target.value })}
                        />
                        
                        <FormControl fullWidth>
                            <InputLabel>Level</InputLabel>
                            <Select
                                value={editProgramForm.level || ''}
                                label="Level"
                                onChange={(e) => setEditProgramForm({ ...editProgramForm, level: e.target.value })}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {LEVEL_OPTIONS.map((level) => (
                                    <MenuItem key={level} value={level}>
                                        {level}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Field</InputLabel>
                            <Select
                                value={editProgramForm.field || ''}
                                label="Field"
                                onChange={(e) => setEditProgramForm({ ...editProgramForm, field: e.target.value })}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {FIELD_OPTIONS.map((field) => (
                                    <MenuItem key={field} value={field}>
                                        {field}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Duration"
                            fullWidth
                            value={editProgramForm.duration || ''}
                            onChange={(e) => setEditProgramForm({ ...editProgramForm, duration: e.target.value })}
                        />
                        <TextField
                            label="Format"
                            fullWidth
                            value={editProgramForm.format || ''}
                            onChange={(e) => setEditProgramForm({ ...editProgramForm, format: e.target.value })}
                        />
                        <TextField
                            label="Credits (comma-separated)"
                            fullWidth
                            value={editProgramForm.credits?.join(', ') || ''}
                            onChange={(e) => setEditProgramForm({ 
                                ...editProgramForm, 
                                credits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                            })}
                        />
                        <TextField
                            label="Tuition Fees (comma-separated)"
                            fullWidth
                            value={editProgramForm.tuition_fees?.join(', ') || ''}
                            onChange={(e) => setEditProgramForm({ 
                                ...editProgramForm, 
                                tuition_fees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                            })}
                        />
                        <TextField
                            label="Intakes (comma-separated)"
                            fullWidth
                            value={editProgramForm.intakes?.join(', ') || ''}
                            onChange={(e) => setEditProgramForm({ 
                                ...editProgramForm, 
                                intakes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                            })}
                        />
                        
                        {/* Program URL - Read-only with clickable link */}
                        {editProgramForm.url && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Program URL (Read-only)
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    href={editProgramForm.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    fullWidth
                                    sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                >
                                    {editProgramForm.url}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingProgramIndex(null)} disabled={approving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEditedProgram} variant="contained" disabled={approving}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
