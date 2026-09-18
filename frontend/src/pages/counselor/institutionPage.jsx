import { normalizeProgramFields, matchesProgramField } from "../../constants/programFields";
import React, { useState, useEffect, useMemo } from "react";
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
import { getProgramsByInstitution } from "../../services/programService";

export default function InstitutionPage() {
    const { institutionId } = useParams();

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
                const [institutionData, programData] = await Promise.all([
                    getInstitutionById(institutionId),
                    getProgramsByInstitution(institutionId),
                ]);

                setInstitution(institutionData);
                setPrograms(programData?.programs || []);
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

    /*
     * -----------------------------
     * FILTER OPTIONS
     * -----------------------------
     *
     * These now come directly from
     * the Program documents.
     */

    const levels = useMemo(() => {
        return [
            ...new Set(
                programs
                    .map((program) => program.level)
                    .filter(Boolean)
            ),
        ].sort();
    }, [programs]);

    const fields = useMemo(() => {
        return [
            ...new Set(
                programs
                    .flatMap((program) => normalizeProgramFields(program.field))
                    .filter(Boolean)
            ),
        ].sort();
    }, [programs]);

    const intakes = useMemo(() => {
        return [
            ...new Set(
                programs.flatMap((program) => {
                    if (Array.isArray(program.intakes)) {
                        return program.intakes;
                    }

                    if (typeof program.intakes === "string") {
                        return program.intakes
                            .split(",")
                            .map((intake) => intake.trim())
                            .filter(Boolean);
                    }

                    return [];
                })
            ),
        ].sort();
    }, [programs]);

    /*
     * -----------------------------
     * TUITION HELPER
     * -----------------------------
     *
     * New structure:
     *
     * tuition_fees: [
     *   {
     *      credits: "...",
     *      annual_fee_eur: 13825
     *   }
     * ]
     *
     * We use annual_fee_eur directly.
     */

    const getProgramTuition = (program) => {
        if (
            !Array.isArray(program?.tuition_fees) ||
            program.tuition_fees.length === 0
        ) {
            return 0;
        }

        const fees = program.tuition_fees
            .map((fee) => Number(fee?.annual_fee_eur))
            .filter((fee) => Number.isFinite(fee) && fee > 0);

        if (fees.length === 0) {
            return 0;
        }

        return Math.min(...fees);
    };

    /*
     * -----------------------------
     * FILTER PROGRAMS
     * -----------------------------
     *
     * No transformation is performed.
     * Programs are already in the new
     * schema.
     */

    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const programName = (
                program.degree_name ||
                program.name ||
                ""
            ).toLowerCase();

            const matchesSearch =
                !searchQuery ||
                programName.includes(searchQuery.toLowerCase());

            const matchesLevel =
                selectedLevel === "all" ||
                program.level === selectedLevel;

            const matchesField =
                matchesProgramField(program.field, selectedField);

            const programIntakes = Array.isArray(program.intakes)
                ? program.intakes
                : typeof program.intakes === "string"
                    ? program.intakes
                        .split(",")
                        .map((intake) => intake.trim())
                        .filter(Boolean)
                    : [];

            const matchesIntake =
                selectedIntake === "all" ||
                programIntakes.includes(selectedIntake);

            const tuition = getProgramTuition(program);

            const matchesTuition =
                selectedTuition === "all" ||
                (
                    selectedTuition === "under20000" &&
                    tuition > 0 &&
                    tuition < 20000
                ) ||
                (
                    selectedTuition === "20000to30000" &&
                    tuition >= 20000 &&
                    tuition <= 30000
                ) ||
                (
                    selectedTuition === "above30000" &&
                    tuition > 30000
                );

            return (
                matchesSearch &&
                matchesLevel &&
                matchesField &&
                matchesIntake &&
                matchesTuition
            );
        });
    }, [
        programs,
        searchQuery,
        selectedLevel,
        selectedField,
        selectedIntake,
        selectedTuition,
    ]);

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
                />
            </Container>
        </Box>
    );
}
