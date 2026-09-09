import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"
import { styled, useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import TextField from "@mui/material/TextField"
import List from "@mui/material/List"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import MenuIcon from "@mui/icons-material/Menu"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import DashboardIcon from "@mui/icons-material/Dashboard"
import BusinessIcon from "@mui/icons-material/Business"
import DescriptionIcon from "@mui/icons-material/Description"
import PeopleIcon from "@mui/icons-material/People"
import HomeIcon from "@mui/icons-material/Home"
import ArticleIcon from "@mui/icons-material/Article"
import SettingsIcon from "@mui/icons-material/Settings"
import LogoutIcon from "@mui/icons-material/Logout"
import useMediaQuery from "@mui/material/useMediaQuery"
import {
    Public,
    KeyboardArrowDown,
} from "@mui/icons-material";
import {
    Menu,
    MenuItem,
    Avatar,
} from "@mui/material";

import { useCountry } from "../../context/CountryContext";
import { getCountries } from "../../services/countryService";
import { useAuth } from "../../context/AuthContext";

const drawerWidth = 260;

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
}))

const StyledDrawer = styled(Drawer)(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
        width: drawerWidth,
        boxSizing: "border-box",
    },
}))

function Sidebar() {
    const theme = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(true);
    const toggle = () => setIsOpen((prev) => !prev);
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"))
    const [countries, setCountries] = useState([]);
    const [countryAnchor, setCountryAnchor] = useState(null);
    const [regionSearch, setRegionSearch] = useState("");

    const { selectedCountry, setSelectedCountry } = useCountry();
    const { logout, user } = useAuth();
    const isSuperAdmin = user?.role === "superAdmin";

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getCountries();
                setCountries(data);
            } catch (err) {
                console.error("Failed to fetch countries", err);
                setCountries([]);
            }
        };

        fetchCountries();
    }, []);

    const handleCountryOpen = (event) => {
        setCountryAnchor(event.currentTarget);
    };

    const handleCountryClose = () => {
        setCountryAnchor(null);
        setRegionSearch("");
    };

    const filteredCountries = countries.filter(
        (item) =>
            item.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
            item.code.toLowerCase().includes(regionSearch.toLowerCase())
    );

    const menuItems = [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
        { text: "Institution Management", icon: <BusinessIcon />, path: "/admin/institutions" },
        { text: "Documents Management", icon: <DescriptionIcon />, path: "/admin/documents" },
        ...(isSuperAdmin ? [{ text: "Users", icon: <PeopleIcon />, path: "/admin/users" }] : []),
    ]

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };


    const drawer = (
        <>
            <DrawerHeader>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
                    Counsora Admin
                </Typography>
                {isMobile && (
                    <IconButton onClick={toggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </DrawerHeader>
            <Divider />

            {/* Country Selector */}
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleCountryOpen}>
                        <ListItemIcon>
                            {selectedCountry ? (
                                <Avatar
                                    src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`}
                                    sx={{ width: 24, height: 24 }}
                                />
                            ) : (
                                <Public />
                            )}
                        </ListItemIcon>

                        <ListItemText
                            primary={selectedCountry ? selectedCountry.name : "Worldwide"}
                            secondary={selectedCountry ? selectedCountry.code : "All countries"}
                        />

                        <KeyboardArrowDown />
                    </ListItemButton>
                </ListItem>
            </List>

            <Menu
                anchorEl={countryAnchor}
                open={Boolean(countryAnchor)}
                onClose={handleCountryClose}
                PaperProps={{
                    sx: {
                        width: 280,
                        maxHeight: 420,
                    },
                }}
            >
                <Box sx={{ p: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search country..."
                        value={regionSearch}
                        onChange={(e) => setRegionSearch(e.target.value)}
                    />
                </Box>

                <Divider />

                <MenuItem
                    onClick={() => {
                        setSelectedCountry(null);
                        handleCountryClose();
                    }}
                >
                    <ListItemIcon>
                        <Public fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Worldwide" />
                </MenuItem>

                {filteredCountries.map((country) => (
                    <MenuItem
                        key={country.code}
                        onClick={() => {
                            setSelectedCountry(country);
                            handleCountryClose();
                        }}
                    >
                        <ListItemIcon>
                            <Avatar
                                src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                sx={{ width: 22, height: 22 }}
                            />
                        </ListItemIcon>

                        <ListItemText
                            primary={country.name}
                            secondary={country.code}
                        />
                    </MenuItem>
                ))}
            </Menu>

            <Divider />

            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
                                "&.Mui-selected": {
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    "&:hover": {
                                        backgroundColor: "primary.dark",
                                    },
                                    "& .MuiListItemIcon-root": {
                                        color: "white",
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: location.pathname === item.path ? "white" : "inherit" }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />

            {/* Logout Button */}
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </>
    )

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    display: { xs: "block", lg: "none" },
                    backgroundColor: "background.paper",
                    color: "text.primary",
                    boxShadow: 1,
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggle} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        Counsora Admin
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
                {isMobile ? (
                    <StyledDrawer
                        variant="temporary"
                        open={isOpen}
                        onClose={toggle}
                        ModalProps={{
                            keepMounted: true,
                        }}
                    >
                        {drawer}
                    </StyledDrawer>
                ) : (
                    <StyledDrawer variant="permanent" open>
                        {drawer}
                    </StyledDrawer>
                )}
            </Box>
        </>
    )
}

export default Sidebar
