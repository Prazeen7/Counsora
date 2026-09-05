import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Paper,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Stack
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    CheckCircle as ApproveIcon,
    Close as RejectIcon
} from '@mui/icons-material';

export default function ReviewPrograms() {
    const { institutionId } = useParams();
    const navigate = useNavigate();

    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchPendingPrograms();
    }, [institutionId]);

    const fetchPendingPrograms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(
                `${apiUrl}/institution/${institutionId}/programs/pending`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch programs');
            }

            const data = await response.json();
            setPrograms(data.programs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (index) => {
        setPrograms(programs.filter((_, i) => i !== index));
    };

    const handleEdit = (index) => {
        setEditingIndex(index);
        setEditForm({ ...programs[index] });
    };

    const handleSaveEdit = () => {
        const updated = [...programs];
        updated[editingIndex] = editForm;
        setPrograms(updated);
        setEditingIndex(null);
        setEditForm({});
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditForm({});
    };

    const handleApprove = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(
                `${apiUrl}/institution/${institutionId}/programs/approve`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ programs }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve programs');
            }

            const data = await response.json();
            alert(`✅ Successfully approved ${data.approvedCount} programs!`);
            navigate('/admin/institutions');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject all programs? This cannot be undone.')) {
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(
                `${apiUrl}/institution/${institutionId}/programs/reject`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject programs');
            }

            alert('Programs rejected successfully');
            navigate('/admin/institutions');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={() => navigate('/admin/institutions')} sx={{ mt: 2 }}>
                    Back to Institutions
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Review Crawled Programs
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Review, edit, or remove programs before saving to database. Total: {programs.length} programs
                </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleApprove}
                    disabled={saving || programs.length === 0}
                >
                    Approve All ({programs.length})
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={handleReject}
                    disabled={saving}
                >
                    Reject All
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={() => navigate('/admin/institutions')}>
                    Cancel
                </Button>
            </Stack>

            {/* Programs List */}
            <Grid container spacing={2}>
                {programs.map((program, index) => (
                    <Grid item xs={12} key={index}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6">
                                        {program.degree_name}
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(index)}
                                            disabled={editingIndex !== null}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(index)}
                                            disabled={editingIndex !== null}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                                        <Typography variant="body1">{program.duration || 'N/A'}</Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">Format:</Typography>
                                        <Typography variant="body1">{program.format || 'N/A'}</Typography>
                                    </Grid>

                                    {program.specialization?.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Specializations:</Typography>
                                            <Typography variant="body1">{program.specialization.join(', ')}</Typography>
                                        </Grid>
                                    )}

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

                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Source URL:</Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ wordBreak: 'break-all', color: 'primary.main' }}
                                            component="a"
                                            href={program.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {program.url}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {programs.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No programs to review. All programs have been deleted.
                </Alert>
            )}

            {/* Edit Dialog */}
            <Dialog open={editingIndex !== null} onClose={handleCancelEdit} maxWidth="md" fullWidth>
                <DialogTitle>Edit Program</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Degree Name"
                            fullWidth
                            value={editForm.degree_name || ''}
                            onChange={(e) => setEditForm({ ...editForm, degree_name: e.target.value })}
                        />
                        <TextField
                            label="Specializations (comma-separated)"
                            fullWidth
                            value={editForm.specialization?.join(', ') || ''}
                            onChange={(e) => setEditForm({
                                ...editForm,
                                specialization: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                        />
                        <TextField
                            label="Duration"
                            fullWidth
                            value={editForm.duration || ''}
                            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                        />
                        <TextField
                            label="Format"
                            fullWidth
                            value={editForm.format || ''}
                            onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                        />
                        <TextField
                            label="Credits (comma-separated)"
                            fullWidth
                            value={editForm.credits?.join(', ') || ''}
                            onChange={(e) => setEditForm({ ...editForm, credits: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <TextField
                            label="Tuition Fees (one per line)"
                            fullWidth
                            multiline
                            rows={3}
                            value={
                                Array.isArray(editForm?.tuition_fees)
                                    ? editForm.tuition_fees
                                        .map(fee =>
                                            `${fee?.credits || ''}: ${fee?.annual_fee_eur ?? ''}`
                                        )
                                        .join('\n')
                                    : ''
                            }
                            onChange={(e) => {
                                const tuitionFees = e.target.value
                                    .split('\n')
                                    .map(line => line.trim())
                                    .filter(Boolean)
                                    .map(line => {
                                        const [credits, fee] = line.split(':');

                                        const parsedFee = Number(fee?.trim());

                                        return {
                                            credits: credits?.trim() || null,
                                            annual_fee_eur:
                                                fee?.trim() && !Number.isNaN(parsedFee)
                                                    ? parsedFee
                                                    : null
                                        };
                                    });

                                setEditForm({
                                    ...editForm,
                                    tuition_fees: tuitionFees
                                });
                            }}
                            placeholder="120 ECTS: 23520"
                        />
                        <TextField
                            label="Intakes (comma-separated)"
                            fullWidth
                            value={editForm.intakes?.join(', ') || ''}
                            onChange={(e) => setEditForm({ ...editForm, intakes: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <TextField
                            label="URL"
                            fullWidth
                            value={editForm.url || ''}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
