import { styled } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";

const AuthCard = styled(MuiCard)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "550px",
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: "auto",
    borderRadius: theme.spacing(1),
}));

export default AuthCard;