import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Avatar,
    Tabs,
    Tab,
    Button,
    IconButton,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    CircularProgress,
    TextField,
    Paper,
    Card,
    CardContent,
    Grid,
    List,
    ListItem,
    ListItemText,
    Fab,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Alert,
    Divider,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Loading from "../../components/Loading";
import InstitutionTabsContent from "../../components/counselor/InstitutionTabsContent";
import { getInstitutionById } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";

const AdminFab = styled(Fab)(({ theme }) => ({
    position: "fixed",
    bottom: 20,
    right: 20,
    backgroundColor: "#4f46e5",
    color: "white",
    "&:hover": {
        backgroundColor: "#4338ca",
    },
}));

export default function AdminInstitutionPage({ institution: institutionProp, onClose }) {
    const { institutionId: routeInstitutionId } = useParams();
    const navigate = useNavigate();

    // Use prop if available, otherwise use route param
    const institutionId = institutionProp?._id || routeInstitutionId;
    const isPropsMode = !!institutionProp; // Check if using props mode

    const [institution, setInstitution] = useState(institutionProp || null);
    const [programs, setPrograms] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("all");
    const [selectedField, setSelectedField] = useState("all");
    const [selectedIntake, setSelectedIntake] = useState("all");
    const [selectedTuition, setSelectedTuition] = useState("all");
    
    // Edit mode states
    const [editMode, setEditMode] = useState(false);
    const [editedInstitution, setEditedInstitution] = useState(null);
    const [saving, setSaving] = useState(false);
    const [pendingDeletions, setPendingDeletions] = useState({
        locations: [],
        programs: [],
        scholarships: [],
        bannerImages: [],
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState("");
    const [editingProgram, setEditingProgram] = useState(null);
    const [editingScholarship, setEditingScholarship] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [programToDelete, setProgramToDelete] = useState(null);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerIntervalRef = useRef(null);
    const [programSaving, setProgramSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch if not using props mode or if institution prop changed
                let institutionData = institutionProp;
                
                if (!institutionProp && institutionId) {
                    institutionData = await getInstitutionById(institutionId);
                    setInstitution(institutionData);
                }

                if (institutionId) {
                    const programData = await getProgramsByInstitution(institutionId);
                    setPrograms(programData.programs || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        window.scrollTo({ top: 0, behavior: "smooth" });
        
        if (institutionId) {
            fetchData();
        }
    }, [institutionId, institutionProp]);

    if (!institution) {
        return <Loading loading={true} />;
    }

    // Helper function to extract level from degree_name
    const extractLevel = (degreeName) => {
        if (!degreeName) return 'Other';
        const lower = degreeName.toLowerCase();
        if (lower.includes('master') || lower.includes('msc') || lower.includes('ma ') || lower.includes('mba')) return 'Master';
        if (lower.includes('bachelor') || lower.includes('bsc') || lower.includes('ba ') || lower.includes('bba')) return 'Bachelor';
        if (lower.includes('phd') || lower.includes('doctorate')) return 'PhD';
        if (lower.includes('diploma') || lower.includes('certificate')) return 'Diploma';
        return 'Other';
    };

    // Helper function to extract field from degree_name
    const extractField = (degreeName) => {
        if (!degreeName) return 'General';
        const lower = degreeName.toLowerCase();
        
        if (lower.includes('computer') || lower.includes('computing') || lower.includes('it ')) return 'Computer Science';
        if (lower.includes('business') || lower.includes('management') || lower.includes('mba')) return 'Business';
        if (lower.includes('engineering')) return 'Engineering';
        if (lower.includes('science')) return 'Science';
        if (lower.includes('arts') || lower.includes(' art ')) return 'Arts';
        if (lower.includes('health') || lower.includes('medicine') || lower.includes('nursing')) return 'Health';
        if (lower.includes('education')) return 'Education';
        if (lower.includes('law')) return 'Law';
        
        return 'General';
    };

    // Helper function to parse tuition fee from string array
    const parseTuitionFee = (tuitionFees) => {
        if (!tuitionFees || !Array.isArray(tuitionFees) || tuitionFees.length === 0) return 0;
        
        const firstFee = tuitionFees[0];
        if (typeof firstFee !== 'string') return 0;
        
        const match = firstFee.match(/[\d,]+/);
        if (match) {
            return parseInt(match[0].replace(/,/g, ''), 10);
        }
        return 0;
    };

    // Transform programs to match old structure for compatibility
    const transformedPrograms = programs.map(program => ({
        ...program,
        name: program.degree_name,
        level: extractLevel(program.degree_name),
        field: extractField(program.degree_name),
        tuitionFee: {
            value: parseTuitionFee(program.tuition_fees),
            currency: institution.country?.currency || 'USD',
        },
    }));

    const levels = [...new Set(transformedPrograms.map((p) => p.level).filter(Boolean))];
    const fields = [...new Set(transformedPrograms.map((p) => p.field).filter(Boolean))];
    const intakes = [
        ...new Set(
            transformedPrograms.flatMap((p) => {
                if (Array.isArray(p.intakes)) return p.intakes;
                if (typeof p.intakes === 'string') {
                    return p.intakes
                        .split(',')
                        .map((i) => i.trim())
                        .filter(Boolean);
                }
                return [];
            })
        ),
    ];

    const filteredPrograms = transformedPrograms.filter((program) => {
        const matchesSearch = program.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesLevel =
            selectedLevel === "all" || program.level === selectedLevel;

        const matchesField =
            selectedField === "all" || program.field === selectedField;

        const programIntakes = Array.isArray(program.intakes)
            ? program.intakes
            : typeof program.intakes === 'string'
                ? program.intakes
                    .split(',')
                    .map((i) => i.trim())
                    .filter(Boolean)
                : [];

        const matchesIntake =
            selectedIntake === 'all' || programIntakes.includes(selectedIntake);

        const fee = Number(program.tuitionFee?.value || 0);

        const matchesTuition =
            selectedTuition === "all" ||
            (selectedTuition === "under20000" && fee < 20000) ||
            (selectedTuition === "20000to30000" && fee >= 20000 && fee <= 30000) ||
            (selectedTuition === "above30000" && fee > 30000);

        return (
            matchesSearch &&
            matchesLevel &&
            matchesField &&
            matchesIntake &&
            matchesTuition
        );
    });

    const handleEditInstitution = () => {
        setEditMode(true);
        setEditedInstitution(JSON.parse(JSON.stringify(institution)));
    };

    const toggleEditMode = () => {
        if (editMode) {
            // Cancel all changes
            setEditedInstitution(JSON.parse(JSON.stringify(institution)));
            setPendingDeletions({
                locations: [],
                programs: [],
                scholarships: [],
                bannerImages: [],
            });
        }
        setEditMode(!editMode);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditedInstitution(null);
        setPendingDeletions({
            locations: [],
            programs: [],
            scholarships: [],
            bannerImages: [],
        });
    };

    const handleSaveEdit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            // Filter out marked items
            const toSave = {
                ...editedInstitution,
                campuses: editedInstitution.campuses?.filter(
                    (loc) => !pendingDeletions.locations.includes(loc._id) && !loc.markedForDeletion
                ),
            };

            const formData = new FormData();
            
            Object.keys(toSave).forEach(key => {
                if (key === 'logo' && typeof toSave[key] === 'object') {
                    return;
                }
                if (typeof toSave[key] === 'object') {
                    formData.append(key, JSON.stringify(toSave[key]));
                } else {
                    formData.append(key, toSave[key]);
                }
            });

            const response = await fetch(`${apiUrl}/institution/${institutionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            console.log('Update response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Update error response:', errorData);
                throw new Error(errorData.error || errorData.message || 'Failed to update institution');
            }

            const data = await response.json();
            console.log('Institution updated:', data);
            
            setInstitution(data);
            setEditedInstitution(JSON.parse(JSON.stringify(data)));
            setPendingDeletions({
                locations: [],
                programs: [],
                scholarships: [],
                bannerImages: [],
            });
            setEditMode(false);
            setSnackbar({
                open: true,
                message: "Changes saved successfully!",
                severity: "success",
            });
        } catch (error) {
            console.error('Error updating institution:', error);
            setSnackbar({
                open: true,
                message: `Error saving changes: ${error.message}`,
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = (field, itemId) => {
        setPendingDeletions((prev) => ({
            ...prev,
            [field]: [...prev[field], itemId],
        }));

        setEditedInstitution((prev) => ({
            ...prev,
            [field === 'locations' ? 'campuses' : field]: prev[field === 'locations' ? 'campuses' : field]?.map((item) =>
                item._id === itemId ? { ...item, markedForDeletion: true } : item
            ),
        }));

        setSnackbar({
            open: true,
            message: `${field.slice(0, -1)} marked for deletion. Save to confirm.`,
            severity: "info",
        });
    };

    const handleInputChange = (field, value) => {
        setEditedInstitution(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (parent, field, value) => {
        setEditedInstitution((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    // Location editing
    const openLocationDialog = (location = null) => {
        setEditingLocation(
            location
                ? { ...location }
                : {
                      name: "",
                      city: "",
                      country: "",
                      address: "",
                      contactNumber: "",
                      email: "",
                      mapEmbedUrl: "",
                  }
        );
        setDialogType("location");
        setOpenDialog(true);
    };

    const handleLocationChange = (field, value) => {
        setEditingLocation((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveLocationChanges = () => {
        const updatedLocations = [...(editedInstitution.campuses || [])];
        if (editingLocation._id) {
            const index = updatedLocations.findIndex((l) => l._id === editingLocation._id);
            if (index !== -1) {
                updatedLocations[index] = editingLocation;
            }
        } else {
            updatedLocations.push({
                ...editingLocation,
                _id: Date.now().toString(),
            });
        }
        setEditedInstitution((prev) => ({
            ...prev,
            campuses: updatedLocations,
        }));
        setOpenDialog(false);
    };

    // Scholarship editing
    const openScholarshipDialog = (scholarship = null) => {
        setEditingScholarship(
            scholarship
                ? { ...scholarship }
                : {
                      name: "",
                      amount: "",
                      description: "",
                  }
        );
        setDialogType("scholarship");
        setOpenDialog(true);
    };

    const handleScholarshipChange = (field, value) => {
        setEditingScholarship((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveScholarshipChanges = () => {
        const updatedScholarships = [...(editedInstitution.scholarships || [])];
        if (editingScholarship._id) {
            const index = updatedScholarships.findIndex((s) => s._id === editingScholarship._id);
            if (index !== -1) {
                updatedScholarships[index] = editingScholarship;
            }
        } else {
            updatedScholarships.push({
                ...editingScholarship,
                _id: `temp_${Date.now()}`,
            });
        }
        setEditedInstitution((prev) => ({
            ...prev,
            scholarships: updatedScholarships,
        }));
        setSnackbar({
            open: true,
            message: `Scholarship "${editingScholarship.name}" ${
                editingScholarship._id ? "updated" : "added"
            }. Save changes to confirm.`,
            severity: "success",
        });
        setOpenDialog(false);
    };

    // Program editing
    const openProgramDialog = (program = null) => {
        setEditingProgram(
            program
                ? { ...program }
                : {
                      degree_name: "",
                      duration: "",
                      intakes: [],
                      tuition_fees: [],
                      campuses: [],
                      url: "",
                      entry_requirements: {
                          academic: "",
                          language: "",
                      },
                  }
        );
        setDialogType("program");
        setOpenDialog(true);
    };

    const handleProgramChange = (field, value) => {
        setEditingProgram((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveProgramChanges = async () => {
        try {
            setProgramSaving(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            if (editingProgram._id && !editingProgram._id.startsWith('temp_')) {
                // Update existing program
                console.log('Updating program:', editingProgram);
                console.log('Program ID:', editingProgram._id);
                console.log('Update URL:', `${apiUrl}/program/${editingProgram._id}`);

                const response = await fetch(`${apiUrl}/program/${editingProgram._id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editingProgram),
                });

                console.log('Update response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Update error response:', errorData);
                    throw new Error(errorData.error || 'Failed to update program');
                }

                const updatedProgram = await response.json();
                console.log('Updated program:', updatedProgram);
                
                // Update local state
                setPrograms(prevPrograms => 
                    prevPrograms.map(p => p._id === updatedProgram._id ? updatedProgram : p)
                );

                setSnackbar({
                    open: true,
                    message: "Program updated successfully!",
                    severity: "success",
                });
            } else {
                // Create new program
                console.log('Creating new program:', editingProgram);
                console.log('Institution ID:', institutionId);

                const response = await fetch(`${apiUrl}/program`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...editingProgram,
                        institution: institutionId,
                    }),
                });

                console.log('Create response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Create error response:', errorData);
                    throw new Error(errorData.error || 'Failed to create program');
                }

                const newProgram = await response.json();
                console.log('Created program:', newProgram);
                
                // Add to local state
                setPrograms(prevPrograms => [...prevPrograms, newProgram]);

                setSnackbar({
                    open: true,
                    message: "Program created successfully!",
                    severity: "success",
                });
            }

            setOpenDialog(false);
            setEditingProgram(null);
        } catch (error) {
            console.error('Error saving program:', error);
            setSnackbar({
                open: true,
                message: `Error saving program: ${error.message}`,
                severity: "error",
            });
        } finally {
            setProgramSaving(false);
        }
    };

    const handleDeleteProgram = async () => {
        if (!programToDelete) return;

        try {
            setProgramSaving(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            console.log('Deleting program:', programToDelete);
            console.log('Program ID:', programToDelete._id);
            console.log('Delete URL:', `${apiUrl}/program/${programToDelete._id}`);

            const response = await fetch(`${apiUrl}/program/${programToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Delete error response:', errorData);
                throw new Error(errorData.error || 'Failed to delete program');
            }

            const result = await response.json();
            console.log('Delete result:', result);

            // Remove from local state
            setPrograms(prevPrograms => prevPrograms.filter(p => p._id !== programToDelete._id));

            setSnackbar({
                open: true,
                message: "Program deleted successfully!",
                severity: "success",
            });

            setConfirmDeleteDialog(false);
            setProgramToDelete(null);
        } catch (error) {
            console.error('Error deleting program:', error);
            setSnackbar({
                open: true,
                message: `Error deleting program: ${error.message}`,
                severity: "error",
            });
        } finally {
            setProgramSaving(false);
        }
    };

    // Image handling
    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("image", file);

            const apiUrl = import.meta.env.VITE_BACKEND_URL;
            fetch(`${apiUrl}/upload`, {
                method: 'POST',
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    setEditedInstitution((prev) => ({
                        ...prev,
                        logo: data,
                    }));
                    setSnackbar({
                        open: true,
                        message: "Logo uploaded successfully!",
                        severity: "success",
                    });
                })
                .catch((error) => {
                    console.error("Error uploading logo:", error);
                    setSnackbar({
                        open: true,
                        message: "Error uploading logo. Please try again.",
                        severity: "error",
                    });
                });
        }
    };

    const handleDeleteInstitution = () => {
        if (confirm(`Are you sure you want to delete ${institution.name}?\n\nThis will permanently delete:\n• Institution details\n• All programs (${programs.length} programs)\n• All related data\n\nThis action cannot be undone.`)) {
            // TODO: Implement delete API call
            alert('Delete functionality will be implemented soon.\n\nRequired:\n• Backend API endpoint\n• Cascade delete for related data\n• Confirmation workflow');
            console.log('Delete institution:', institutionId);
        }
    };

    const handleAddPrograms = () => {
        // Open the program dialog for adding a new program
        openProgramDialog();
    };

    const handleExportData = () => {
        // Export institution data as JSON
        const dataStr = JSON.stringify({ institution, programs }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${institution.name.replace(/\s+/g, '-')}-data.json`;
        link.click();
    };

    const speedDialActions = [
        { icon: <EditIcon />, name: 'Edit Institution', onClick: handleEditInstitution },
        { icon: <AddIcon />, name: 'Add Programs', onClick: handleAddPrograms },
        { icon: <DownloadIcon />, name: 'Export Data', onClick: handleExportData },
        { icon: <DeleteIcon />, name: 'Delete Institution', onClick: handleDeleteInstitution },
    ];

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", pb: 10 }}>
            <Container sx={{ py: 4 }}>
                {/* Header with Back Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <IconButton 
                        onClick={onClose || (() => navigate('/admin/institutions'))} 
                        sx={{ mr: 1 }}
                        disabled={saving}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    
                    <Box sx={{ position: "relative" }}>
                        <Avatar
                            src={editMode ? editedInstitution?.logo?.url : institution.logo?.url}
                            alt={editMode ? editedInstitution?.name : institution.name}
                            sx={{
                                width: 100,
                                height: 100,
                                border: '2px solid #4f46e5',
                                boxShadow: 3,
                                '& img': { objectFit: 'contain' },
                            }}
                        />
                        {editMode && (
                            <IconButton
                                component="label"
                                sx={{
                                    position: "absolute",
                                    bottom: -5,
                                    right: -5,
                                    backgroundColor: "rgba(79, 70, 229, 0.9)",
                                    color: "white",
                                    "&:hover": { backgroundColor: "#4338ca" },
                                }}
                            >
                                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        {editMode ? (
                            <TextField
                                fullWidth
                                value={editedInstitution?.name || ''}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                sx={{ fontWeight: "bold", mb: 1 }}
                            />
                        ) : (
                            <Typography variant='h4' fontWeight='bold'>
                                {institution.name}
                            </Typography>
                        )}

                        <Typography color='text.secondary'>
                            {institution.country?.name} • {institution.type}
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                            {institution.campuses?.length || 0} campus
                            {institution.campuses?.length === 1 ? '' : 'es'} • {programs.length} programs
                        </Typography>

                        {institution.applicationFee > 0 && (
                            <Typography variant='body2' sx={{ mt: 0.5 }}>
                                Application Fee: {institution.country?.currency || 'USD'}{' '}
                                {institution.applicationFee}
                            </Typography>
                        )}
                    </Box>

                    {/* Edit Mode Buttons */}
                    {editMode ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                startIcon={<CancelIcon />}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSaveEdit}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEditInstitution}
                            sx={{ height: 'fit-content' }}
                        >
                            Edit
                        </Button>
                    )}
                </Box>

                <Tabs
                    value={tabIndex}
                    onChange={(e, newIndex) => setTabIndex(newIndex)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,
                        "& .MuiTab-root": { fontWeight: "bold" },
                        "& .Mui-selected": { color: "#4f46e5 !important" },
                    }}
                >
                    {[
                        "Overview",
                        "Locations",
                        "Programs",
                        "Intakes",
                        "Scholarships",
                        "Entry Requirements",
                        "Deadlines",
                        "Documents",
                    ].map((label, index) => (
                        <Tab key={index} label={label} />
                    ))}
                </Tabs>

                {editMode ? (
                    <Box>
                        {(tabIndex === 0 || tabIndex === 1 || tabIndex === 4 || tabIndex === 5 || tabIndex === 6 || tabIndex === 7) ? (
                            // Tabs with custom edit UI
                            <Paper sx={{ p: 3, mb: 3 }}>
                        {tabIndex === 0 && (
                            // Overview Tab
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                                    Edit Institution Overview
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <TextField
                                        label="Institution Name"
                                        fullWidth
                                        value={editedInstitution?.name || ''}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                    />
                                    
                                    <TextField
                                        label="Institution Type"
                                        fullWidth
                                        select
                                        value={editedInstitution?.type || ''}
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Public">Public</option>
                                        <option value="Private">Private</option>
                                        <option value="Community">Community</option>
                                        <option value="Other">Other</option>
                                    </TextField>
                                    
                                    <TextField
                                        label="Website"
                                        fullWidth
                                        value={editedInstitution?.website || ''}
                                        onChange={(e) => handleInputChange('website', e.target.value)}
                                    />
                                    
                                    <TextField
                                        label="Email"
                                        fullWidth
                                        value={editedInstitution?.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                    />
                                    
                                    <TextField
                                        label="Contact Number"
                                        fullWidth
                                        value={editedInstitution?.contactNumber || ''}
                                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                    />
                                    
                                    <TextField
                                        label="Application Fee (Amount)"
                                        fullWidth
                                        type="number"
                                        value={editedInstitution?.applicationFee || ''}
                                        onChange={(e) => handleInputChange('applicationFee', Number(e.target.value))}
                                    />
                                    
                                    <TextField
                                        label="Description"
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={editedInstitution?.description || ''}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                    />

                                    <Divider sx={{ my: 2 }} />
                                    
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Awards & Recognition
                                    </Typography>
                                    
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            const newAward = {
                                                _id: `temp_${Date.now()}`,
                                                title: "",
                                                issuer: "",
                                                year: "",
                                                description: "",
                                            };
                                            setEditedInstitution(prev => ({
                                                ...prev,
                                                awards: [...(prev.awards || []), newAward]
                                            }));
                                        }}
                                    >
                                        Add Award
                                    </Button>

                                    {editedInstitution?.awards?.map((award, index) => (
                                        <Box key={index} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, position: 'relative' }}>
                                            <IconButton
                                                size="small"
                                                sx={{ position: 'absolute', top: 5, right: 5 }}
                                                onClick={() => {
                                                    setEditedInstitution(prev => ({
                                                        ...prev,
                                                        awards: prev.awards.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                            
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        label="Award Title"
                                                        value={award.title || ''}
                                                        onChange={(e) => {
                                                            const newAwards = [...editedInstitution.awards];
                                                            newAwards[index].title = e.target.value;
                                                            setEditedInstitution(prev => ({ ...prev, awards: newAwards }));
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Issuer"
                                                        value={award.issuer || ''}
                                                        onChange={(e) => {
                                                            const newAwards = [...editedInstitution.awards];
                                                            newAwards[index].issuer = e.target.value;
                                                            setEditedInstitution(prev => ({ ...prev, awards: newAwards }));
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Year"
                                                        value={award.year || ''}
                                                        onChange={(e) => {
                                                            const newAwards = [...editedInstitution.awards];
                                                            newAwards[index].year = e.target.value;
                                                            setEditedInstitution(prev => ({ ...prev, awards: newAwards }));
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                        label="Description"
                                                        value={award.description || ''}
                                                        onChange={(e) => {
                                                            const newAwards = [...editedInstitution.awards];
                                                            newAwards[index].description = e.target.value;
                                                            setEditedInstitution(prev => ({ ...prev, awards: newAwards }));
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {tabIndex === 1 && (
                            // Locations Tab
                            <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
                                        Campuses
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => openLocationDialog()}
                                        sx={{ backgroundColor: "#4f46e5" }}
                                    >
                                        Add Campus
                                    </Button>
                                </Box>
                                <Grid container spacing={3}>
                                    {editedInstitution?.campuses?.map((location, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card
                                                sx={{
                                                    borderRadius: 2,
                                                    boxShadow: 3,
                                                    position: "relative",
                                                    opacity: location.markedForDeletion ? 0.6 : 1,
                                                    border: location.markedForDeletion ? "2px dashed red" : "none",
                                                }}
                                            >
                                                {location.markedForDeletion && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: "rgba(255,0,0,0.1)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        <Typography variant="body2" color="error">
                                                            Marked for deletion
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {!location.markedForDeletion && (
                                                    <Box sx={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openLocationDialog(location)}
                                                            sx={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => deleteItem("locations", location._id)}
                                                            sx={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                                        >
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "medium", textAlign: "center" }}>
                                                        {location.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                                        {location.city}, {location.country}
                                                    </Typography>
                                                    {location.address && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                                            {location.address}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {tabIndex === 4 && (
                            // Scholarships Tab
                            <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold" }}>
                                        Scholarships
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => openScholarshipDialog()}
                                        sx={{ backgroundColor: "#4f46e5" }}
                                    >
                                        Add Scholarship
                                    </Button>
                                </Box>
                                <Grid container spacing={3}>
                                    {editedInstitution?.scholarships?.map((scholarship, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card
                                                sx={{
                                                    minHeight: 100,
                                                    minWidth: 200,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    borderRadius: 2,
                                                    boxShadow: 3,
                                                    position: "relative",
                                                    opacity: scholarship.markedForDeletion ? 0.6 : 1,
                                                    border: scholarship.markedForDeletion ? "2px dashed red" : "none",
                                                }}
                                            >
                                                {scholarship.markedForDeletion && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: "rgba(255,0,0,0.1)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        <Typography variant="body2" color="error">
                                                            Marked for deletion
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {!scholarship.markedForDeletion && (
                                                    <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 1, zIndex: 2 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openScholarshipDialog(scholarship)}
                                                            sx={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => deleteItem("scholarships", scholarship._id)}
                                                            sx={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                                        >
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                                <CardContent sx={{ p: 2, flexGrow: 1, pt: 4 }}>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: "medium",
                                                            textAlign: "center",
                                                            wordBreak: "break-word",
                                                        }}
                                                    >
                                                        {scholarship.name}
                                                    </Typography>
                                                    {scholarship.amount && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                                            Amount: {scholarship.amount}
                                                        </Typography>
                                                    )}
                                                    {scholarship.description && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
                                                            {scholarship.description}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {tabIndex === 5 && (
                                    // Entry Requirements Tab
                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                                            Edit Entry Requirements
                                        </Typography>

                                        <Grid container spacing={3}>
                                            {/* Undergraduate Requirements */}
                                            <Grid item xs={12} md={6}>
                                                <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        Undergraduate Requirements
                                                    </Typography>
                                                    
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                                        <TextField
                                                            label="GPA Type"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.undergraduate?.gpa?.type || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        undergraduate: {
                                                                            ...prev.entryRequirements?.undergraduate,
                                                                            gpa: {
                                                                                ...prev.entryRequirements?.undergraduate?.gpa,
                                                                                type: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="GPA Score"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.undergraduate?.gpa?.score || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        undergraduate: {
                                                                            ...prev.entryRequirements?.undergraduate,
                                                                            gpa: {
                                                                                ...prev.entryRequirements?.undergraduate?.gpa,
                                                                                score: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="Language Test Type"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.undergraduate?.languageRequirement?.testType || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        undergraduate: {
                                                                            ...prev.entryRequirements?.undergraduate,
                                                                            languageRequirement: {
                                                                                ...prev.entryRequirements?.undergraduate?.languageRequirement,
                                                                                testType: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="Overall Score"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.undergraduate?.languageRequirement?.overall || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        undergraduate: {
                                                                            ...prev.entryRequirements?.undergraduate,
                                                                            languageRequirement: {
                                                                                ...prev.entryRequirements?.undergraduate?.languageRequirement,
                                                                                overall: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>
                                            </Grid>

                                            {/* Postgraduate Requirements */}
                                            <Grid item xs={12} md={6}>
                                                <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        Postgraduate Requirements
                                                    </Typography>
                                                    
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                                        <TextField
                                                            label="GPA Type"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.postgraduate?.gpa?.type || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        postgraduate: {
                                                                            ...prev.entryRequirements?.postgraduate,
                                                                            gpa: {
                                                                                ...prev.entryRequirements?.postgraduate?.gpa,
                                                                                type: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="GPA Score"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.postgraduate?.gpa?.score || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        postgraduate: {
                                                                            ...prev.entryRequirements?.postgraduate,
                                                                            gpa: {
                                                                                ...prev.entryRequirements?.postgraduate?.gpa,
                                                                                score: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="Language Test Type"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.postgraduate?.languageRequirement?.testType || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        postgraduate: {
                                                                            ...prev.entryRequirements?.postgraduate,
                                                                            languageRequirement: {
                                                                                ...prev.entryRequirements?.postgraduate?.languageRequirement,
                                                                                testType: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                        
                                                        <TextField
                                                            label="Overall Score"
                                                            fullWidth
                                                            value={editedInstitution?.entryRequirements?.postgraduate?.languageRequirement?.overall || ''}
                                                            onChange={(e) => {
                                                                setEditedInstitution(prev => ({
                                                                    ...prev,
                                                                    entryRequirements: {
                                                                        ...prev.entryRequirements,
                                                                        postgraduate: {
                                                                            ...prev.entryRequirements?.postgraduate,
                                                                            languageRequirement: {
                                                                                ...prev.entryRequirements?.postgraduate?.languageRequirement,
                                                                                overall: e.target.value
                                                                            }
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {tabIndex === 6 && (
                                    // Deadlines Tab
                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                                            Edit Application Deadlines
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Last Application Deadline"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={editedInstitution?.deadlines?.lastApplicationDeadline || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            deadlines: {
                                                                ...prev.deadlines,
                                                                lastApplicationDeadline: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Document Submission Deadline"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={editedInstitution?.deadlines?.documentSubmissionDeadline || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            deadlines: {
                                                                ...prev.deadlines,
                                                                documentSubmissionDeadline: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Scholarship Application Deadline"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={editedInstitution?.deadlines?.scholarshipDeadline || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            deadlines: {
                                                                ...prev.deadlines,
                                                                scholarshipDeadline: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Offer Acceptance Deadline"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={editedInstitution?.deadlines?.offerAcceptanceDeadline || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            deadlines: {
                                                                ...prev.deadlines,
                                                                offerAcceptanceDeadline: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Orientation / Enrollment Date"
                                                    type="date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={editedInstitution?.deadlines?.orientationDate || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            deadlines: {
                                                                ...prev.deadlines,
                                                                orientationDate: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {tabIndex === 7 && (
                                    // Documents Tab
                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", mb: 3 }}>
                                            Edit Financial Document Requirements
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    label="Income Sources (one per line)"
                                                    value={editedInstitution?.documents?.incomeSources?.join('\n') || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            documents: {
                                                                ...prev.documents,
                                                                incomeSources: e.target.value.split('\n').filter(line => line.trim())
                                                            }
                                                        }));
                                                    }}
                                                    helperText="Enter each income source on a new line"
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    label="Accepted Sponsors (one per line)"
                                                    value={editedInstitution?.documents?.sponsors?.join('\n') || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            documents: {
                                                                ...prev.documents,
                                                                sponsors: e.target.value.split('\n').filter(line => line.trim())
                                                            }
                                                        }));
                                                    }}
                                                    helperText="Enter each sponsor type on a new line"
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    label="Accepted Banks (one per line)"
                                                    value={editedInstitution?.documents?.banks?.join('\n') || ''}
                                                    onChange={(e) => {
                                                        setEditedInstitution(prev => ({
                                                            ...prev,
                                                            documents: {
                                                                ...prev.documents,
                                                                banks: e.target.value.split('\n').filter(line => line.trim())
                                                            }
                                                        }));
                                                    }}
                                                    helperText="Enter each bank name on a new line"
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Minimum Sponsor Count"
                                                        type="number"
                                                        value={editedInstitution?.documents?.minSponsorCount || ''}
                                                        onChange={(e) => {
                                                            setEditedInstitution(prev => ({
                                                                ...prev,
                                                                documents: {
                                                                    ...prev.documents,
                                                                    minSponsorCount: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                    />

                                                    <TextField
                                                        fullWidth
                                                        label="Minimum Income Amount"
                                                        value={editedInstitution?.documents?.minIncomeAmount || ''}
                                                        onChange={(e) => {
                                                            setEditedInstitution(prev => ({
                                                                ...prev,
                                                                documents: {
                                                                    ...prev.documents,
                                                                    minIncomeAmount: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                    />

                                                    <TextField
                                                        fullWidth
                                                        label="Previous Visa Refusal"
                                                        value={editedInstitution?.documents?.previousVisaRefusal || ''}
                                                        onChange={(e) => {
                                                            setEditedInstitution(prev => ({
                                                                ...prev,
                                                                documents: {
                                                                    ...prev.documents,
                                                                    previousVisaRefusal: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                    />

                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label="Level Change After Refusal"
                                                        value={editedInstitution?.documents?.levelChangeAfterRefusal ? 'yes' : 'no'}
                                                        onChange={(e) => {
                                                            setEditedInstitution(prev => ({
                                                                ...prev,
                                                                documents: {
                                                                    ...prev.documents,
                                                                    levelChangeAfterRefusal: e.target.value === 'yes'
                                                                }
                                                            }));
                                                        }}
                                                        SelectProps={{ native: true }}
                                                    >
                                                        <option value="no">No</option>
                                                        <option value="yes">Yes</option>
                                                    </TextField>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}
                            </Paper>
                        ) : (
                            // Tabs 2 (Programs) and 3 (Intakes) - Show normal content with edit mode enabled
                            <InstitutionTabsContent
                                activeTab={tabIndex}
                                institution={institution}
                                programs={transformedPrograms}
                                filteredPrograms={filteredPrograms}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                selectedLevel={selectedLevel}
                                setSelectedLevel={setSelectedLevel}
                                selectedField={selectedField}
                                setSelectedField={setSelectedField}
                                selectedIntake={selectedIntake}
                                setSelectedIntake={setSelectedIntake}
                                selectedTuition={selectedTuition}
                                setSelectedTuition={setSelectedTuition}
                                levels={levels}
                                fields={fields}
                                intakes={intakes}
                                navigate={navigate}
                                isAdmin={true}
                                isEditMode={true}
                                onEditProgram={openProgramDialog}
                                onDeleteProgram={(program) => {
                                    setProgramToDelete(program);
                                    setConfirmDeleteDialog(true);
                                }}
                            />
                        )}
                    </Box>
                ) : (
                    // View Mode - Show normal tabs
                    <InstitutionTabsContent
                        activeTab={tabIndex}
                        institution={institution}
                        programs={transformedPrograms}
                        filteredPrograms={filteredPrograms}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedLevel={selectedLevel}
                        setSelectedLevel={setSelectedLevel}
                        selectedField={selectedField}
                        setSelectedField={setSelectedField}
                        selectedIntake={selectedIntake}
                        setSelectedIntake={setSelectedIntake}
                        selectedTuition={selectedTuition}
                        setSelectedTuition={setSelectedTuition}
                        levels={levels}
                        fields={fields}
                        intakes={intakes}
                        navigate={navigate}
                        isAdmin={true}
                        isEditMode={editMode}
                        onEditProgram={openProgramDialog}
                        onDeleteProgram={(program) => {
                            setProgramToDelete(program);
                            setConfirmDeleteDialog(true);
                        }}
                    />
                )}
            </Container>

            {/* Admin Speed Dial - Only show when not in edit mode */}
            {!editMode && (
                <SpeedDial
                    ariaLabel="Admin actions"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                    icon={<SpeedDialIcon />}
                >
                    {speedDialActions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            title={action.name}
                            onClick={action.onClick}
                        />
                    ))}
                </SpeedDial>
            )}

            {/* Edit Dialogs */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {dialogType === "scholarship" && (editingScholarship?._id ? "Edit Scholarship" : "Add Scholarship")}
                    {dialogType === "location" && (editingLocation?._id ? "Edit Campus" : "Add Campus")}
                    {dialogType === "program" && (editingProgram?._id && !editingProgram._id.startsWith('temp_') ? "Edit Program" : "Add Program")}
                </DialogTitle>
                <DialogContent>
                    {dialogType === "scholarship" && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Scholarship Name"
                                    value={editingScholarship?.name || ""}
                                    onChange={(e) => handleScholarshipChange("name", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Amount"
                                    value={editingScholarship?.amount || ""}
                                    onChange={(e) => handleScholarshipChange("amount", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Description"
                                    value={editingScholarship?.description || ""}
                                    onChange={(e) => handleScholarshipChange("description", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    )}
                    {dialogType === "location" && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Campus Name"
                                    value={editingLocation?.name || ""}
                                    onChange={(e) => handleLocationChange("name", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={editingLocation?.city || ""}
                                    onChange={(e) => handleLocationChange("city", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Country"
                                    value={editingLocation?.country || ""}
                                    onChange={(e) => handleLocationChange("country", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    value={editingLocation?.address || ""}
                                    onChange={(e) => handleLocationChange("address", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Contact Number"
                                        value={editingLocation?.contactNumber || ""}
                                        onChange={(e) => handleLocationChange("contactNumber", e.target.value)}
                                        placeholder="e.g., +49 30 1234567"
                                        disabled={editingLocation?.useInstitutionContact}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={editingLocation?.useInstitutionContact || false}
                                                onChange={(e) => {
                                                    const useInstitution = e.target.checked;
                                                    setEditingLocation(prev => ({
                                                        ...prev,
                                                        useInstitutionContact: useInstitution,
                                                        contactNumber: useInstitution ? institution?.contactNumber || "" : prev.contactNumber
                                                    }));
                                                }}
                                                size="small"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" color="text.secondary">
                                                Use institution contact: <strong>{institution?.contactNumber || 'N/A'}</strong>
                                            </Typography>
                                        }
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={editingLocation?.email || ""}
                                        onChange={(e) => handleLocationChange("email", e.target.value)}
                                        placeholder="e.g., campus@university.edu"
                                        disabled={editingLocation?.useInstitutionEmail}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={editingLocation?.useInstitutionEmail || false}
                                                onChange={(e) => {
                                                    const useInstitution = e.target.checked;
                                                    setEditingLocation(prev => ({
                                                        ...prev,
                                                        useInstitutionEmail: useInstitution,
                                                        email: useInstitution ? institution?.email || "" : prev.email
                                                    }));
                                                }}
                                                size="small"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" color="text.secondary">
                                                Use institution email: <strong>{institution?.email || 'N/A'}</strong>
                                            </Typography>
                                        }
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Google Maps Embed URL"
                                    value={editingLocation?.mapEmbedUrl || ""}
                                    onChange={(e) => handleLocationChange("mapEmbedUrl", e.target.value)}
                                    placeholder="e.g., https://www.google.com/maps/embed?pb=..."
                                    helperText="Paste the embed URL from Google Maps (Share > Embed a map > Copy HTML > extract the src URL)"
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    )}
                    {dialogType === "program" && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Fill in the program details below. All fields with multiple values should be comma-separated or one per line as indicated.
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Program Name / Degree Name"
                                    value={editingProgram?.degree_name || ""}
                                    onChange={(e) => handleProgramChange("degree_name", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Duration"
                                    value={editingProgram?.duration || ""}
                                    onChange={(e) => handleProgramChange("duration", e.target.value)}
                                    placeholder="e.g., 2 years, 18 months"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Program URL"
                                    value={editingProgram?.url || ""}
                                    onChange={(e) => handleProgramChange("url", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Intakes (comma-separated)"
                                    value={Array.isArray(editingProgram?.intakes) ? editingProgram.intakes.join(', ') : ''}
                                    onChange={(e) => handleProgramChange("intakes", e.target.value.split(',').map(i => i.trim()).filter(Boolean))}
                                    placeholder="e.g., January, September"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Tuition Fees (one per line)"
                                    value={Array.isArray(editingProgram?.tuition_fees) ? editingProgram.tuition_fees.join('\n') : ''}
                                    onChange={(e) => handleProgramChange("tuition_fees", e.target.value.split('\n').filter(Boolean))}
                                    placeholder="e.g., EUR 12,000 per year"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Campuses (comma-separated)"
                                    value={Array.isArray(editingProgram?.campuses) ? editingProgram.campuses.join(', ') : ''}
                                    onChange={(e) => handleProgramChange("campuses", e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                                    placeholder="e.g., Main Campus, Downtown Campus"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Academic Requirements"
                                    value={editingProgram?.entry_requirements?.academic || ""}
                                    onChange={(e) => handleProgramChange("entry_requirements", {
                                        ...editingProgram?.entry_requirements,
                                        academic: e.target.value
                                    })}
                                    placeholder="e.g., Bachelor's degree"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Language Requirements"
                                    value={editingProgram?.entry_requirements?.language || ""}
                                    onChange={(e) => handleProgramChange("entry_requirements", {
                                        ...editingProgram?.entry_requirements,
                                        language: e.target.value
                                    })}
                                    placeholder="e.g., IELTS 6.5"
                                />
                            </Grid>
                        </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (dialogType === "scholarship") saveScholarshipChanges();
                            else if (dialogType === "location") saveLocationChanges();
                            else if (dialogType === "program") saveProgramChanges();
                        }}
                        variant="contained"
                        sx={{ backgroundColor: "#4f46e5" }}
                        disabled={programSaving}
                    >
                        {programSaving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={confirmDeleteDialog} 
                onClose={() => {
                    setConfirmDeleteDialog(false);
                    setProgramToDelete(null);
                }}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the program "{programToDelete?.degree_name || programToDelete?.name}"?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setConfirmDeleteDialog(false);
                            setProgramToDelete(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteProgram} 
                        color="error" 
                        variant="contained"
                        disabled={programSaving}
                    >
                        {programSaving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{
                    top: { xs: 80, sm: 100 },
                    "& .MuiAlert-root": {
                        width: "100%",
                        maxWidth: "600px",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        fontSize: "1rem",
                    },
                    zIndex: 100,
                }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
