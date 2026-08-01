import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const HeaderWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.up("sm")]: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    [theme.breakpoints.down("lg")]: {
        paddingTop: theme.spacing(8),
    },
}));

const TitleSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
        marginBottom: 0,
    },
}));

const ActionSection = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
}));

function PageHeader({ title, subtitle, action, actionIcon, actionText, onActionClick }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <HeaderWrapper>
            <TitleSection>
                <Typography variant="h5" component="h1" fontWeight="bold">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </TitleSection>
            <ActionSection>
                {action && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={actionIcon}
                        sx={{ ml: 1, display: isMobile ? "none" : "flex" }}
                        onClick={onActionClick}
                    >
                        {actionText}
                    </Button>
                )}
            </ActionSection>
        </HeaderWrapper>
    );
}

export default PageHeader;