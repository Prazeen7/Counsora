import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Toolbar,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    TablePagination,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";

import PageHeader from "../../components/admin/PageHeader";
import AddInstitution from "../../components/admin/AddInstitutions";
import AdminInstitutionsPage from "./InstitutionPage";

import { useCountry } from "../../context/CountryContext";
import { getInstitutions } from "../../services/institutionService";
import { getProgramsByInstitution } from "../../services/programService";

function AdminInstitutions() {
    const { selectedCountry } = useCountry();

    const [institutions, setInstitutions] = useState([]);
    const [totalInstitutions, setTotalInstitutions] = useState(0);

    const [order, setOrder] = useState("asc");
    const [orderBy, setOrderBy] = useState("institutionName");

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [showAddInstitution, setShowAddInstitution] = useState(false);
    const [showInstitutionDetails, setShowInstitutionDetails] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchInstitutions();
    }, [searchTerm, selectedCountry, page, rowsPerPage, order, orderBy]);

    const fetchInstitutions = async () => {
        try {
            const response = await getInstitutions({
                search: searchTerm,
                country: selectedCountry?._id,
                page: page + 1,
                limit: rowsPerPage,
                sortBy: orderBy,
                sortOrder: order,
            });

            const institutionsWithCounts = await Promise.all(
                (response.institutions || []).map(async (inst) => {
                    const programData = await getProgramsByInstitution(inst._id);

                    return {
                        ...inst,
                        programCount: programData.count,
                    };
                })
            );

            setInstitutions(institutionsWithCounts);
            setTotalInstitutions(response.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching institutions:", error);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleAddInstitutionClick = () => {
        setShowAddInstitution(true);
    };

    const handleBackToInstitutions = () => {
        setShowAddInstitution(false);
        setShowInstitutionDetails(false);
        fetchInstitutions();
    };

    const handleRowClick = (institution) => {
        setSelectedInstitution(institution);
        setShowInstitutionDetails(true);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3 }}>
            {showAddInstitution ? (<AddInstitution onClose={handleBackToInstitutions} />
            ) : showInstitutionDetails ? (<AdminInstitutionsPage
                institution={selectedInstitution}
                onClose={handleBackToInstitutions}
            />
            ) : (
                <>
                    <PageHeader
                        title="Institution Management"
                        subtitle="Manage educational institutions in the system"
                        action
                        actionIcon={<Add />}
                        actionText="Add Institution"
                        onActionClick={handleAddInstitutionClick}
                    />

                    <Paper sx={{ width: "100%", mt: 3 }}>
                        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
                            <TextField
                                size="small"
                                placeholder="Search institutions..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(0);
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: { xs: "100%", md: 300 } }}
                            />

                            <Box sx={{ flexGrow: 1 }} />

                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel id="rows-per-page-label">Per Page</InputLabel>
                                <Select
                                    labelId="rows-per-page-label"
                                    value={rowsPerPage}
                                    label="Per Page"
                                    onChange={handleChangeRowsPerPage}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={20}>20</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                    <MenuItem value={100}>100</MenuItem>
                                </Select>
                            </FormControl>
                        </Toolbar>

                        <TableContainer>
                            <Table sx={{ minWidth: 750 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>SN</TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBy === "institutionName"}
                                                direction={orderBy === "institutionName" ? order : "asc"}
                                                onClick={() => handleRequestSort("institutionName")}
                                            >
                                                Institution Name
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>Country</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Programs</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {institutions.map((institution, index) => (
                                        <TableRow
                                            hover
                                            key={institution._id}
                                            onClick={() => handleRowClick(institution)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>

                                            {/* Institution Name */}
                                            <TableCell>{institution.name}</TableCell>

                                            {/* Country */}
                                            <TableCell>
                                                {institution.country?.name || "N/A"}
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell>{institution.type || "N/A"}</TableCell>

                                            {/* Programs */}
                                            <TableCell align="right">
                                                {institution.programCount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50, 100]}
                            component="div"
                            count={totalInstitutions}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </>
            )}
        </Box>

    );
}

export default AdminInstitutions;
