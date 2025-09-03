// ================================
// CITIES API DYNAMIQUE - src/routes/cities.js
// Amélioré avec villes du monde arabe et Turquie
// ================================

const express = require('express');
const router = express.Router();

// ✅ AMÉLIORATION : Configuration GeoNames avec fallback vers 'cheapship'
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'cheapship';

console.log('🔧 GeoNames Username configuré:', GEONAMES_USERNAME);

// ================================
// ROUTES EXISTANTES (inchangées)
// ================================

// Récupérer les pays et leurs villes principales
router.get('/countries', async (req, res) => {
  try {
    const countriesResponse = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,capital,latlng');
    const countries = await countriesResponse.json();
    
    const formattedCountries = countries.map(country => ({
      code: country.cca2,
      name: country.name.common,
      capital: country.capital?.[0],
      coordinates: {
        lat: country.latlng?.[0],
        lng: country.latlng?.[1]
      }
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      countries: formattedCountries,
      total: formattedCountries.length
    });
  } catch (error) {
    console.error('Erreur récupération pays:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des pays'
    });
  }
});

// Recherche de villes avec autocomplétion
router.get('/search', async (req, res) => {
  try {
    const { q, country, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    let geonamesUrl = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(q)}&maxRows=${limit}&featureClass=P&orderby=population&username=${GEONAMES_USERNAME}`;
    
    if (country) {
      geonamesUrl += `&country=${country}`;
    }

    console.log('🔍 GeoNames API call:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    if (data.status) {
      console.error('❌ GeoNames Error:', data.status);
      // ✅ AMÉLIORATION : Utiliser le fallback étendu en cas d'erreur
      const fallbackCities = getCitiesFallback(q);
      return res.json({
        success: true,
        cities: fallbackCities,
        total: fallbackCities.length,
        query: q,
        source: 'fallback',
        error: `GeoNames Error: ${data.status.message}`
      });
    }

    if (data.geonames) {
      const cities = data.geonames.map(city => ({
        id: city.geonameId,
        name: city.name,
        country: city.countryName,
        countryCode: city.countryCode,
        region: city.adminName1,
        population: city.population,
        coordinates: {
          lat: parseFloat(city.lat),
          lng: parseFloat(city.lng)
        }
      }));

      res.json({
        success: true,
        cities,
        total: cities.length,
        query: q,
        source: 'geonames'
      });
    } else {
      // ✅ AMÉLIORATION : Fallback si pas de résultats GeoNames
      const fallbackCities = getCitiesFallback(q);
      res.json({
        success: true,
        cities: fallbackCities,
        total: fallbackCities.length,
        query: q,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('❌ Erreur recherche villes:', error);
    
    const fallbackCities = getCitiesFallback(req.query.q);
    res.json({
      success: true,
      cities: fallbackCities,
      total: fallbackCities.length,
      query: req.query.q,
      source: 'fallback',
      error: error.message
    });
  }
});

// Villes populaires par pays
router.get('/popular/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { limit = 10 } = req.query;

    const geonamesUrl = `http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&orderby=population&maxRows=${limit}&username=${GEONAMES_USERNAME}`;
    
    console.log('🏙️ GeoNames Popular Cities:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    if (data.status) {
      console.error('❌ GeoNames Error:', data.status);
      throw new Error(`GeoNames API Error: ${data.status.message}`);
    }

    if (data.geonames) {
      const cities = data.geonames.map(city => ({
        id: city.geonameId,
        name: city.name,
        country: city.countryName,
        countryCode: city.countryCode,
        region: city.adminName1,
        population: city.population,
        coordinates: {
          lat: parseFloat(city.lat),
          lng: parseFloat(city.lng)
        }
      }));

      res.json({
        success: true,
        cities,
        country: countryCode,
        total: cities.length,
        source: 'geonames'
      });
    } else {
      res.json({
        success: true,
        cities: [],
        country: countryCode,
        total: 0,
        source: 'geonames'
      });
    }

  } catch (error) {
    console.error('❌ Erreur villes populaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des villes populaires',
      details: error.message
    });
  }
});

// Villes dans un rayon
router.get('/nearby', async (req, res) => {
  try {
    let { lat, lng, radius = 300, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude et longitude requises'
      });
    }

    const maxRadius = 300;
    if (parseInt(radius) > maxRadius) {
      radius = maxRadius;
      console.log(`⚠️ Rayon ajusté à ${maxRadius}km (limite gratuite GeoNames)`);
    }

    const geonamesUrl = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&radius=${radius}&maxRows=${limit}&username=${GEONAMES_USERNAME}`;
    
    console.log('📍 GeoNames Nearby:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    if (data.status) {
      console.error('❌ GeoNames Error:', data.status);
      throw new Error(`GeoNames API Error: ${data.status.message}`);
    }

    if (data.geonames) {
      const cities = data.geonames.map(city => ({
        id: city.geonameId,
        name: city.name,
        country: city.countryName,
        countryCode: city.countryCode,
        distance: Math.round(parseFloat(city.distance || 0)),
        coordinates: {
          lat: parseFloat(city.lat),
          lng: parseFloat(city.lng)
        }
      }));

      res.json({
        success: true,
        cities,
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        maxRadius: maxRadius,
        total: cities.length,
        source: 'geonames',
        note: radius == maxRadius ? 'Rayon limité à 300km (version gratuite)' : null
      });
    } else {
      res.json({
        success: true,
        cities: [],
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        maxRadius: maxRadius,
        total: 0,
        source: 'geonames'
      });
    }

  } catch (error) {
    console.error('❌ Erreur villes proches:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche des villes proches',
      details: error.message
    });
  }
});

