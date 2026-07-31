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
import InstitutionTabsContent from "../../components/InstitutionTabsContent";
import { getInstitutionById } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";

export default function InstitutionPage() {
    const { institutionId } = useParams();
    const navigate = useNavigate();

    const [institution, setInstitution] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredPrograms = programs.filter((program) =>
        program.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
            <Container sx={{ py: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                    <Avatar
                        src={institution.logo?.url}
                        alt={institution.name}
                        sx={{
                            width: 100,
                            height: 100,
                            border: "2px solid #4f46e5",
                            boxShadow: 3,
                            "& img": { objectFit: "contain" },
                        }}
                    />

                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {institution.name}
                        </Typography>
                        <Typography color="text.secondary">
                            {institution.country?.name} • {institution.type}
                        </Typography>
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
                    programs={programs}
                    filteredPrograms={filteredPrograms}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    navigate={navigate}
                />
            </Container>
        </Box>

    );
}
