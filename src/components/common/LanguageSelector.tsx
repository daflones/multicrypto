import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useCountry } from '../../hooks/useCountry';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { selectedCountry, supportedCountries, changeCountry } = useCountry();
  const [isOpen, setIsOpen] = useState(false);

  const currentCountry = supportedCountries.find(country => country.code === selectedCountry);

  const handleCountryChange = (countryCode: string) => {
    changeCountry(countryCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
      >
        <Globe size={16} />
        {currentCountry && (
          <>
            <span className="text-lg">{currentCountry.flag}</span>
            {showLabel && (
              <span className="text-sm font-medium hidden sm:block">
                {currentCountry.name.split(' ')[0]}
              </span>
            )}
          </>
        )}
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-white/60 px-3 py-2 border-b border-white/10 mb-2">
                Selecionar País/Idioma
              </div>
              
              {supportedCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange(country.code)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-colors duration-200 ${
                    selectedCountry === country.code 
                      ? 'bg-white/15 text-white' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {country.name}
                    </div>
                    <div className="text-xs text-white/50 truncate">
                      {country.langCode}
                    </div>
                  </div>
                  {selectedCountry === country.code && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
