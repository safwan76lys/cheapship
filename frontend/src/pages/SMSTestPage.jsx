import React, { useState, useEffect } from 'react';
import { Phone, Shield, CheckCircle, AlertCircle, Clock, AlertTriangle, Plus, Package, User, Settings } from 'lucide-react';

const SMSTestPage = () => {
  const [activeTab, setActiveTab] = useState('verification');
  const [userStatus, setUserStatus] = useState(null);
  
  const API_URL = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  // Vérifier le statut utilisateur au chargement
  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/sms/verify/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data);
      }
    } catch (error) {
      console.error('Erreur statut:', error);
    }
  };

  const tabs = [
    { id: 'verification', label: 'Vérification SMS', icon: Phone },
    { id: 'protection', label: 'Test Protection', icon: Shield },
    { id: 'status', label: 'Statut Utilisateur', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Test API SMS Cheapship</h1>
          <p className="text-gray-600 mt-2">Interface de test pour la vérification SMS</p>
        </div>

        {/* Status global */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Configuration</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className={token ? 'text-green-600' : 'text-red-600'}>
                JWT: {token ? '✅ Connecté' : '❌ Non connecté'}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">API: {API_URL}</span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu des tabs */}
        <div className="space-y-6">
          {activeTab === 'verification' && <SMSVerificationTab />}
          {activeTab === 'protection' && <ProtectionTestTab />}
          {activeTab === 'status' && <UserStatusTab userStatus={userStatus} onRefresh={checkUserStatus} />}
        </div>
      </div>
    </div>
  );
};

// Composant de vérification SMS
const SMSVerificationTab = () => {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('+33');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const API_URL = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const sendSMS = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/sms/verify/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Code SMS envoyé !');
        setMaskedPhone(data.phone);
        setStep('code');
        setTimeLeft(600);
      } else {
        setError(data.message || data.error);
      }
    } catch (err) {
      setError('Erreur connexion');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/sms/verify/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Téléphone vérifié ! 🎉');
        setStep('success');
      } else {
        setError(data.message || data.error);
      }
    } catch (err) {
      setError('Erreur connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Vérification SMS</h2>
      
      {step === 'phone' && (
        <div className="max-w-md">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33123456789"
            className="w-full px-3 py-2 border rounded-md mb-4"
          />
          <button
            onClick={sendSMS}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer SMS'}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 mb-4">Code envoyé à {maskedPhone}</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 border rounded-md mb-4 text-center text-xl"
            maxLength={6}
          />
          {timeLeft > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Expire dans {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}
            </p>
          )}
          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Succès !</h3>
          <button
            onClick={() => {
              setStep('phone');
              setPhone('+33');
              setCode('');
              setSuccess('');
              setError('');
            }}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Tester à nouveau
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && step !== 'success' && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}
    </div>
  );
};

// Composant de test de protection
const ProtectionTestTab = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const API_URL = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const testCreateTrip = async () => {
    setLoading(true);
    addResult('🚀 Test création voyage...', 'info');
    
    try {
      const response = await fetch(`${API_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departureCity: "Paris",
          departureCountry: "France",
          arrivalCity: "Cairo",
          arrivalCountry: "Egypt",
          departureDate: "2025-09-15",
          arrivalDate: "2025-09-16",
          availableWeight: 10,
          pricePerKg: 5,
          description: "Test voyage"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPhoneVerification || data.code === 'PHONE_VERIFICATION_REQUIRED') {
          addResult('✅ Protection SMS active: ' + data.message, 'success');
        } else {
          addResult('❌ Autre erreur: ' + data.error, 'error');
        }
      } else {
        addResult('✅ Voyage créé (téléphone vérifié)', 'success');
      }
    } catch (err) {
      addResult('❌ Erreur connexion: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testCreateParcel = async () => {
    setLoading(true);
    addResult('📦 Test création colis...', 'info');
    
    try {
      const response = await fetch(`${API_URL}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: "Test Colis",
          description: "Colis de test",
          category: "electronics",
          weight: 2.5,
          value: 100,
          pickupCity: "Paris",
          deliveryCity: "Lyon",
          pickupDate: "2025-09-15",
          deliveryDate: "2025-09-17",
          maxPrice: 25
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPhoneVerification || data.code === 'PHONE_VERIFICATION_REQUIRED') {
          addResult('✅ Protection SMS active: ' + data.message, 'success');
        } else {
          addResult('❌ Autre erreur: ' + data.error, 'error');
        }
      } else {
        addResult('✅ Colis créé (téléphone vérifié)', 'success');
      }
    } catch (err) {
      addResult('❌ Erreur connexion: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Test Protection SMS</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testCreateTrip}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Test Création Voyage
        </button>
        
        <button
          onClick={testCreateParcel}
          disabled={loading}
          className="bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          <Package className="w-4 h-4 mr-2" />
          Test Création Colis
        </button>
      </div>

      {/* Résultats des tests */}
      <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
        <h3 className="font-medium text-gray-900 mb-4">Résultats des tests</h3>
        {results.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun test effectué</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  result.type === 'success' ? 'bg-green-100 text-green-800' :
                  result.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <span className="text-xs text-gray-500">{result.time}</span> - {result.message}
              </div>
            ))}
          </div>
        )}
        
        {results.length > 0 && (
          <button
            onClick={() => setResults([])}
            className="mt-4 text-xs text-gray-500 hover:text-gray-700"
          >
            Effacer les résultats
          </button>
        )}
      </div>
    </div>
  );
};

// Composant de statut utilisateur
const UserStatusTab = ({ userStatus, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Statut Utilisateur</h2>
        <button
          onClick={onRefresh}
          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-sm"
        >
          Actualiser
        </button>
      </div>
      
      {userStatus ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">📱 Téléphone</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Numéro: </span>
                  <span className="font-mono">{userStatus.phone || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Statut: </span>
                  <span className={userStatus.phoneVerified ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {userStatus.phoneVerified ? '✅ Vérifié' : '❌ Non vérifié'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">⏰ Vérification active</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Code en cours: </span>
                  <span className={userStatus.hasActiveVerification ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                    {userStatus.hasActiveVerification ? '🟡 Oui' : 'Non'}
                  </span>
                </div>
                {userStatus.expiresAt && (
                  <div>
                    <span className="text-gray-600">Expire: </span>
                    <span className="font-mono text-xs">
                      {new Date(userStatus.expiresAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="font-medium text-gray-700 mb-2">💡 Actions recommandées</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {!userStatus.phoneVerified && (
                <li>• Vérifiez votre téléphone pour débloquer les actions critiques</li>
              )}
              {userStatus.phoneVerified && (
                <li>• ✅ Votre téléphone est vérifié - toutes les fonctionnalités sont accessibles</li>
              )}
              {userStatus.hasActiveVerification && (
                <li>• Un code de vérification est en attente de saisie</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Chargement du statut utilisateur...</p>
        </div>
      )}
    </div>
  );
};

export default SMSTestPage;