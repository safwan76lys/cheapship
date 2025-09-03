import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck,
  ChevronDown,
  Search
} from 'lucide-react';

// Base de données des pays avec indicatifs téléphoniques
const COUNTRIES_DATA = [
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '06 12 34 56 78' },
  { code: 'EG', name: 'Égypte', flag: '🇪🇬', dialCode: '+20', format: '10 1234 5678' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1', format: '(555) 123-4567' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44', format: '07123 456789' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49', format: '0151 12345678' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸', dialCode: '+34', format: '612 34 56 78' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹', dialCode: '+39', format: '312 345 6789' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', dialCode: '+31', format: '06 12345678' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', dialCode: '+32', format: '0470 12 34 56' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', dialCode: '+41', format: '078 123 45 67' },
  { code: 'AT', name: 'Autriche', flag: '🇦🇹', dialCode: '+43', format: '0664 123456' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', format: '91 234 5678' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪', dialCode: '+46', format: '070-123 45 67' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴', dialCode: '+47', format: '401 23 456' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰', dialCode: '+45', format: '20 12 34 56' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱', dialCode: '+48', format: '512 345 678' },
  { code: 'CZ', name: 'République tchèque', flag: '🇨🇿', dialCode: '+420', format: '601 123 456' },
  { code: 'HU', name: 'Hongrie', flag: '🇭🇺', dialCode: '+36', format: '30 123 4567' },
  { code: 'GR', name: 'Grèce', flag: '🇬🇷', dialCode: '+30', format: '694 123 4567' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪', dialCode: '+353', format: '085 123 4567' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(416) 123-4567' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺', dialCode: '+61', format: '0412 345 678' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵', dialCode: '+81', format: '090-1234-5678' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212', format: '0612-345678' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216', format: '20 123 456' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213', format: '0551 23 45 67' },
  { code: 'AE', name: 'Émirats arabes unis', flag: '🇦🇪', dialCode: '+971', format: '050 123 4567' },
  { code: 'SA', name: 'Arabie saoudite', flag: '🇸🇦', dialCode: '+966', format: '050 123 4567' }
];

// Composant sélecteur de pays intégré
const CountrySelector = ({ selectedCountry, onSelect, isOpen, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCountries = COUNTRIES_DATA.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-3 border border-gray-300 rounded-l-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden min-w-[280px]">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelect(country);
                  setSearchTerm('');
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-blue-50 text-left"
              >
                <span className="text-lg mr-3">{country.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{country.name}</div>
                  <div className="text-sm text-gray-500">{country.dialCode}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SMSVerification = ({ 
  user, 
  isOpen, 
  onClose, 
  onVerificationComplete,
  mode = 'profile' // 'profile', 'registration', 'required'
}) => {
  const [step, setStep] = useState('phone'); // 'phone', 'code', 'success', 'error'
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES_DATA.find(c => c.code === 'FR') // France par défaut
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [messageId, setMessageId] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Configuration API selon votre architecture
  const API_BASE_URL = 'http://localhost:4000/api';

  // Initialisation du téléphone depuis les props user
  useEffect(() => {
    if (user?.phone) {
      const phoneStr = user.phone.toString();
      if (phoneStr.startsWith('+')) {
        // Trouver le pays correspondant
        const matchingCountry = COUNTRIES_DATA.find(country => 
          phoneStr.startsWith(country.dialCode)
        );
        
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
          const number = phoneStr.substring(matchingCountry.dialCode.length);
          setPhoneNumber(number);
          setFullPhone(phoneStr);
        }
      }
    }
  }, [user?.phone]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCountryDropdownOpen && !event.target.closest('.country-selector')) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  // Gestion du countdown pour renvoyer le SMS
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Formatage du numéro de téléphone pour l'affichage
  const formatPhoneDisplay = (country, number) => {
    if (!country || !number) return '';
    return `${country.dialCode} ${number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
  };

  // Validation du numéro de téléphone international
  const validatePhone = (country, number) => {
    if (!country || !number) return false;
    const cleanNumber = number.replace(/\D/g, '');
    // Validation générale : entre 8 et 15 chiffres
    return cleanNumber.length >= 8 && cleanNumber.length <= 15;
  };

  // Gérer le changement de pays
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    updateFullPhone(country, phoneNumber);
  };

  // Gérer le changement de numéro
  const handleNumberChange = (e) => {
    const number = e.target.value;
    setPhoneNumber(number);
    updateFullPhone(selectedCountry, number);
  };

  // Mettre à jour le numéro complet
  const updateFullPhone = (country, number) => {
    if (country && number) {
      const cleanNumber = number.replace(/\D/g, '');
      setFullPhone(`${country.dialCode}${cleanNumber}`);
    }
  };

  // Headers avec le token d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Étape 1: Envoyer le SMS de vérification
  const sendSMS = async () => {
    if (!validatePhone(selectedCountry, phoneNumber)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sms/verify/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ phone: fullPhone })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageId(data.messageId);
        setStep('code');
        setCountdown(60); // 60 secondes avant de pouvoir renvoyer
      } else {
        setError(data.error || 'Erreur lors de l\'envoi du SMS');
      }
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      setError('Problème de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérifier le code SMS
  const verifyCode = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sms/verify/check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: fullCode })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        
        // Appeler la fonction callback pour notifier le parent
        if (onVerificationComplete) {
          onVerificationComplete(fullPhone);
        }

        // Fermer automatiquement après 2 secondes
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        setError(data.error || 'Code de vérification incorrect');
      }
    } catch (error) {
      console.error('Erreur vérification code:', error);
      setError('Problème de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la saisie du code à 6 chiffres
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Focus automatique sur le champ suivant
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Vérification automatique quand tous les champs sont remplis
    if (index === 5 && value && newCode.every(digit => digit !== '')) {
      setTimeout(() => verifyCode(), 500);
    }
  };

  // Gestion de la touche backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Renvoyer un nouveau SMS
  const resendSMS = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    sendSMS();
  };

  // Retour à l'étape précédente
  const goBack = () => {
    if (step === 'code') {
      setStep('phone');
      setCode(['', '', '', '', '', '']);
    } else {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  const titles = {
    phone: mode === 'registration' ? 'Vérifiez votre téléphone' : 'Numéro de téléphone',
    code: 'Code de vérification',
    success: 'Téléphone vérifié !',
    error: 'Erreur de vérification'
  };

  const subtitles = {
    phone: 'Pour votre sécurité, nous devons vérifier votre numéro',
    code: `Un code à 6 chiffres a été envoyé au ${formatPhoneDisplay(selectedCountry, phoneNumber)}`,
    success: 'Votre numéro de téléphone est maintenant vérifié',
    error: 'Une erreur s\'est produite'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          {step !== 'success' && (
            <button
              onClick={goBack}
              className="absolute left-4 top-6 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'success' ? (
                <CheckCircle size={32} className="text-green-300" />
              ) : (
                <Phone size={32} />
              )}
            </div>
            <h2 className="text-xl font-bold">{titles[step]}</h2>
            <p className="text-blue-100 text-sm mt-2">{subtitles[step]}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Étape 1: Saisie du numéro */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <div className="flex country-selector">
                  <CountrySelector
                    selectedCountry={selectedCountry}
                    onSelect={handleCountrySelect}
                    isOpen={isCountryDropdownOpen}
                    onToggle={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handleNumberChange}
                    placeholder="612 345 678"
                    className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Saisissez votre numéro sans l'indicatif pays
                </p>
                {fullPhone && (
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    Numéro complet : {fullPhone}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={sendSMS}
                disabled={loading || !validatePhone(selectedCountry, phoneNumber)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Phone size={20} />
                    <span>Envoyer le code SMS</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Étape 2: Saisie du code */}
          {step === 'code' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Saisissez le code reçu par SMS
                </label>
                
                <div className="flex justify-center space-x-3 mb-4">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={1}
                    />
                  ))}
                </div>
                
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                      <Clock size={14} />
                      <span>Nouveau SMS dans {countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={resendSMS}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Renvoyer le code
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={verifyCode}
                disabled={loading || code.some(digit => digit === '')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Vérifier le code</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Étape 3: Succès */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Parfait !
                </h3>
                <p className="text-gray-600 text-sm">
                  Votre numéro {formatPhoneDisplay(selectedCountry, phoneNumber)} est maintenant vérifié.
                  Vous pouvez désormais proposer des voyages et transporter des colis.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <ShieldCheck size={20} />
                  <span className="font-medium">Compte sécurisé</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer informatif */}
        {step !== 'success' && (
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="flex items-start space-x-2 text-xs text-gray-600">
              <ShieldCheck size={14} className="mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Pourquoi vérifier mon téléphone ?</p>
                <ul className="mt-1 space-y-1">
                  <li>• Sécurité renforcée de votre compte</li>
                  <li>• Communication directe en cas d'urgence</li>
                  <li>• Accès aux fonctionnalités de transport</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Badge de vérification (à utiliser dans les profils)
export const PhoneVerificationBadge = ({ isVerified, onClick }) => {
  if (isVerified) {
    return (
      <div className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircle size={14} />
        <span>Téléphone vérifié</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
    >
      <AlertCircle size={14} />
      <span>Vérifier le téléphone</span>
    </button>
  );
};

// Composant Hook pour bloquer les actions si téléphone non vérifié
export const PhoneVerificationGuard = ({ isVerified, children, onVerificationRequired }) => {
  if (!isVerified) {
    return (
      <div className="relative group">
        {children}
        <div
          onClick={onVerificationRequired}
          className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-white rounded-lg p-4 text-center">
            <ShieldCheck size={24} className="text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">Vérification requise</p>
            <p className="text-xs text-gray-600">Vérifiez votre téléphone pour continuer</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default SMSVerification;