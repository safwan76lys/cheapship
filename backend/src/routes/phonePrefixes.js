// ================================
// ROUTE API PREFIXES TELEPHONIQUES
// Fichier: src/routes/phonePrefixes.js
// ================================

const express = require('express');
const router = express.Router();

// Base de données complète des préfixes téléphoniques (195+ pays)
const phonePrefixes = [
  // Europe (complète)
  { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Allemagne', prefix: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', prefix: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', prefix: '+34', flag: '🇪🇸' },
  { code: 'GB', name: 'Royaume-Uni', prefix: '+44', flag: '🇬🇧' },
  { code: 'NL', name: 'Pays-Bas', prefix: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgique', prefix: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', prefix: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Autriche', prefix: '+43', flag: '🇦🇹' },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
  { code: 'IE', name: 'Irlande', prefix: '+353', flag: '🇮🇪' },
  { code: 'DK', name: 'Danemark', prefix: '+45', flag: '🇩🇰' },
  { code: 'SE', name: 'Suède', prefix: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norvège', prefix: '+47', flag: '🇳🇴' },
  { code: 'FI', name: 'Finlande', prefix: '+358', flag: '🇫🇮' },
  { code: 'IS', name: 'Islande', prefix: '+354', flag: '🇮🇸' },
  { code: 'PL', name: 'Pologne', prefix: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'République tchèque', prefix: '+420', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovaquie', prefix: '+421', flag: '🇸🇰' },
  { code: 'HU', name: 'Hongrie', prefix: '+36', flag: '🇭🇺' },
  { code: 'SI', name: 'Slovénie', prefix: '+386', flag: '🇸🇮' },
  { code: 'HR', name: 'Croatie', prefix: '+385', flag: '🇭🇷' },
  { code: 'BA', name: 'Bosnie-Herzégovine', prefix: '+387', flag: '🇧🇦' },
  { code: 'RS', name: 'Serbie', prefix: '+381', flag: '🇷🇸' },
  { code: 'ME', name: 'Monténégro', prefix: '+382', flag: '🇲🇪' },
  { code: 'MK', name: 'Macédoine du Nord', prefix: '+389', flag: '🇲🇰' },
  { code: 'AL', name: 'Albanie', prefix: '+355', flag: '🇦🇱' },
  { code: 'XK', name: 'Kosovo', prefix: '+383', flag: '🇽🇰' },
  { code: 'GR', name: 'Grèce', prefix: '+30', flag: '🇬🇷' },
  { code: 'BG', name: 'Bulgarie', prefix: '+359', flag: '🇧🇬' },
  { code: 'RO', name: 'Roumanie', prefix: '+40', flag: '🇷🇴' },
  { code: 'MD', name: 'Moldavie', prefix: '+373', flag: '🇲🇩' },
  { code: 'UA', name: 'Ukraine', prefix: '+380', flag: '🇺🇦' },
  { code: 'BY', name: 'Biélorussie', prefix: '+375', flag: '🇧🇾' },
  { code: 'LT', name: 'Lituanie', prefix: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Lettonie', prefix: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonie', prefix: '+372', flag: '🇪🇪' },
  { code: 'RU', name: 'Russie', prefix: '+7', flag: '🇷🇺' },
  { code: 'LU', name: 'Luxembourg', prefix: '+352', flag: '🇱🇺' },
  { code: 'MT', name: 'Malte', prefix: '+356', flag: '🇲🇹' },
  { code: 'CY', name: 'Chypre', prefix: '+357', flag: '🇨🇾' },
  { code: 'AD', name: 'Andorre', prefix: '+376', flag: '🇦🇩' },
  { code: 'MC', name: 'Monaco', prefix: '+377', flag: '🇲🇨' },
  { code: 'SM', name: 'Saint-Marin', prefix: '+378', flag: '🇸🇲' },
  { code: 'VA', name: 'Vatican', prefix: '+379', flag: '🇻🇦' },
  { code: 'LI', name: 'Liechtenstein', prefix: '+423', flag: '🇱🇮' },

  // Amérique du Nord
  { code: 'US', name: 'États-Unis', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', prefix: '+1', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexique', prefix: '+52', flag: '🇲🇽' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'BZ', name: 'Belize', prefix: '+501', flag: '🇧🇿' },
  { code: 'SV', name: 'Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', prefix: '+507', flag: '🇵🇦' },

  // Amérique du Sud (complète)
  { code: 'BR', name: 'Brésil', prefix: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentine', prefix: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chili', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombie', prefix: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Pérou', prefix: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Équateur', prefix: '+593', flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivie', prefix: '+591', flag: '🇧🇴' },
  { code: 'GY', name: 'Guyana', prefix: '+592', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', prefix: '+597', flag: '🇸🇷' },
  { code: 'GF', name: 'Guyane française', prefix: '+594', flag: '🇬🇫' },

  // Caraïbes
  { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaïque', prefix: '+1876', flag: '🇯🇲' },
  { code: 'HT', name: 'Haïti', prefix: '+509', flag: '🇭🇹' },
  { code: 'DO', name: 'République dominicaine', prefix: '+1', flag: '🇩🇴' },
  { code: 'PR', name: 'Porto Rico', prefix: '+1', flag: '🇵🇷' },
  { code: 'TT', name: 'Trinité-et-Tobago', prefix: '+1868', flag: '🇹🇹' },
  { code: 'BB', name: 'Barbade', prefix: '+1246', flag: '🇧🇧' },

  // Asie (complète)
  { code: 'CN', name: 'Chine', prefix: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japon', prefix: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corée du Sud', prefix: '+82', flag: '🇰🇷' },
  { code: 'KP', name: 'Corée du Nord', prefix: '+850', flag: '🇰🇵' },
  { code: 'IN', name: 'Inde', prefix: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', prefix: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', prefix: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', prefix: '+94', flag: '🇱🇰' },
  { code: 'MV', name: 'Maldives', prefix: '+960', flag: '🇲🇻' },
  { code: 'NP', name: 'Népal', prefix: '+977', flag: '🇳🇵' },
  { code: 'BT', name: 'Bhoutan', prefix: '+975', flag: '🇧🇹' },
  { code: 'AF', name: 'Afghanistan', prefix: '+93', flag: '🇦🇫' },
  { code: 'IR', name: 'Iran', prefix: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Irak', prefix: '+964', flag: '🇮🇶' },
  { code: 'SY', name: 'Syrie', prefix: '+963', flag: '🇸🇾' },
  { code: 'LB', name: 'Liban', prefix: '+961', flag: '🇱🇧' },
  { code: 'JO', name: 'Jordanie', prefix: '+962', flag: '🇯🇴' },
  { code: 'PS', name: 'Palestine', prefix: '+970', flag: '🇵🇸' },
  { code: 'IL', name: 'Israël', prefix: '+972', flag: '🇮🇱' },
  { code: 'SA', name: 'Arabie saoudite', prefix: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Émirats arabes unis', prefix: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', prefix: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahreïn', prefix: '+973', flag: '🇧🇭' },
  { code: 'KW', name: 'Koweït', prefix: '+965', flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', prefix: '+968', flag: '🇴🇲' },
  { code: 'YE', name: 'Yémen', prefix: '+967', flag: '🇾🇪' },
  { code: 'TR', name: 'Turquie', prefix: '+90', flag: '🇹🇷' },
  { code: 'GE', name: 'Géorgie', prefix: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Arménie', prefix: '+374', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaïdjan', prefix: '+994', flag: '🇦🇿' },
  { code: 'KZ', name: 'Kazakhstan', prefix: '+7', flag: '🇰🇿' },
  { code: 'KG', name: 'Kirghizistan', prefix: '+996', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tadjikistan', prefix: '+992', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkménistan', prefix: '+993', flag: '🇹🇲' },
  { code: 'UZ', name: 'Ouzbékistan', prefix: '+998', flag: '🇺🇿' },
  { code: 'MN', name: 'Mongolie', prefix: '+976', flag: '🇲🇳' },
  { code: 'TH', name: 'Thaïlande', prefix: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', flag: '🇻🇳' },
  { code: 'LA', name: 'Laos', prefix: '+856', flag: '🇱🇦' },
  { code: 'KH', name: 'Cambodge', prefix: '+855', flag: '🇰🇭' },
  { code: 'MM', name: 'Myanmar', prefix: '+95', flag: '🇲🇲' },
  { code: 'MY', name: 'Malaisie', prefix: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapour', prefix: '+65', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonésie', prefix: '+62', flag: '🇮🇩' },
  { code: 'BN', name: 'Brunei', prefix: '+673', flag: '🇧🇳' },
  { code: 'PH', name: 'Philippines', prefix: '+63', flag: '🇵🇭' },
  { code: 'TW', name: 'Taïwan', prefix: '+886', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', flag: '🇭🇰' },
  { code: 'MO', name: 'Macao', prefix: '+853', flag: '🇲🇴' },

  // Afrique (complète)
  { code: 'EG', name: 'Égypte', prefix: '+20', flag: '🇪🇬' },
  { code: 'LY', name: 'Libye', prefix: '+218', flag: '🇱🇾' },
  { code: 'TN', name: 'Tunisie', prefix: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algérie', prefix: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', prefix: '+212', flag: '🇲🇦' },
  { code: 'EH', name: 'Sahara occidental', prefix: '+212', flag: '🇪🇭' },
  { code: 'MR', name: 'Mauritanie', prefix: '+222', flag: '🇲🇷' },
  { code: 'ML', name: 'Mali', prefix: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', prefix: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', prefix: '+227', flag: '🇳🇪' },
  { code: 'TD', name: 'Tchad', prefix: '+235', flag: '🇹🇩' },
  { code: 'SD', name: 'Soudan', prefix: '+249', flag: '🇸🇩' },
  { code: 'SS', name: 'Soudan du Sud', prefix: '+211', flag: '🇸🇸' },
  { code: 'ET', name: 'Éthiopie', prefix: '+251', flag: '🇪🇹' },
  { code: 'ER', name: 'Érythrée', prefix: '+291', flag: '🇪🇷' },
  { code: 'DJ', name: 'Djibouti', prefix: '+253', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalie', prefix: '+252', flag: '🇸🇴' },
  { code: 'KE', name: 'Kenya', prefix: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Ouganda', prefix: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzanie', prefix: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', prefix: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', prefix: '+257', flag: '🇧🇮' },
  { code: 'MZ', name: 'Mozambique', prefix: '+258', flag: '🇲🇿' },
  { code: 'MW', name: 'Malawi', prefix: '+265', flag: '🇲🇼' },
  { code: 'ZM', name: 'Zambie', prefix: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', prefix: '+263', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', prefix: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibie', prefix: '+264', flag: '🇳🇦' },
  { code: 'ZA', name: 'Afrique du Sud', prefix: '+27', flag: '🇿🇦' },
  { code: 'LS', name: 'Lesotho', prefix: '+266', flag: '🇱🇸' },
  { code: 'SZ', name: 'Eswatini', prefix: '+268', flag: '🇸🇿' },
  { code: 'MG', name: 'Madagascar', prefix: '+261', flag: '🇲🇬' },
  { code: 'MU', name: 'Maurice', prefix: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', prefix: '+248', flag: '🇸🇨' },
  { code: 'KM', name: 'Comores', prefix: '+269', flag: '🇰🇲' },
  { code: 'AO', name: 'Angola', prefix: '+244', flag: '🇦🇴' },
  { code: 'CD', name: 'République démocratique du Congo', prefix: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'République du Congo', prefix: '+242', flag: '🇨🇬' },
  { code: 'CF', name: 'République centrafricaine', prefix: '+236', flag: '🇨🇫' },
  { code: 'CM', name: 'Cameroun', prefix: '+237', flag: '🇨🇲' },
  { code: 'GQ', name: 'Guinée équatoriale', prefix: '+240', flag: '🇬🇶' },
  { code: 'GA', name: 'Gabon', prefix: '+241', flag: '🇬🇦' },
  { code: 'ST', name: 'Sao Tomé-et-Principe', prefix: '+239', flag: '🇸🇹' },
  { code: 'NG', name: 'Nigeria', prefix: '+234', flag: '🇳🇬' },
  { code: 'BJ', name: 'Bénin', prefix: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', prefix: '+228', flag: '🇹🇬' },
  { code: 'GH', name: 'Ghana', prefix: '+233', flag: '🇬🇭' },
  { code: 'CI', name: 'Côte d\'Ivoire', prefix: '+225', flag: '🇨🇮' },
  { code: 'LR', name: 'Liberia', prefix: '+231', flag: '🇱🇷' },
  { code: 'SL', name: 'Sierra Leone', prefix: '+232', flag: '🇸🇱' },
  { code: 'GN', name: 'Guinée', prefix: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinée-Bissau', prefix: '+245', flag: '🇬🇼' },
  { code: 'CV', name: 'Cap-Vert', prefix: '+238', flag: '🇨🇻' },
  { code: 'SN', name: 'Sénégal', prefix: '+221', flag: '🇸🇳' },
  { code: 'GM', name: 'Gambie', prefix: '+220', flag: '🇬🇲' },

  // Océanie (complète)
  { code: 'AU', name: 'Australie', prefix: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nouvelle-Zélande', prefix: '+64', flag: '🇳🇿' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', prefix: '+675', flag: '🇵🇬' },
  { code: 'FJ', name: 'Fidji', prefix: '+679', flag: '🇫🇯' },
  { code: 'SB', name: 'Îles Salomon', prefix: '+677', flag: '🇸🇧' },
  { code: 'VU', name: 'Vanuatu', prefix: '+678', flag: '🇻🇺' },
  { code: 'NC', name: 'Nouvelle-Calédonie', prefix: '+687', flag: '🇳🇨' },
  { code: 'PF', name: 'Polynésie française', prefix: '+689', flag: '🇵🇫' },
  { code: 'WS', name: 'Samoa', prefix: '+685', flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', prefix: '+676', flag: '🇹🇴' },
  { code: 'TV', name: 'Tuvalu', prefix: '+688', flag: '🇹🇻' },
  { code: 'KI', name: 'Kiribati', prefix: '+686', flag: '🇰🇮' },
  { code: 'NR', name: 'Nauru', prefix: '+674', flag: '🇳🇷' },
  { code: 'PW', name: 'Palaos', prefix: '+680', flag: '🇵🇼' },
  { code: 'FM', name: 'États fédérés de Micronésie', prefix: '+691', flag: '🇫🇲' },
  { code: 'MH', name: 'Îles Marshall', prefix: '+692', flag: '🇲🇭' },

  // Territoires et dépendances
  { code: 'GL', name: 'Groenland', prefix: '+299', flag: '🇬🇱' },
  { code: 'FO', name: 'Îles Féroé', prefix: '+298', flag: '🇫🇴' },
  { code: 'SJ', name: 'Svalbard', prefix: '+47', flag: '🇸🇯' },
  { code: 'GI', name: 'Gibraltar', prefix: '+350', flag: '🇬🇮' },
  { code: 'IM', name: 'Île de Man', prefix: '+44', flag: '🇮🇲' },
  { code: 'JE', name: 'Jersey', prefix: '+44', flag: '🇯🇪' },
  { code: 'GG', name: 'Guernesey', prefix: '+44', flag: '🇬🇬' }
];

// ================================
// ENDPOINTS API
// ================================

/**
 * GET /api/phone-prefixes
 * Récupère tous les préfixes téléphoniques
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Liste des préfixes téléphoniques récupérée avec succès',
      data: phonePrefixes,
      total: phonePrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes',
      message: 'Impossible de récupérer la liste des préfixes téléphoniques'
    });
  }
});

/**
 * GET /api/phone-prefixes/european
 * Récupère uniquement les préfixes européens (pour Cheapship)
 */
router.get('/european', (req, res) => {
  try {
    const europeanCountries = [
      'FR', 'DE', 'IT', 'ES', 'GB', 'NL', 'BE', 'CH', 'AT', 'PT', 'IE', 
      'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 
      'BA', 'RS', 'ME', 'MK', 'AL', 'XK', 'GR', 'BG', 'RO', 'MD', 'UA', 
      'BY', 'LT', 'LV', 'EE', 'RU', 'LU', 'MT', 'CY', 'AD', 'MC', 'SM', 
      'VA', 'LI'
    ];

    const europeanPrefixes = phonePrefixes.filter(country => 
      europeanCountries.includes(country.code)
    );

    res.json({
      success: true,
      message: 'Préfixes européens récupérés avec succès',
      data: europeanPrefixes,
      total: europeanPrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes européens:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes européens'
    });
  }
});

/**
 * GET /api/phone-prefixes/search?q=france
 * Recherche de préfixes par nom de pays
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre de recherche requis',
        message: 'Veuillez fournir au moins 2 caractères pour la recherche'
      });
    }

    const searchTerm = q.trim().toLowerCase();
    const results = phonePrefixes.filter(country => 
      country.name.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm) ||
      country.prefix.includes(searchTerm)
    );

    res.json({
      success: true,
      message: `${results.length} résultat(s) trouvé(s) pour "${q}"`,
      data: results,
      total: results.length,
      query: q
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de préfixes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la recherche'
    });
  }
});

/**
 * GET /api/phone-prefixes/country/:code
 * Récupère le préfixe d'un pays spécifique
 */
router.get('/country/:code', (req, res) => {
  try {
    const { code } = req.params;
    const countryCode = code.toUpperCase();

    const country = phonePrefixes.find(c => c.code === countryCode);

    if (!country) {
      return res.status(404).json({
        success: false,
        error: 'Pays non trouvé',
        message: `Aucun préfixe trouvé pour le code pays "${code}"`
      });
    }

    res.json({
      success: true,
      message: `Préfixe pour ${country.name} récupéré avec succès`,
      data: country
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du préfixe pays:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du préfixe'
    });
  }
});

/**
 * GET /api/phone-prefixes/popular
 * Récupère les préfixes les plus populaires pour Cheapship
 */
router.get('/popular', (req, res) => {
  try {
    // Pays populaires pour le transport européen + Palestine/Israël traités équitablement
    const popularCountries = ['FR', 'DE', 'IT', 'ES', 'GB', 'NL', 'BE', 'CH', 'PS', 'IL'];
    
    const popularPrefixes = phonePrefixes
      .filter(country => popularCountries.includes(country.code))
      .sort((a, b) => {
        const orderA = popularCountries.indexOf(a.code);
        const orderB = popularCountries.indexOf(b.code);
        return orderA - orderB;
      });

    res.json({
      success: true,
      message: 'Préfixes populaires récupérés avec succès',
      data: popularPrefixes,
      total: popularPrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes populaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes populaires'
    });
  }
});

/**
 * POST /api/phone-prefixes/validate
 * Valide un numéro de téléphone avec son préfixe
 */
router.post('/validate', (req, res) => {
  try {
    const { countryCode, phoneNumber } = req.body;

    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: 'Code pays et numéro de téléphone requis'
      });
    }

    const country = phonePrefixes.find(c => c.code === countryCode.toUpperCase());
    
    if (!country) {
      return res.status(400).json({
        success: false,
        error: 'Code pays invalide',
        message: `Code pays "${countryCode}" non reconnu`
      });
    }

    // Validation basique du numéro de téléphone
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const isValid = /^\d{6,15}$/.test(cleanNumber);

    const formattedNumber = `${country.prefix} ${phoneNumber}`;

    res.json({
      success: true,
      message: isValid ? 'Numéro de téléphone valide' : 'Format de numéro invalide',
      data: {
        country: country,
        originalNumber: phoneNumber,
        cleanNumber: cleanNumber,
        formattedNumber: formattedNumber,
        isValid: isValid
      }
    });
  } catch (error) {
    console.error('Erreur lors de la validation du numéro:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la validation'
    });
  }
});

/**
 * GET /api/phone-prefixes/africa
 * Récupère uniquement les préfixes africains
 */
router.get('/africa', (req, res) => {
  try {
    const africanCountries = [
      'EG', 'LY', 'TN', 'DZ', 'MA', 'EH', 'MR', 'ML', 'BF', 'NE', 'TD', 'SD', 'SS', 
      'ET', 'ER', 'DJ', 'SO', 'KE', 'UG', 'TZ', 'RW', 'BI', 'MZ', 'MW', 'ZM', 'ZW', 
      'BW', 'NA', 'ZA', 'LS', 'SZ', 'MG', 'MU', 'SC', 'KM', 'AO', 'CD', 'CG', 'CF', 
      'CM', 'GQ', 'GA', 'ST', 'NG', 'BJ', 'TG', 'GH', 'CI', 'LR', 'SL', 'GN', 'GW', 
      'CV', 'SN', 'GM'
    ];

    const africanPrefixes = phonePrefixes.filter(country => 
      africanCountries.includes(country.code)
    );

    res.json({
      success: true,
      message: 'Préfixes africains récupérés avec succès',
      data: africanPrefixes,
      total: africanPrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes africains:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes africains'
    });
  }
});

/**
 * GET /api/phone-prefixes/americas
 * Récupère uniquement les préfixes des Amériques
 */
router.get('/americas', (req, res) => {
  try {
    const americanCountries = [
      'US', 'CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', 'BR', 'AR', 'CL', 
      'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'GY', 'SR', 'GF', 'CU', 'JM', 'HT', 
      'DO', 'PR', 'TT', 'BB'
    ];

    const americanPrefixes = phonePrefixes.filter(country => 
      americanCountries.includes(country.code)
    );

    res.json({
      success: true,
      message: 'Préfixes des Amériques récupérés avec succès',
      data: americanPrefixes,
      total: americanPrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes américains:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes américains'
    });
  }
});

/**
 * GET /api/phone-prefixes/asia
 * Récupère uniquement les préfixes asiatiques
 */
router.get('/asia', (req, res) => {
  try {
    const asianCountries = [
      'CN', 'JP', 'KR', 'KP', 'IN', 'PK', 'BD', 'LK', 'MV', 'NP', 'BT', 'AF', 'IR', 
      'IQ', 'SY', 'LB', 'JO', 'PS', 'IL', 'SA', 'AE', 'QA', 'BH', 'KW', 'OM', 'YE', 
      'TR', 'GE', 'AM', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'MN', 'TH', 'VN', 'LA', 
      'KH', 'MM', 'MY', 'SG', 'ID', 'BN', 'PH', 'TW', 'HK', 'MO'
    ];

    const asianPrefixes = phonePrefixes.filter(country => 
      asianCountries.includes(country.code)
    );

    res.json({
      success: true,
      message: 'Préfixes asiatiques récupérés avec succès',
      data: asianPrefixes,
      total: asianPrefixes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préfixes asiatiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des préfixes asiatiques'
    });
  }
});

module.exports = router;