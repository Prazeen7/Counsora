import { createContext, useContext, useState } from 'react';

const CountryContext = createContext();

export const CountryProvider = ({ children }) => {
    const [selectedCountry, setSelectedCountry] = useState(null);

    return (
        <CountryContext.Provider value={{ selectedCountry, setSelectedCountry }}>
            {children}
        </CountryContext.Provider>
    );
};

export const useCountry = () => useContext(CountryContext);
