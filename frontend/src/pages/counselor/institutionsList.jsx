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
    const { selectedCountry } = useCountry();
    return (
        <CountryInstitutionList
            key={selectedCountry?._id || selectedCountry?.id || "worldwide"}
            selectedCountry={selectedCountry}
        />
    );
}

function CountryInstitutionList({ selectedCountry }) {
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
    const requestVersion = useRef(0);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });

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
        const level = program.level?.toLowerCase();
        if (['master', 'phd', 'doctoral', 'research', 'postgraduate'].includes(level)) return 'postgraduate';
        if (['foundation', 'diploma', 'bachelor', 'undergraduate'].includes(level)) return 'undergraduate';
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

        // Academic and language minima are independent; do not add unrelated scores.
        const findMin = (programs) => {
            const academics = new Map();
            const languages = new Map();
            programs.forEach(({ entry_requirements: requirement }) => {
                const score = parseGPA(requirement);
                if (Number.isFinite(score)) {
                    const academic = requirement.academic;
                    const key = `${academic.score_type || ''}:${academic.scale || ''}`;
                    if (!academics.has(key) || score < parseGPA(academics.get(key))) {
                        academics.set(key, requirement);
                    }
                }
                ['ielts', 'toefl', 'pte', 'duolingo'].forEach(test => {
                    const value = requirement?.language_requirements?.english?.[test]?.overall;
                    if (value === null || value === undefined || String(value).trim() === '') return;
                    const score = Number(value);
                    if (Number.isFinite(score) && (!languages.has(test) || score < languages.get(test))) {
                        languages.set(test, score);
                    }
                });
            });
            const language = [...languages].map(([test, overall]) =>
                formatLanguage({ language_requirements: { english: { [test]: { overall } } } })
            );
            const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const germanLevels = programs.map(program =>
                program.entry_requirements?.language_requirements?.german?.cefr?.trim().toUpperCase()
            ).filter(level => cefrLevels.includes(level));
            if (germanLevels.length) {
                const minimum = germanLevels.reduce((min, level) =>
                    cefrLevels.indexOf(level) < cefrLevels.indexOf(min) ? level : min
                );
                language.push(`German CEFR ${minimum}`);
            }
            return {
                academic: [...academics.values()].map(requirement => {
                    const scale = requirement.academic.scale;
                    return `${formatAcademic(requirement)}${scale ? ` (scale ${scale})` : ''}`;
                }).join(', ') || null,
                language: language.join(', ') || 'Not specified',
            };
        };

        return {
            undergraduate: findMin(undergradPrograms),
            postgraduate: findMin(postgradPrograms),
        };
    };

    const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

    const getUniqueCities = (campuses = []) => [
        ...new Map(
            campuses
                .map((campus) => campus.city?.trim())
                .filter(Boolean)
                .map((city) => [city.toLowerCase(), city])
        ).values(),
    ];

    // ----- Fetch institutions -----

    const fetchInstitution = async (query, location, page, version) => {
        try {
            setLoading(true);

            const params = {
                search: query,
                location: location === "all" ? undefined : location,
                country: selectedCountry?._id || selectedCountry?.id,
                page,
                limit: itemsPerPage,
            };

            const jsonResponse = await getInstitutions(params);
            if (version !== requestVersion.current) return;

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

            if (version !== requestVersion.current) return;
            setInstitutions(institutionsWithCounts);
            setPagination(jsonResponse.pagination);

            setAllLocations(jsonResponse.locations || []);
            setError(null);
        } catch (err) {
            if (version === requestVersion.current) setError(err.message);
        } finally {
            if (version === requestVersion.current) setLoading(false);
        }
    };

    useEffect(() => {
        const version = ++requestVersion.current;
        setLoading(true);
        setError(null);
        const timer = setTimeout(() => {
            fetchInstitution(searchQuery.trim(), selectedLocation, currentPage, version);
        }, searchQuery.trim() ? 300 : 0);
        return () => {
            clearTimeout(timer);
            requestVersion.current += 1;
        };
    }, [searchQuery, selectedLocation, selectedCountry, currentPage]);

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
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    <Select
                        placeholder="Select location"
                        startDecorator={<LocationOn sx={{ color: brandColor }} />}
                        value={selectedLocation}
                        onChange={(_, value) => {
                            setSelectedLocation(value);
                            setCurrentPage(1);
                        }}
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

                <Loading centered loading={loading} />

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
                                        inert={Boolean(institution.isDimmed)}
                                        aria-disabled={Boolean(institution.isDimmed)}
                                        variant="outlined"
                                        sx={{
                                            opacity: institution.isDimmed ? 0.45 : 1,
                                            filter: institution.isDimmed ? "grayscale(1)" : "none",
                                            pointerEvents: institution.isDimmed ? "none" : "auto",
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
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        backgroundColor: '#fff',
                                                        border: `2px solid ${brandColor}`,
                                                        boxSizing: 'border-box',
                                                        '& img': {
                                                            objectFit: 'contain',
                                                        },
                                                    }}
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
                                                    {getUniqueCities(institution.campuses).length
                                                        ? getUniqueCities(institution.campuses).join(', ')
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
                                                        {hasValue(institution.entryRequirements?.undergraduate?.gpa?.score)
                                                            ? `${institution.entryRequirements.undergraduate.gpa.score} ${institution.entryRequirements.undergraduate.gpa.type || ''}`
                                                            : institution.minimumRequirements?.undergraduate?.academic || <strong>A school-leaving certificate equivalent</strong>}
                                                    </Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Language:</strong>{' '}
                                                        {institution.entryRequirements?.undergraduate?.languageRequirement?.some(test => [test.overall, test.minimum, test.listening, test.reading, test.writing, test.speaking].some(hasValue)) ? (
                                                            institution.entryRequirements.undergraduate.languageRequirement
                                                                .map(test => `${test.testType || test.testName || 'Test'}${test.overall ? ` ${test.overall}` : ''}`)
                                                                .join(', ')
                                                        ) : institution.minimumRequirements?.undergraduate?.language || 'Not specified'}
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 1 }} />

                                                {/* Postgraduate */}
                                                <Box>
                                                    <Typography level='body-xs' fontWeight='lg'>Postgraduate</Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Academic:</strong>{' '}
                                                        {hasValue(institution.entryRequirements?.postgraduate?.gpa?.score)
                                                            ? `${institution.entryRequirements.postgraduate.gpa.score} ${institution.entryRequirements.postgraduate.gpa.type || ''}`
                                                            : institution.minimumRequirements?.postgraduate?.academic || <strong>A completed Bachelor’s degree</strong>}
                                                    </Typography>
                                                    <Typography level='body-xs'>
                                                        <strong>Language:</strong>{' '}
                                                        {institution.entryRequirements?.postgraduate?.languageRequirement?.some(test => [test.overall, test.minimum, test.listening, test.reading, test.writing, test.speaking].some(hasValue)) ? (
                                                            institution.entryRequirements.postgraduate.languageRequirement
                                                                .map(test => `${test.testType || test.testName || 'Test'}${test.overall ? ` ${test.overall}` : ''}`)
                                                                .join(', ')
                                                        ) : institution.minimumRequirements?.postgraduate?.language || 'Not specified'}
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