// Test de configuration GeoNames
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test GeoNames avec username:', GEONAMES_USERNAME);
    
    const testUrl = `http://api.geonames.org/searchJSON?q=Paris&maxRows=1&username=${GEONAMES_USERNAME}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (data.status) {
      return res.status(400).json({
        success: false,
        error: 'Erreur configuration GeoNames',
        details: data.status,
        solution: data.status.message.includes('user account not enabled') 
          ? 'Activez les "free web services" dans votre profil GeoNames'
          : 'Vérifiez votre username GeoNames'
      });
    }

    res.json({
      success: true,
      message: 'GeoNames configuré correctement !',
      username: GEONAMES_USERNAME,
      testResult: data.geonames?.[0] || 'Aucun résultat',
      endpoints: [
        'GET /api/cities/search?q=paris',
        'GET /api/cities/popular/FR',
        'GET /api/cities/nearby?lat=45.76&lng=4.83&radius=500'
      ]
    });

  } catch (error) {
    console.error('❌ Erreur test GeoNames:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test GeoNames',
      details: error.message
    });
  }
});

// ✅ NOUVEAU : Route de diagnostic étendue
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug GeoNames');
    console.log('Username configuré:', GEONAMES_USERNAME);
    console.log('Variable d\'environnement:', process.env.GEONAMES_USERNAME);
    
    const testUrl = `http://api.geonames.org/searchJSON?q=Paris&maxRows=1&username=${GEONAMES_USERNAME}`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    res.json({
      success: !data.status,
      username: GEONAMES_USERNAME,
      environmentVariable: process.env.GEONAMES_USERNAME || 'non définie',
      testResult: data.status || data.geonames?.[0],
      fallbackCitiesCount: getCitiesFallback().length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      username: GEONAMES_USERNAME
    });
  }
});

// ================================
// ✅ AMÉLIORATION MAJEURE : FALLBACK ÉTENDU AVEC MONDE ARABE ET TURQUIE
// ================================

