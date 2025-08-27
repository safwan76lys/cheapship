import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Phone, Video, MoreVertical, ArrowLeft, Clock, Check, CheckCheck, 
  AlertCircle, Package, Plane, MapPin, Euro, Calendar, User, Star, Flag, Ban, Shield,
  Plus, Search, Filter, Archive, Settings, Bell, Paperclip, Smile, Camera,
  X, Eye, Download, CheckCircle, XCircle, DollarSign, TrendingUp, Handshake
} from 'lucide-react';
// import socketService from '../services/socketService'; // Décommentez quand vous créez le service

const API_URL = 'https://cheapship-backend.onrender.com/api' ;


// Mock data
const mockConversations = [
  {
    id: '1',
    parcelId: 'p1',
    tripId: 't1',
    parcelTitle: 'MacBook Pro 16" - Fragile',
    parcelImage: '/api/placeholder/60/60',
    weight: 2.1,
    value: 2500,
    category: 'Électronique',
    transporterId: 't1',
    transporterName: 'Marie Dubois',
    transporterAvatar: '/api/placeholder/40/40',
    transporterRating: 4.8,
    transporterVerified: true,
    clientId: 'c1',
    clientName: 'Pierre Martin',
    clientAvatar: '/api/placeholder/40/40',
    clientRating: 4.5,
    lastMessage: 'Parfait, je confirme pour 45€',
    lastMessageTime: new Date(Date.now() - 300000),
    unreadCount: 2,
    status: 'negotiating',
    route: { 
      from: 'Paris', 
      to: 'Lyon',
      departureDate: '2024-01-15T08:00:00',
      arrivalDate: '2024-01-15T12:30:00'
    },
    currentOffer: {
      price: 45,
      status: 'pending',
      offeredBy: 'c1'
    }
  },
  {
    id: '2',
    parcelId: 'p2',
    parcelTitle: 'Livre rare - Histoire de France',
    parcelImage: '/api/placeholder/60/60',
    weight: 0.8,
    value: 150,
    category: 'Livres',
    transporterId: 't2',
    transporterName: 'Jean Lefebvre',
    transporterAvatar: '/api/placeholder/40/40',
    transporterRating: 4.9,
    transporterVerified: true,
    clientId: 'c2',
    clientName: 'Sophie Chen',
    clientAvatar: '/api/placeholder/40/40',
    clientRating: 4.7,
    lastMessage: 'Transport accepté ! RDV demain 9h gare Lyon',
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 0,
    status: 'accepted',
    route: { 
      from: 'Marseille', 
      to: 'Nice',
      departureDate: '2024-01-16T09:00:00',
      arrivalDate: '2024-01-16T11:15:00'
    }
  },
  {
    id: '3',
    parcelId: 'p3',
    parcelTitle: 'Vêtements hiver + chaussures',
    parcelImage: '/api/placeholder/60/60',
    weight: 5.2,
    value: 300,
    category: 'Vêtements',
    transporterId: 't3',
    transporterName: 'Amelie Rodriguez',
    transporterAvatar: '/api/placeholder/40/40',
    transporterRating: 4.6,
    transporterVerified: false,
    clientId: 'c3',
    clientName: 'Lucas Bernard',
    clientAvatar: '/api/placeholder/40/40',
    clientRating: 4.2,
    lastMessage: 'Je peux faire 22€ au lieu de 25€',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 1,
    status: 'negotiating',
    route: { 
      from: 'Toulouse', 
      to: 'Bordeaux',
      departureDate: '2024-01-20T14:00:00',
      arrivalDate: '2024-01-20T16:30:00'
    },
    currentOffer: {
      price: 22,
      status: 'pending',
      offeredBy: 't3'
    }
  }
];

