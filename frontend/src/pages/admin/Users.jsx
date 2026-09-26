import Loading from '../../components/Loading';
import { useState } from "react";
import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { apiRequest } from "../../services/api";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { TablePagination } from "@mui/material";
import useAdminList from "../../hooks/useAdminList";
import ListSearch from "../../components/admin/ListSearch";

const roleLabels = { superAdmin: "Superadmin", admin: "Admin", counselor: "Counselor" };

export default function Users() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [search, setSearch] = useState("");
    const [view, setView] = useState("all");
    const [organization, setOrganization] = useState("all");
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const query = new URLSearchParams({ page, limit, search, view });
    if (view === "counselor" && organization !== "all") query.set("organization", organization);
    const { data: result, loading, error: fetchError } = useAdminList("/users", query.toString(), retry);
    const data = result || { users: [], total: 0, organizations: [] };
    const [subscriptionUser, setSubscriptionUser] = useState(null);
    const [duration, setDuration] = useState('1');
    const [unit, setUnit] = useState('days');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState('');
    const saveSubscription = async () => {
        setSaving(true);
        setSubscriptionError('');
        try {
            await apiRequest(`/users/${subscriptionUser._id}/subscription`, {
                method: 'PATCH', body: JSON.stringify({ value: Number(duration), unit, endDate }),
            });
            setSubscriptionUser(null);
            setRetry(value => value + 1);
        } catch (err) { setSubscriptionError(err.message); }
        finally { setSaving(false); }
    };
    const changeView = (_, nextView) => {
        if (nextView === null) return;
        setView(nextView);
        setOrganization("all");
        setPage(1);
    };
    const changeOrganization = (event) => {
        setOrganization(event.target.value);
        setPage(1);
    };
    const updateApproval = async (user, approved) => {
        try {
            await apiRequest(`/users/${user._id}/approval`, {
                method: "PATCH", body: JSON.stringify({ approved }),
            });
            if (view === "verify" && approved && data.users.length === 1 && page > 1) setPage(value => value - 1);
            setRetry((value) => value + 1);
        } catch (err) {
            setError(err.message);
        }
    };

    return <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" mb={1}>Users</Typography>
        <Typography color="text.secondary" mb={2}>Registered accounts and their access roles.</Typography>
        <ListSearch label="Search users" placeholder="Name, email, or organization" onSearch={value => { setSearch(value); setPage(1); setError(""); }} />
        <Tabs value={view} onChange={changeView} variant="scrollable" sx={{ mb: 2 }}>
            <Tab value="all" label="View All Users" />
            <Tab value="verify" label="Verify Users" />
            <Tab value="admin" label="Admin" />
            <Tab value="counselor" label="Counselor" />
        </Tabs>
        {view === "counselor" && <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
            <InputLabel id="organization-filter-label">Organization</InputLabel>
            <Select labelId="organization-filter-label" value={organization} label="Organization" onChange={changeOrganization}>
                <MenuItem value="all">All organizations</MenuItem>
                {organization !== "all" && !data.organizations.includes(organization) && <MenuItem value={organization}>{organization}</MenuItem>}
                {data.organizations.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
        </FormControl>}
        {error || fetchError ? <Alert severity="error" action={<Button onClick={() => { setError(""); setRetry(retry + 1); }}>Retry</Button>}>{error || fetchError}</Alert>
            : loading ? <Loading centered aria-label="Loading users" />
                : <>
                    <TableContainer component={Paper}>
                        <Table aria-label="Registered users">
                            <TableHead><TableRow>{["Name", "Email", "Role", "Email verification", "Approval", "Account", "Subscription", ...(view === "verify" ? ["Actions"] : [])].map((title) => <TableCell key={title}>{title}</TableCell>)}</TableRow></TableHead>
                            <TableBody>{data.users.map((user) => <TableRow key={user._id}>
                                <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell>
                                <TableCell>{roleLabels[user.role] || "Unknown"}</TableCell>
                                <TableCell><Chip size="small" label={user.isVerified ? "Verified" : "Unverified"} color={user.isVerified ? "success" : "warning"} /></TableCell>
                                <TableCell><Chip size="small" label={user.isApproved ? "Approved" : "Pending"} color={user.isApproved ? "success" : "warning"} /></TableCell>
                                <TableCell>{user.isActive ? "Active" : "Inactive"}</TableCell>
                                <TableCell>{user.role === 'superAdmin' ? 'Exempt' : <>
                                    <Typography variant="body2">{!user.subscriptionExpiresAt ? 'Not assigned' : new Date(user.subscriptionExpiresAt) <= new Date() ? 'Expired' : 'Active'}</Typography>
                                    {user.subscriptionDuration?.value && <Typography variant="body2">{user.subscriptionDuration.value} {user.subscriptionDuration.unit}</Typography>}
                                    {user.subscriptionExpiresAt && <Typography variant="caption" display="block">Last access: {new Date(new Date(user.subscriptionExpiresAt).getTime() - 1).toLocaleDateString('en-GB', { timeZone: 'Asia/Kathmandu' })} (Nepal)</Typography>}
                                    <Button size="small" onClick={() => { setSubscriptionUser(user); setDuration('1'); setUnit('days'); setEndDate(''); setSubscriptionError(''); }}>Set subscription</Button>
                                </>}</TableCell>
                                {view === "verify" && <TableCell>
                                    {user.isVerified ? <Box display="flex" gap={1}>
                                        <Button size="small" variant="contained" color="success" disabled={user.isApproved} onClick={() => updateApproval(user, true)}>Approve</Button>
                                        <Button size="small" color="error" disabled={!user.isApproved} onClick={() => updateApproval(user, false)}>Reject</Button>
                                    </Box> : <Typography variant="caption" color="text.secondary">Verify email first</Typography>}
                                </TableCell>}
                            </TableRow>)}
                                {!data.users.length && <TableRow><TableCell colSpan={view === "verify" ? 8 : 7}>No users found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination component="div" count={data.total} page={page - 1} rowsPerPage={limit} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, next) => setPage(next + 1)} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(1); }} />
                </>}
        <Dialog open={Boolean(subscriptionUser)} onClose={() => { if (!saving) setSubscriptionUser(null); }} fullWidth maxWidth="sm">
            <DialogTitle>Subscription for {subscriptionUser?.name}</DialogTitle>
            <DialogContent>
                <Typography mb={2}>Replaces the current subscription, starting today. One day covers today through midnight in Nepal time. Months and years use calendar dates.</Typography>
                {subscriptionError && <Alert severity="error" sx={{ mb: 2 }}>{subscriptionError}</Alert>}
                <FormControl fullWidth sx={{ mt: 1, mb: 2 }}><InputLabel id="subscription-unit">Duration unit</InputLabel>
                    <Select labelId="subscription-unit" label="Duration unit" value={unit} onChange={event => setUnit(event.target.value)}>
                        <MenuItem value="days">Days</MenuItem><MenuItem value="months">Months</MenuItem><MenuItem value="years">Years</MenuItem><MenuItem value="date">Specific last-access date</MenuItem>
                    </Select>
                </FormControl>
                {unit === 'date' ? <TextField fullWidth label="Last-access date (Nepal)" type="date" slotProps={{ inputLabel: { shrink: true } }} value={endDate} onChange={event => setEndDate(event.target.value)} />
                    : <TextField fullWidth label="Number" type="number" slotProps={{ htmlInput: { min: 1, step: 1 } }} value={duration} onChange={event => setDuration(event.target.value)} />}
            </DialogContent>
            <DialogActions><Button disabled={saving} onClick={() => setSubscriptionUser(null)}>Cancel</Button><Button variant="contained" disabled={saving || (unit === 'date' ? !endDate : !Number.isSafeInteger(Number(duration)) || Number(duration) < 1)} onClick={saveSubscription}>{saving ? <><Loading size={20} sx={{ display: 'inline-flex', mr: 1 }} label="Saving…" />Saving…</> : 'Save subscription'}</Button></DialogActions>
        </Dialog>
    </Box>;
}
