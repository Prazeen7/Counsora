import { useState, useEffect, useContext } from "react"
import "./NavBar.css"
import Logo from "../assets/Logo.png"
import hamBurger from "../assets/ham.png"
import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import { useCountry } from "../context/CountryContext";

import { Public } from "@mui/icons-material";

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

    const URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchCountries = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${URL}/country/get`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();

                setCountries(data);

            } catch (err) {
                console.error("Failed to fetch countries", err);
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
                    <span className="website-name">GEA</span>
                </div>
            </NavLink>

            {isLoggedIn ? (
                <>
                    <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
                        <li>
                            <NavLink to="/institutions" onClick={handleLinkClick}>
                                Institutions
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/programs" onClick={handleLinkClick}>
                                Programs
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/documents" onClick={handleLinkClick}>
                                Documents
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/cost-estimation" onClick={handleLinkClick}>
                                Cost Estimation
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/progress-tracking" onClick={handleLinkClick}>
                                Progress Tracking
                            </NavLink>
                        </li>
                        <li className="region-selector">
                            <button
                                className="region-button"
                                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                                type="button"
                            >
                                {selectedRegion ? (
                                    <>
                                        <img
                                            src={`https://flagcdn.com/${selectedRegion.code.toLowerCase()}.svg`}
                                            alt={selectedRegion.name}
                                            width={28}
                                            height={20}
                                        />
                                        <span className="region-code">{selectedRegion.code}</span>
                                    </>
                                ) : (
                                    <>
                                        <Public sx={{ fontSize: 24 }} />
                                        <span className="region-code">Worldwide</span>
                                    </>
                                )}
                            </button>

                            {showRegionDropdown && (
                                <div className="region-dropdown">
                                    <input
                                        type="text"
                                        placeholder="Search country..."
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
