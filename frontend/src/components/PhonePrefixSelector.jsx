import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Phone, Check, Globe, Loader } from 'lucide-react';

const PhonePrefixSelector = ({ 
  value = { countryCode: 'FR', prefix: '+33' }, 
  onChange, 
  disabled = false,
  error = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prefixes, setPrefixes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredPrefixes, setFilteredPrefixes] = useState([]);
  
  const dropdownRef = useRef(null);
  const API_BASE = 'https://cheapship-back.onrender.com/api'

  // Charger les préfixes au démarrage
  useEffect(() => {
    fetchPrefixes();
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrer les préfixes selon la recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrefixes(prefixes);
    } else {
      const filtered = prefixes.filter(country =>
        !country.separator && (
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.prefix.includes(searchTerm)
        )
      );
      setFilteredPrefixes(filtered);
    }
  }, [searchTerm, prefixes]);

  const fetchPrefixes = async () => {
    try {
      setLoading(true);
      
      // ✅ Récupérer les préfixes populaires en premier
      const popularResponse = await fetch(`${API_BASE}/phone-prefixes/popular`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!popularResponse.ok) {
        throw new Error(`HTTP error! status: ${popularResponse.status}`);
      }
      
      const popularData = await popularResponse.json();
      
      if (popularData.success && popularData.data) {
        // ✅ Récupérer les préfixes européens complets
        const europeanResponse = await fetch(`${API_BASE}/phone-prefixes/european`);
        const europeanData = await europeanResponse.json();
        
        // ✅ Récupérer quelques pays du monde entier
        const worldResponse = await fetch(`${API_BASE}/phone-prefixes`);
        const worldData = await worldResponse.json();
        
        if (europeanData.success && worldData.success) {
          // ✅ CORRECTION : Éviter les doublons en créant un Set des codes populaires
          const popularCodes = new Set(popularData.data.map(p => p.code));
          const europeanCodes = new Set(europeanData.data.map(p => p.code));
          
          // Pays européens non populaires (éviter doublons)
          const otherEuropean = europeanData.data.filter(p => !popularCodes.has(p.code));
          
          // Pays du monde (non européens, éviter doublons)
          const worldCountries = worldData.data.filter(p => 
            !europeanCodes.has(p.code)
          ).slice(0, 50); // Limiter pour éviter une liste trop longue
          
          const organizedPrefixes = [
            ...popularData.data,
            ...(otherEuropean.length > 0 ? [
              { separator: true, label: 'Autres pays européens', id: 'sep-europe' },
              ...otherEuropean
            ] : []),
            ...(worldCountries.length > 0 ? [
              { separator: true, label: 'Autres pays', id: 'sep-world' },
              ...worldCountries
            ] : [])
          ];
          
          setPrefixes(organizedPrefixes);
          setFilteredPrefixes(organizedPrefixes);
        } else {
          // Fallback si les autres endpoints échouent
          setPrefixes(popularData.data);
          setFilteredPrefixes(popularData.data);
        }
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préfixes:', error);
      
      // ✅ Fallback avec préfixes de base (pas de doublons)
      const fallbackPrefixes = [
        { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' },
        { code: 'DE', name: 'Allemagne', prefix: '+49', flag: '🇩🇪' },
        { code: 'IT', name: 'Italie', prefix: '+39', flag: '🇮🇹' },
        { code: 'ES', name: 'Espagne', prefix: '+34', flag: '🇪🇸' },
        { code: 'GB', name: 'Royaume-Uni', prefix: '+44', flag: '🇬🇧' },
        { code: 'NL', name: 'Pays-Bas', prefix: '+31', flag: '🇳🇱' },
        { code: 'BE', name: 'Belgique', prefix: '+32', flag: '🇧🇪' },
        { code: 'CH', name: 'Suisse', prefix: '+41', flag: '🇨🇭' },
        { code: 'PS', name: 'Palestine', prefix: '+970', flag: '🇵🇸' },
        { code: 'IL', name: 'Israël', prefix: '+972', flag: '🇮🇱' },
        { code: 'US', name: 'États-Unis', prefix: '+1', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', prefix: '+1', flag: '🇨🇦' }
      ];
      
      setPrefixes(fallbackPrefixes);
      setFilteredPrefixes(fallbackPrefixes);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (country) => {
    if (country.separator) return; // Ignorer les séparateurs
    
    onChange({
      countryCode: country.code,
      prefix: country.prefix,
      country: country
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  // ✅ Sélection du pays actuel avec fallback amélioré
  const selectedCountry = prefixes.find(p => p.code === value.countryCode && !p.separator) || 
    { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border rounded-lg bg-white transition-all duration-200
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 focus:outline-none focus:ring-2'
          }
        `}
      >
        <div className="flex items-center">
          {loading ? (
            <div className="w-6 h-6 rounded bg-gray-200 animate-pulse mr-3"></div>
          ) : (
            <span className="text-xl mr-3">{selectedCountry.flag}</span>
          )}
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedCountry.prefix}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-32">
              {selectedCountry.name}
            </div>
          </div>
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Message d'erreur */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Champ de recherche */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des préfixes */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-flex items-center">
                  <Loader className="animate-spin h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Chargement des pays...</span>
                </div>
              </div>
            ) : filteredPrefixes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Aucun pays trouvé</p>
                <p className="text-sm">Essayez un autre terme de recherche</p>
              </div>
            ) : (
              filteredPrefixes.map((country, index) => {
                if (country.separator) {
                  return (
                    <div key={country.id || `separator-${index}`} className="border-t border-gray-100 my-1">
                      <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50">
                        {country.label || 'Autres pays'}
                      </div>
                    </div>
                  );
                }

                const isSelected = country.code === value.countryCode;
                
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`
                      w-full flex items-center px-4 py-3 hover:bg-blue-50 
                      transition-colors duration-150 text-left
                      ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                    `}
                  >
                    <span className="text-xl mr-3">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {country.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {country.prefix}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhonePrefixSelector;
