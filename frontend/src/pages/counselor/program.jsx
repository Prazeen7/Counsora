import { apiFetch } from "../../services/api";
import { resolveProgramLocations } from "../../utils/programLocations";
import { FIELD_OPTIONS, formatProgramFields } from "../../constants/programFields";
import { useState, useEffect, useRef } from "react";
import {
    Box,
    Alert,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    CircularProgress,
    InputLabel,
    Menu,
    MenuItem,
    Select,
    Slider,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    createTheme,
    ThemeProvider,
    Pagination,
    Snackbar,
} from "@mui/material";
import {
    FilterList as FilterListIcon,
    Close as CloseIcon,
    Clear as ClearIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Sort as SortIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import ProgramCard from "../../components/counselor/ProgramCard";
import TabPanel from "../../components/counselor/TabPanel";
import '../counselor/institutions.css';
import SearchBar from "../../components/counselor/SearchBar";
import Loading from "../../components/Loading";
import { useCountry } from "../../context/CountryContext";

const URL = import.meta.env.VITE_BACKEND_URL;

// Shuffle cards

// Theme Configuration
const theme = createTheme({
    palette: {
        primary: {
            main: "#4f46e5",
            light: "#6366f1",
            dark: "#4338ca",
        },
        secondary: {
            main: "#6b7280",
        },
        background: {
            default: "#ffffff",
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
        h1: {
            fontSize: "2rem",
            fontWeight: 700,
            color: "#4f46e5",
        },
        body1: {
            fontSize: "0.875rem",
            color: "#6b7280",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 12,
                },
                contained: {
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    "&:hover": {
                        backgroundColor: "#4338ca",
                    },
                },
                outlined: {
                    borderColor: "#6b7280",
                    color: "#6b7280",
                    "&:hover": {
                        borderColor: "#4f46e5",
                        color: "#4f46e5",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                    },
                    padding: "16px",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    cursor: "pointer",
                    "&.MuiChip-clickable:hover": {
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                    },
                },
            },
        },
    },
});

// responsive
const SearchContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    padding: theme.spacing(2),
    border: "1px solid #e0e0e0",
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
        flexDirection: "row",
        alignItems: "center",
    },
}));