function getCitiesFallback(query) {
  const fallbackCities = [
    // France
    { id: 'fr_paris', name: 'Paris', country: 'France', countryCode: 'FR', coordinates: { lat: 48.8566, lng: 2.3522 } },
    { id: 'fr_lyon', name: 'Lyon', country: 'France', countryCode: 'FR', coordinates: { lat: 45.7640, lng: 4.8357 } },
    { id: 'fr_marseille', name: 'Marseille', country: 'France', countryCode: 'FR', coordinates: { lat: 43.2965, lng: 5.3698 } },
    { id: 'fr_toulouse', name: 'Toulouse', country: 'France', countryCode: 'FR', coordinates: { lat: 43.6047, lng: 1.4442 } },
    { id: 'fr_nice', name: 'Nice', country: 'France', countryCode: 'FR', coordinates: { lat: 43.7102, lng: 7.2620 } },
    { id: 'fr_bordeaux', name: 'Bordeaux', country: 'France', countryCode: 'FR', coordinates: { lat: 44.8378, lng: -0.5792 } },
    { id: 'fr_strasbourg', name: 'Strasbourg', country: 'France', countryCode: 'FR', coordinates: { lat: 48.5734, lng: 7.7521 } },
    { id: 'fr_montpellier', name: 'Montpellier', country: 'France', countryCode: 'FR', coordinates: { lat: 43.6108, lng: 3.8767 } },
    { id: 'fr_lille', name: 'Lille', country: 'France', countryCode: 'FR', coordinates: { lat: 50.6292, lng: 3.0573 } },
    { id: 'fr_nantes', name: 'Nantes', country: 'France', countryCode: 'FR', coordinates: { lat: 47.2184, lng: -1.5536 } },
    
    // Europe
    { id: 'gb_london', name: 'Londres', country: 'Royaume-Uni', countryCode: 'GB', coordinates: { lat: 51.5074, lng: -0.1278 } },
    { id: 'de_berlin', name: 'Berlin', country: 'Allemagne', countryCode: 'DE', coordinates: { lat: 52.5200, lng: 13.4050 } },
    { id: 'es_madrid', name: 'Madrid', country: 'Espagne', countryCode: 'ES', coordinates: { lat: 40.4168, lng: -3.7038 } },
    { id: 'it_rome', name: 'Rome', country: 'Italie', countryCode: 'IT', coordinates: { lat: 41.9028, lng: 12.4964 } },
    { id: 'nl_amsterdam', name: 'Amsterdam', country: 'Pays-Bas', countryCode: 'NL', coordinates: { lat: 52.3676, lng: 4.9041 } },
    { id: 'be_brussels', name: 'Bruxelles', country: 'Belgique', countryCode: 'BE', coordinates: { lat: 50.8503, lng: 4.3517 } },
    { id: 'ch_zurich', name: 'Zurich', country: 'Suisse', countryCode: 'CH', coordinates: { lat: 47.3769, lng: 8.5417 } },
    
    // ✅ TURQUIE (principales villes)
    { id: 'tr_istanbul', name: 'Istanbul', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 41.0082, lng: 28.9784 } },
    { id: 'tr_ankara', name: 'Ankara', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 39.9334, lng: 32.8597 } },
    { id: 'tr_izmir', name: 'Izmir', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 38.4192, lng: 27.1287 } },
    { id: 'tr_bursa', name: 'Bursa', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 40.1826, lng: 29.0669 } },
    { id: 'tr_antalya', name: 'Antalya', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 36.8841, lng: 30.7056 } },
    { id: 'tr_adana', name: 'Adana', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 37.0000, lng: 35.3213 } },
    { id: 'tr_konya', name: 'Konya', country: 'Turquie', countryCode: 'TR', coordinates: { lat: 37.8713, lng: 32.4846 } },
    
    // ✅ MONDE ARABE - Maghreb
    { id: 'ma_casablanca', name: 'Casablanca', country: 'Maroc', countryCode: 'MA', coordinates: { lat: 33.5731, lng: -7.5898 } },
    { id: 'ma_rabat', name: 'Rabat', country: 'Maroc', countryCode: 'MA', coordinates: { lat: 34.0209, lng: -6.8416 } },
    { id: 'ma_fes', name: 'Fès', country: 'Maroc', countryCode: 'MA', coordinates: { lat: 34.0181, lng: -5.0078 } },
    { id: 'ma_marrakech', name: 'Marrakech', country: 'Maroc', countryCode: 'MA', coordinates: { lat: 31.6295, lng: -7.9811 } },
    { id: 'ma_tangier', name: 'Tanger', country: 'Maroc', countryCode: 'MA', coordinates: { lat: 35.7595, lng: -5.8340 } },
    
    { id: 'dz_algiers', name: 'Alger', country: 'Algérie', countryCode: 'DZ', coordinates: { lat: 36.7538, lng: 3.0588 } },
    { id: 'dz_oran', name: 'Oran', country: 'Algérie', countryCode: 'DZ', coordinates: { lat: 35.6969, lng: -0.6331 } },
    { id: 'dz_constantine', name: 'Constantine', country: 'Algérie', countryCode: 'DZ', coordinates: { lat: 36.3650, lng: 6.6147 } },
    
    { id: 'tn_tunis', name: 'Tunis', country: 'Tunisie', countryCode: 'TN', coordinates: { lat: 36.8065, lng: 10.1815 } },
    { id: 'tn_sfax', name: 'Sfax', country: 'Tunisie', countryCode: 'TN', coordinates: { lat: 34.7406, lng: 10.7603 } },
    { id: 'tn_sousse', name: 'Sousse', country: 'Tunisie', countryCode: 'TN', coordinates: { lat: 35.8256, lng: 10.6369 } },
    
    { id: 'ly_tripoli', name: 'Tripoli', country: 'Libye', countryCode: 'LY', coordinates: { lat: 32.8872, lng: 13.1913 } },
    { id: 'ly_benghazi', name: 'Benghazi', country: 'Libye', countryCode: 'LY', coordinates: { lat: 32.1169, lng: 20.0685 } },
    
    // ✅ MONDE ARABE - Machrek et Golfe
    { id: 'eg_cairo', name: 'Le Caire', country: 'Égypte', countryCode: 'EG', coordinates: { lat: 30.0444, lng: 31.2357 } },
    { id: 'eg_alexandria', name: 'Alexandrie', country: 'Égypte', countryCode: 'EG', coordinates: { lat: 31.2001, lng: 29.9187 } },
    { id: 'eg_giza', name: 'Gizeh', country: 'Égypte', countryCode: 'EG', coordinates: { lat: 30.0131, lng: 31.2089 } },
    { id: 'eg_luxor', name: 'Louxor', country: 'Égypte', countryCode: 'EG', coordinates: { lat: 25.6872, lng: 32.6396 } },
    
    { id: 'sd_khartoum', name: 'Khartoum', country: 'Soudan', countryCode: 'SD', coordinates: { lat: 15.5007, lng: 32.5599 } },
    
    { id: 'sy_damascus', name: 'Damas', country: 'Syrie', countryCode: 'SY', coordinates: { lat: 33.5138, lng: 36.2765 } },
    { id: 'sy_aleppo', name: 'Alep', country: 'Syrie', countryCode: 'SY', coordinates: { lat: 36.2021, lng: 37.1343 } },
    
    { id: 'lb_beirut', name: 'Beyrouth', country: 'Liban', countryCode: 'LB', coordinates: { lat: 33.8938, lng: 35.5018 } },
    { id: 'lb_tripoli', name: 'Tripoli', country: 'Liban', countryCode: 'LB', coordinates: { lat: 34.4167, lng: 35.8333 } },
    
    { id: 'jo_amman', name: 'Amman', country: 'Jordanie', countryCode: 'JO', coordinates: { lat: 31.9454, lng: 35.9284 } },
    
    // ✅ PALESTINE (avec Jérusalem comme capitale)
    { id: 'ps_jerusalem', name: 'Jérusalem', country: 'Palestine', countryCode: 'PS', coordinates: { lat: 31.7683, lng: 35.2137 } },
    { id: 'ps_gaza', name: 'Gaza', country: 'Palestine', countryCode: 'PS', coordinates: { lat: 31.3547, lng: 34.3088 } },
    { id: 'ps_ramallah', name: 'Ramallah', country: 'Palestine', countryCode: 'PS', coordinates: { lat: 31.9073, lng: 35.2044 } },
    { id: 'ps_hebron', name: 'Hébron', country: 'Palestine', countryCode: 'PS', coordinates: { lat: 31.5326, lng: 35.0998 } },
    { id: 'ps_nablus', name: 'Naplouse', country: 'Palestine', countryCode: 'PS', coordinates: { lat: 32.2211, lng: 35.2544 } },
    
    { id: 'il_telaviv', name: 'Tel Aviv', country: 'Israël', countryCode: 'IL', coordinates: { lat: 32.0853, lng: 34.7818 } },
    { id: 'il_haifa', name: 'Haïfa', country: 'Israël', countryCode: 'IL', coordinates: { lat: 32.7940, lng: 34.9896 } },
    
    // ✅ MONDE ARABE - Golfe Persique
    { id: 'sa_riyadh', name: 'Riyad', country: 'Arabie saoudite', countryCode: 'SA', coordinates: { lat: 24.7136, lng: 46.6753 } },
    { id: 'sa_jeddah', name: 'Djeddah', country: 'Arabie saoudite', countryCode: 'SA', coordinates: { lat: 21.4858, lng: 39.1925 } },
    { id: 'sa_mecca', name: 'La Mecque', country: 'Arabie saoudite', countryCode: 'SA', coordinates: { lat: 21.3891, lng: 39.8579 } },
    { id: 'sa_medina', name: 'Médine', country: 'Arabie saoudite', countryCode: 'SA', coordinates: { lat: 24.4686, lng: 39.6142 } },
    { id: 'sa_dammam', name: 'Dammam', country: 'Arabie saoudite', countryCode: 'SA', coordinates: { lat: 26.4282, lng: 50.1044 } },
    
    { id: 'ae_dubai', name: 'Dubaï', country: 'Émirats arabes unis', countryCode: 'AE', coordinates: { lat: 25.2048, lng: 55.2708 } },
    { id: 'ae_abudhabi', name: 'Abou Dabi', country: 'Émirats arabes unis', countryCode: 'AE', coordinates: { lat: 24.2992, lng: 54.6989 } },
    { id: 'ae_sharjah', name: 'Charjah', country: 'Émirats arabes unis', countryCode: 'AE', coordinates: { lat: 25.3463, lng: 55.4209 } },
    
    { id: 'qa_doha', name: 'Doha', country: 'Qatar', countryCode: 'QA', coordinates: { lat: 25.2854, lng: 51.5310 } },
    
    { id: 'kw_kuwait', name: 'Koweït', country: 'Koweït', countryCode: 'KW', coordinates: { lat: 29.3759, lng: 47.9774 } },
    
    { id: 'bh_manama', name: 'Manama', country: 'Bahreïn', countryCode: 'BH', coordinates: { lat: 26.0667, lng: 50.5577 } },
    
    { id: 'om_muscat', name: 'Mascate', country: 'Oman', countryCode: 'OM', coordinates: { lat: 23.5859, lng: 58.4059 } },
    
    { id: 'ye_sanaa', name: 'Sanaa', country: 'Yémen', countryCode: 'YE', coordinates: { lat: 15.3694, lng: 44.1910 } },
    { id: 'ye_aden', name: 'Aden', country: 'Yémen', countryCode: 'YE', coordinates: { lat: 12.7794, lng: 45.0367 } },
    
    // ✅ MONDE ARABE - Irak
    { id: 'iq_baghdad', name: 'Bagdad', country: 'Irak', countryCode: 'IQ', coordinates: { lat: 33.3152, lng: 44.3661 } },
    { id: 'iq_basra', name: 'Bassorah', country: 'Irak', countryCode: 'IQ', coordinates: { lat: 30.5085, lng: 47.7804 } },
    { id: 'iq_mosul', name: 'Mossoul', country: 'Irak', countryCode: 'IQ', coordinates: { lat: 36.3350, lng: 43.1189 } },
    { id: 'iq_erbil', name: 'Erbil', country: 'Irak', countryCode: 'IQ', coordinates: { lat: 36.1911, lng: 44.0093 } },
    
    // International (grandes villes)
    { id: 'us_newyork', name: 'New York', country: 'États-Unis', countryCode: 'US', coordinates: { lat: 40.7128, lng: -74.0060 } },
    { id: 'jp_tokyo', name: 'Tokyo', country: 'Japon', countryCode: 'JP', coordinates: { lat: 35.6762, lng: 139.6503 } },
    { id: 'cn_shanghai', name: 'Shanghai', country: 'Chine', countryCode: 'CN', coordinates: { lat: 31.2304, lng: 121.4737 } },
    { id: 'gb_manchester', name: 'Manchester', country: 'Royaume-Uni', countryCode: 'GB', coordinates: { lat: 53.4808, lng: -2.2426 } },
    { id: 'de_munich', name: 'Munich', country: 'Allemagne', countryCode: 'DE', coordinates: { lat: 48.1351, lng: 11.5820 } },
    { id: 'ru_moscow', name: 'Moscou', country: 'Russie', countryCode: 'RU', coordinates: { lat: 55.7558, lng: 37.6176 } }
  ];

  if (!query) return fallbackCities.slice(0, 20);

  return fallbackCities.filter(city => 
    city.name.toLowerCase().includes(query.toLowerCase()) ||
    city.country.toLowerCase().includes(query.toLowerCase())
  );
}

