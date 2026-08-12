import { TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const SearchBar = ({ searchQuery, onSearchChange }) => {
    return (
        <TextField
            fullWidth
            placeholder="Search programs..."
            value={searchQuery}
            onChange={onSearchChange}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#4f46e5" }} />
                    </InputAdornment>
                ),
                sx: {
                    borderRadius: "lg",
                    borderColor: "#e0e0e0",
                    "&:hover": {
                        borderColor: "#4f46e5",
                    },
                },
            }}
            sx={{
                fontSize: "1rem",
                fontFamily: "'Inter', sans-serif",
                mb: 0,
            }}
        />
    );
};

export default SearchBar;