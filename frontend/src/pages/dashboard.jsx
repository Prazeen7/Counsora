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

                        <Typography level="h1" sx={{ mb: 1 }}>
                            Welcome to Counsora
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

        </Box >

    );
}
