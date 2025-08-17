// ================================
// CITIES API DYNAMIQUE - src/routes/cities.js
// ================================

const express = require('express');
const router = express.Router();

// Configuration GeoNames
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'demo';

// ================================
// OPTION 1: API REST Countries + GeoNames
// ================================

// Récupérer les pays et leurs villes principales
router.get('/countries', async (req, res) => {
  try {
    // API REST Countries (gratuite, pas de clé requise)
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

    // Construire l'URL GeoNames
    let geonamesUrl = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(q)}&maxRows=${limit}&featureClass=P&orderby=population&username=${GEONAMES_USERNAME}`;
    
    if (country) {
      geonamesUrl += `&country=${country}`;
    }

    console.log('🔍 GeoNames API call:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    // Vérifier les erreurs GeoNames
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
        total: cities.length,
        query: q,
        source: 'geonames'
      });
    } else {
      res.json({
        success: true,
        cities: [],
        total: 0,
        query: q,
        source: 'geonames'
      });
    }

  } catch (error) {
    console.error('❌ Erreur recherche villes:', error);
    
    // Fallback avec notre base locale en cas d'erreur API
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

    // GeoNames: villes les plus peuplées par pays
    const geonamesUrl = `http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&orderby=population&maxRows=${limit}&username=${GEONAMES_USERNAME}`;
    
    console.log('🏙️ GeoNames Popular Cities:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    // Vérifier les erreurs GeoNames
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

// Villes dans un rayon (ajusté pour version gratuite)
router.get('/nearby', async (req, res) => {
  try {
    let { lat, lng, radius = 300, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude et longitude requises'
      });
    }

    // Limiter le rayon à 300km pour la version gratuite GeoNames
    const maxRadius = 300;
    if (parseInt(radius) > maxRadius) {
      radius = maxRadius;
      console.log(`⚠️ Rayon ajusté à ${maxRadius}km (limite gratuite GeoNames)`);
    }

    // GeoNames: findNearbyPlaceName
    const geonamesUrl = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&radius=${radius}&maxRows=${limit}&username=${GEONAMES_USERNAME}`;
    
    console.log('📍 GeoNames Nearby:', geonamesUrl.replace(GEONAMES_USERNAME, 'XXX'));

    const response = await fetch(geonamesUrl);
    const data = await response.json();

    // Vérifier les erreurs GeoNames
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
        distance: Math.round(parseFloat(city.distance || 0)), // En km
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
    
    // Test simple avec Paris
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

// ================================
// OPTION 2: API AÉROPORTS IATA
// ================================

router.get('/airports/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    // API Aviation Edge (gratuite avec limites)
    // Remplacez YOUR_API_KEY par votre vraie clé
    const aviationUrl = `https://aviation-edge.com/v2/public/cityDatabase?key=YOUR_API_KEY&codeIataCity=${q}`;
    
    // Alternative: API Airport (plus simple)
    const airportUrl = `https://api.api-ninjas.com/v1/airports?name=${encodeURIComponent(q)}&limit=${limit}`;
    
    const response = await fetch(airportUrl, {
      headers: {
        'X-Api-Key': 'YOUR_NINJAS_API_KEY' // Gratuite avec inscription
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
// FALLBACK LOCAL DATA
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
    
    // Europe populaire
    { id: 'gb_london', name: 'Londres', country: 'Royaume-Uni', countryCode: 'GB', coordinates: { lat: 51.5074, lng: -0.1278 } },
    { id: 'de_berlin', name: 'Berlin', country: 'Allemagne', countryCode: 'DE', coordinates: { lat: 52.5200, lng: 13.4050 } },
    { id: 'es_madrid', name: 'Madrid', country: 'Espagne', countryCode: 'ES', coordinates: { lat: 40.4168, lng: -3.7038 } },
    { id: 'it_rome', name: 'Rome', country: 'Italie', countryCode: 'IT', coordinates: { lat: 41.9028, lng: 12.4964 } },
    
    // International
    { id: 'us_newyork', name: 'New York', country: 'États-Unis', countryCode: 'US', coordinates: { lat: 40.7128, lng: -74.0060 } },
    { id: 'jp_tokyo', name: 'Tokyo', country: 'Japon', countryCode: 'JP', coordinates: { lat: 35.6762, lng: 139.6503 } },
    { id: 'cn_shanghai', name: 'Shanghai', country: 'Chine', countryCode: 'CN', coordinates: { lat: 31.2304, lng: 121.4737 } },
    { id: 'ae_dubai', name: 'Dubaï', country: 'Émirats arabes unis', countryCode: 'AE', coordinates: { lat: 25.2048, lng: 55.2708 } }
  ];

  if (!query) return fallbackCities;

  return fallbackCities.filter(city => 
    city.name.toLowerCase().includes(query.toLowerCase()) ||
    city.country.toLowerCase().includes(query.toLowerCase())
  );
}

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
        limits: 'Gratuite avec inscription, 30k requêtes/jour'
      },
      airports: {
        available: true,
        description: 'API Aéroports pour codes IATA',
        limits: 'Gratuite avec inscription'
      },
      fallback: {
        available: true,
        description: 'Base locale des principales villes',
        cities: 200
      }
    },
    features: {
      search: 'Recherche par nom avec autocomplétion',
      nearby: 'Villes dans un rayon de 500km',
      popular: 'Villes populaires par pays',
      countries: 'Liste complète des pays'
    }
  });
});

module.exports = router;