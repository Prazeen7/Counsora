import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Avatar,
    Tabs,
    Tab,
} from "@mui/material";
import Loading from "../../components/Loading";
import InstitutionTabsContent from "../../components/counselor/InstitutionTabsContent";
import { getInstitutionById } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";

export default function InstitutionPage() {
    const { institutionId } = useParams();
    const navigate = useNavigate();

    const [institution, setInstitution] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("all");
    const [selectedField, setSelectedField] = useState("all");
    const [selectedIntake, setSelectedIntake] = useState("all");
    const [selectedTuition, setSelectedTuition] = useState("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const institutionData = await getInstitutionById(institutionId);
                setInstitution(institutionData);


                const programData = await getProgramsByInstitution(institutionId);
                setPrograms(programData.programs || []);
            } catch (err) {
                console.error(err);
            }
        };

        window.scrollTo({ top: 0, behavior: "smooth" });
        fetchData();

    }, [institutionId]);

    if (!institution) {
        return <Loading loading={true} />;
    }

    // Helper function to extract level from degree_name (e.g., "Master of Science" -> "Master")
    const extractLevel = (degreeName) => {
        if (!degreeName) return 'Other';
        const lower = degreeName.toLowerCase();
        if (lower.includes('master') || lower.includes('msc') || lower.includes('ma ') || lower.includes('mba')) return 'Master';
        if (lower.includes('bachelor') || lower.includes('bsc') || lower.includes('ba ') || lower.includes('bba')) return 'Bachelor';
        if (lower.includes('phd') || lower.includes('doctorate')) return 'PhD';
        if (lower.includes('diploma') || lower.includes('certificate')) return 'Diploma';
        return 'Other';
    };

    // Helper function to extract field from degree_name (e.g., "Master of Science in Computer Science" -> "Computer Science")
    const extractField = (degreeName) => {
        if (!degreeName) return 'General';
        const lower = degreeName.toLowerCase();
        
        // Common patterns
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

    // Helper function to parse tuition fee from string array (e.g., ["€13,825 per year"] -> 13825)
    const parseTuitionFee = (tuitionFees) => {
        if (!tuitionFees || !Array.isArray(tuitionFees) || tuitionFees.length === 0) return 0;
        
        const firstFee = tuitionFees[0];
        if (typeof firstFee !== 'string') return 0;
        
        // Extract numbers from string like "€13,825 per year" or "$20,000"
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

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
            <Container sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Avatar
                        src={institution.logo?.url}
                        alt={institution.name}
                        sx={{
                            width: 100,
                            height: 100,
                            border: '2px solid #4f46e5',
                            boxShadow: 3,
                            '& img': { objectFit: 'contain' },
                        }}
                    />

                    <Box>
                        <Typography variant='h4' fontWeight='bold'>
                            {institution.name}
                        </Typography>

                        <Typography color='text.secondary'>
                            {institution.country?.name} • {institution.type}
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                            {institution.campuses?.length || 0} campus
                            {institution.campuses?.length === 1 ? '' : 'es'}
                        </Typography>

                        {institution.applicationFee?.amount > 0 && (
                            <Typography variant='body2' sx={{ mt: 0.5 }}>
                                Application Fee: {institution.applicationFee.currency}{' '}
                                {institution.applicationFee.amount}
                            </Typography>
                        )}
                    </Box>
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
                />
            </Container>
        </Box>

    );
}
