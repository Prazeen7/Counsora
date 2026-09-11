import { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    ListItemText,
    Alert,
    Backdrop,
    Tabs,
    Tab,
} from "@mui/material";
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Public,
    KeyboardArrowDown,
    PhotoCamera,
    Edit as EditIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import { getCountries } from "../../services/countryService";
import LanguageRequirementFields from "./LanguageRequirementFields";
import { addInstitution, commitInstitutionImport, discoverSpreadsheetGroups, extractInstitutionsFromSpreadsheet, extractProgramsFromSpreadsheet } from '../../services/institutionService';
import InstitutionPreview from './InstitutionPreview';
import ReviewProgramsModal from './ReviewProgramsModal';
import SpreadsheetImportReview from './SpreadsheetImportReview';


export default function AddInstitution({ onClose }) {
    const theme = useTheme();

    const [inputMethod, setInputMethod] = useState("manual");
    const [excelFile, setExcelFile] = useState(null);
    const [importReview, setImportReview] = useState({ open: false, stage: "institutions", institutions: [], programs: [] });
    const [importBusy, setImportBusy] = useState(false);
    const [importError, setImportError] = useState("");
    const [importLoadingMessage, setImportLoadingMessage] = useState("");
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, label: "" });
    const importGroupsRef = useRef([]);
    const importSessionIdRef = useRef("");
    const activeGroupIndexRef = useRef(0);
    const approvedInstitutionRef = useRef(null);
    const prefetchedInstitutionRef = useRef(null);
    const importedCountsRef = useRef({ institutions: 0, programs: 0 });
    const importActionLockRef = useRef(false);

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
        useState([
            {
                id: Date.now(),
                testType: "",
                testName: "",
                overall: "",
                minimum: "",
                hasIndividualScores: false,
                listening: "",
                reading: "",
                writing: "",
                speaking: "",
                literacy: "",
                comprehension: "",
                conversation: "",
                production: "",
            }
        ]);

    const [postgraduateGPA, setPostgraduateGPA] = useState({
        type: "",
        score: "",
    });
    const [postgraduateIELTS, setPostgraduateIELTS] = useState("");
    const [postgraduatePTE, setPostgraduatePTE] = useState("");
    const [postgraduateTOEFL, setPostgraduateTOEFL] = useState("");
    const [postgraduateDuolingo, setPostgraduateDuolingo] = useState("");
    const [postgraduateLanguageRequirement, setPostgraduateLanguageRequirement] =
        useState([
            {
                id: Date.now() + 1,
                testType: "",
                testName: "",
                overall: "",
                minimum: "",
                hasIndividualScores: false,
                listening: "",
                reading: "",
                writing: "",
                speaking: "",
                literacy: "",
                comprehension: "",
                conversation: "",
                production: "",
            }
        ]);

    // State for agents
    const [agents, setAgents] = useState([]);

    // State for programs
    const [programs, setPrograms] = useState([]);
    const [programInputMode, setProgramInputMode] = useState('manual'); // 'manual' or 'crawl'
    const [crawlUrl, setCrawlUrl] = useState('');
    const [crawlStatus, setCrawlStatus] = useState(null); // null, 'checking', 'crawling', 'completed', 'failed', 'pending_review'
    const [crawlMessage, setCrawlMessage] = useState('');
    const [institutionId, setInstitutionId] = useState(null); // Store created institution ID
    const [showReviewModal, setShowReviewModal] = useState(false); // Modal to review crawled programs
    const [reviewPrograms, setReviewPrograms] = useState([]); // Programs to review
    const [approvingPrograms, setApprovingPrograms] = useState(false);

    // State for scholarships
    const [scholarships, setScholarships] = useState([]);

    // State for documents
    const [incomeSources, setIncomeSources] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [minSponsorCount, setMinSponsorCount] = useState("");
    const [minIncomeAmount, setMinIncomeAmount] = useState("");
    const [banks, setBanks] = useState([]);
    const [previousVisaRefusal, setPreviousVisaRefusal] = useState("");
    const [levelChangeAfterRefusal, setLevelChangeAfterRefusal] = useState(false);
    const [offerLetter, setOfferLetter] = useState({
        document: "",
        docs: [{ id: 1, name: "" }],
        src: [{ id: 1, name: "" }],
        info: [{ id: 1, name: "" }],
    });

    // State for preview
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);


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
            if (!["image/png", "image/jpeg"].includes(file.type.toLowerCase())) {
                event.target.value = "";
                alert("Please select a PNG, JPG, or JPEG image.");
                return;
            }
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

    // Handler for adding a program
    const handleAddProgram = () => {
        setPrograms([
            ...programs,
            {
                id: Date.now(),
                name: '',
                level: '',
                field: '',
                duration: '',

                tuitionFee: {
                    value: '',
                    currency: selectedCountry?.currency || '',
                    per: 'year',
                },

                campuses: [],

                useInstitutionRequirements: true,

                undergraduateRequirement: {
                    gpa: { type: '', score: '' },
                    languageRequirement: [
                        {
                            id: Date.now(),
                            testType: '',
                            testName: '',
                            overall: '',
                            minimum: '',
                            hasIndividualScores: false,
                            listening: '',
                            reading: '',
                            writing: '',
                            speaking: '',
                            literacy: '',
                            comprehension: '',
                            conversation: '',
                            production: '',
                        }
                    ],
                },

                postgraduateRequirement: {
                    gpa: { type: '', score: '' },
                    languageRequirement: [
                        {
                            id: Date.now() + 1,
                            testType: '',
                            testName: '',
                            overall: '',
                            minimum: '',
                            hasIndividualScores: false,
                            listening: '',
                            reading: '',
                            writing: '',
                            speaking: '',
                            literacy: '',
                            comprehension: '',
                            conversation: '',
                            production: '',
                        }
                    ],
                },

                intakes: '',
                description: '',
            },
        ]);
    };

    // Handler for changing program details
    const handleProgramChange = (id, path, value) => {
        setPrograms((prevPrograms) =>
            prevPrograms.map((program) => {
                if (program.id !== id) return program;

                const updated = structuredClone(program);

                const keys = path.split(".");
                let current = updated;

                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }

                current[keys[keys.length - 1]] = value;

                return updated;
            })
        );
    };

    // Handler for removing a program
    const handleRemoveProgram = (id) => {
        setPrograms(programs.filter((program) => program.id !== id));
    };

    // Handler for adding a scholarship
    const handleAddScholarship = () => {
        setScholarships([
            ...scholarships,
            {
                id: Date.now(),
                name: "",
                value: "",
                description: "",
                eligibility: "",
                url: "",
            },
        ]);
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

    const handleAddRequiredDoc = () => {
        setOfferLetter((prev) => ({
            ...prev,
            docs: [...prev.docs, { id: Date.now(), name: "" }],
        }));
    };

    const handleRequiredDocChange = (id, value) => {
        setOfferLetter((prev) => ({
            ...prev,
            docs: prev.docs.map((doc) =>
                doc.id === id ? { ...doc, name: value } : doc
            ),
        }));
    };

    const handleRemoveRequiredDoc = (id) => {
        setOfferLetter((prev) => ({
            ...prev,
            docs:
                prev.docs.length === 1
                    ? prev.docs
                    : prev.docs.filter((doc) => doc.id !== id),
        }));
    };

    const handleAddSource = () => {
        setOfferLetter((prev) => ({
            ...prev,
            src: [...prev.src, { id: Date.now(), name: "" }],
        }));
    };

    const handleSourceChange = (id, value) => {
        setOfferLetter((prev) => ({
            ...prev,
            src: prev.src.map((item) =>
                item.id === id ? { ...item, name: value } : item
            ),
        }));
    };

    const handleRemoveSource = (id) => {
        setOfferLetter((prev) => ({
            ...prev,
            src:
                prev.src.length === 1
                    ? prev.src
                    : prev.src.filter((item) => item.id !== id),
        }));
    };

    const handleAddInfo = () => {
        setOfferLetter((prev) => ({
            ...prev,
            info: [...prev.info, { id: Date.now(), name: "" }],
        }));
    };

    const handleInfoChange = (id, value) => {
        setOfferLetter((prev) => ({
            ...prev,
            info: prev.info.map((item) =>
                item.id === id ? { ...item, name: value } : item
            ),
        }));
    };

    const handleRemoveInfo = (id) => {
        setOfferLetter((prev) => ({
            ...prev,
            info:
                prev.info.length === 1
                    ? prev.info
                    : prev.info.filter((item) => item.id !== id),
        }));
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

    const extractInstitutionGroup = async (index) => {
        const group = importGroupsRef.current[index];
        if (!group) throw new Error("Spreadsheet group was not found");
        const data = await extractInstitutionsFromSpreadsheet(excelFile, group.id, importSessionIdRef.current);
        return { group, institutions: data.institutions || [] };
    };

    const prefetchInstitutionGroup = (index) => {
        if (index >= importGroupsRef.current.length) {
            prefetchedInstitutionRef.current = null;
            return;
        }
        prefetchedInstitutionRef.current = {
            index,
            promise: extractInstitutionGroup(index)
                .then((value) => ({ value }))
                .catch((error) => ({ error })),
        };
    };

    const showInstitutionGroup = async (index) => {
        setImportBusy(true);
        setImportError("");
        activeGroupIndexRef.current = index;
        const pendingGroup = importGroupsRef.current[index];
        setImportLoadingMessage(`Loading institution ${index + 1} of ${importGroupsRef.current.length}${pendingGroup?.label ? `: ${pendingGroup.label}` : ""}...`);
        setImportReview({ open: true, stage: "institutions", institutions: [], programs: [] });
        const prefetched = prefetchedInstitutionRef.current;
        const outcome = prefetched?.index === index
            ? await prefetched.promise
            : { value: await extractInstitutionGroup(index) };
        if (outcome.error) throw outcome.error;
        const { group, institutions: extractedInstitutions } = outcome.value;
        setImportProgress({ current: index + 1, total: importGroupsRef.current.length, label: group.label });
        setImportReview({ open: true, stage: "institutions", institutions: extractedInstitutions, programs: [] });
        setImportLoadingMessage("");
        setImportBusy(false);
        prefetchInstitutionGroup(index + 1);
    };

    // Handler for form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (inputMethod === "excel") {
            if (!excelFile) {
                setImportError("Choose an Excel file first.");
                return;
            }
            try {
                setImportBusy(true);
                setImportError("");
                const data = await discoverSpreadsheetGroups(excelFile);
                if (!data.groups?.length) throw new Error("No institution groups were found in the spreadsheet");
                importSessionIdRef.current = data.sessionId;
                importGroupsRef.current = data.groups;
                importedCountsRef.current = { institutions: 0, programs: 0 };
                prefetchedInstitutionRef.current = null;
                await showInstitutionGroup(0);
            } catch (error) {
                setImportError(error.message || "Could not extract institutions");
                setImportReview((current) => ({ ...current, open: true, stage: "institutions" }));
            } finally {
                setImportBusy(false);
            }
            return;
        }

        if (!institutionName || !institutionType || !selectedCountry) {
            alert('Institution name, country, and type are required');
            return;
        }

        // Helper function to convert array of language requirements to single object (take first non-empty)
        const getFirstLanguageRequirement = (requirements) => {
            if (!Array.isArray(requirements) || requirements.length === 0) {
                return {
                    testType: "",
                    overall: "",
                    minimum: "",
                    hasIndividualScores: false,
                    listening: "",
                    reading: "",
                    writing: "",
                    speaking: "",
                    literacy: "",
                    comprehension: "",
                    conversation: "",
                    production: "",
                };
            }

            // Find first requirement with testType filled or return first one
            const validReq = requirements.find(r => r.testType) || requirements[0];

            // Remove id and testName fields as they're not in backend schema
            const { id, testName, ...rest } = validReq;
            return rest;
        };

        // Prepare preview data
        const payload = {
            name: institutionName,
            country: selectedCountry._id,
            countryName: selectedCountry.name,
            currency: selectedCountry.currency,
            type: institutionType,
            website,
            email: institutionEmail,
            contactNumber: institutionContact,
            description,
            applicationFee: Number(applicationFee) || 0,

            campuses: locations.map((location) => ({
                name: location.name,
                address: location.address,
                city: location.city,
                contactNumber: location.useInstitutionContact
                    ? institutionContact
                    : location.contactNumber,
                email: location.useInstitutionContact
                    ? institutionEmail
                    : location.email,
                mapEmbedUrl: location.mapEmbedUrl,
            })),

            entryRequirements: {
                undergraduate: {
                    gpa: undergraduateGPA,
                    languageRequirement: getFirstLanguageRequirement(undergraduateLanguageRequirement),
                },
                postgraduate: {
                    gpa: postgraduateGPA,
                    languageRequirement: getFirstLanguageRequirement(postgraduateLanguageRequirement),
                },
            },

            // Store all language requirements for preview display
            undergraduateLanguageRequirementFull: undergraduateLanguageRequirement,
            postgraduateLanguageRequirementFull: postgraduateLanguageRequirement,

            scholarships: scholarships.map((scholarship) => ({
                name: scholarship.name,
                value: scholarship.value,
                description: scholarship.description,
                eligibility: scholarship.eligibility,
                url: scholarship.url,
            })),

            documents: {
                incomeSources: incomeSources.map((source) => source.name),
                sponsors: sponsors.map((sponsor) => sponsor.name),
                banks: banks.map((bank) => bank.name),
                minSponsorCount,
                minIncomeAmount,
                previousVisaRefusal,
                levelChangeAfterRefusal,
            },

            // Only include manual programs if in manual mode
            programs: programInputMode === 'manual' ? programs.map((program) => ({
                name: program.name,
                level: program.level,
                field: program.field,
                duration: program.duration,
                tuitionFee: program.tuitionFee,
                campuses: program.campuses.map((campusId) => {
                    const campus = locations.find((loc) => loc.id === campusId);
                    return campus ? campus.name : '';
                }),
                useInstitutionRequirements: program.useInstitutionRequirements,
                undergraduateRequirement: {
                    gpa: program.undergraduateRequirement.gpa,
                    languageRequirement: getFirstLanguageRequirement(program.undergraduateRequirement.languageRequirement),
                },
                postgraduateRequirement: {
                    gpa: program.postgraduateRequirement.gpa,
                    languageRequirement: getFirstLanguageRequirement(program.postgraduateRequirement.languageRequirement),
                },
                intakes: program.intakes,
                description: program.description,
            })) : [],
        };

        setPreviewData(payload);
        setShowPreview(true);
    };

    const handleImportReviewContinue = async (approvedItems) => {
        if (importActionLockRef.current) return;
        importActionLockRef.current = true;
        try {
            setImportBusy(true);
            setImportError("");
            if (importReview.stage === "institutions") {
                const group = importGroupsRef.current[activeGroupIndexRef.current];
                approvedInstitutionRef.current = approvedItems;
                setImportLoadingMessage(`Loading programs for ${approvedItems[0]?.name || group.label}...`);
                setImportReview({ open: true, stage: "programs", institutions: approvedItems, programs: [] });
                const data = await extractProgramsFromSpreadsheet(excelFile, approvedItems, group.id, importSessionIdRef.current);
                setImportReview({ open: true, stage: "programs", institutions: approvedItems, programs: data.programs || [] });
                setImportLoadingMessage("");
                return;
            }
            setImportLoadingMessage(`Importing ${approvedInstitutionRef.current?.[0]?.name || "institution"} and its programs...`);
            setImportReview((current) => ({ ...current, programs: [] }));
            const activeGroup = importGroupsRef.current[activeGroupIndexRef.current];
            const result = await commitInstitutionImport(
                approvedInstitutionRef.current,
                approvedItems,
                importSessionIdRef.current,
                activeGroup.id
            );
            importedCountsRef.current.institutions += result.institutionCount;
            importedCountsRef.current.programs += result.programCount;
            const nextIndex = activeGroupIndexRef.current + 1;
            if (nextIndex < importGroupsRef.current.length) {
                await showInstitutionGroup(nextIndex);
            } else {
                const counts = importedCountsRef.current;
                alert(`${counts.institutions} institutions and ${counts.programs} programs imported successfully.`);
                setImportReview({ open: false, stage: "institutions", institutions: [], programs: [] });
                setExcelFile(null);
                prefetchedInstitutionRef.current = null;
                onClose?.();
            }
        } catch (error) {
            setImportError(error.message || "Import failed");
            setImportLoadingMessage("");
        } finally {
            setImportBusy(false);
            importActionLockRef.current = false;
        }
    };

    // Handler for confirming submission
    const handleConfirmSubmit = async () => {
        try {
            // Remove preview-only fields before sending to backend
            const {
                countryName,
                currency,
                undergraduateLanguageRequirementFull,
                postgraduateLanguageRequirementFull,
                ...backendPayload
            } = previewData;

            // Send institution data with logo file
            const data = await addInstitution(backendPayload, profilePicture.file);

            console.log('Institution added successfully:', data);

            // Store institution ID for potential crawling
            if (data.institution && data.institution._id) {
                setInstitutionId(data.institution._id);

                // If in crawl mode and URL is provided, automatically trigger crawl
                if (programInputMode === 'crawl' && crawlUrl) {
                    setTimeout(() => {
                        handleImportPrograms(data.institution._id);
                    }, 500);
                }
            }

            alert('Institution added successfully!' + (programInputMode === 'crawl' && crawlUrl ? ' Starting program import...' : ''));

            // Don't reset form immediately if crawling
            if (programInputMode === 'crawl' && crawlUrl) {
                setShowPreview(false);
                setPreviewData(null);
                return; // Keep form data for status display
            }

            // Reset all form fields (only if not crawling)
            setInstitutionName('');
            setInstitutionType('');
            setWebsite('');
            setInstitutionEmail('');
            setInstitutionContact('');
            setDescription('');
            setApplicationFee('');
            setSelectedCountry(null);
            setProfilePicture({ file: null, preview: null });

            // Reset entry requirements
            setUndergraduateGPA({ type: "", score: "" });
            setPostgraduateGPA({ type: "", score: "" });
            setUndergraduateLanguageRequirement([
                {
                    id: Date.now(),
                    testType: "",
                    testName: "",
                    overall: "",
                    minimum: "",
                    hasIndividualScores: false,
                    listening: "",
                    reading: "",
                    writing: "",
                    speaking: "",
                    literacy: "",
                    comprehension: "",
                    conversation: "",
                    production: "",
                }
            ]);
            setPostgraduateLanguageRequirement([
                {
                    id: Date.now() + 1,
                    testType: "",
                    testName: "",
                    overall: "",
                    minimum: "",
                    hasIndividualScores: false,
                    listening: "",
                    reading: "",
                    writing: "",
                    speaking: "",
                    literacy: "",
                    comprehension: "",
                    conversation: "",
                    production: "",
                }
            ]);

            // Reset arrays
            setLocations([]);
            setPrograms([]);
            setScholarships([]);
            setIncomeSources([]);
            setSponsors([]);
            setBanks([]);
            setMinSponsorCount('');
            setMinIncomeAmount('');
            setPreviousVisaRefusal('');
            setLevelChangeAfterRefusal(false);

            // Reset crawl states
            setProgramInputMode('manual');
            setCrawlUrl('');
            setCrawlStatus(null);
            setCrawlMessage('');

            // Close preview
            setShowPreview(false);
            setPreviewData(null);

        } catch (error) {
            console.error('Error adding institution:', error);
            alert(error.message || 'Failed to add institution');
        }
    };

    // Handler for importing programs via crawl
    const handleImportPrograms = async (instId = null) => {
        const useInstId = instId || institutionId;

        if (!crawlUrl) {
            alert('Please enter a website URL');
            return;
        }

        // Ensure URL has protocol
        let validUrl = crawlUrl.trim();
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = 'https://' + validUrl;
        }

        // If institution hasn't been created yet, need to create it first
        if (!useInstId) {
            alert('Please save the institution first before importing programs');
            return;
        }

        try {
            setCrawlStatus('checking');
            setCrawlMessage('Checking if programs already exist...');

            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_BACKEND_URL;

            // Start crawling
            setCrawlStatus('crawling');
            setCrawlMessage('Crawling website... This may take several minutes. You can continue working.');

            const crawlResponse = await fetch(
                `${apiUrl}/institution/${useInstId}/crawl`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ websiteUrl: validUrl, availableOnly: false }),
                }
            );

            const crawlData = await crawlResponse.json();

            if (crawlResponse.ok) {
                if (crawlData.shouldCrawl === false && crawlData.crawlStatus === 'completed') {
                    setCrawlStatus('completed');
                    setCrawlMessage(`Programs already exist (${crawlData.programCount} programs). Skipped crawling.`);
                } else {
                    setCrawlStatus('crawling');
                    setCrawlMessage('Completing missing program data. Existing structured files will be reused; programs will be ready for review when finished.');

                    // Poll for status every 10 seconds
                    const pollInterval = setInterval(async () => {
                        try {
                            const pollResponse = await fetch(
                                `${apiUrl}/institution/${useInstId}/crawl-status`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                }
                            );
                            const pollData = await pollResponse.json();

                            if (pollData.status === 'completed') {
                                clearInterval(pollInterval);
                                setCrawlStatus('completed');
                                setCrawlMessage(`✓ Crawl completed! ${pollData.programCount} programs imported successfully.`);
                            } else if (pollData.status === 'pending_review') {
                                clearInterval(pollInterval);
                                setCrawlStatus('pending_review');
                                setCrawlMessage(`✓ Crawl completed! Fetching ${pollData.programCount} programs for review...`);

                                // Fetch the pending programs
                                const programsResponse = await fetch(
                                    `${apiUrl}/institution/${useInstId}/programs/pending`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                        },
                                    }
                                );

                                if (programsResponse.ok) {
                                    const programsData = await programsResponse.json();
                                    setReviewPrograms(programsData.programs || []);
                                    setShowReviewModal(true);
                                    setCrawlMessage(`✓ Ready for review: ${programsData.programs?.length || 0} programs`);
                                } else {
                                    setCrawlStatus('failed');
                                    setCrawlMessage('Failed to fetch programs for review');
                                }
                            } else if (pollData.status === 'failed') {
                                clearInterval(pollInterval);
                                setCrawlStatus('failed');
                                setCrawlMessage('Crawl failed. Please try again or add programs manually.');
                            } else {
                                setCrawlMessage(`Crawling in progress... (Status: ${pollData.status})`);
                            }
                        } catch (error) {
                            console.error('Error polling status:', error);
                        }
                    }, 10000);

                    // Stop polling after 30 minutes
                    setTimeout(() => clearInterval(pollInterval), 1800000);
                }
            } else {
                throw new Error(crawlData.error || 'Failed to start crawl');
            }

        } catch (error) {
            console.error('Error importing programs:', error);
            setCrawlStatus('failed');
            setCrawlMessage(error.message || 'Failed to import programs. Please try again or add manually.');
        }
    };

    // Handler for editing from preview
    const handleEditFromPreview = (section) => {
        setShowPreview(false);
        // Optionally scroll to the section
        // You can add scroll logic here if needed
    };

    // Handler for approving programs from modal
    const handleApprovePrograms = async (programs) => {
        if (programs.length === 0) {
            alert('No programs to approve');
            return;
        }

        try {
            setApprovingPrograms(true);
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

            // Close modal and reset form
            setShowReviewModal(false);
            setReviewPrograms([]);
            setCrawlStatus(null);
            setCrawlMessage('');

            // Reset entire form
            resetForm();

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setApprovingPrograms(false);
        }
    };

    // Handler for rejecting programs from modal
    const handleRejectPrograms = () => {
        if (!confirm('Are you sure you want to reject all programs? This cannot be undone.')) {
            return;
        }

        setShowReviewModal(false);
        setReviewPrograms([]);
        setCrawlStatus(null);
        setCrawlMessage('');
    };

    // Reset form function
    const resetForm = () => {
        setInstitutionName('');
        setInstitutionType('');
        setWebsite('');
        setInstitutionEmail('');
        setInstitutionContact('');
        setDescription('');
        setApplicationFee('');
        setSelectedCountry(null);
        setProfilePicture({ file: null, preview: null });

        setUndergraduateGPA({ type: "", score: "" });
        setPostgraduateGPA({ type: "", score: "" });
        setUndergraduateLanguageRequirement([
            {
                id: Date.now(),
                testType: "",
                testName: "",
                overall: "",
                minimum: "",
                hasIndividualScores: false,
                listening: "",
                reading: "",
                writing: "",
                speaking: "",
                literacy: "",
                comprehension: "",
                conversation: "",
                production: "",
            }
        ]);
        setPostgraduateLanguageRequirement([
            {
                id: Date.now() + 1,
                testType: "",
                testName: "",
                overall: "",
                minimum: "",
                hasIndividualScores: false,
                listening: "",
                reading: "",
                writing: "",
                speaking: "",
                literacy: "",
                comprehension: "",
                conversation: "",
                production: "",
            }
        ]);

        setLocations([]);
        setPrograms([]);
        setScholarships([]);
        setIncomeSources([]);
        setSponsors([]);
        setBanks([]);
        setMinSponsorCount('');
        setMinIncomeAmount('');
        setPreviousVisaRefusal('');
        setLevelChangeAfterRefusal(false);

        setProgramInputMode('manual');
        setCrawlUrl('');
        setInstitutionId(null);
    };


    const scrollableMenuProps = {
        disableAutoFocusItem: true,
        autoFocus: false,
        getContentAnchorEl: null,
        anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
        },
        transformOrigin: {
            vertical: "top",
            horizontal: "left",
        },
        PaperProps: {
            style: {
                maxHeight: 220,
                overflowY: "auto",
            },
            sx: {
                maxHeight: "220px !important",
                overflowY: "auto !important",
                mt: 0.5,
                boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
                "& .MuiMenuItem-root": {
                    py: 0.75,
                    fontSize: "0.875rem",
                },
            },
        },
        MenuListProps: {
            style: {
                maxHeight: 220,
                overflowY: "auto",
                paddingTop: 4,
                paddingBottom: 4,
            },
            sx: {
                maxHeight: "220px !important",
                overflowY: "auto !important",
            },
        },
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

            {/* Form Content - two explicit flex columns. We deliberately avoid CSS
                `columns` (multi-column) here: it puts MUI's Grid (which sizes itself
                via negative margins + flexbox) into a formatting context where
                browsers can miscalculate available width, causing Selects/inputs to
                collapse to their content width. Plain flex columns don't have that
                problem. */}

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                }}
            >
                {/* Tabs */}
                <Tabs
                    value={inputMethod}
                    onChange={(event, newValue) => setInputMethod(newValue)}
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Tab label="Manual" value="manual" />
                    <Tab label="Upload Excel File" value="excel" />
                </Tabs>

                {inputMethod === "manual" ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            gap: 3,
                        }}
                    >

                        {/* Left column */}
                        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>

                            {/* Basic Information */}
                            <Paper sx={{
                                p: 3,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
                                    },
                                },
                            }}>
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
                                                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
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
                                            <FormControl fullWidth sx={{ minWidth: 220 }}>
                                                <InputLabel id="country-label">Country</InputLabel>
                                                <Select
                                                    labelId="country-label"
                                                    value={selectedCountry?._id || ""}
                                                    label="Country"
                                                    fullWidth
                                                    sx={{ width: "100%" }}
                                                    MenuProps={scrollableMenuProps}
                                                    onChange={(e) => {
                                                        const country = countries.find((c) => c._id === e.target.value);
                                                        setSelectedCountry(country || null);
                                                    }}
                                                    renderValue={(value) => {
                                                        const country = countries.find((c) => c._id === value);
                                                        if (!country) return "";
                                                        return (
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Avatar
                                                                    src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                                                    sx={{ width: 20, height: 20 }}
                                                                />
                                                                <Typography variant="body2" noWrap>
                                                                    {country.name}
                                                                </Typography>
                                                            </Box>
                                                        );
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
                                            <FormControl fullWidth sx={{ minWidth: 220 }}>
                                                <InputLabel id="institution-type-label">Institution Type</InputLabel>
                                                <Select
                                                    labelId="institution-type-label"
                                                    value={institutionType}
                                                    onChange={(e) => setInstitutionType(e.target.value)}
                                                    label="Institution Type"
                                                    fullWidth
                                                    MenuProps={scrollableMenuProps}
                                                    sx={{ width: "100%" }}
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
                                        </Box>

                                        {locations.map((location, index) => (
                                            <Box key={location.id} sx={{ mb: 3, pb: 3, borderBottom: index < locations.length - 1 ? '1px solid' : 'none', borderColor: 'divider', position: 'relative' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle2">
                                                        Campus #{index + 1}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveLocation(location.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

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
                                            </Box>
                                        ))}

                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddIcon />}
                                                onClick={handleAddLocation}
                                            >
                                                {locations.length === 0 ? "Add Campus" : "Add Another Campus"}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Paper>

                            {/* Entry Requirements */}
                            <Paper sx={{
                                p: 3,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
                                    },
                                },
                            }}>
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
                                                    <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                                                        <InputLabel>
                                                            Score Type
                                                        </InputLabel>

                                                        <Select
                                                            value={undergraduateGPA.type}
                                                            label="Score Type"
                                                            MenuProps={scrollableMenuProps}
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
                                                    <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                                                        <InputLabel>
                                                            Score Type
                                                        </InputLabel>

                                                        <Select
                                                            value={postgraduateGPA.type}
                                                            label="Score Type"
                                                            MenuProps={scrollableMenuProps}
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
                        </Box>

                        {/* Right column */}
                        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>

                            {/* Programs */}
                            <Paper sx={{
                                p: 3,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
                                    },
                                },
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6">Programs</Typography>
                                </Box>

                                {/* Program Input Mode Toggle */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        How would you like to add programs?
                                    </Typography>
                                    <RadioGroup
                                        row
                                        value={programInputMode}
                                        onChange={(e) => setProgramInputMode(e.target.value)}
                                    >
                                        <FormControlLabel
                                            value="manual"
                                            control={<Radio />}
                                            label="Add Manually"
                                        />
                                        <FormControlLabel
                                            value="crawl"
                                            control={<Radio />}
                                            label="Import from Website (Crawl)"
                                        />
                                    </RadioGroup>
                                </Box>

                                {/* Crawl Mode UI */}
                                {programInputMode === 'crawl' && (
                                    <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Import Programs from Website
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Enter the university website URL to automatically crawl and import all programs.
                                            {!institutionId && ' Save the institution first, then you can import programs.'}
                                        </Typography>

                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} md={8}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Website URL"
                                                    value={crawlUrl}
                                                    onChange={(e) => setCrawlUrl(e.target.value)}
                                                    placeholder="www.university.edu or https://www.university.edu"
                                                    disabled={crawlStatus === 'crawling'}
                                                    helperText="Enter university website URL (https:// will be added automatically)"
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Public />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() => handleImportPrograms()}
                                                    disabled={!crawlUrl || !institutionId || crawlStatus === 'crawling'}
                                                    startIcon={<UploadIcon />}
                                                >
                                                    Import Programs
                                                </Button>
                                            </Grid>
                                        </Grid>

                                        {/* Crawl Status Messages */}
                                        {crawlStatus && (
                                            <Box
                                                sx={{
                                                    mt: 2,
                                                    p: 2,
                                                    borderRadius: 1,
                                                    bgcolor:
                                                        crawlStatus === 'completed' ? 'success.light' :
                                                            crawlStatus === 'failed' ? 'error.light' :
                                                                'info.light',
                                                    color:
                                                        crawlStatus === 'completed' ? 'success.dark' :
                                                            crawlStatus === 'failed' ? 'error.dark' :
                                                                'info.dark',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {crawlMessage}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Manual Mode UI */}
                                {programInputMode === 'manual' && (
                                    <>
                                        {programs.map((program, index) => (
                                            <Box key={program.id} sx={{ mb: 3, pb: 3, borderBottom: index < programs.length - 1 ? '1px solid' : 'none', borderColor: 'divider', position: 'relative' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle2">
                                                        Program #{index + 1}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveProgram(program.id)}
                                                        disabled={programs.length === 1}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>

                                                    <Grid item xs={12}>
                                                        <TextField
                                                            label="Program Name"
                                                            fullWidth
                                                            size="small"
                                                            value={program.name}
                                                            onChange={(e) =>
                                                                handleProgramChange(program.id, "name", e.target.value)
                                                            }
                                                        />
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <FormControl fullWidth size="small" sx={{ minWidth: 100 }}>
                                                            <InputLabel>Level</InputLabel>
                                                            <Select
                                                                value={program.level}
                                                                label="Level"
                                                                onChange={(e) =>
                                                                    handleProgramChange(program.id, "level", e.target.value)
                                                                }
                                                                MenuProps={{
                                                                    PaperProps: {
                                                                        style: {
                                                                            maxHeight: 300,
                                                                        },
                                                                    },
                                                                }}
                                                            >
                                                                <MenuItem value="Certificate">Certificate</MenuItem>
                                                                <MenuItem value="Diploma">Diploma</MenuItem>
                                                                <MenuItem value="Bachelor">Bachelor</MenuItem>
                                                                <MenuItem value="Master">Master</MenuItem>
                                                                <MenuItem value="PhD">PhD</MenuItem>
                                                                <MenuItem value="Other">Other</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <TextField
                                                            label="Field of Study"
                                                            fullWidth
                                                            size="small"
                                                            value={program.field}
                                                            onChange={(e) =>
                                                                handleProgramChange(program.id, "field", e.target.value)
                                                            }
                                                            placeholder="e.g. Computer Science"
                                                        />
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <TextField
                                                            label="Duration"
                                                            fullWidth
                                                            size="small"
                                                            value={program.duration}
                                                            onChange={(e) =>
                                                                handleProgramChange(program.id, "duration", e.target.value)
                                                            }
                                                            placeholder="e.g. 2 years"
                                                        />
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                                                            Tuition Fee
                                                        </Typography>

                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} md={8}>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    placeholder={`Amount (${selectedCountry?.currency || ""})`}
                                                                    value={program.tuitionFee?.value || ""}
                                                                    onChange={(e) =>
                                                                        handleProgramChange(program.id, "tuitionFee.value", e.target.value)
                                                                    }
                                                                />
                                                            </Grid>

                                                            <Grid item xs={12} md={4}>
                                                                <FormControl fullWidth size="small">
                                                                    <InputLabel>Per</InputLabel>
                                                                    <Select
                                                                        value={program.tuitionFee?.per || "year"}
                                                                        label="Per"
                                                                        onChange={(e) =>
                                                                            handleProgramChange(program.id, "tuitionFee.per", e.target.value)
                                                                        }
                                                                        MenuProps={{
                                                                            PaperProps: {
                                                                                style: {
                                                                                    maxHeight: 300,
                                                                                },
                                                                            },
                                                                        }}
                                                                    >
                                                                        <MenuItem value="semester">Semester</MenuItem>
                                                                        <MenuItem value="year">Year</MenuItem>
                                                                        <MenuItem value="total">Total Program</MenuItem>
                                                                    </Select>
                                                                </FormControl>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>

                                                    {/* Campuses */}
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                                                            Campuses
                                                        </Typography>

                                                        <FormControl fullWidth size="small" sx={{ minWidth: 100 }}>
                                                            <InputLabel id={`campus-label-${program.id}`}>
                                                                Select Campuses
                                                            </InputLabel>
                                                            <Select
                                                                labelId={`campus-label-${program.id}`}
                                                                multiple
                                                                value={program.campuses || []}
                                                                onChange={(e) => {
                                                                    handleProgramChange(program.id, 'campuses', e.target.value);
                                                                }}
                                                                label="Select Campuses"
                                                                renderValue={(selected) => {
                                                                    if (!selected || selected.length === 0) return '';
                                                                    const names = selected
                                                                        .map((id) => locations.find((loc) => loc.id === id)?.name)
                                                                        .filter(Boolean);
                                                                    return names.join(', ');
                                                                }}
                                                                MenuProps={{
                                                                    PaperProps: {
                                                                        style: {
                                                                            maxHeight: 300,
                                                                        },
                                                                    },
                                                                }}
                                                            >
                                                                {locations.map((location, idx) => (
                                                                    <MenuItem key={location.id} value={location.id}>
                                                                        <Checkbox checked={(program.campuses || []).includes(location.id)} />
                                                                        <ListItemText
                                                                            primary={location.name || `Campus #${idx + 1}`}
                                                                            secondary={location.city}
                                                                        />
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Entry Requirements
                                                        </Typography>
                                                        <Divider sx={{ my: 1 }} />

                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={program.useInstitutionRequirements}
                                                                    onChange={(e) =>
                                                                        handleProgramChange(
                                                                            program.id,
                                                                            "useInstitutionRequirements",
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                />
                                                            }
                                                            label="Use institution entry requirements"
                                                        />

                                                        {!program.useInstitutionRequirements && (
                                                            <Box sx={{ mt: 2 }}>
                                                                {/* Undergraduate */}
                                                                {["Certificate", "Diploma", "Bachelor"].includes(program.level) && (
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                                                                            Undergraduate Requirements
                                                                        </Typography>

                                                                        <Grid container spacing={2}>
                                                                            {/* Score Type */}
                                                                            <Grid item xs={12}>
                                                                                <FormControl fullWidth size="small">
                                                                                    <InputLabel>Score Type</InputLabel>
                                                                                    <Select
                                                                                        value={program.undergraduateRequirement.gpa.type}
                                                                                        label="Score Type"
                                                                                        onChange={(e) =>
                                                                                            handleProgramChange(
                                                                                                program.id,
                                                                                                "undergraduateRequirement.gpa.type",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        MenuProps={{
                                                                                            PaperProps: {
                                                                                                style: {
                                                                                                    maxHeight: 300,
                                                                                                },
                                                                                            },
                                                                                        }}
                                                                                    >
                                                                                        <MenuItem value="GPA">GPA</MenuItem>
                                                                                        <MenuItem value="Percentage">Percentage</MenuItem>
                                                                                    </Select>
                                                                                </FormControl>
                                                                            </Grid>

                                                                            {/* GPA / Percentage */}
                                                                            <Grid item xs={12}>

                                                                                <TextField
                                                                                    fullWidth
                                                                                    size="small"
                                                                                    value={program.undergraduateRequirement.gpa.score}
                                                                                    onChange={(e) =>
                                                                                        handleProgramChange(
                                                                                            program.id,
                                                                                            "undergraduateRequirement.gpa.score",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    placeholder={
                                                                                        program.undergraduateRequirement.gpa.type === "Percentage"
                                                                                            ? "e.g. 75%"
                                                                                            : "e.g. 3.0/4.0"
                                                                                    }
                                                                                />
                                                                            </Grid>

                                                                            {/* Language Requirement */}
                                                                            <Grid item xs={12}>
                                                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                                                                    Language Requirement
                                                                                </Typography>
                                                                                <LanguageRequirementFields
                                                                                    value={program.undergraduateRequirement.languageRequirement}
                                                                                    onChange={(updated) =>
                                                                                        handleProgramChange(
                                                                                            program.id,
                                                                                            "undergraduateRequirement.languageRequirement",
                                                                                            updated
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Box>
                                                                )}

                                                                {/* Postgraduate */}
                                                                {["Master", "PhD"].includes(program.level) && (
                                                                    <Box sx={{ mt: 3 }}>
                                                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                                                                            Postgraduate Requirements
                                                                        </Typography>

                                                                        <Grid container spacing={2}>
                                                                            {/* Score Type */}
                                                                            <Grid item xs={12}>
                                                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                                                                    Score Type
                                                                                </Typography>
                                                                                <FormControl fullWidth size="small">
                                                                                    <InputLabel>Score Type</InputLabel>
                                                                                    <Select
                                                                                        value={program.postgraduateRequirement.gpa.type}
                                                                                        label="Score Type"
                                                                                        onChange={(e) =>
                                                                                            handleProgramChange(
                                                                                                program.id,
                                                                                                "postgraduateRequirement.gpa.type",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        MenuProps={{
                                                                                            PaperProps: {
                                                                                                style: {
                                                                                                    maxHeight: 300,
                                                                                                },
                                                                                            },
                                                                                        }}
                                                                                    >
                                                                                        <MenuItem value="GPA">GPA</MenuItem>
                                                                                        <MenuItem value="Percentage">Percentage</MenuItem>
                                                                                    </Select>
                                                                                </FormControl>
                                                                            </Grid>

                                                                            {/* GPA / Percentage */}
                                                                            <Grid item xs={12}>
                                                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                                                                    {program.postgraduateRequirement.gpa.type === "Percentage"
                                                                                        ? "Percentage"
                                                                                        : "GPA"}
                                                                                </Typography>
                                                                                <TextField
                                                                                    fullWidth
                                                                                    size="small"
                                                                                    value={program.postgraduateRequirement.gpa.score}
                                                                                    onChange={(e) =>
                                                                                        handleProgramChange(
                                                                                            program.id,
                                                                                            "postgraduateRequirement.gpa.score",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    placeholder={
                                                                                        program.postgraduateRequirement.gpa.type === "Percentage"
                                                                                            ? "e.g. 75%"
                                                                                            : "e.g. 3.0/4.0"
                                                                                    }
                                                                                />
                                                                            </Grid>

                                                                            {/* Language Requirement */}
                                                                            <Grid item xs={12}>
                                                                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                                                                    Language Requirement
                                                                                </Typography>
                                                                                <LanguageRequirementFields
                                                                                    value={program.postgraduateRequirement.languageRequirement}
                                                                                    onChange={(updated) =>
                                                                                        handleProgramChange(
                                                                                            program.id,
                                                                                            "postgraduateRequirement.languageRequirement",
                                                                                            updated
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Grid>

                                                    {/* ===== INTAKES & DESCRIPTION ===== */}
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Intakes & Description
                                                        </Typography>
                                                        <Divider sx={{ my: 1 }} />

                                                        <Box sx={{ mt: 2 }}>
                                                            {/* Intakes */}

                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={program.intakes}
                                                                onChange={(e) =>
                                                                    handleProgramChange(program.id, "intakes", e.target.value)
                                                                }
                                                                placeholder="e.g. February, July, November"
                                                            />

                                                            {/* Program Description */}

                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                sx={{ marginTop: 2 }}
                                                                rows={4}
                                                                value={program.description}
                                                                onChange={(e) =>
                                                                    handleProgramChange(program.id, "description", e.target.value)
                                                                }
                                                                placeholder="Brief description of the program."
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}

                                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddProgram}>
                                                {programs.length === 0 ? "Add Program" : "Add Another Program"}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Paper>

                            {/* Scholarships */}
                            <Paper sx={{
                                p: 3,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
                                    },
                                },
                            }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6">Scholarships</Typography>
                                </Box>

                                {scholarships.map((scholarship, index) => (
                                    <Box key={scholarship.id} sx={{ mb: 3, pb: 3, borderBottom: index < scholarships.length - 1 ? '1px solid' : 'none', borderColor: 'divider', position: 'relative' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle2">
                                                Scholarship #{index + 1}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveScholarship(scholarship.id)}
                                                disabled={scholarships.length === 1}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Scholarship Name"
                                                    fullWidth
                                                    size="small"
                                                    value={scholarship.name}
                                                    onChange={(e) =>
                                                        handleScholarshipChange(
                                                            scholarship.id,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. International Student Scholarship"
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Scholarship Value"
                                                    fullWidth
                                                    size="small"
                                                    value={scholarship.value}
                                                    onChange={(e) =>
                                                        handleScholarshipChange(
                                                            scholarship.id,
                                                            "value",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. 25% tuition waiver or AUD 5,000"
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Description"
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={scholarship.description}
                                                    onChange={(e) =>
                                                        handleScholarshipChange(
                                                            scholarship.id,
                                                            "description",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Brief description of the scholarship and what it covers."
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Eligibility"
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={scholarship.eligibility}
                                                    onChange={(e) =>
                                                        handleScholarshipChange(
                                                            scholarship.id,
                                                            "eligibility",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. International students with a GPA of 3.0/4.0 or above."
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Scholarship URL"
                                                    fullWidth
                                                    size="small"
                                                    type="url"
                                                    value={scholarship.url || ""}
                                                    onChange={(e) =>
                                                        handleScholarshipChange(
                                                            scholarship.id,
                                                            "url",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="https://www.example.edu/scholarships/..."
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddScholarship}>
                                        {scholarships.length === 0 ? "Add Scholarship" : "Add Another Scholarship"}
                                    </Button>
                                </Box>
                            </Paper>

                            {/* Documents */}
                            <Paper sx={{
                                p: 3,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
                                    },
                                },
                            }}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ mb: 2 }}>
                                        Financial Documents </Typography>

                                    {/* Income Sources */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Income Sources</Typography>

                                        <FormControl fullWidth size="small">
                                            <InputLabel id="income-sources-label">Select Income Sources</InputLabel>
                                            <Select
                                                labelId="income-sources-label"
                                                multiple
                                                value={incomeSources.map(s => s.name)}
                                                onChange={(e) => {
                                                    const values = e.target.value;
                                                    setIncomeSources(values.map((name, idx) => ({
                                                        id: incomeSources[idx]?.id || Date.now() + idx,
                                                        name
                                                    })));
                                                }}
                                                label="Select Income Sources"
                                                renderValue={(selected) => selected.join(', ')}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 300,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="Salary from Employment">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Salary from Employment")} />
                                                    <ListItemText primary="Salary from Employment" />
                                                </MenuItem>
                                                <MenuItem value="Business Income">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Business Income")} />
                                                    <ListItemText primary="Business Income" />
                                                </MenuItem>
                                                <MenuItem value="Rental Income">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Rental Income")} />
                                                    <ListItemText primary="Rental Income" />
                                                </MenuItem>
                                                <MenuItem value="Investment Income">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Investment Income")} />
                                                    <ListItemText primary="Investment Income" />
                                                </MenuItem>
                                                <MenuItem value="Retirement Pension">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Retirement Pension")} />
                                                    <ListItemText primary="Retirement Pension" />
                                                </MenuItem>
                                                <MenuItem value="Spousal Support">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Spousal Support")} />
                                                    <ListItemText primary="Spousal Support" />
                                                </MenuItem>
                                                <MenuItem value="Trust Fund Disbursements">
                                                    <Checkbox checked={incomeSources.some(s => s.name === "Trust Fund Disbursements")} />
                                                    <ListItemText primary="Trust Fund Disbursements" />
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Sponsors */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Sponsors</Typography>

                                        <FormControl fullWidth size="small">
                                            <InputLabel id="sponsors-label">Select Sponsors</InputLabel>
                                            <Select
                                                labelId="sponsors-label"
                                                multiple
                                                value={sponsors.map(s => s.name)}
                                                onChange={(e) => {
                                                    const values = e.target.value;
                                                    setSponsors(values.map((name, idx) => ({
                                                        id: sponsors[idx]?.id || Date.now() + idx,
                                                        name
                                                    })));
                                                }}
                                                label="Select Sponsors"
                                                renderValue={(selected) => selected.join(', ')}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 300,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="Parents">
                                                    <Checkbox checked={sponsors.some(s => s.name === "Parents")} />
                                                    <ListItemText primary="Parents" />
                                                </MenuItem>
                                                <MenuItem value="Spouse">
                                                    <Checkbox checked={sponsors.some(s => s.name === "Spouse")} />
                                                    <ListItemText primary="Spouse" />
                                                </MenuItem>
                                                <MenuItem value="Employers">
                                                    <Checkbox checked={sponsors.some(s => s.name === "Employers")} />
                                                    <ListItemText primary="Employers" />
                                                </MenuItem>
                                                <MenuItem value="Educational Institutions">
                                                    <Checkbox checked={sponsors.some(s => s.name === "Educational Institutions")} />
                                                    <ListItemText primary="Educational Institutions" />
                                                </MenuItem>
                                                <MenuItem value="Government Sponsors">
                                                    <Checkbox checked={sponsors.some(s => s.name === "Government Sponsors")} />
                                                    <ListItemText primary="Government Sponsors" />
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Minimum Sponsor Count */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1">Sponsor Count</Typography>
                                        <TextField
                                            label='Minimum Sponsor Count'
                                            fullWidth
                                            size='small'
                                            type='number'
                                            value={minSponsorCount}
                                            onChange={(e) => setMinSponsorCount(e.target.value)}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Box>

                                    {/* Banks */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Banks</Typography>

                                        <FormControl fullWidth size="small">
                                            <InputLabel id="banks-label">Select Banks</InputLabel>
                                            <Select
                                                labelId="banks-label"
                                                multiple
                                                value={banks.map(b => b.name)}
                                                onChange={(e) => {
                                                    const values = e.target.value;
                                                    setBanks(values.map((name, idx) => ({
                                                        id: banks[idx]?.id || Date.now() + idx,
                                                        name
                                                    })));
                                                }}
                                                label="Select Banks"
                                                renderValue={(selected) => selected.join(', ')}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 300,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="Chase Bank">
                                                    <Checkbox checked={banks.some(b => b.name === "Chase Bank")} />
                                                    <ListItemText primary="Chase Bank" />
                                                </MenuItem>
                                                <MenuItem value="Bank of America">
                                                    <Checkbox checked={banks.some(b => b.name === "Bank of America")} />
                                                    <ListItemText primary="Bank of America" />
                                                </MenuItem>
                                                <MenuItem value="Wells Fargo">
                                                    <Checkbox checked={banks.some(b => b.name === "Wells Fargo")} />
                                                    <ListItemText primary="Wells Fargo" />
                                                </MenuItem>
                                                <MenuItem value="Citibank">
                                                    <Checkbox checked={banks.some(b => b.name === "Citibank")} />
                                                    <ListItemText primary="Citibank" />
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Previous Visa Refusal */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1">Previous Visa Refusal</Typography>
                                        <FormControl fullWidth size='small'>
                                            <InputLabel>Previous Visa Refusal</InputLabel>
                                            <Select
                                                value={previousVisaRefusal}
                                                label='Previous Visa Refusal'
                                                MenuProps={scrollableMenuProps}
                                                onChange={(e) => setPreviousVisaRefusal(e.target.value)}
                                            >
                                                <MenuItem value='Yes'>Yes</MenuItem>
                                                <MenuItem value='No'>No</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Level Change After Refusal */}
                                    <Box>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={levelChangeAfterRefusal}
                                                    onChange={(e) =>
                                                        setLevelChangeAfterRefusal(e.target.checked)
                                                    }
                                                />
                                            }
                                            label='There is a change in level of study (e.g., UG to PG) compared to the previous refusal'
                                        />
                                    </Box>


                                </Box>
                            </Paper>

                        </Box>
                    </Box>

                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 250,
                            border: "1px dashed",
                            borderColor: excelFile ? "success.main" : "divider",
                            borderRadius: 2,
                            p: 4,
                        }}
                    >
                        {!excelFile ? (
                            <>
                                <Typography variant="h6">
                                    Upload Excel File
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1, mb: 2 }}
                                >
                                    Upload an Excel file containing your program data.
                                </Typography>

                                <Button
                                    variant="contained"
                                    component="label"
                                >
                                    Choose Excel File

                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) {
                                                setExcelFile(file);
                                            }
                                        }}
                                    />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="h6" color="success.main">
                                    ✓ File Selected
                                </Typography>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        mt: 2,
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                        textAlign: "center",
                                    }}
                                >
                                    {excelFile.name}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {(excelFile.size / 1024).toFixed(2)} KB
                                </Typography>

                                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                    >
                                        Change File

                                        <input
                                            type="file"
                                            hidden
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];

                                                if (file) {
                                                    setExcelFile(file);
                                                }
                                            }}
                                        />
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => setExcelFile(null)}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
                <Button variant="outlined" onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="primary" type="submit" disabled={importBusy}>
                    {importBusy && inputMethod === "excel" ? "Extracting with Groq..." : "Review & Submit"}
                </Button>
            </Box>

            {/* Preview Dialog */}
            <InstitutionPreview
                open={showPreview}
                data={previewData}
                onEdit={handleEditFromPreview}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setShowPreview(false)}
            />

            <SpreadsheetImportReview
                open={importReview.open}
                stage={importReview.stage}
                items={importReview.stage === "institutions" ? importReview.institutions : importReview.programs}
                countries={countries}
                busy={importBusy}
                loadingMessage={importLoadingMessage}
                error={importError}
                progress={importProgress}
                onClose={() => setImportReview((current) => ({ ...current, open: false }))}
                onBack={() => {
                    setImportError("");
                    setImportLoadingMessage("");
                    setImportReview((current) => ({
                        ...current,
                        stage: "institutions",
                        institutions: approvedInstitutionRef.current || current.institutions,
                    }));
                }}
                onContinue={handleImportReviewContinue}
            />

            {/* Review Programs Modal */}
            <ReviewProgramsModal
                open={showReviewModal}
                programs={reviewPrograms}
                onClose={() => setShowReviewModal(false)}
                onApprove={handleApprovePrograms}
                onReject={handleRejectPrograms}
                approving={approvingPrograms}
            />

            {/* Full-screen Crawling Loader */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1000,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                }}
                open={crawlStatus === 'crawling' || crawlStatus === 'checking'}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
                        {crawlStatus === 'checking' ? 'Checking status...' : 'Crawling Programs'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
                        {crawlMessage || 'This may take several minutes. Please do not close this window.'}
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        flexWrap: 'wrap'
                    }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Please wait...
                        </Typography>
                    </Box>
                </Box>
            </Backdrop>
        </Box>
    );
}
