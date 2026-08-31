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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from "@mui/material";
import {
    Edit as EditIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

export default function InstitutionPreview({ data, onEdit, onConfirm, onCancel, open }) {
    const theme = useTheme();

    if (!data) return null;

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Review Institution Details</Typography>
                    <IconButton onClick={onCancel} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please review all information before submitting
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Basic Information */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Basic Information</Typography>
                            <IconButton size="small" onClick={() => onEdit('basic')}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Institution Name</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Country</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.countryName || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Type</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.type || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Website</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.website || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Email</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.email || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Contact Number</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.contactNumber || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">Application Fee</Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {data.applicationFee ? `${data.currency} ${data.applicationFee}` : 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Description</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.description || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Campuses */}
                    {data.campuses && data.campuses.length > 0 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Campuses ({data.campuses.length})</Typography>
                                <IconButton size="small" onClick={() => onEdit('campuses')}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {data.campuses.map((campus, index) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {campus.name || `Campus #${index + 1}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {campus.address}, {campus.city}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {campus.email} • {campus.contactNumber}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Paper>
                    )}

                    {/* Entry Requirements */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Entry Requirements</Typography>
                            <IconButton size="small" onClick={() => onEdit('requirements')}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>Undergraduate</Typography>
                        <Box sx={{ ml: 2, mb: 2 }}>
                            <Typography variant="body2">
                                <strong>GPA:</strong> {data.entryRequirements?.undergraduate?.gpa?.score || 'N/A'} 
                                {data.entryRequirements?.undergraduate?.gpa?.type && ` (${data.entryRequirements.undergraduate.gpa.type})`}
                            </Typography>
                            {(data.undergraduateLanguageRequirementFull || [data.entryRequirements?.undergraduate?.languageRequirement]).map((req, idx) => (
                                req && req.testType && (
                                    <Typography variant="body2" key={idx}>
                                        <strong>{req.testType}{req.testName ? ` (${req.testName})` : ''}:</strong> {req.overall}
                                        {req.minimum && `/${req.minimum}`}
                                    </Typography>
                                )
                            ))}
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>Postgraduate</Typography>
                        <Box sx={{ ml: 2 }}>
                            <Typography variant="body2">
                                <strong>GPA:</strong> {data.entryRequirements?.postgraduate?.gpa?.score || 'N/A'}
                                {data.entryRequirements?.postgraduate?.gpa?.type && ` (${data.entryRequirements.postgraduate.gpa.type})`}
                            </Typography>
                            {(data.postgraduateLanguageRequirementFull || [data.entryRequirements?.postgraduate?.languageRequirement]).map((req, idx) => (
                                req && req.testType && (
                                    <Typography variant="body2" key={idx}>
                                        <strong>{req.testType}{req.testName ? ` (${req.testName})` : ''}:</strong> {req.overall}
                                        {req.minimum && `/${req.minimum}`}
                                    </Typography>
                                )
                            ))}
                        </Box>
                    </Paper>

                    {/* Programs */}
                    {data.programs && data.programs.length > 0 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Programs ({data.programs.length})</Typography>
                                <IconButton size="small" onClick={() => onEdit('programs')}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Name</strong></TableCell>
                                            <TableCell><strong>Level</strong></TableCell>
                                            <TableCell><strong>Field</strong></TableCell>
                                            <TableCell><strong>Duration</strong></TableCell>
                                            <TableCell><strong>Tuition Fee</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.programs.map((program, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{program.name || 'N/A'}</TableCell>
                                                <TableCell>{program.level || 'N/A'}</TableCell>
                                                <TableCell>{program.field || 'N/A'}</TableCell>
                                                <TableCell>{program.duration || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {program.tuitionFee?.value 
                                                        ? `${data.currency} ${program.tuitionFee.value}/${program.tuitionFee.per}`
                                                        : 'N/A'
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Scholarships */}
                    {data.scholarships && data.scholarships.length > 0 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Scholarships ({data.scholarships.length})</Typography>
                                <IconButton size="small" onClick={() => onEdit('scholarships')}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {data.scholarships.map((scholarship, index) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {scholarship.name || `Scholarship #${index + 1}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Value:</strong> {scholarship.value || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Description:</strong> {scholarship.description || 'N/A'}
                                        </Typography>
                                        {scholarship.url && (
                                            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                <strong>URL:</strong> {scholarship.url}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Paper>
                    )}

                    {/* Financial Documents */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Financial Documents</Typography>
                            <IconButton size="small" onClick={() => onEdit('documents')}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Income Sources</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {data.documents?.incomeSources?.length > 0 ? (
                                        data.documents.incomeSources.map((source, idx) => (
                                            <Chip key={idx} label={source} size="small" />
                                        ))
                                    ) : (
                                        <Typography variant="body2">N/A</Typography>
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Sponsors</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {data.documents?.sponsors?.length > 0 ? (
                                        data.documents.sponsors.map((sponsor, idx) => (
                                            <Chip key={idx} label={sponsor} size="small" />
                                        ))
                                    ) : (
                                        <Typography variant="body2">N/A</Typography>
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Banks</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {data.documents?.banks?.length > 0 ? (
                                        data.documents.banks.map((bank, idx) => (
                                            <Chip key={idx} label={bank} size="small" />
                                        ))
                                    ) : (
                                        <Typography variant="body2">N/A</Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onCancel} variant="outlined" color="inherit">
                    Cancel
                </Button>
                <Button onClick={onEdit} variant="outlined" startIcon={<EditIcon />}>
                    Edit Form
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                >
                    Confirm & Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
