import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Divider,
    Chip,
    Avatar,
    Stack
} from "@mui/joy";
import {
    School,
    Description,
    Calculate,
    Timeline,
    Login,
    PersonAdd,
    Public,
} from "@mui/icons-material";

export default function Dashboard() {
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const brandColor = "#4f46e5";

    if (!isLoggedIn) {
        return (
            <Box
                sx={{
                    minHeight: "80vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                }}
            >
                <Card
                    sx={{
                        maxWidth: 720,
                        width: "100%",
                        p: 4,
                        textAlign: "center",
                        borderRadius: "3xl",
                        boxShadow: "lg",
                    }}
                > <CardContent>
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                bgcolor: "#eef2ff",
                                color: brandColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            <Public sx={{ fontSize: 36 }} /> </Box>


                        <Typography level="h1" sx={{ mb: 1 }}>
                            Welcome to GEA
                        </Typography>

                        <Typography level="body-lg" color="neutral" sx={{ mb: 3 }}>
                            Explore institutions, compare programs, estimate study costs, and track
                            your application journey from one place.
                        </Typography>

                        <Stack gap={2} justify="center" sx={{ flexWrap: "wrap" }}>
                            <Button
                                size="lg"
                                startDecorator={<Login />}
                                sx={{ bgcolor: brandColor, "&:hover": { bgcolor: "#4338ca" } }}
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </Button>

                            <Button
                                size="lg"
                                variant="outlined"
                                startDecorator={<PersonAdd />}
                                onClick={() => navigate("/signup")}
                            >
                                Create account
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        <Grid container spacing={2}>
                            <Grid xs={12} sm={6}>
                                <Card variant="outlined" sx={{ height: "100%" }}>
                                    <CardContent>
                                        <School sx={{ color: brandColor, mb: 1 }} />
                                        <Typography level="title-md" sx={{ mb: 0.5 }}>
                                            Browse institutions
                                        </Typography>
                                        <Typography level="body-sm" color="neutral">
                                            Discover universities and colleges by country, city, and intake.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid xs={12} sm={6}>
                                <Card variant="outlined" sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Calculate sx={{ color: brandColor, mb: 1 }} />
                                        <Typography level="title-md" sx={{ mb: 0.5 }}>
                                            Estimate costs
                                        </Typography>
                                        <Typography level="body-sm" color="neutral">
                                            Calculate tuition, living expenses, and application costs.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        );

    }

    return (
        <Box sx={{ width: "100%", p: 3 }}>
            <Box
                sx={{
                    mb: 4,
                    p: 3,
                    borderRadius: "3xl",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "white",
                }}
            > <Stack align="center" gap={2}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: "white", color: brandColor }}>
                        {user?.name?.charAt(0)?.toUpperCase() || "U"} </Avatar>


                    < Box >
                        <Typography level="h2" sx={{ color: "white" }}>
                            Welcome back{user?.name ? `, ${user.name}` : ""}!
                        </Typography>
                        <Typography level="body-md" sx={{ color: "#e0e7ff" }}>
                            Continue your study abroad journey and keep your applications on track.
                        </Typography>
                    </Box >
                </Stack >
            </Box >

            <Grid container spacing={3}>
                <Grid xs={12} md={8}>
                    <Card sx={{ borderRadius: "3xl" }}>
                        <CardContent>
                            <Typography level="h4" sx={{ mb: 2 }}>
                                Application progress
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box>
                                    <Stack justify="between" align="center" sx={{ mb: 0.5 }}>
                                        <Typography level="body-sm" weight="medium">
                                            Profile completed
                                        </Typography>
                                        <Typography level="body-sm" weight="medium">
                                            75%
                                        </Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, borderRadius: "full", bgcolor: "#e5e7eb" }}>
                                        <Box
                                            sx={{
                                                width: "75%",
                                                height: "100%",
                                                borderRadius: "full",
                                                bgcolor: brandColor,
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box>
                                    <Stack justify="between" align="center" sx={{ mb: 0.5 }}>
                                        <Typography level="body-sm" weight="medium">
                                            Documents uploaded
                                        </Typography>
                                        <Typography level="body-sm" weight="medium">
                                            60%
                                        </Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, borderRadius: "full", bgcolor: "#e5e7eb" }}>
                                        <Box
                                            sx={{
                                                width: "60%",
                                                height: "100%",
                                                borderRadius: "full",
                                                bgcolor: brandColor,
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box>
                                    <Stack justify="between" align="center" sx={{ mb: 0.5 }}>
                                        <Typography level="body-sm" weight="medium">
                                            Applications submitted
                                        </Typography>
                                        <Typography level="body-sm" weight="medium">
                                            25%
                                        </Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, borderRadius: "full", bgcolor: "#e5e7eb" }}>
                                        <Box
                                            sx={{
                                                width: "25%",
                                                height: "100%",
                                                borderRadius: "full",
                                                bgcolor: brandColor,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid xs={12} md={4}>
                    <Card sx={{ borderRadius: "3xl" }}>
                        <CardContent>
                            <Typography level="h4" sx={{ mb: 2 }}>
                                Quick actions
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                <Button
                                    fullWidth
                                    startDecorator={<School />}
                                    sx={{ justifyContent: "flex-start", bgcolor: brandColor, "&:hover": { bgcolor: "#4338ca" } }}
                                    onClick={() => navigate("/institutions")}
                                >
                                    Browse institutions
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startDecorator={<Description />}
                                    sx={{ justifyContent: "flex-start" }}
                                    onClick={() => navigate("/documents")}
                                >
                                    Manage documents
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startDecorator={<Calculate />}
                                    sx={{ justifyContent: "flex-start" }}
                                    onClick={() => navigate("/cost-estimation")}
                                >
                                    Estimate costs
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startDecorator={<Timeline />}
                                    sx={{ justifyContent: "flex-start" }}
                                    onClick={() => navigate("/progress-tracking")}
                                >
                                    Track progress
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid xs={12}>
                    <Card sx={{ borderRadius: "3xl" }}>
                        <CardContent>
                            <Typography level="h4" sx={{ mb: 2 }}>
                                Recent activity
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                <Stack align="center" gap={1.5}>
                                    <Chip color="primary" variant="soft">Today</Chip>
                                    <Typography level="body-sm">
                                        You viewed <b>Maple University</b>.
                                    </Typography>
                                </Stack>

                                <Divider />

                                <Stack align="center" gap={1.5}>
                                    <Chip color="success" variant="soft">Yesterday</Chip>
                                    <Typography level="body-sm">
                                        Your IELTS document was uploaded successfully.
                                    </Typography>
                                </Stack>

                                <Divider />

                                <Stack align="center" gap={1.5}>
                                    <Chip color="warning" variant="soft">Reminder</Chip>
                                    <Typography level="body-sm">
                                        Complete your profile to unlock institution recommendations.
                                    </Typography>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box >

    );
}