// Routes existantes (airports, config) inchangées
router.get('/airports/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    // API Airport (exemple avec API Ninjas)
    const airportUrl = `https://api.api-ninjas.com/v1/airports?name=${encodeURIComponent(q)}&limit=${limit}`;
    
    const response = await fetch(airportUrl, {
      headers: {
        'X-Api-Key': 'YOUR_NINJAS_API_KEY' // Remplacez par votre clé
      }
    });
    
    const airports = await response.json();

    const formattedAirports = airports.map(airport => ({
      id: airport.icao,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      iataCode: airport.iata,
      icaoCode: airport.icao,
      coordinates: {
        lat: airport.latitude,
        lng: airport.longitude
      }
    }));

    res.json({
      success: true,
      airports: formattedAirports,
      total: formattedAirports.length,
      query: q
    });

  } catch (error) {
    console.error('Erreur recherche aéroports:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche des aéroports'
    });
  }
});

// ================================
// ENDPOINT DE CONFIGURATION
// ================================

router.get('/config', (req, res) => {
  res.json({
    success: true,
    apis: {
      geonames: {
        available: true,
        description: 'API GeoNames pour villes mondiales',
        limits: 'Gratuite avec inscription, 20k requêtes/jour',
        username: GEONAMES_USERNAME
      },
      airports: {
        available: true,
        description: 'API Aéroports pour codes IATA',
        limits: 'Gratuite avec inscription'
      },
      fallback: {
        available: true,
        description: 'Base locale étendue avec monde arabe et Turquie',
        cities: getCitiesFallback().length
      }
    },
    features: {
      search: 'Recherche par nom avec autocomplétion',
      nearby: 'Villes dans un rayon de 300km',
      popular: 'Villes populaires par pays',
      countries: 'Liste complète des pays',
      fallback: 'Base locale avec 80+ grandes villes mondiales'
    },
    regions: {
      france: 'Principales villes françaises',
      europe: 'Capitales et grandes villes européennes',
      turkey: 'Istanbul, Ankara, Izmir, Bursa, Antalya...',
      maghreb: 'Maroc, Algérie, Tunisie, Libye',
      mashreq: 'Egypte, Syrie, Liban, Jordanie, Palestine',
      gulf: 'Arabie Saoudite, EAU, Qatar, Koweït, Bahreïn, Oman',
      iraq: 'Bagdad, Bassorah, Mossoul, Erbil',
      yemen: 'Sanaa, Aden'
    }
  });
});

module.exports = router;