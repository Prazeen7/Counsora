import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";

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

    const URL = import.meta.env.VITE_BACKEND_URL;

    const fetchInstitution = async (query, location, page) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const param = {
                search: query,
                location: location === "all" ? undefined : location,
                page,
            };

            setLoading(true);
            const response = await fetch(`${URL}/institution/get`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(param)
            });

            const jsonResponse = await response.json();

            if (!response.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", {
                    state: {
                        message: jsonResponse.error,
                    },
                });
                return;
            }

            setLoading(false);
            setInstitutions(jsonResponse.institutions);
            setPagination(jsonResponse.pagination);

            const locations = jsonResponse.institutions
                .flatMap(inst =>
                    inst.campuses ? inst.campuses.map(campus => campus.city) : []
                )
                .filter((city, index, self) => city && self.indexOf(city) === index)
                .sort();

            setAllLocations(locations);
            setError(null);
            setCurrentPage(1);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setInstitutions([]);
                setError([
                    "No institutions found matching your criteria.",
                    "Try adjusting your search or filters to see more results.",
                ]);
            } else {
                setError("Failed to fetch institutions. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    }

    // Initial fetch
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        fetchInstitution(searchQuery, selectedLocation);
    }, [searchQuery, selectedLocation, currentPage]);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        fetchInstitution(searchQuery, selectedLocation, value);

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
                <Box sx={{ mb: 4 }}>
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
                                        <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                                <Avatar
                                                    src={institution.logo.url}
                                                    sx={{ width: 56, height: 56 }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography level="h4">
                                                        {institution.name}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 2 }} />

                                            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <LocationOn sx={{ fontSize: 20 }} />
                                                    <Typography level="body-sm">
                                                        {institution.campuses?.map(loc => loc.city).join(", ") || "Location not available"}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <School sx={{ fontSize: 20 }} />
                                                    <Typography level="body-sm">
                                                        Programs: {institution.programs?.length || 0}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <AccessTime sx={{ fontSize: 20 }} />
                                                    <Typography level="body-sm">
                                                        Intakes: {institution.programs?.[0]?.intakes}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography level="body-md" fontWeight="bold" sx={{ mb: 1 }}>
                                                        Language Requirements
                                                    </Typography>
                                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                        {institution.entryRequirements?.map((req) => (
                                                            <Chip key={req} color="primary" size="sm">
                                                                {req}
                                                            </Chip>
                                                        ))}
                                                    </Box>
                                                </Box>

                                                <Box>
                                                    <Typography level="body-md" fontWeight="bold" sx={{ mb: 1 }}>
                                                        Academic Requirements
                                                    </Typography>
                                                    <Typography level="body-sm" sx={{ mb: 1 }}>
                                                        Undergraduate: {(institution.entryRequirements?.undergraduate?.GPA)}
                                                    </Typography>
                                                    <Typography level="body-sm">
                                                        Postgraduate: {(institution.entryRequirements?.postgraduate?.GPA)}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ mb: 2 }} />
                                            <Button
                                                fullWidth
                                                color="primary"
                                                endDecorator={<ArrowForward />}
                                                onClick={() => institutionsCheck(institution)}
                                                sx={{
                                                    backgroundColor: brandColor,
                                                    "&:hover": {
                                                        backgroundColor: "#4338ca",
                                                    },
                                                }}
                                            >
                                                Learn More
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