const mockMessages = {
  '1': [
    {
      id: '1',
      content: 'Bonjour ! Je suis intéressé par le transport de votre MacBook. Je peux le faire pour 40€.',
      senderId: 't1',
      senderName: 'Marie Dubois',
      timestamp: new Date(Date.now() - 7200000),
      type: 'offer',
      status: 'read',
      offerData: {
        price: 40,
        pickupDate: '2024-01-15T08:00:00',
        deliveryDate: '2024-01-15T12:30:00',
        description: 'Transport sécurisé en main propre, emballage renforcé fourni',
        terms: 'Assurance incluse jusqu\'à 2000€'
      }
    },
    {
      id: '2',
      content: 'Merci pour votre offre ! Serait-il possible de faire 45€ ? Le colis est vraiment fragile et a une grande valeur.',
      senderId: 'c1',
      senderName: 'Pierre Martin',
      timestamp: new Date(Date.now() - 3600000),
      type: 'counter_offer',
      status: 'read',
      offerData: {
        price: 45,
        pickupDate: '2024-01-15T08:00:00',
        deliveryDate: '2024-01-15T12:30:00',
        description: 'Transport sécurisé en main propre, emballage renforcé fourni',
        terms: 'Assurance incluse jusqu\'à 2500€ (valeur du MacBook)'
      }
    },
    {
      id: '3',
      content: 'Parfait, je confirme pour 45€. J\'ai l\'habitude des colis fragiles et d\'électronique.',
      senderId: 't1',
      senderName: 'Marie Dubois',
      timestamp: new Date(Date.now() - 300000),
      type: 'text',
      status: 'delivered'
    }
  ],
  '2': [
    {
      id: '1',
      content: 'Bonjour, je peux transporter votre livre pour 15€.',
      senderId: 't2',
      senderName: 'Jean Lefebvre',
      timestamp: new Date(Date.now() - 86400000),
      type: 'offer',
      status: 'read',
      offerData: {
        price: 15,
        pickupDate: '2024-01-16T09:00:00',
        deliveryDate: '2024-01-16T11:15:00',
        description: 'Transport soigné, protection contre l\'humidité'
      }
    },
    {
      id: '2',
      content: 'Transport accepté ! RDV demain 9h gare Lyon',
      senderId: 'c2',
      senderName: 'Sophie Chen',
      timestamp: new Date(Date.now() - 3600000),
      type: 'acceptance',
      status: 'read'
    }
  ]
};

