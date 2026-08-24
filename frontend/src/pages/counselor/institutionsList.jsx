import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import { useCountry } from "../../context/CountryContext";
import { getInstitutions } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";

// MUI imports
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Input,
    Select,
    Option,
    Button,
    Divider,
    Chip,
    Avatar,
    Sheet,
} from "@mui/joy";
import { Pagination } from "@mui/material";
import { Search, LocationOn, School, AccessTime, ArrowForward } from "@mui/icons-material";

export default function InstitutionList() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [allLocations, setAllLocations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const navigate = useNavigate();
    const brandColor = "#4f46e5";
    const searchBarRef = useRef(null);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });
    const { selectedCountry } = useCountry();

    const URL = import.meta.env.VITE_BACKEND_URL;

    // ----- Helper functions for the new Program schema -----

    // Extract numeric GPA/percentage from academic requirement object
    const parseGPA = (entryReq) => {
        if (!entryReq || !entryReq.academic) return Infinity;
        const academic = entryReq.academic;
        // If score is a number directly
        if (typeof academic.score === 'number' && academic.score !== null) {
            return academic.score;
        }
        // If score is a string like "3.0" or "85%"
        if (typeof academic.score === 'string') {
            const match = academic.score.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : Infinity;
        }
        return Infinity;
    };

    // Extract the lowest overall language score from language_requirements
    const parseLanguageScore = (entryReq) => {
        if (!entryReq || !entryReq.language_requirements) return Infinity;
        const lang = entryReq.language_requirements;
        // Check common English tests – take the first available overall
        const tests = [
            lang.english?.ielts?.overall,
            lang.english?.toefl?.overall,
            lang.english?.pte?.overall,
            lang.english?.duolingo?.overall,
            // German tests if needed (optional)
            // lang.german?.testdaf?.overall,
            // lang.german?.dsh?.overall,
        ];
        const scores = tests
            .filter(v => v !== undefined && v !== null)
            .map(Number)
            .filter(v => !isNaN(v));
        if (scores.length === 0) return Infinity;
        // Return the minimum (or you could pick the first)
        return Math.min(...scores);
    };

    // Format academic requirement for display
    const formatAcademic = (entryReq) => {
        if (!entryReq || !entryReq.academic) return 'Not specified';
        const academic = entryReq.academic;
        let scoreStr = academic.score !== null && academic.score !== undefined
            ? academic.score
            : '';
        const type = academic.score_type || '';
        if (type && scoreStr) {
            return `${scoreStr} ${type}`;
        }
        return scoreStr || 'Not specified';
    };

    // Format language requirement for display (take first available English test)
    const formatLanguage = (entryReq) => {
        if (!entryReq || !entryReq.language_requirements) return 'Not specified';
        const lang = entryReq.language_requirements;
        // English tests
        const tests = [
            { name: 'IELTS', score: lang.english?.ielts?.overall },
            { name: 'TOEFL', score: lang.english?.toefl?.overall },
            { name: 'PTE', score: lang.english?.pte?.overall },
            { name: 'Duolingo', score: lang.english?.duolingo?.overall },
        ];
        const available = tests.find(t => t.score !== undefined && t.score !== null);
        if (available) {
            return `${available.name} ${available.score}`;
        }
        // Check if any other language fields exist (e.g., German)
        if (lang.german?.cefr) {
            return `German CEFR ${lang.german.cefr}`;
        }
        return 'Not specified';
    };

    // Determine program level based on degree name
    const getProgramLevel = (program) => {
        const name = program.degree_name?.toLowerCase() || '';
        if (name.includes('master') || name.includes('msc') || name.includes('ma ') ||
            name.includes('mba') || name.includes('phd') || name.includes('doctorate')) {
            return 'postgraduate';
        }
        if (name.includes('bachelor') || name.includes('bsc') || name.includes('ba ') ||
            name.includes('bba') || name.includes('diploma') || name.includes('certificate')) {
            return 'undergraduate';
        }
        return 'other';
    };

    // Find the program with the minimum entry requirements for each level
    const getMinimumRequirements = (programs) => {
        if (!programs || programs.length === 0) {
            return { undergraduate: null, postgraduate: null };
        }

        const undergradPrograms = programs.filter(p => getProgramLevel(p) === 'undergraduate');
        const postgradPrograms = programs.filter(p => getProgramLevel(p) === 'postgraduate');

        // Helper to find minimum among an array of programs
        const findMin = (progList) => {
            return progList.reduce((min, program) => {
                if (!program.entry_requirements) return min;
                const currentGPA = parseGPA(program.entry_requirements);
                const currentLang = parseLanguageScore(program.entry_requirements);
                if (!min) return program;

                const minGPA = parseGPA(min.entry_requirements);
                const minLang = parseLanguageScore(min.entry_requirements);

                // Combine scores (treat missing as 100 so they are never the minimum)
                const currentScore = (currentGPA === Infinity ? 100 : currentGPA) +
                    (currentLang === Infinity ? 100 : currentLang);
                const minScore = (minGPA === Infinity ? 100 : minGPA) +
                    (minLang === Infinity ? 100 : minLang);

                return currentScore < minScore ? program : min;
            }, null);
        };

        const undergradMin = findMin(undergradPrograms);
        const postgradMin = findMin(postgradPrograms);

        // Return formatted strings for each level
        return {
            undergraduate: undergradMin ? {
                academic: formatAcademic(undergradMin.entry_requirements),
                language: formatLanguage(undergradMin.entry_requirements),
                // Keep raw if needed, but we won't use it
            } : null,
            postgraduate: postgradMin ? {
                academic: formatAcademic(postgradMin.entry_requirements),
                language: formatLanguage(postgradMin.entry_requirements),
            } : null,
        };
    };

    // ----- Fetch institutions -----

    const fetchInstitution = async (query, location, page) => {
        try {
            setLoading(true);

            const params = {
                search: query,
                location: location === "all" ? undefined : location,
                country: selectedCountry?._id,
                page,
            };

            const jsonResponse = await getInstitutions(params);

            const institutionsWithCounts = await Promise.all(
                jsonResponse.institutions.map(async (inst) => {
                    const programData = await getProgramsByInstitution(inst._id);

                    // Collect unique intakes
                    const intakes = [
                        ...new Set(
                            (programData.programs || [])
                                .flatMap((program) => {
                                    if (Array.isArray(program.intakes)) return program.intakes;
                                    if (typeof program.intakes === 'string') {
                                        return program.intakes
                                            .split(',')
                                            .map((i) => i.trim())
                                            .filter(Boolean);
                                    }
                                    return [];
                                })
                        ),
                    ];

                    const minimumRequirements = getMinimumRequirements(programData.programs);

                    return {
                        ...inst,
                        programCount: programData.count,
                        intakes,
                        minimumRequirements,
                    };
                })
            );

            setInstitutions(institutionsWithCounts);
            setPagination(jsonResponse.pagination);

            const locations = institutionsWithCounts
                .flatMap(inst => inst.campuses?.map(c => c.city) || [])
                .filter((city, index, self) => city && self.indexOf(city) === index)
                .sort();

            setAllLocations(locations);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        fetchInstitution(searchQuery, selectedLocation, currentPage);
    }, [searchQuery, selectedLocation, selectedCountry, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedLocation]);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);

        setTimeout(() => {
            searchBarRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    };

    return (
        <>
            <Box sx={{ width: "100%", margin: "0 auto", p: 3 }}>
                <Box sx={{ mb: 4, textAlign: "center" }}>
                    <Typography level="h1" sx={{ mb: 1, color: brandColor, fontSize: "2rem" }}>
                        Find Your Perfect Institution
                    </Typography>
                    <Typography level="body-lg" color="neutral" fontSize="0.875rem">
                        Browse through our curated list of top educational institutions worldwide
                    </Typography>
                </Box>

                <Sheet
                    ref={searchBarRef}
                    variant="outlined"
                    sx={{
                        mb: 4,
                        p: 2,
                        borderRadius: "lg",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        width: "100%",
                    }}
                >
                    <Input
                        startDecorator={<Search />}
                        placeholder="Search institutions..."
                        sx={{ flex: 1 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select
                        placeholder="Select location"
                        startDecorator={<LocationOn sx={{ color: brandColor }} />}
                        value={selectedLocation}
                        onChange={(_, value) => setSelectedLocation(value)}
                        sx={{
                            minWidth: 200,
                        }}
                    >
                        <Option value="all">All Locations</Option>
                        {allLocations.map((location) => (
                            <Option key={location} value={location}>
                                {location}
                            </Option>
                        ))}
                    </Select>
                </Sheet>

                <Loading loading={loading} />

                {error && !loading && (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography level="h3" sx={{ mb: 1 }}>
                            {Array.isArray(error) ? error[0] : error}
                        </Typography>
                        {Array.isArray(error) && (
                            <Typography level="body-md" color="neutral">
                                {error[1]}
                            </Typography>
                        )}
                    </Box>
                )}

                {!loading && !error && institutions.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography level="h3" sx={{ mb: 1 }}>
                            No Results Found
                        </Typography>
                        <Typography level="body-md" color="neutral">
                            Try adjusting your search or filter criteria
                        </Typography>
                    </Box>
                )}

                {!loading && !error && institutions.length > 0 && (
                    <>
                        <Grid container spacing={3}>
                            {institutions.map((institution) => (
                                <Grid key={institution._id} xs={12} sm={6} md={4} lg={3}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            height: "100%",
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                            "&:hover": {
                                                transform: "translateY(-4px)",
                                                boxShadow: "md",
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            {/* Header */}
                                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                <Avatar
                                                    src={institution.logo?.url || undefined}
                                                    sx={{ width: 56, height: 56 }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography level='title-lg'>{institution.name}</Typography>
                                                    <Chip size='sm' variant='soft' sx={{ mt: 0.5 }}>
                                                        {institution.type}
                                                    </Chip>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ mb: 2 }} />

                                            {/* Location */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <LocationOn sx={{ fontSize: 18 }} />
                                                <Typography level='body-sm'>
                                                    {institution.campuses?.length
                                                        ? institution.campuses
                                                            .map((campus) => campus.city)
                                                            .filter(Boolean)
                                                            .join(', ')
                                                        : 'Location not available'}
                                                </Typography>
                                            </Box>

                                            {/* Stats */}
                                            <Grid container spacing={1} sx={{ mb: 2 }}>
                                                <Grid xs={6}>
                                                    <Sheet
                                                        variant='soft'
                                                        sx={{ p: 1.5, borderRadius: 'md', textAlign: 'center' }}
                                                    >
                                                        <Typography level='title-md'>{institution.programCount}</Typography>
                                                        <Typography level='body-xs'>Programs</Typography>
                                                    </Sheet>
                                                </Grid>
                                                <Grid xs={6}>
                                                    <Sheet
                                                        variant='soft'
                                                        sx={{ p: 1.5, borderRadius: 'md', textAlign: 'center' }}
                                                    >
                                                        <Typography level='title-md'>
                                                            {institution.campuses?.length || 0}
                                                        </Typography>
                                                        <Typography level='body-xs'>Campuses</Typography>
                                                    </Sheet>
                                                </Grid>
                                            </Grid>

                                            {/* Intakes */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography level='body-sm' fontWeight='lg' sx={{ mb: 0.75 }}>
                                                    Available Intakes
                                                </Typography>
                                                {institution.intakes?.length ? (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {institution.intakes.map((intake) => (
                                                            <Chip key={intake} size='sm' variant='soft'>
                                                                {intake}
                                                            </Chip>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography level='body-xs' color='neutral'>
                                                        Intake information not available
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Entry Requirements */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography level='body-sm' fontWeight='lg' sx={{ mb: 0.75 }}>
                                                    Entry Requirements
                                                </Typography>

                                                {/* Undergraduate */}
                                                <Box sx={{ mb: 1 }}>
                                                    <Typography level='body-xs' fontWeight='lg'>Undergraduate</Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Academic:</strong>{' '}
                                                        {institution.entryRequirements?.undergraduate?.gpa?.score
                                                            ? `${institution.entryRequirements.undergraduate.gpa.score} ${institution.entryRequirements.undergraduate.gpa.type || ''}`
                                                            : 'Not specified'}
                                                    </Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Language:</strong>{' '}
                                                        {institution.entryRequirements?.undergraduate?.languageRequirement?.length ? (
                                                            institution.entryRequirements.undergraduate.languageRequirement
                                                                .map(test => `${test.testType || test.testName || 'Test'}${test.overall ? ` ${test.overall}` : ''}`)
                                                                .join(', ')
                                                        ) : 'Not specified'}
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 1 }} />

                                                {/* Postgraduate */}
                                                <Box>
                                                    <Typography level='body-xs' fontWeight='lg'>Postgraduate</Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Academic:</strong>{' '}
                                                        {institution.entryRequirements?.postgraduate?.gpa?.score
                                                            ? `${institution.entryRequirements.postgraduate.gpa.score} ${institution.entryRequirements.postgraduate.gpa.type || ''}`
                                                            : 'Not specified'}
                                                    </Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Language:</strong>{' '}
                                                        {institution.entryRequirements?.postgraduate?.languageRequirement?.length ? (
                                                            institution.entryRequirements.postgraduate.languageRequirement
                                                                .map(test => `${test.testType || test.testName || 'Test'}${test.overall ? ` ${test.overall}` : ''}`)
                                                                .join(', ')
                                                        ) : 'Not specified'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Application Fee */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography level='body-sm' fontWeight='lg' sx={{ mb: 0.5 }}>
                                                    Application Fee
                                                </Typography>
                                                <Typography level='body-sm'>
                                                    {institution.applicationFee?.amount
                                                        ? `${institution.applicationFee.currency || ''} ${institution.applicationFee.amount}`
                                                        : 'Not specified'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ flexGrow: 1 }} />

                                            <Button
                                                fullWidth
                                                color='primary'
                                                endDecorator={<ArrowForward />}
                                                onClick={() => navigate(`/institutions/${institution._id}`)}
                                                sx={{
                                                    mt: 1,
                                                    backgroundColor: brandColor,
                                                    '&:hover': { backgroundColor: '#4338ca' },
                                                }}
                                            >
                                                View Institution
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination */}
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination
                                count={pagination.totalPages}
                                page={pagination.page}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    </>
                )}
            </Box>
        </>
    )
}