// Main Component
export default function Programs() {
    const [filterOpen, setFilterOpen] = useState(false);
    const { selectedCountry } = useCountry();
    const [tabValue, setTabValue] = useState(0); // For program level tabs
    const [filterTabValue, setFilterTabValue] = useState(0); // For filter dialog tabs
    const [tempFilters, setTempFilters] = useState({
        gpa: 0,
        englishTest: "",
        testScore: "",
        listeningScore: "",
        readingScore: "",
        writingScore: "",
        speakingScore: "",
        academicLevel: "",
        fieldOfStudy: "",
        preferredLocation: "",
        visaRefusal: false,
        bankBalance: null,
        educationLoan: null,
        educationLoanBank: "",
        incomeSources: [{ incomeSourceType: "", totalIncome: null, sourceOwner: "" }],
    });
    const [scoreWarning, setScoreWarning] = useState("");
    const [appliedFilters, setAppliedFilters] = useState({
        gpa: 0,
        englishTest: "",
        testScore: "",
        listeningScore: "",
        readingScore: "",
        writingScore: "",
        speakingScore: "",
        academicLevel: "",
        fieldOfStudy: "",
        preferredLocation: "",
        visaRefusal: false,
        bankBalance: null,
        educationLoan: null,
        educationLoanBank: "",
        incomeSources: [{ incomeSourceType: "", totalIncome: null, sourceOwner: "" }],
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const isSortMenuOpen = Boolean(sortAnchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [institutions, setInstitutions] = useState([]);
    const [totalPrograms, setTotalPrograms] = useState(0);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [loadedOffset, setLoadedOffset] = useState(-1);
    const programBatchesRef = useRef(new Map());
    const [programShuffleSeed] = useState(() =>
        Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16)).join("-")
    );
    const batchSize = itemsPerPage * 5;
    const gpaFilter = Number(appliedFilters.gpa) || 0;
    const backendParams = new URLSearchParams({ gpa: String(gpaFilter) });
    if (selectedCountry?._id) backendParams.set("country", selectedCountry._id);
    if (searchQuery.trim()) backendParams.set("search", searchQuery.trim());
    backendParams.set("programLevel", ["all", "undergraduate", "postgraduate"][tabValue]);
    if (appliedFilters.academicLevel) backendParams.set("academicLevel", appliedFilters.academicLevel);
    if (appliedFilters.englishTest) {
        backendParams.set("englishTest", appliedFilters.englishTest);
        ["testScore", "listeningScore", "readingScore", "writingScore", "speakingScore"].forEach(key => {
            if (appliedFilters[key] !== "") backendParams.set(key, appliedFilters[key]);
        });
    }
    if (appliedFilters.fieldOfStudy) backendParams.set("fieldOfStudy", appliedFilters.fieldOfStudy);
    if (appliedFilters.preferredLocation) backendParams.set("location", appliedFilters.preferredLocation);
    if (sortOrder) backendParams.set("sortOrder", sortOrder);
    const backendFilterKey = backendParams.toString();
    const [loadedFilterKey, setLoadedFilterKey] = useState(null);
    const previousFilterRef = useRef(backendFilterKey);
    const batchOffset = Math.floor((currentPage - 1) / 5) * batchSize;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const programTabsRef = useRef(null);
    const pendingPageScrollRef = useRef(null);

    // Default filter values
    const defaultFilters = {
        gpa: 0,
        englishTest: "",
        testScore: "",
        listeningScore: "",
        readingScore: "",
        writingScore: "",
        speakingScore: "",
        academicLevel: "",
        fieldOfStudy: "",
        preferredLocation: "",
        visaRefusal: false,
        bankBalance: null,
        educationLoan: null,
        educationLoanBank: "",
        incomeSources: [{ incomeSourceType: "", totalIncome: null, sourceOwner: "" }],
    };

    // ----- Helper to parse GPA from new schema -----
    const parseGPAFromProgram = (entryRequirements) => {
        if (!entryRequirements || !entryRequirements.academic) return 0;
        const academic = entryRequirements.academic;
        // If score is a number
        if (typeof academic.score === 'number' && academic.score !== null) {
            return academic.score;
        }
        // If score is a string, try to extract number
        if (typeof academic.score === 'string') {
            const match = academic.score.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    };

    // ----- Helper to extract language score from new schema -----
    const getLanguageScore = (entryRequirements, testType) => {
        if (!entryRequirements || !entryRequirements.language_requirements) return null;
        const lang = entryRequirements.language_requirements;
        const english = lang.english || {};
        let score = null;
        switch (testType.toLowerCase()) {
            case 'ielts':
                score = english.ielts?.overall;
                break;
            case 'toefl':
                score = english.toefl?.overall;
                break;
            case 'pte':
                score = english.pte?.overall;
                break;
            case 'duolingo':
                score = english.duolingo?.overall;
                break;
            default:
                return null;
        }
        return (score !== undefined && score !== null) ? score : null;
    };

    // ----- Fetch programs and map to UI format -----
    const fetchData = async (offset, signal) => {
        const cacheKey = `${backendFilterKey}:${offset}`;
        const cached = programBatchesRef.current.get(cacheKey);
        if (cached) {
            setInstitutions(cached.programs);
            setTotalPrograms(cached.total);
            setAvailableLocations(cached.locations || []);
            setLoadedFilterKey(backendFilterKey);
            setLoadedOffset(offset);
            setError("");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await apiFetch(`${URL}/program/get?limit=${batchSize}&offset=${offset}&seed=${programShuffleSeed}&${backendFilterKey}`, {
                method: "GET",
                signal,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (signal.aborted) return;

            // Map the new schema to the UI format
            const mappedPrograms = data.programs.map((program) => {
                    // Determine level from degree_name or level field
                    let level = "N/A";
                    const levelField = program.level || "";
                    if (levelField === "Bachelor" || levelField === "Diploma" || levelField === "Foundation") {
                        level = "Undergraduate";
                    } else if (levelField === "Master" || levelField === "PhD" || levelField === "Doctoral" || levelField === "Research") {
                        level = "Postgraduate";
                    } else {
                        // Fallback: search in degree_name
                        const name = program.degree_name?.toLowerCase() || "";
                        if (name.includes("bachelor") || name.includes("undergraduate")) {
                            level = "Undergraduate";
                        } else if (name.includes("master") || name.includes("phd") || name.includes("postgraduate") || name.includes("doctorate")) {
                            level = "Postgraduate";
                        }
                    }

                    // Extract discipline from field or degree name
                    const discipline = formatProgramFields(program.field) ||
                        program.degree_name?.split(" in ")[1]?.split(" ")[0] ||
                        program.degree_name?.split(" of ")[1]?.split(" ")[0] ||
                        "General";

                    // Display all campuses, including locations matched by the backend filter.
                    const campus = resolveProgramLocations(program, program.institutionData).join(", ") || "N/A";

                    // Extract language scores
                    const ielts = getLanguageScore(program.entry_requirements, 'ielts');
                    const pte = getLanguageScore(program.entry_requirements, 'pte');
                    const toefl = getLanguageScore(program.entry_requirements, 'toefl');
                    const gpa = parseGPAFromProgram(program.entry_requirements);

                    // Build institutionData from program fields (if institution data is populated)
                    // The API might return the full institution object as `institutionData`
                    const institutionData = program.institutionData || {
                        // Fallback to program-level data if not populated
                        entryRequirements: {},
                        documents: {
                            incomeSources: [],
                            sponsors: [],
                            minIncomeAmount: "",
                            banks: [],
                            previousVisaRefusal: "no"
                        },
                        applicationFee: { amount: program.application_fees || 0 }
                    };

                    return {
                        id: `${program.institutionId || program.institution}-${program._id}`,
                        program: program.degree_name || "N/A",
                        isPinned: Boolean(program.isPinned),
                        isDimmed: Boolean(program.isDimmed || institutionData?.isDimmed),
                        institution: program.institutionName || "N/A",
                        level: level,
                        discipline: discipline,
                        duration: program.duration || "N/A",
                        intakes: program.intakes || [],
                        tuition_fees: program.tuition_fees || [],
                        campus: campus,
                        ielts: ielts,
                        pte: pte,
                        toefl: toefl,
                        gpa: gpa,
                        entry_requirements: program.entry_requirements,
                        specialization: program.specialization,
                        applicationFees: program.application_fees || institutionData?.applicationFee?.amount || "N/A",
                        requiredFunds: null, // will be calculated later
                        institutionData: {
                            ...institutionData,
                            profilePicture: program.institutionLogo?.url || institutionData?.logo?.url,
                        },
                        url: program.url || "#",
                    };
                });

            programBatchesRef.current.set(cacheKey, {
                programs: mappedPrograms,
                total: data.pagination.total,
                locations: data.locations || [],
            });
            setLoadedFilterKey(backendFilterKey);
            setInstitutions(mappedPrograms);
            setLoadedOffset(offset);
            setTotalPrograms(data.pagination.total);
            setAvailableLocations(data.locations || []);
            setError("");
        } catch (error) {
            if (signal.aborted) return;
            console.error("Error fetching programs:", error);
            setError("Failed to fetch programs. Please try again later.");
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    };

    // Fetch data 
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, []);

    // Fetch five pages at a time, including when jumping directly to a distant page.
    useEffect(() => {
        if (previousFilterRef.current !== backendFilterKey) {
            previousFilterRef.current = backendFilterKey;
            setCurrentPage(1);
            if (batchOffset !== 0) return;
        }
        const controller = new AbortController();
        fetchData(batchOffset, controller.signal);
        return () => controller.abort();
    }, [batchOffset, backendFilterKey]);

    // Calculate total required funds for a program
    const calculateTotalRequiredFunds = (program) => {
        const firstYearFees = Number(program.tuition_fees?.[0]?.annual_fee_eur) || 0;
        const livingExpenses = 29710; // AUD 29,710
        const travellingExpenses = 2500; // AUD 2,500
        const healthCover = 2500; // AUD 2,500
        return firstYearFees + livingExpenses + travellingExpenses + healthCover;
    };


    // Extract unique acceptable banks from all institutions
    const acceptableBanks = [
        ...new Set(
            institutions.flatMap(program =>
                program.institutionData?.documents?.banks || []
            )
        ),
    ].filter(bank => bank);

    // Filter programs based on search query, selected discipline, program level, and financial filters
    const filteredPrograms = institutions.filter((program) => {

        // Financial Filter Logic
        const totalRequiredFunds = calculateTotalRequiredFunds(program);
        const matchesBankBalance =
            appliedFilters.bankBalance === null || appliedFilters.bankBalance >= totalRequiredFunds;

        // Education Loan Filter Logic
        const matchesEducationLoan =
            appliedFilters.educationLoan === null ||
            (appliedFilters.educationLoan >= totalRequiredFunds &&
                appliedFilters.educationLoanBank &&
                program.institutionData?.documents?.banks?.includes(appliedFilters.educationLoanBank));

        // Income Source Filter Logic
        const acceptableIncomeSources = program.institutionData?.documents?.incomeSources || [];
        const minimumIncomeAmountRequired =
            parseFloat(program.institutionData?.documents?.minIncomeAmount?.replace(/[^0-9.]/g, "")) || 0;
        const acceptableSponsors = program.institutionData?.documents?.sponsors || [];

        // Sum total income from all income sources
        const totalIncome = appliedFilters.incomeSources.reduce(
            (sum, source) => sum + (source.totalIncome || 0),
            0
        );

        const matchesIncomeSource =
            appliedFilters.incomeSources.every((source) =>
                !source.incomeSourceType || acceptableIncomeSources.includes(source.incomeSourceType)
            );

        const matchesTotalIncome =
            !totalIncome || totalIncome >= minimumIncomeAmountRequired;

        const matchesSourceOwner =
            appliedFilters.incomeSources.every((source) =>
                !source.sourceOwner || acceptableSponsors.includes(source.sourceOwner)
            );

        // Immigration History Filter Logic
        const matchesVisaRefusal =
            !appliedFilters.visaRefusal ||
            program.institutionData?.documents?.previousVisaRefusal === "yes";

        return (
            matchesBankBalance &&
            matchesEducationLoan &&
            matchesIncomeSource &&
            matchesTotalIncome &&
            matchesSourceOwner &&
            matchesVisaRefusal
        );
    });

    // The backend sorts before pagination; retain the returned order here.
    const sortedPrograms = filteredPrograms;

    // Updated pagination logic
    const indexOfLastItem = currentPage * itemsPerPage - batchOffset;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPrograms = loadedOffset === batchOffset && loadedFilterKey === backendFilterKey && !loading && !error
        ? sortedPrograms.slice(indexOfFirstItem, indexOfLastItem) : [];

    // Ensure the pagination count is calculated correctly
    const totalPages = Math.ceil(totalPrograms / itemsPerPage);

    // Handle page change 
    const handlePageChange = (event, value) => {
        pendingPageScrollRef.current = value;
        setCurrentPage(value);
    };

    // Scroll after the requested page's cards have rendered, including cached pages.
    useEffect(() => {
        if (pendingPageScrollRef.current !== currentPage || loading || error || loadedOffset !== batchOffset || loadedFilterKey !== backendFilterKey) return;

        const frame = requestAnimationFrame(() => {
            programTabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            pendingPageScrollRef.current = null;
        });
        return () => cancelAnimationFrame(frame);
    }, [currentPage, loading, error, loadedOffset, batchOffset, loadedFilterKey, backendFilterKey]);

    // Handle opening the sort dropdown menu
    const handleSortMenuOpen = (event) => {
        setSortAnchorEl(event.currentTarget);
    };

    // Handle closing the sort dropdown menu
    const handleSortMenuClose = () => {
        setSortAnchorEl(null);
    };

    // Handle selecting a sort option
    const handleSortOptionSelect = (order) => {
        setSortOrder(order);
        setCurrentPage(1);
        handleSortMenuClose();
    };

    // Function to remove a specific filter
    const handleRemoveFilter = (filterKey) => {
        setAppliedFilters((prev) => ({
            ...prev,
            [filterKey]: defaultFilters[filterKey],
        }));
        setTempFilters((prev) => ({
            ...prev,
            [filterKey]: defaultFilters[filterKey],
        }));
    };

    // Function to get applied filters as chips
    const getAppliedFilterChips = () => {
        const chips = [];
        for (const [key, value] of Object.entries(appliedFilters)) {
            if (value && value !== defaultFilters[key]) {
                let displayValue = value;

                // Handle income sources 
                if (key === "incomeSources") {
                    const hasNonDefaultIncomeSources = value.some(
                        (source) =>
                            source.incomeSourceType !== "" ||
                            source.totalIncome !== null ||
                            source.sourceOwner !== ""
                    );

                    if (hasNonDefaultIncomeSources) {
                        displayValue = value
                            .map((source) => `${source.incomeSourceType}, Amount: $${source.totalIncome}, Sponsor: ${source.sourceOwner}`)
                            .join(", ");
                        chips.push(
                            <Chip
                                key={key}
                                label={`${key}: ${displayValue}`}
                                onDelete={() => handleRemoveFilter(key)}
                                deleteIcon={<CloseIcon />}
                                sx={{ m: 0.5 }}
                            />
                        );
                    }
                } else {
                    chips.push(
                        <Chip
                            key={key}
                            label={key === "academicLevel"
                                ? `Highest Qualification Completed: ${{ high_school: "High School", bachelors: "Bachelor's Degree", masters: "Master's Degree", phd: "PhD" }[value]}`
                                : `${key === "fieldOfStudy" ? "Field of Study" : key === "preferredLocation" ? "Location" : key}: ${displayValue}`}
                            onDelete={() => handleRemoveFilter(key)}
                            deleteIcon={<CloseIcon />}
                            sx={{ m: 0.5 }}
                        />
                    );
                }
            }
        }
        // Add sort filter chip
        if (sortOrder) {
            chips.push(
                <Chip
                    key="sort"
                    label={`${sortOrder === "highToLow" ? "Fee: High to Low" : "Fee: Low to High"}`}
                    onDelete={() => setSortOrder("")}
                    deleteIcon={<CloseIcon />}
                    sx={{ m: 0.5 }}
                />
            );
        }
        return chips;
    };

    // Handlers
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setCurrentPage(1);
        setTimeout(() => {
            if (programTabsRef.current) {
                programTabsRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 0);
    };

    const handleFilterTabChange = (event, newValue) => {
        setFilterTabValue(newValue);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        if (name === "englishTest" || name.endsWith("Score")) setScoreWarning("");
        setTempFilters((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "englishTest" ? { testScore: "", listeningScore: "", readingScore: "", writingScore: "", speakingScore: "" } : {}),
        }));
    };

    const handleSliderChange = (name) => (event, newValue) => {
        setTempFilters((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSwitchChange = (name) => (event) => {
        setTempFilters((prev) => ({
            ...prev,
            [name]: event.target.checked,
        }));
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const handleApplyFilters = () => {
        const individualKeys = ["listeningScore", "readingScore", "writingScore", "speakingScore"];
        const individual = individualKeys
            .filter((key) => tempFilters[key] !== "" && tempFilters[key] !== null && tempFilters[key] !== undefined)
            .map((key) => Number(tempFilters[key]))
            .filter(Number.isFinite);
        if (tempFilters.testScore !== "" && individual.length === 4) {
            const calculated = Math.round((individual.reduce((sum, score) => sum + score, 0) / 4) * 2) / 2;
            const entered = Number(tempFilters.testScore);
            if (Math.abs(calculated - entered) > 0.001) {
                setScoreWarning(`The overall score should be ${calculated.toFixed(1)} according to the four individual scores.`);
                return;
            }
        }
        setScoreWarning("");
        setAppliedFilters(tempFilters);
        setCurrentPage(1);
        setFilterOpen(false);
        setTimeout(() => {
            if (programTabsRef.current) {
                programTabsRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 0);
    };

    const handleClearFilters = () => {
        setTempFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
    };

    // Handle income source change
    const handleIncomeSourceChange = (index, field, value) => {
        const updatedIncomeSources = [...tempFilters.incomeSources];
        updatedIncomeSources[index][field] = value;
        setTempFilters((prev) => ({
            ...prev,
            incomeSources: updatedIncomeSources,
        }));
    };

    // Add new income source
    const addIncomeSource = () => {
        setTempFilters((prev) => ({
            ...prev,
            incomeSources: [...prev.incomeSources, { incomeSourceType: "", totalIncome: null, sourceOwner: "" }],
        }));
    };

    // Remove income source
    const removeIncomeSource = (index) => {
        const updatedIncomeSources = tempFilters.incomeSources.filter((_, i) => i !== index);
        setTempFilters((prev) => ({
            ...prev,
            incomeSources: updatedIncomeSources,
        }));
    };

    // Initialize temporary filters when dialog opens
    const handleFilterDialogOpen = () => {
        setTempFilters(appliedFilters);
        setFilterOpen(true);
    };

    // Reset temporary filters when dialog closes without applying
    const handleFilterDialogClose = () => {
        setTempFilters(appliedFilters);
        setFilterOpen(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
                <Container maxWidth="xl">
                    <Stack spacing={4}>

                        {/* Header */}
                        <Box sx={{ textAlign: "center" }}>
                            <Stack spacing={1} alignItems="center" textAlign="center">
                                <Typography variant="h1" textAlign="center" fontSize="2rem">
                                    Discover Your Perfect Program
                                </Typography>
                                <Typography variant="body1" color="text.secondary" textAlign="center" fontSize="0.875rem">
                                    Browse through thousands of programs from top institutions
                                </Typography>
                            </Stack>
                        </Box>

                        {/* Search and Filter Section */}
                        <SearchContainer>
                            <Box sx={{ flex: 1 }}>
                                <SearchBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<FilterListIcon />}
                                sx={{ width: { xs: "100%", sm: "auto" } }}
                                onClick={handleFilterDialogOpen}
                            >
                                Filters
                            </Button>

                            {/* Sort Button with Dropdown Menu */}
                            <Button
                                variant="outlined"
                                startIcon={<SortIcon />}
                                sx={{ width: { xs: "100%", sm: "auto" } }}
                                onClick={handleSortMenuOpen}
                                aria-controls="sort-menu"
                                aria-haspopup="true"
                                aria-expanded={isSortMenuOpen ? "true" : undefined}
                            >
                                Sort
                            </Button>
                            <Menu
                                id="sort-menu"
                                anchorEl={sortAnchorEl}
                                open={isSortMenuOpen}
                                onClose={handleSortMenuClose}
                                MenuListProps={{
                                    "aria-labelledby": "sort-button",
                                }}
                            >
                                <MenuItem onClick={() => handleSortOptionSelect("")}>
                                    None
                                </MenuItem>
                                <MenuItem onClick={() => handleSortOptionSelect("highToLow")}>
                                    Fee: High to Low
                                </MenuItem>
                                <MenuItem onClick={() => handleSortOptionSelect("lowToHigh")}>
                                    Fee: Low to High
                                </MenuItem>
                            </Menu>
                        </SearchContainer>

                        {/* Applied Filters Chips */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {getAppliedFilterChips()}
                        </Box>

                        {/* Program Level Tabs */}
                        <Box ref={programTabsRef} sx={{ borderBottom: 1, borderColor: "divider" }}>
                            <Tabs value={tabValue} onChange={handleTabChange} centered>
                                <Tab label="All Programs" />
                                <Tab label="Undergraduate" />
                                <Tab label="Postgraduate" />
                            </Tabs>
                        </Box>

                        {/* Loading State */}
                        {loading && (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                                <Loading />
                            </Box>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography level="h3" sx={{ mb: 1 }}>
                                    Error
                                </Typography>
                                <Typography level="body-md" color="neutral">
                                    {error}
                                </Typography>
                            </Box>
                        )}

                        {/* Program Cards */}
                        {!loading && filteredPrograms.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography level="h3" sx={{ mb: 1 }}>
                                    No Programs Found
                                </Typography>
                                <Typography level="body-md" color="neutral">
                                    Try adjusting your filters or search terms.
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(3, 1fr)',
                                        md: 'repeat(3, 1fr)',
                                        lg: 'repeat(3, 1fr)',
                                        xl: 'repeat(3, 1fr)'
                                    },
                                    gap: 3,
                                    width: '100%'
                                }}
                            >
                                {currentPrograms.map((program) => (
                                    <Box key={program.id} sx={{ display: 'flex', minWidth: 0 }}>
                                        <ProgramCard
                                            program={program}
                                            institutionData={program.institutionData}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Pagination */}
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    </Stack>
                </Container>

                {/* Filter Dialog */}
                <Dialog open={filterOpen} onClose={handleFilterDialogClose} maxWidth="md" fullWidth scroll="paper">
                    <DialogTitle component="div" sx={{ position: "relative", pr: 7 }}>
                        <Stack direction="row" alignItems="center">
                            <Tabs value={filterTabValue} onChange={handleFilterTabChange} centered>
                                <Tab label="Academic" />
                                {/* <Tab label="Financial" />
                                <Tab label="Other" /> */}
                            </Tabs>
                            <IconButton
                                aria-label="Close filters"
                                onClick={handleFilterDialogClose}
                                sx={{ position: "absolute", top: 8, right: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent dividers>
                        <TabPanel value={filterTabValue} index={0}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 3, alignItems: "start", "& > *": { minWidth: 0 } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Highest Qualification Completed</InputLabel>
                                    <Select
                                        label="Highest Qualification Completed"
                                        name="academicLevel"
                                        value={tempFilters.academicLevel}
                                        onChange={handleFilterChange}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="high_school">High School</MenuItem>
                                        <MenuItem value="bachelors">Bachelor's Degree</MenuItem>
                                        <MenuItem value="masters">Master's Degree</MenuItem>
                                        <MenuItem value="phd">PhD</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="counselor-program-field-label">Field of Study</InputLabel>
                                    <Select
                                        labelId="counselor-program-field-label"
                                        label="Field of Study"
                                        name="fieldOfStudy"
                                        value={tempFilters.fieldOfStudy}
                                        onChange={handleFilterChange}
                                        MenuProps={{
                                            slotProps: {
                                                paper: {
                                                    sx: {
                                                        maxHeight: "min(300px, calc(100vh - 64px))",
                                                        overflowY: "auto",
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="">All Fields</MenuItem>
                                        {FIELD_OPTIONS.map(field => (
                                            <MenuItem key={field} value={field}>{field}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="counselor-program-location-label">Location</InputLabel>
                                    <Select
                                        labelId="counselor-program-location-label"
                                        label="Location"
                                        name="preferredLocation"
                                        value={tempFilters.preferredLocation}
                                        onChange={handleFilterChange}
                                        MenuProps={{ slotProps: { paper: { sx: {
                                            maxHeight: "min(300px, calc(100vh - 64px))",
                                            overflowY: "auto",
                                        } } } }}
                                    >
                                        <MenuItem value="">All Locations</MenuItem>
                                        {availableLocations.map(location => (
                                            <MenuItem key={location} value={location}>{location}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Box sx={{ gridColumn: "1 / -1", px: 1 }}>
                                    <Typography gutterBottom>GPA Range</Typography>
                                    <Slider
                                        value={tempFilters.gpa}
                                        step={0.1}
                                        min={0}
                                        max={4.0}
                                        marks={[
                                            { value: 0, label: "0.0" },
                                            { value: 4, label: "4.0" },
                                        ]}
                                        valueLabelDisplay="auto"
                                        onChange={handleSliderChange("gpa")}
                                    />
                                </Box>
                                <FormControl fullWidth>
                                    <InputLabel>English Proficiency Test</InputLabel>
                                    <Select
                                        label="English Proficiency Test"
                                        name="englishTest"
                                        value={tempFilters.englishTest}
                                        onChange={handleFilterChange}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="ielts">IELTS</MenuItem>
                                        <MenuItem value="toefl">TOEFL</MenuItem>
                                        <MenuItem value="pte">PTE</MenuItem>
                                        <MenuItem value="duolingo">Duolingo</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    type="number"
                                    label="Overall Score (optional)"
                                    name="testScore"
                                    value={tempFilters.testScore}
                                    onChange={handleFilterChange}
                                    disabled={!tempFilters.englishTest}
                                />
                                <Box sx={{ display: "grid", gridTemplateColumns: "subgrid", gridColumn: "1 / -1", gap: 3 }}>
                                    {["listening", "reading", "writing", "speaking"].map(component => (
                                        <TextField
                                            key={component}
                                            type="number"
                                            label={`${component[0].toUpperCase()}${component.slice(1)} Score (optional)`}
                                            name={`${component}Score`}
                                            value={tempFilters[`${component}Score`]}
                                            onChange={handleFilterChange}
                                            disabled={!tempFilters.englishTest}
                                            slotProps={{ htmlInput: { min: 0, step: "any" } }}
                                        />
                                    ))}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
                                    Enter your scores. Programs must accept the selected test and have minimum requirements no higher than the scores you enter.
                                </Typography>
                            </Box>
                        </TabPanel>
                        {/* Financial and Other filters temporarily hidden.
                        <TabPanel value={filterTabValue} index={1}>
                            <Stack spacing={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Stack spacing={3}>
                                            <Typography variant="subtitle1">Available Funds</Typography>
                                            <TextField
                                                type="number"
                                                label="Bank Balance"
                                                fullWidth
                                                value={tempFilters.bankBalance || ""}
                                                onChange={(e) =>
                                                    setTempFilters((prev) => ({
                                                        ...prev,
                                                        bankBalance: e.target.value ? parseFloat(e.target.value) : null,
                                                    }))
                                                }
                                            />
                                            <TextField
                                                type="number"
                                                label="Education Loan Amount"
                                                fullWidth
                                                value={tempFilters.educationLoan || ""}
                                                onChange={(e) =>
                                                    setTempFilters((prev) => ({
                                                        ...prev,
                                                        educationLoan: e.target.value ? parseFloat(e.target.value) : null,
                                                    }))
                                                }
                                            />
                                            <FormControl fullWidth>
                                                <InputLabel>Bank Name</InputLabel>
                                                <Select
                                                    label="Bank Name"
                                                    value={tempFilters.educationLoanBank || ""}
                                                    onChange={(e) =>
                                                        setTempFilters((prev) => ({
                                                            ...prev,
                                                            educationLoanBank: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    <MenuItem value="">None</MenuItem>
                                                    {acceptableBanks.map((bank) => (
                                                        <MenuItem key={bank} value={bank}>
                                                            {bank}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </CardContent>
                                </Card>

                                Income Source Section
                                {tempFilters.incomeSources.map((source, index) => (
                                    <Card key={index} variant="outlined">
                                        <CardContent>
                                            <Stack spacing={3}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle1">Income Source {index + 1}</Typography>
                                                    {index === tempFilters.incomeSources.length - 1 && (
                                                        <Stack direction="row" spacing={1}>
                                                            <IconButton size="small" onClick={() => removeIncomeSource(index)}>
                                                                <RemoveIcon />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={addIncomeSource}>
                                                                <AddIcon />
                                                            </IconButton>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                                <FormControl fullWidth>
                                                    <InputLabel>Source Type</InputLabel>
                                                    <Select
                                                        label="Source Type"
                                                        value={source.incomeSourceType || ""}
                                                        onChange={(e) =>
                                                            handleIncomeSourceChange(index, "incomeSourceType", e.target.value)
                                                        }
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
                                                <TextField
                                                    type="number"
                                                    label="Total Income (Annual)"
                                                    fullWidth
                                                    value={source.totalIncome || ""}
                                                    onChange={(e) =>
                                                        handleIncomeSourceChange(index, "totalIncome", e.target.value ? parseFloat(e.target.value) : null)
                                                    }
                                                />
                                                <FormControl fullWidth>
                                                    <InputLabel>Source Owner (Sponsor)</InputLabel>
                                                    <Select
                                                        label="Source Owner (Sponsor)"
                                                        value={source.sourceOwner || ""}
                                                        onChange={(e) =>
                                                            handleIncomeSourceChange(index, "sourceOwner", e.target.value)
                                                        }
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        <MenuItem value="Parents">Parents</MenuItem>
                                                        <MenuItem value="Spouse">Spouse</MenuItem>
                                                        <MenuItem value="Relatives">Relatives</MenuItem>
                                                        <MenuItem value="Employers">Employers</MenuItem>
                                                        <MenuItem value="Educational Institutions">Educational Institutions</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </TabPanel>
                        <TabPanel value={filterTabValue} index={2}>
                            <Stack spacing={3}>

                                <Card variant="outlined">
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Typography variant="subtitle1">Immigration History</Typography>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        name="visaRefusal"
                                                        checked={tempFilters.visaRefusal}
                                                        onChange={handleSwitchChange("visaRefusal")}
                                                    />
                                                }
                                                label="Previous Visa Refusal"
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Stack>
                        </TabPanel>
                        */}
                    </DialogContent>
                    <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={handleClearFilters}
                            sx={{ color: "#6b7280", borderColor: "#6b7280" }}
                        >
                            Clear Filters
                        </Button>
                        <Button variant="contained" onClick={handleApplyFilters} disabled={Boolean(tempFilters.englishTest) &&
                            ["testScore", "listeningScore", "readingScore", "writingScore", "speakingScore"].some(key =>
                                tempFilters[key] !== "" && (!Number.isFinite(Number(tempFilters[key])) || Number(tempFilters[key]) < 0)
                            )}>
                            Apply Filters
                        </Button>
                    </Box>
                </Dialog>
            </Box>
            <Snackbar open={Boolean(scoreWarning)} autoHideDuration={6000} onClose={() => setScoreWarning("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={() => setScoreWarning("")} severity="warning" variant="filled" sx={{ width: "100%" }}>{scoreWarning}</Alert>
            </Snackbar>
        </ThemeProvider>
    );
}
