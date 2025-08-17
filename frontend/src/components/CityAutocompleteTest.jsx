// src/components/CityAutocompleteTest.jsx
import React, { useState } from 'react';
import CityAutocomplete from './CityAutocomplete';

const CityAutocompleteTest = () => {
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [selectedArrival, setSelectedArrival] = useState(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Test CityAutocomplete
        </h2>
        <p className="text-gray-600">
          Test de l'autocomplétion avec ton API Cities
        </p>
      </div>

      {/* Formulaire de test */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville de départ
            </label>
            <CityAutocomplete
              value={selectedDeparture}
              onChange={setSelectedDeparture}
              placeholder="D'où partez-vous ?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville d'arrivée
            </label>
            <CityAutocomplete
              value={selectedArrival}
              onChange={setSelectedArrival}
              placeholder="Où allez-vous ?"
            />
          </div>
        </div>

        {/* Affichage des résultats */}
        {(selectedDeparture || selectedArrival) && (
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Villes sélectionnées :</h3>
            
            {selectedDeparture && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Départ :</h4>
                <div className="text-sm text-green-700">
                  <div><strong>Nom :</strong> {selectedDeparture.displayName}</div>
                  <div><strong>Coordonnées :</strong> {selectedDeparture.latitude}, {selectedDeparture.longitude}</div>
                  <div><strong>ID :</strong> {selectedDeparture.id}</div>
                </div>
              </div>
            )}

            {selectedArrival && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Arrivée :</h4>
                <div className="text-sm text-blue-700">
                  <div><strong>Nom :</strong> {selectedArrival.displayName}</div>
                  <div><strong>Coordonnées :</strong> {selectedArrival.latitude}, {selectedArrival.longitude}</div>
                  <div><strong>ID :</strong> {selectedArrival.id}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guide de test */}
        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">🧪 Tests à faire :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>✅ Tape "par" → doit afficher Paris</div>
              <div>✅ Tape "lyo" → doit afficher Lyon</div>
              <div>✅ Tape "lon" → doit afficher London</div>
              <div>✅ Sélectionne une ville → doit remplir le champ</div>
            </div>
            <div className="space-y-2">
              <div>✅ Clique sur X → doit vider le champ</div>
              <div>✅ Vérifie les coordonnées affichées</div>
              <div>✅ Teste avec des caractères spéciaux</div>
              <div>✅ Vérifie que les drapeaux s'affichent</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityAutocompleteTest;