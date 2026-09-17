import { useState, useEffect } from "react"
import "./NavBar.css"
import Logo from "../../assets/Logo.png"
import hamBurger from "../../assets/ham.png"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext";
import { useCountry } from "../../context/CountryContext";
import { getCountries } from "../../services/countryService";

import { KeyboardArrowDown, Public } from "@mui/icons-material";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showRegionDropdown, setShowRegionDropdown] = useState(false);
    const [regionSearch, setRegionSearch] = useState("");
    const [countries, setCountries] = useState([]);
    const { isLoggedIn, logout } = useAuth();
    const { selectedCountry, setSelectedCountry } = useCountry();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    useEffect(() => {
        if (!isLoggedIn) return;

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

    }, [isLoggedIn]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 960) {
                setIsMenuOpen(false)
            }
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleLinkClick = () => {
        setIsMenuOpen(false)
    }

    const selectedRegion = selectedCountry;

    const filteredRegions = countries.filter(item =>
        item.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(regionSearch.toLowerCase())
    );

    return (

        <nav className="navbar">
            <NavLink to="/" onClick={handleLinkClick}>
                <div className="logo-container">
                    <img src={Logo} alt="Logo" className="logo" />
                    <span className="website-name">Counsora</span>
                </div>
            </NavLink>

            {isLoggedIn ? (
                <>
                    <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
                        <li>
                            <NavLink end to="/institutions" onClick={handleLinkClick} className={({ isActive }) => isActive ? "activeColor" : ""}>
                                Institutions
                            </NavLink>
                        </li>
                        <li>
                            <NavLink end to="/programs" onClick={handleLinkClick} className={({ isActive }) => isActive ? "activeColor" : ""}>
                                Programs
                            </NavLink>
                        </li>
                        <li>
                            <NavLink end to="/documents" onClick={handleLinkClick} className={({ isActive }) => isActive ? "activeColor" : ""}>
                                Documents
                            </NavLink>
                        </li>
                        <li>
                            <NavLink end to="/cost-estimation" onClick={handleLinkClick} className={({ isActive }) => isActive ? "activeColor" : ""}>
                                Cost Estimation
                            </NavLink>
                        </li>
                        <li>
                            <NavLink end to="/study-guide" onClick={handleLinkClick} className={({ isActive }) => isActive ? "activeColor" : ""}>
                                Study Guide
                            </NavLink>
                        </li>
                        <li className="region-selector">
                            <button
                                className="region-button"
                                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                                type="button"
                                aria-expanded={showRegionDropdown}
                                aria-controls="country-dropdown"
                                aria-label={`Select country: ${selectedRegion?.name || "Worldwide"}`}
                            >
                                {selectedRegion ? (
                                    <>
                                        <img
                                            src={`https://flagcdn.com/${selectedRegion.code.toLowerCase()}.svg`}
                                            alt=""
                                            width={28}
                                            height={20}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Public sx={{ fontSize: 24 }} />
                                    </>
                                )}
                                <span className="region-button-text">
                                    <span className="region-label">Select country</span>
                                    <span className="region-code" title={selectedRegion?.name || "Worldwide"}>
                                        {selectedRegion?.name || "Worldwide"}
                                    </span>
                                </span>
                                <KeyboardArrowDown className="region-chevron" sx={{ fontSize: 22 }} />
                            </button>

                            {showRegionDropdown && (
                                <div className="region-dropdown" id="country-dropdown">
                                    <input
                                        type="text"
                                        placeholder="Search country..."
                                        aria-label="Search countries"
                                        value={regionSearch}
                                        onChange={(e) => setRegionSearch(e.target.value)}
                                        className="region-search"
                                    />

                                    <div className="region-list">
                                        <button
                                            className="region-item"
                                            onClick={() => {
                                                setSelectedCountry(null);
                                                setShowRegionDropdown(false);
                                                setRegionSearch("");
                                            }}
                                        >
                                            <Public sx={{ fontSize: 24 }} />
                                            <span>Worldwide</span>
                                        </button>

                                        {filteredRegions.map((item) => (
                                            <button
                                                key={item.code}
                                                className="region-item"
                                                onClick={() => {
                                                    setSelectedCountry(item);
                                                    setShowRegionDropdown(false);
                                                    setRegionSearch("");
                                                }}
                                            >
                                                <img
                                                    src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                                                    alt={item.name}
                                                    width={22}
                                                    height={16}
                                                />
                                                <span>{item.name}</span>
                                                <strong>{item.code}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </li>

                    </ul>

                    <div className="auth-buttons">
                        <button className="login-button" onClick={logout}>
                            Logout
                        </button>
                    </div>

                    <button className="hamburger" onClick={toggleMenu}>
                        <img src={hamBurger} alt="Menu" className="hamburger-icon" />
                    </button>
                </>
            ) : (
                <div className="auth-buttons">
                    <NavLink to="/login">
                        <button className="login-button">Login</button>
                    </NavLink>
                    <NavLink to="/signup">
                        <button className="signup-button">Signup</button>
                    </NavLink>
                </div>
            )}
        </nav>
    );

}

export default Navbar
