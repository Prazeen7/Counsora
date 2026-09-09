import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { apiRequest } from "../../services/api";

const roleLabels = { superAdmin: "Superadmin", admin: "Admin", counselor: "Counselor" };

export default function Users() {
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ users: [], total: 0, limit: 25 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        apiRequest(`/users?page=${page}`).then((result) => {
            if (!cancelled) setData(result);
        }).catch((err) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [page, retry]);

    return <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={1}>Users</Typography>
        <Typography color="text.secondary" mb={3}>Registered accounts and their access roles.</Typography>
        {error ? <Alert severity="error" action={<Button onClick={() => setRetry(retry + 1)}>Retry</Button>}>{error}</Alert>
            : loading ? <CircularProgress aria-label="Loading users" />
                : <>
                    <TableContainer component={Paper}>
                        <Table aria-label="Registered users">
                            <TableHead><TableRow>{["Name", "Email", "Role", "Verification", "Account"].map((title) => <TableCell key={title}>{title}</TableCell>)}</TableRow></TableHead>
                            <TableBody>{data.users.map((user) => <TableRow key={user._id}>
                                <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell>
                                <TableCell>{roleLabels[user.role] || "Unknown"}</TableCell>
                                <TableCell><Chip size="small" label={user.isVerified ? "Verified" : "Unverified"} color={user.isVerified ? "success" : "default"} /></TableCell>
                                <TableCell>{user.isActive ? "Active" : "Inactive"}</TableCell>
                            </TableRow>)}
                                {!data.users.length && <TableRow><TableCell colSpan={5}>No users found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                        <Typography>Page {page} of {Math.max(1, Math.ceil(data.total / data.limit))}</Typography>
                        <Button disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next</Button>
                    </Box>
                </>}
    </Box>;
}
