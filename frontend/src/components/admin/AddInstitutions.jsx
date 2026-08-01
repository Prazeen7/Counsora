import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    Typography,
    useTheme,
    InputLabel,
    Avatar,
    Menu,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Public,
    KeyboardArrowDown,
    PhotoCamera
} from "@mui/icons-material";
import { getCountries } from "../../services/countryService";
import LanguageRequirementFields from "./LanguageRequirementFields";

export default function AddInstitution({ onClose }) {
    const theme = useTheme();

    // State for basic information
    const [institutionName, setInstitutionName] = useState("");
    const [institutionType, setInstitutionType] = useState("");
    const [website, setWebsite] = useState('');
    const [institutionEmail, setInstitutionEmail] = useState('');
    const [institutionContact, setInstitutionContact] = useState('');
    const [description, setDescription] = useState('');
    const [applicationFeeCurrency, setApplicationFeeCurrency] = useState("");
    const [profilePicture, setProfilePicture] = useState({
        file: null,
        preview: null,
    });
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [countryAnchor, setCountryAnchor] = useState(null);
    const [countrySearch, setCountrySearch] = useState("");
    // State for overview
    const [overviewHeading, setOverviewHeading] = useState("");
    const [overviewDetails, setOverviewDetails] = useState("");

    // State for locations
    const [locations, setLocations] = useState([]);

    // State for application fee
    const [applicationFee, setApplicationFee] = useState("");

    // State for entry requirements
    const [undergraduateGPA, setUndergraduateGPA] = useState({
        type: "",
        score: "",
    });
    const [undergraduateIELTS, setUndergraduateIELTS] = useState("");
    const [undergraduatePTE, setUndergraduatePTE] = useState("");
    const [undergraduateTOEFL, setUndergraduateTOEFL] = useState("");
    const [undergraduateDuolingo, setUndergraduateDuolingo] = useState("");
    const [undergraduateLanguageRequirement, setUndergraduateLanguageRequirement] =
        useState({
            testType: "",
            overall: "",
            minimum: "",
            hasIndividualScores: false,

            listening: "",
            reading: "",
            writing: "",
            speaking: "",

            // For Duolingo
            literacy: "",
            comprehension: "",
            conversation: "",
            production: "",
        });

    const [postgraduateGPA, setPostgraduateGPA] = useState({
        type: "",
        score: "",
    });
    const [postgraduateIELTS, setPostgraduateIELTS] = useState("");
    const [postgraduatePTE, setPostgraduatePTE] = useState("");
    const [postgraduateTOEFL, setPostgraduateTOEFL] = useState("");
    const [postgraduateDuolingo, setPostgraduateDuolingo] = useState("");
    const [postgraduateLanguageRequirement, setPostgraduateLanguageRequirement] =
        useState({
            testType: "",
            overall: "",
            minimum: "",
            hasIndividualScores: false,

            listening: "",
            reading: "",
            writing: "",
            speaking: "",

            // For Duolingo
            literacy: "",
            comprehension: "",
            conversation: "",
            production: "",
        });

    // State for agents
    const [agents, setAgents] = useState([]);

    // State for programs
    const [programs, setPrograms] = useState([]);

    // State for scholarships
    const [scholarships, setScholarships] = useState([]);

    // State for documents
    const [incomeSources, setIncomeSources] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [minSponsorCount, setMinSponsorCount] = useState("");
    const [minIncomeAmount, setMinIncomeAmount] = useState("");
    const [banks, setBanks] = useState([]);
    const [previousVisaRefusal, setPreviousVisaRefusal] = useState("no");
    const [levelChangeAfterRefusal, setLevelChangeAfterRefusal] = useState(false);


    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getCountries();
                setCountries(data);
            } catch (err) {
                console.error("Failed to fetch countries", err);
                setCountries([]);
            }
        };

        fetchCountries();
    }, []);

    const handleCountryOpen = (event) => {
        setCountryAnchor(event.currentTarget);
    };

    const handleCountryClose = () => {
        setCountryAnchor(null);
        setCountrySearch("");
    };

    const filteredCountries = countries.filter(
        (country) =>
            country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            country.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    // Handler for profile picture upload
    const handleProfilePictureUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setProfilePicture({
                file: file,
                preview: URL.createObjectURL(file),
            });
        }
    };

    // Handler for removing profile picture
    const handleRemoveProfilePicture = () => {
        setProfilePicture({
            file: null,
            preview: null,
        });
    };

    // Handler for banner images upload
    const handleBannerImagesUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            const files = Array.from(event.target.files);

            // Check image limit
            if (bannerImages.length + files.length > MAX_BANNER_IMAGES) {
                setBannerError(`Maximum ${MAX_BANNER_IMAGES} banner images allowed`);
                return;
            }

            // Reset error if valid
            setBannerError("");

            const newBannerImages = files.map((file) => ({
                file: file,
                preview: URL.createObjectURL(file),
            }));
            setBannerImages([...bannerImages, ...newBannerImages]);
        }
    };

    // Handler for adding a location
    const handleAddLocation = () => {
        setLocations([
            ...locations,
            {
                id: Date.now(),
                name: '',
                address: '',
                city: '',
                contactNumber: '',
                email: '',
                mapEmbedUrl: '',
                useInstitutionContact: false,
            },
        ]);
    };

    // Handler for removing a location
    const handleRemoveLocation = (id) => {
        setLocations(locations.filter((location) => location.id !== id));
    };

    // Handler for changing location details
    const handleLocationChange = (id, field, value) => {
        setLocations(
            locations.map((location) =>
                location.id === id ? { ...location, [field]: value } : location
            )
        );
    };

    // Handler for adding an agent
    const handleAddAgent = () => {
        setAgents([...agents, { id: Date.now(), name: "" }]);
    };

    // Handler for changing agent details
    const handleAgentChange = (id, value) => {
        setAgents(
            agents.map((agent) =>
                agent.id === id ? { ...agent, name: value } : agent
            )
        );
    };

    // Handler for removing an agent
    const handleRemoveAgent = (id) => {
        setAgents(agents.filter((agent) => agent.id !== id));
    };

    // Handler for adding a program
    const handleAddProgram = () => {
        setPrograms([...programs, { id: Date.now(), name: "", level: "", url: "", duration: "", intakes: "", firstYearFees: "", cricosCode: "", discipline: "", campuses: "", fundsRequired: "", ielts: "", pte: "", toefl: "" }]);
    };

    // Handler for changing program details
    const handleProgramChange = (id, field, value) => {
        setPrograms(
            programs.map((program) =>
                program.id === id ? { ...program, [field]: value } : program
            )
        );
    };

    // Handler for removing a program
    const handleRemoveProgram = (id) => {
        setPrograms(programs.filter((program) => program.id !== id));
    };

    // Handler for adding a scholarship
    const handleAddScholarship = () => {
        setScholarships([...scholarships, { id: Date.now(), name: "", link: "" }]);
    };

    // Handler for changing scholarship details
    const handleScholarshipChange = (id, field, value) => {
        setScholarships(
            scholarships.map((scholarship) =>
                scholarship.id === id ? { ...scholarship, [field]: value } : scholarship
            )
        );
    };

    // Handler for removing a scholarship
    const handleRemoveScholarship = (id) => {
        setScholarships(scholarships.filter((scholarship) => scholarship.id !== id));
    };

    // Handler for adding an income source
    const handleAddIncomeSource = () => {
        setIncomeSources([...incomeSources, { id: Date.now(), name: "" }]);
    };

    // Handler for changing income source details
    const handleIncomeSourceChange = (id, value) => {
        setIncomeSources(
            incomeSources.map((source) =>
                source.id === id ? { ...source, name: value } : source
            )
        );
    };

    // Handler for removing an income source
    const handleRemoveIncomeSource = (id) => {
        setIncomeSources(incomeSources.filter((source) => source.id !== id));
    };

    // Handler for adding a sponsor
    const handleAddSponsor = () => {
        setSponsors([...sponsors, { id: Date.now(), name: "" }]);
    };

    // Handler for changing sponsor details
    const handleSponsorChange = (id, value) => {
        setSponsors(
            sponsors.map((sponsor) =>
                sponsor.id === id ? { ...sponsor, name: value } : sponsor
            )
        );
    };

    // Handler for removing a sponsor
    const handleRemoveSponsor = (id) => {
        setSponsors(sponsors.filter((sponsor) => sponsor.id !== id));
    };

    // Handler for adding a bank
    const handleAddBank = () => {
        setBanks([...banks, { id: Date.now(), name: "" }]);
    };

    // Handler for changing bank details
    const handleBankChange = (id, value) => {
        setBanks(
            banks.map((bank) =>
                bank.id === id ? { ...bank, name: value } : bank
            )
        );
    };

    // Handler for removing a bank
    const handleRemoveBank = (id) => {
        setBanks(banks.filter((bank) => bank.id !== id));
    };

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Frontend validation
        if (!institutionName || !institutionType || !selectedCountry) {
            alert("Institution name, country, and type are required");
            return;
        }

        // Validate profile picture if exists
        if (profilePicture.file) {
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(profilePicture.file.type)) {
                alert('Profile picture must be a JPEG/PNG/JPG image');
                return;
            }
            if (profilePicture.file.size > 5 * 1024 * 1024) {
                alert('Profile picture is too large. Maximum 5MB allowed');
                return;
            }
        }

        // Validate banner images if exist
        for (const image of bannerImages) {
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(image.file.type)) {
                alert('Banner images must be JPEG/PNG/JPG format');
                return;
            }
            if (image.file.size > 5 * 1024 * 1024) {
                alert('One or more banner images are too large. Maximum 5MB allowed');
                return;
            }
        }

        // Create FormData object
        const formData = new FormData();

        // Append files with correct field names
        if (profilePicture.file) {
            formData.append("profilePicture", profilePicture.file);
        }

        bannerImages.forEach((image) => {
            formData.append("bannerImages", image.file);
        });

        // Append other fields
        formData.append("institutionName", institutionName);
        formData.append("country", selectedCountry._id);
        formData.append("institutionType", institutionType);
        formData.append("overviewHeading", overviewHeading);
        formData.append("overviewDetails", overviewDetails);
        formData.append("applicationFee", applicationFee);
        formData.append("undergraduateGPA", undergraduateGPA);
        formData.append("undergraduateIELTS", undergraduateIELTS);
        formData.append("undergraduatePTE", undergraduatePTE);
        formData.append("undergraduateTOEFL", undergraduateTOEFL);
        formData.append("postgraduateGPA", postgraduateGPA);
        formData.append("postgraduateIELTS", postgraduateIELTS);
        formData.append("postgraduatePTE", postgraduatePTE);
        formData.append("postgraduateTOEFL", postgraduateTOEFL);
        formData.append("minSponsorCount", minSponsorCount);
        formData.append("minIncomeAmount", minIncomeAmount);
        formData.append("previousVisaRefusal", previousVisaRefusal);
        formData.append("levelChangeAfterRefusal", levelChangeAfterRefusal);

        // Append JSON stringified fields
        formData.append("locations", JSON.stringify(locations));
        formData.append("programs", JSON.stringify(programs));
        formData.append("scholarships", JSON.stringify(scholarships));
        formData.append("agents", JSON.stringify(agents.map(agent => agent.name)));
        formData.append("incomeSources", JSON.stringify(incomeSources.map(source => source.name)));
        formData.append("sponsors", JSON.stringify(sponsors.map(sponsor => sponsor.name)));
        formData.append("banks", JSON.stringify(banks.map(bank => bank.name)));

        try {
            const response = await fetch("https://global-edu-assist.onrender.com/api/institutions", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add institution");
            }

            const data = await response.json();
            console.log("Institution added successfully:", data);
            alert("Institution added successfully!");

            // Clear the form after successful submission
            setInstitutionName("");
            setInstitutionType("university");
            setProfilePicture({ file: null, preview: null });
            setBannerImages([]);
            setBannerError("");
            setOverviewHeading("");
            setOverviewDetails("");
            setLocations([]);
            setApplicationFee("");
            setUndergraduateGPA("");
            setUndergraduateIELTS("");
            setUndergraduatePTE("");
            setUndergraduateTOEFL("");
            setPostgraduateGPA("");
            setPostgraduateIELTS("");
            setPostgraduatePTE("");
            setPostgraduateTOEFL("");
            setAgents([]);
            setPrograms([]);
            setScholarships([]);
            setIncomeSources([]);
            setSponsors([]);
            setMinSponsorCount("");
            setMinIncomeAmount("");
            setBanks([]);
            setPreviousVisaRefusal("no");
            setLevelChangeAfterRefusal(false);

        } catch (error) {
            console.error("Error adding institution:", error);
            // Show more specific error messages
            if (error.message.includes("Invalid file type")) {
                alert("Upload error: " + error.message);
            } else if (error.message.includes("File size too large")) {
                alert("Upload error: " + error.message);
            } else {
                alert(error.message || "Failed to add institution. Please try again.");
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Add Institution
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create a new educational institution in the system
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={onClose}
                >
                    Back to Institutions
                </Button>
            </Box>


            <Box
                sx={{
                    columnCount: { xs: 1, md: 2 },
                    columnGap: 3,
                }}
            >
                {/* Basic Information */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        breakInside: 'avoid',
                        display: 'inline-block',
                        width: '100%',
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Basic Information
                    </Typography>

                    <Stack spacing={3}>
                        {/* Logo + Institution Name */}
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                                        <Avatar
                                            src={profilePicture.preview || ''}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                bgcolor: 'grey.200',
                                            }}
                                        />
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="profile-picture-upload"
                                            type="file"
                                            onChange={handleProfilePictureUpload}
                                        />
                                        <label htmlFor="profile-picture-upload">
                                            <IconButton
                                                component="span"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: -4,
                                                    right: -4,
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'primary.dark' },
                                                }}
                                            >
                                                <PhotoCamera fontSize="small" />
                                            </IconButton>
                                        </label>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={10}>
                                <TextField
                                    label="Institution Name"
                                    fullWidth
                                    value={institutionName}
                                    onChange={(e) => setInstitutionName(e.target.value)}
                                    placeholder="e.g. Australian Catholic University"
                                    required
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Country + Type */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="country-label">Country</InputLabel>
                                    <Select
                                        labelId="country-label"
                                        value={selectedCountry?._id || ""}
                                        label="Country"
                                        onChange={(e) => {
                                            const country = countries.find((c) => c._id === e.target.value);
                                            setSelectedCountry(country || null);
                                        }}
                                    >
                                        {countries.map((country) => (
                                            <MenuItem key={country._id} value={country._id}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Avatar
                                                        src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                                        sx={{ width: 22, height: 22 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="body2">{country.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {country.code}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="institution-type-label">Institution Type</InputLabel>
                                    <Select
                                        labelId="institution-type-label"
                                        value={institutionType}
                                        onChange={(e) => setInstitutionType(e.target.value)}
                                        label="Institution Type"
                                    >
                                        <MenuItem value="Public">Public</MenuItem>
                                        <MenuItem value="Private">Private</MenuItem>
                                        <MenuItem value="Community">Community</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Website + Email + Contact + Application Fee */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Website"
                                    fullWidth
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.example.edu"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Institution Email"
                                    fullWidth
                                    value={institutionEmail}
                                    onChange={(e) => setInstitutionEmail(e.target.value)}
                                    placeholder="info@example.edu"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Institution Contact Number"
                                    fullWidth
                                    value={institutionContact}
                                    onChange={(e) => setInstitutionContact(e.target.value)}
                                    placeholder="+61 2 9701 4000"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label={`Application Fee (${selectedCountry?.currency ?? ""})`}
                                    fullWidth
                                    value={applicationFee}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, "");
                                        setApplicationFee(value);
                                    }}
                                    placeholder="0.00"
                                    inputProps={{
                                        inputMode: "decimal",
                                        pattern: "[0-9.]*",
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Overview */}
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Overview
                            </Typography>
                            <TextField
                                label="Institution Description"
                                fullWidth
                                multiline
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write a concise overview of the institution, its strengths, facilities, rankings, and academic focus."
                            />
                        </Box>

                        <Divider />

                        {/* Campuses */}
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                }}
                            >
                                <Typography variant="subtitle1">Campuses</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddLocation}
                                >
                                    Add Campus
                                </Button>
                            </Box>

                            {locations.map((location, index) => (
                                <Card key={location.id} sx={{ mb: 2, position: 'relative' }}>
                                    <CardContent>
                                        <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                            onClick={() => handleRemoveLocation(location.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>

                                        <Typography variant="subtitle2" gutterBottom>
                                            Campus #{index + 1}
                                        </Typography>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Campus Name"
                                                    fullWidth
                                                    value={location.name}
                                                    onChange={(e) =>
                                                        handleLocationChange(location.id, 'name', e.target.value)
                                                    }
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="City"
                                                    fullWidth
                                                    value={location.city}
                                                    onChange={(e) =>
                                                        handleLocationChange(location.id, 'city', e.target.value)
                                                    }
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Address"
                                                    fullWidth
                                                    value={location.address}
                                                    onChange={(e) =>
                                                        handleLocationChange(location.id, 'address', e.target.value)
                                                    }
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={location.useInstitutionContact || false}
                                                            onChange={(e) =>
                                                                handleLocationChange(
                                                                    location.id,
                                                                    'useInstitutionContact',
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="Use institution email and contact number for this campus"
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Campus Email"
                                                    fullWidth
                                                    value={
                                                        location.useInstitutionContact
                                                            ? institutionEmail
                                                            : location.email
                                                    }
                                                    onChange={(e) =>
                                                        handleLocationChange(location.id, 'email', e.target.value)
                                                    }
                                                    disabled={location.useInstitutionContact}
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Campus Contact Number"
                                                    fullWidth
                                                    value={
                                                        location.useInstitutionContact
                                                            ? institutionContact
                                                            : location.contactNumber
                                                    }
                                                    onChange={(e) =>
                                                        handleLocationChange(
                                                            location.id,
                                                            'contactNumber',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={location.useInstitutionContact}
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Google Maps Embed URL"
                                                    fullWidth
                                                    value={location.mapEmbedUrl}
                                                    onChange={(e) =>
                                                        handleLocationChange(
                                                            location.id,
                                                            'mapEmbedUrl',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="https://www.google.com/maps/embed?..."
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Stack>
                </Paper>

                {/* Scholarships */}
                <Paper sx={{ p: 3, mb: 3, breakInside: "avoid", display: "inline-block", width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Scholarships</Typography>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddScholarship}>
                            Add Scholarship
                        </Button>
                    </Box>

                    {scholarships.map((scholarship, index) => (
                        <Card key={scholarship.id} sx={{ mb: 2, position: "relative" }}>
                            <CardContent>
                                <IconButton
                                    size="small"
                                    sx={{ position: "absolute", top: 8, right: 8 }}
                                    onClick={() => handleRemoveScholarship(scholarship.id)}
                                    disabled={scholarships.length === 1}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>

                                <Typography variant="subtitle2" gutterBottom>
                                    Scholarship #{index + 1}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Scholarship Name"
                                            fullWidth
                                            value={scholarship.name}
                                            onChange={(e) => handleScholarshipChange(scholarship.id, "name", e.target.value)}
                                            placeholder="e.g. International Student Scholarship"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Scholarship Link"
                                            fullWidth
                                            value={scholarship.link}
                                            onChange={(e) => handleScholarshipChange(scholarship.id, "link", e.target.value)}
                                            placeholder="Scholarship website URL"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
                </Paper>

                {/* Documents */}
                <Paper sx={{ p: 3, mb: 3, breakInside: "avoid", display: "inline-block", width: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                        Documents
                    </Typography>

                    {/* Acceptable Income Sources */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1">Acceptable Income Sources</Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddIncomeSource}>
                                Add
                            </Button>
                        </Box>

                        {incomeSources.map((source, index) => (
                            <Box key={source.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id={`income-source-label-${source.id}`}>Income Source</InputLabel>
                                    <Select
                                        labelId={`income-source-label-${source.id}`}
                                        id={`income-source-${source.id}`}
                                        value={source.name}
                                        onChange={(e) => handleIncomeSourceChange(source.id, e.target.value)}
                                        label="Income Source"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 300
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="Salary from Employment">Salary from Employment</MenuItem>
                                        <MenuItem value="Business Income">Business Income</MenuItem>
                                        <MenuItem value="Rental Income">Rental Income</MenuItem>
                                        <MenuItem value="Agricultural Income">Agricultural Income</MenuItem>
                                        <MenuItem value="Pension">Pension</MenuItem>
                                        <MenuItem value="Foreign Employment Income">Foreign Employment Income</MenuItem>
                                        <MenuItem value="Income from Investments">Income from Investments</MenuItem>
                                    </Select>
                                </FormControl>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveIncomeSource(source.id)}
                                    disabled={incomeSources.length === 1}
                                    sx={{ ml: 1 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>

                    {/* Acceptable Sponsors */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1">Acceptable Sponsors</Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddSponsor}>
                                Add
                            </Button>
                        </Box>

                        {sponsors.map((sponsor, index) => (
                            <Box key={sponsor.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id={`sponsor-label-${sponsor.id}`}>Sponsor</InputLabel>
                                    <Select
                                        labelId={`sponsor-label-${sponsor.id}`}
                                        id={`sponsor-${sponsor.id}`}
                                        value={sponsor.name}
                                        onChange={(e) => handleSponsorChange(sponsor.id, e.target.value)}
                                        label="Sponsor"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 300
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="Parents">Parents</MenuItem>
                                        <MenuItem value="Siblings">Siblings</MenuItem>
                                        <MenuItem value="Spouse">Spouse</MenuItem>
                                        <MenuItem value="Relatives">Relatives</MenuItem>
                                        <MenuItem value="Employers">Employers</MenuItem>
                                        <MenuItem value="Educational Institutions">Educational Institutions</MenuItem>
                                    </Select>
                                </FormControl>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveSponsor(sponsor.id)}
                                    disabled={sponsors.length === 1}
                                    sx={{ ml: 1 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>

                    {/* Minimum Sponsor Count */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Minimum Sponsor Count"
                            fullWidth
                            value={minSponsorCount}
                            onChange={(e) => setMinSponsorCount(e.target.value)}
                            placeholder="e.g. 1"
                            size="small"
                            type="number"
                            inputProps={{ min: 0 }}
                        />
                    </Box>

                    {/* Minimum Income Amount Required */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Minimum Income Amount Required"
                            fullWidth
                            value={minIncomeAmount}
                            onChange={(e) => setMinIncomeAmount(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            placeholder="0.00"
                            size="small"
                        />
                    </Box>

                    {/* Acceptable Banks */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1">Acceptable Banks</Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddBank}>
                                Add
                            </Button>
                        </Box>

                        {banks.map((bank, index) => (
                            <Box key={bank.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <TextField
                                    fullWidth
                                    value={bank.name}
                                    onChange={(e) => handleBankChange(bank.id, e.target.value)}
                                    placeholder={`Bank #${index + 1}`}
                                    size="small"
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveBank(bank.id)}
                                    disabled={banks.length === 1}
                                    sx={{ ml: 1 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>

                    {/* Previous Visa Refusal */}
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Previous Visa Refusal
                        </Typography>
                        <RadioGroup
                            value={previousVisaRefusal}
                            onChange={(e) => {
                                setPreviousVisaRefusal(e.target.value);
                            }}
                            row
                        >
                            <FormControlLabel
                                value="yes"
                                control={<Radio />}
                                label="Yes"
                                sx={{ cursor: 'pointer' }}
                            />
                            <FormControlLabel
                                value="no"
                                control={<Radio />}
                                label="No"
                                sx={{ cursor: 'pointer' }}
                            />
                        </RadioGroup>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    id="level-change-checkbox"
                                    checked={levelChangeAfterRefusal}
                                    onChange={(e) => setLevelChangeAfterRefusal(e.target.checked)}
                                />
                            }
                            label="There is a change in level of study (e.g., UG to PG) compared to the previous refusal"
                            sx={{ cursor: 'pointer' }}
                        />
                    </Box>
                </Paper>

                {/* Entry Requirements */}
                <Paper sx={{ p: 3, mb: 3, breakInside: "avoid", display: "inline-block", width: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                        Entry Requirements
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Undergraduate
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Grid container spacing={1.5}>

                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>
                                                Score Type
                                            </InputLabel>

                                            <Select
                                                value={undergraduateGPA.type}
                                                label="Score Type"
                                                onChange={(e) =>
                                                    setUndergraduateGPA({
                                                        ...undergraduateGPA,
                                                        type: e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="GPA">
                                                    GPA
                                                </MenuItem>

                                                <MenuItem value="Percentage">
                                                    Percentage
                                                </MenuItem>

                                            </Select>
                                        </FormControl>
                                    </Grid>


                                    <Grid item xs={12} sm={8}>
                                        <TextField
                                            label={
                                                undergraduateGPA.type === "Percentage"
                                                    ? "Percentage"
                                                    : "GPA"
                                            }
                                            fullWidth
                                            size="small"
                                            value={undergraduateGPA.score}
                                            onChange={(e) =>
                                                setUndergraduateGPA({
                                                    ...undergraduateGPA,
                                                    score: e.target.value,
                                                })
                                            }
                                            placeholder={
                                                undergraduateGPA.type === "Percentage"
                                                    ? "e.g. 75%"
                                                    : "e.g. 3.0/4.0"
                                            }
                                        />
                                    </Grid>

                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Language Requirements
                                </Typography>
                                <Grid container spacing={2}>
                                    <LanguageRequirementFields
                                        value={undergraduateLanguageRequirement}
                                        onChange={setUndergraduateLanguageRequirement}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Postgraduate
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Grid container spacing={1.5}>

                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>
                                                Score Type
                                            </InputLabel>

                                            <Select
                                                value={postgraduateGPA.type}
                                                label="Score Type"
                                                onChange={(e) =>
                                                    setPostgraduateGPA({
                                                        ...postgraduateGPA,
                                                        type: e.target.value,
                                                    })
                                                }
                                            >
                                                <MenuItem value="GPA">
                                                    GPA
                                                </MenuItem>

                                                <MenuItem value="Percentage">
                                                    Percentage
                                                </MenuItem>

                                            </Select>
                                        </FormControl>
                                    </Grid>


                                    <Grid item xs={12} sm={8}>
                                        <TextField
                                            label={
                                                postgraduateGPA.type === "Percentage"
                                                    ? "Percentage"
                                                    : "GPA"
                                            }
                                            fullWidth
                                            size="small"
                                            value={postgraduateGPA.score}
                                            onChange={(e) =>
                                                setPostgraduateGPA({
                                                    ...postgraduateGPA,
                                                    score: e.target.value,
                                                })
                                            }
                                            placeholder={
                                                postgraduateGPA.type === "Percentage"
                                                    ? "e.g. 75%"
                                                    : "e.g. 3.0/4.0"
                                            }
                                        />
                                    </Grid>

                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Language Requirements
                                </Typography>
                                <Grid container spacing={2}>
                                    <LanguageRequirementFields
                                        value={postgraduateLanguageRequirement}
                                        onChange={setPostgraduateLanguageRequirement}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Programs */}
                <Paper sx={{ p: 3, mb: 3, breakInside: "avoid", display: "inline-block", width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Programs</Typography>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddProgram}>
                            Add Program
                        </Button>
                    </Box>

                    {programs.map((program, index) => (
                        <Card key={program.id} sx={{ mb: 2, position: "relative" }}>
                            <CardContent>
                                <IconButton
                                    size="small"
                                    sx={{ position: "absolute", top: 8, right: 8 }}
                                    onClick={() => handleRemoveProgram(program.id)}
                                    disabled={programs.length === 1}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>

                                <Typography variant="subtitle2" gutterBottom>
                                    Program #{index + 1}
                                </Typography>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={8}>
                                        <TextField
                                            label="Program Name"
                                            fullWidth
                                            value={program.name}
                                            onChange={(e) => handleProgramChange(program.id, "name", e.target.value)}
                                            placeholder="e.g. Bachelor of Applied Public Health (Honours)"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id={`level-label-${program.id}`}>Level</InputLabel>
                                            <Select
                                                labelId={`level-label-${program.id}`}
                                                value={program.level}
                                                onChange={(e) => handleProgramChange(program.id, "level", e.target.value)}
                                                label="Level"
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 300
                                                        }
                                                    }
                                                }}
                                            >
                                                <MenuItem value="">Select level</MenuItem>
                                                <MenuItem value="Undergraduate">Undergraduate</MenuItem>
                                                <MenuItem value="Postgraduate">Postgraduate</MenuItem>
                                                <MenuItem value="Diploma">Diploma</MenuItem>
                                                <MenuItem value="Certificate">Certificate</MenuItem>
                                                <MenuItem value="PhD">PhD</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="URL"
                                            fullWidth
                                            value={program.url}
                                            onChange={(e) => handleProgramChange(program.id, "url", e.target.value)}
                                            placeholder="Program website URL"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Duration"
                                            fullWidth
                                            value={program.duration}
                                            onChange={(e) => handleProgramChange(program.id, "duration", e.target.value)}
                                            placeholder="e.g. 1 year"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Intakes"
                                            fullWidth
                                            value={program.intakes}
                                            onChange={(e) => handleProgramChange(program.id, "intakes", e.target.value)}
                                            placeholder="e.g. February 2025, July 2025"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="First Year Fees"
                                            fullWidth
                                            value={program.firstYearFees}
                                            onChange={(e) => handleProgramChange(program.id, "firstYearFees", e.target.value)}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            }}
                                            placeholder="0.00"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="CRICOS Code"
                                            fullWidth
                                            value={program.cricosCode}
                                            onChange={(e) => handleProgramChange(program.id, "cricosCode", e.target.value)}
                                            placeholder="e.g. 090703A"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Discipline"
                                            fullWidth
                                            value={program.discipline}
                                            onChange={(e) => handleProgramChange(program.id, "discipline", e.target.value)}
                                            placeholder="e.g. Public Health"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Campuses"
                                            fullWidth
                                            value={program.campuses}
                                            onChange={(e) => handleProgramChange(program.id, "campuses", e.target.value)}
                                            placeholder="e.g. Melbourne, Sydney"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Funds Required"
                                            fullWidth
                                            value={program.fundsRequired}
                                            onChange={(e) => handleProgramChange(program.id, "fundsRequired", e.target.value)}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">AUD</InputAdornment>,
                                            }}
                                            placeholder="0"
                                            size="small"
                                            margin="normal"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Language Requirements
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label="IELTS"
                                                    fullWidth
                                                    value={program.ielts}
                                                    onChange={(e) => handleProgramChange(program.id, "ielts", e.target.value)}
                                                    placeholder="e.g. 6.5/6.0"
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label="PTE"
                                                    fullWidth
                                                    value={program.pte}
                                                    onChange={(e) => handleProgramChange(program.id, "pte", e.target.value)}
                                                    placeholder="e.g. 58/50"
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label="TOEFL"
                                                    fullWidth
                                                    value={program.toefl}
                                                    onChange={(e) => handleProgramChange(program.id, "toefl", e.target.value)}
                                                    placeholder="e.g. 90"
                                                    size="small"
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
                </Paper>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
                <Button variant="outlined">Cancel</Button>
                <Button variant="contained" color="primary" type="submit">
                    Save Institution
                </Button>
            </Box>
        </Box>
    );
}