import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const PrimaryButton = styled(Button)(() => ({
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontWeight: "bold",
    textTransform: "none",

    "&:hover": {
        backgroundColor: "#3a39c1",
    },
}));

export default PrimaryButton;