// Composant principal Chat
const CheapshipChat = ({ user, onClose }) => {
  // États du composant
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState(mockConversations);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [currentUserId] = useState(user?.id || 'c1');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Fonction pour faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect pour le scroll automatique
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Récupérer les conversations au chargement
  useEffect(() => {
    fetchConversations();
  }, []);

  // Récupérer les messages quand on sélectionne une conversation
  useEffect(() => {
    if (selectedConversation && !messages[selectedConversation]) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Fonction pour récupérer les conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || mockConversations); // Fallback vers mock data
      } else {
        console.error('Erreur lors du chargement des conversations, utilisation des données de test');
        setConversations(mockConversations);
      }
    } catch (error) {
      console.error('Erreur de connexion, utilisation des données de test:', error);
      setConversations(mockConversations);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les messages d'une conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [conversationId]: data.messages || []
        }));
      } else {
        console.error('Erreur lors du chargement des messages pour la conversation:', conversationId);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  // Socket.IO Connection (optionnel pour l'instant)
  /*
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && socketService) {
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);

      // Écouter les nouveaux messages
      socketService.onNewMessage((message) => {
        console.log('📨 Nouveau message reçu:', message);
        
        setMessages(prev => ({
          ...prev,
          [message.conversationId]: [...(prev[message.conversationId] || []), message]
        }));

        // Mettre à jour la conversation
        setConversations(prev => 
          prev.map(conv => 
            conv.id === message.conversationId 
              ? { 
                  ...conv, 
                  lastMessage: message.content, 
                  lastMessageTime: new Date(message.timestamp),
                  unreadCount: selectedConversation === message.conversationId ? 0 : conv.unreadCount + 1
                }
              : conv
          )
        );
      });

      // Écouter les mises à jour de statut
      socketService.onMessageStatusUpdate((update) => {
        console.log('📊 Statut message mis à jour:', update);
        
        setMessages(prev => ({
          ...prev,
          [update.conversationId]: prev[update.conversationId]?.map(msg =>
            msg.id === update.messageId
              ? { ...msg, status: update.status }
              : msg
          ) || []
        }));
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [selectedConversation]);

  // Rejoindre/quitter les conversations
  useEffect(() => {
    if (selectedConversation && socket && socketService) {
      socketService.joinConversation(selectedConversation);
      
      return () => {
        socketService.leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation, socket]);
  */

  // Fonction unique pour envoyer un message (corrigée)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Créer l'objet message
    const messageData = {
      conversationId: selectedConversation,
      content: newMessage.trim(),
      type: 'text'
    };

    // Optimistic update - ajouter le message immédiatement à l'UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      senderId: currentUserId,
      senderName: user?.fullName || 'Vous',
      timestamp: new Date(),
      type: 'text',
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), tempMessage]
    }));

    // Mettre à jour la conversation
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: new Date() }
          : conv
      )
    );

    setNewMessage('');

    // Envoyer le message à l'API (optionnel pour l'instant)
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        // Remplacer le message temporaire par le message réel avec l'ID du serveur
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: prev[selectedConversation].map(msg =>
            msg.id === tempMessage.id ? { ...msg, id: data.message.id, status: 'delivered' } : msg
          )
        }));
      } else {
        console.error('Erreur lors de l\'envoi du message');
        // En cas d'erreur, marquer le message comme échoué
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: prev[selectedConversation].map(msg =>
            msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
          )
        }));
      }
    } catch (error) {
      console.error('Erreur de connexion lors de l\'envoi du message:', error);
    }

    /* Alternative avec Socket.IO (quand disponible)
    if (socketService && socketService.isConnected) {
      socketService.sendMessage(messageData);
    }
    */
  };

  // Fonction pour accepter une offre
  const handleAcceptOffer = async (messageId) => {
    const conv = conversations.find(c => c.id === selectedConversation);
    if (!conv) return;

    const acceptanceMsg = {
      id: Date.now().toString(),
      content: `Offre acceptée ! Transport confirmé pour ${conv.currentOffer?.price}€`,
      senderId: currentUserId,
      senderName: user?.fullName || 'Vous',
      timestamp: new Date(),
      type: 'acceptance',
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), acceptanceMsg]
    }));

    setConversations(prev => 
      prev.map(c => 
        c.id === selectedConversation 
          ? { ...c, status: 'accepted', lastMessage: acceptanceMsg.content, lastMessageTime: new Date() }
          : c
      )
    );

    // Envoyer à l'API
    try {
      await fetch(`${API_URL}/messages/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          messageId,
          offerPrice: conv.currentOffer?.price
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'offre:', error);
    }
  };

  // Fonction pour faire une offre
  const handleMakeOffer = async (price, terms) => {
    if (!selectedConversation) return;

    const conv = conversations.find(c => c.id === selectedConversation);
    if (!conv) return;

    const offerMsg = {
      id: Date.now().toString(),
      content: `Nouvelle offre : ${price}€`,
      senderId: currentUserId,
      senderName: user?.fullName || 'Vous',
      timestamp: new Date(),
      type: 'counter_offer',
      status: 'sent',
      offerData: {
        price,
        pickupDate: conv.route.departureDate,
        deliveryDate: conv.route.arrivalDate,
        description: terms,
        terms
      }
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), offerMsg]
    }));

    setConversations(prev => 
      prev.map(c => 
        c.id === selectedConversation 
          ? { 
              ...c, 
              status: 'negotiating',
              currentOffer: { price, status: 'pending', offeredBy: currentUserId },
              lastMessage: `Nouvelle offre : ${price}€`,
              lastMessageTime: new Date()
            }
          : c
      )
    );

    setShowOfferForm(false);

    // Envoyer à l'API
    try {
      await fetch(`${API_URL}/messages/make-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          price,
          terms,
          offerData: offerMsg.offerData
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'offre:', error);
    }
  };

  // Fonction pour rendre le statut du message
  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Fonction pour rendre les messages d'offre
  const renderOfferMessage = (message) => {
    const { offerData } = message;
    if (!offerData) return null;

    const isOwnMessage = message.senderId === currentUserId;

    return (
      <div className={`max-w-md ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`rounded-2xl p-4 ${
          isOwnMessage 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-white border-2 border-blue-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className={`w-4 h-4 ${isOwnMessage ? 'text-blue-100' : 'text-blue-600'}`} />
            <span className="font-semibold">
              {message.type === 'offer' ? 'Offre de transport' : 
               message.type === 'counter_offer' ? 'Contre-offre' : 'Offre acceptée'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-600'}>Prix proposé :</span>
              <span className="font-bold text-xl">{offerData.price}€</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`} />
              <span className={`text-sm ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                {new Date(offerData.pickupDate).toLocaleDateString()} à {new Date(offerData.pickupDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-blue-600 bg-opacity-50' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isOwnMessage ? 'text-blue-100' : 'text-gray-700'}`}>
                {offerData.description}
              </p>
              {offerData.terms && (
                <p className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-200' : 'text-gray-600'}`}>
                  🛡️ {offerData.terms}
                </p>
              )}
            </div>
          </div>

          {!isOwnMessage && message.type !== 'acceptance' && (
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => handleAcceptOffer(message.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accepter
              </button>
              <button 
                onClick={() => setShowOfferForm(true)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Négocier
              </button>
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwnMessage && renderMessageStatus(message.status)}
        </div>
      </div>
    );
  };

  // Fonction pour rendre un message normal
  const renderMessage = (message) => {
    const isOwnMessage = message.senderId === currentUserId;

    if (message.type === 'offer' || message.type === 'counter_offer' || message.type === 'acceptance') {
      return renderOfferMessage(message);
    }

    if (message.type === 'system') {
      return (
        <div className="mx-auto max-w-sm">
          <div className="bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-full text-sm">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div className={`max-w-md ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="break-words">{message.content}</p>
        </div>
        
        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwnMessage && renderMessageStatus(message.status)}
        </div>
      </div>
    );
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      conv.parcelTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.transporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.route.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.route.to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex">
      {/* Liste des conversations */}
      <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Tout', count: conversations.length },
              { key: 'negotiating', label: 'Négociation', count: conversations.filter(c => c.status === 'negotiating').length },
              { key: 'accepted', label: 'Accepté', count: conversations.filter(c => c.status === 'accepted').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filterStatus === filter.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => {
                setSelectedConversation(conversation.id);
                setConversations(prev => 
                  prev.map(c => 
                    c.id === conversation.id 
                      ? { ...c, unreadCount: 0 }
                      : c
                  )
                );
              }}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative">
                  <img 
                    src={conversation.parcelImage} 
                    alt={conversation.parcelTitle}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <img 
                      src={conversation.transporterAvatar} 
                      alt={conversation.transporterName}
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  </div>
                  {conversation.transporterVerified && (
                    <div className="absolute -top-1 -left-1">
                      <Shield className="w-4 h-4 text-green-500 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.parcelTitle}
                    </h3>
                    <div className="flex items-center gap-1">
                      {conversation.currentOffer && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {conversation.currentOffer.price}€
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{conversation.transporterName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span>{conversation.transporterRating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{conversation.weight}kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {conversation.route.from} → {conversation.route.to}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                      {conversation.lastMessage}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {conversation.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune conversation trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Zone de chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Header du chat */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={currentConversation?.parcelImage} 
                      alt={currentConversation?.parcelTitle}
                      className="w-10 h-10 rounded-lg"
                    />
                  </div>

                  <div>
                    <h2 className="font-medium text-gray-900">
                      {currentConversation?.parcelTitle}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{currentConversation?.transporterName}</span>
                        {currentConversation?.transporterVerified && (
                          <Shield className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{currentConversation?.route.from} → {currentConversation?.route.to}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Flag className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.map((message) => (
              <div key={message.id}>
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowOfferForm(true)}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Offre
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-2xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Sélectionnez une conversation
            </h3>
            <p className="text-gray-600 max-w-sm">
              Choisissez une conversation pour commencer à négocier le transport de vos colis.
            </p>
          </div>
        </div>
      )}

      {/* Modal formulaire d'offre */}
      {showOfferForm && (
        <OfferModal
          conversation={currentConversation}
          onSubmit={handleMakeOffer}
          onClose={() => setShowOfferForm(false)}
        />
      )}
    </div>
  );
};

// Composant modal pour faire une offre
const OfferModal = ({ conversation, onSubmit, onClose }) => {
  const [price, setPrice] = useState(conversation?.currentOffer?.price || 0);
  const [terms, setTerms] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (price > 0) {
      onSubmit(price, terms);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Faire une offre</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prix proposé (€)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conditions (optionnel)</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Précisez vos conditions de transport..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Envoyer l'offre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheapshipChat;