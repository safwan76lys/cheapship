import React, { useState } from 'react';

const CityAutocompleteSimple = () => {
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');
  const [departureCities, setDepartureCities] = useState([]);
  const [arrivalCities, setArrivalCities] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [selectedArrival, setSelectedArrival] = useState(null);

  const searchCities = async (query, setResults) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    try {
      const response = await fetch(`https://cheapship-backend.onrender.com/api/cities/search?q=${query}&limit=5`);
      const data = await response.json();
      
      console.log('Réponse API:', data); // Pour débug
      
      if (data.success && data.cities) {
        setResults(data.cities);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setResults([]);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test API Cities</h1>
      
      {/* Test 1: Départ */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🟢 Ville de départ</h3>
        <input
          type="text"
          value={departureSearch}
          onChange={(e) => {
            setDepartureSearch(e.target.value);
            searchCities(e.target.value, setDepartureCities);
          }}
          placeholder="Tape 'paris' ou 'lyon'..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
        
        {departureCities.length > 0 && (
          <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            {departureCities.map((city) => (
              <div 
                key={city.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9'
                }}
                onClick={() => {
                  setSelectedDeparture(city);
                  setDepartureSearch(city.name);
                  setDepartureCities([]);
                }}
              >
                <strong>{city.name}</strong> - {city.country}
                <br />
                <small>Coordonnées: {city.coordinates?.lat}, {city.coordinates?.lng}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test 2: Arrivée */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🔴 Ville d'arrivée</h3>
        <input
          type="text"
          value={arrivalSearch}
          onChange={(e) => {
            setArrivalSearch(e.target.value);
            searchCities(e.target.value, setArrivalCities);
          }}
          placeholder="Tape 'london' ou 'berlin'..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
        
        {arrivalCities.length > 0 && (
          <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            {arrivalCities.map((city) => (
              <div 
                key={city.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9'
                }}
                onClick={() => {
                  setSelectedArrival(city);
                  setArrivalSearch(city.name);
                  setArrivalCities([]);
                }}
              >
                <strong>{city.name}</strong> - {city.country}
                <br />
                <small>Coordonnées: {city.coordinates?.lat}, {city.coordinates?.lng}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résultats */}
      {(selectedDeparture || selectedArrival) && (
        <div style={{ padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3>✅ Résultats</h3>
          
          {selectedDeparture && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Départ :</strong> {selectedDeparture.name}, {selectedDeparture.country}
              <br />
              <strong>Coordonnées :</strong> {selectedDeparture.coordinates?.lat}, {selectedDeparture.coordinates?.lng}
              <br />
              <strong>ID :</strong> {selectedDeparture.id}
            </div>
          )}

          {selectedArrival && (
            <div>
              <strong>Arrivée :</strong> {selectedArrival.name}, {selectedArrival.country}
              <br />
              <strong>Coordonnées :</strong> {selectedArrival.coordinates?.lat}, {selectedArrival.coordinates?.lng}
              <br />
              <strong>ID :</strong> {selectedArrival.id}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h4>🧪 Tests à faire :</h4>
        <ul>
          <li>Tape "par" → doit afficher Paris</li>
          <li>Tape "lyo" → doit afficher Lyon</li>
          <li>Tape "lon" → doit afficher London</li>
          <li>Clique sur une ville → doit la sélectionner</li>
          <li>Vérifie la console pour les logs API</li>
        </ul>
      </div>
    </div>
  );
};

export default CityAutocompleteSimple;