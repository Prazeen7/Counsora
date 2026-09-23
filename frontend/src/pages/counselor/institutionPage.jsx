import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Button,
    Container,
    Typography,
    Avatar,
    Tabs,
    Tab,
} from "@mui/material";

import Loading from "../../components/Loading";
import InstitutionTabsContent from "../../components/counselor/InstitutionTabsContent";

import { getInstitutionById } from "../../services/institutionService";
import useInstitutionPrograms from "../../hooks/useInstitutionPrograms";

export default function InstitutionPage() {
    const { institutionId } = useParams();

    const [institution, setInstitution] = useState(null);


    const [tabIndex, setTabIndex] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("all");
    const [selectedField, setSelectedField] = useState("all");
    const [selectedIntake, setSelectedIntake] = useState("all");
    const [selectedTuition, setSelectedTuition] = useState("all");

    const programList = useInstitutionPrograms(institutionId, {
        search: searchQuery, level: selectedLevel, field: selectedField,
        intake: selectedIntake, tuition: selectedTuition,
    });
    const { programs, summary } = programList;
    const levels = summary?.levels || [];
    const fields = summary?.fields || [];
    const intakes = summary?.intakes || [];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const institutionData = await getInstitutionById(institutionId);

                setInstitution(institutionData);

            } catch (err) {
                console.error("Error fetching institution:", err);
            }
        };

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        fetchData();
    }, [institutionId]);

    if (!institution) {
        return <Loading loading={true} />;
    }

    if (institution?.isDimmed) {
        return <Box sx={{ p: 4 }}>
            <Typography>This institution is currently unavailable.</Typography>
            <Button href="/institutions">Back to institutions</Button>
        </Box>;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
            }}
        >
            <Container sx={{ py: 4 }}>

                {/* =========================
                    INSTITUTION HEADER
                   ========================= */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <Avatar
                        src={institution.logo?.url}
                        alt={institution.name}
                        sx={{
                            width: 100,
                            height: 100,
                            border: "2px solid #4f46e5",
                            boxShadow: 3,
                            "& img": {
                                objectFit: "contain",
                            },
                        }}
                    />

                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                        >
                            {institution.name}
                        </Typography>

                        <Typography color="text.secondary">
                            {institution.country?.name} •{" "}
                            {institution.type}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {institution.campuses?.length || 0} campus
                            {institution.campuses?.length === 1
                                ? ""
                                : "es"}
                        </Typography>

                        {institution.applicationFee?.amount > 0 && (
                            <Typography
                                variant="body2"
                                sx={{ mt: 0.5 }}
                            >
                                Application Fee:{" "}
                                {institution.applicationFee.currency}{" "}
                                {institution.applicationFee.amount}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* =========================
                    TABS
                   ========================= */}

                <Tabs
                    value={tabIndex}
                    onChange={(e, newIndex) =>
                        setTabIndex(newIndex)
                    }
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,
                        "& .MuiTab-root": {
                            fontWeight: "bold",
                        },
                        "& .Mui-selected": {
                            color: "#4f46e5 !important",
                        },
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
                        <Tab
                            key={index}
                            label={label}
                        />
                    ))}
                </Tabs>

                {/* =========================
                    CONTENT
                   ========================= */}

                <InstitutionTabsContent
                    activeTab={tabIndex}

                    institution={institution}

                    /*
                     * IMPORTANT:
                     *
                     * Pass the Program documents
                     * directly. No transformation.
                     */
                    programs={programs}
                    filteredPrograms={programs} programList={programList} programSummary={summary}

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
                />
            </Container>
        </Box>
    );
}
