-- 🚀 MIGRATION CHEAPSHIP SCHEMA VERS D1 (SQLite)
-- Fichier: schema-d1.sql
-- Basé sur votre schema Prisma existant

-- ================================
-- TABLE USERS
-- ================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phone TEXT,
  isVerified INTEGER DEFAULT 0, -- SQLite utilise INTEGER pour BOOLEAN
  isActive INTEGER DEFAULT 1,
  profilePicture TEXT,
  verificationDocument TEXT,
  rating REAL DEFAULT 0.0,
  redCards INTEGER DEFAULT 0,
  isBanned INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- ================================
-- TABLE TRIPS (VOLS)
-- ================================
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  departureDate TEXT NOT NULL, -- ISO string format
  availableSpace INTEGER NOT NULL,
  pricePerKg REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE PARCELS (COLIS)
-- ================================
CREATE TABLE parcels (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  maxPrice REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE CONVERSATIONS
-- ================================
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  participant1Id TEXT NOT NULL,
  participant2Id TEXT NOT NULL,
  tripId TEXT,
  parcelId TEXT,
  lastMessageAt TEXT DEFAULT (datetime('now')),
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (participant1Id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2Id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL,
  FOREIGN KEY (parcelId) REFERENCES parcels(id) ON DELETE SET NULL
);

-- ================================
-- TABLE MESSAGES
-- ================================
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  content TEXT NOT NULL,
  messageType TEXT DEFAULT 'text',
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE REVIEWS
-- ================================
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  reviewerId TEXT NOT NULL,
  reviewedId TEXT NOT NULL,
  tripId TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  isRedCard INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL
);

-- ================================
-- TABLE NOTIFICATIONS
-- ================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  isRead INTEGER DEFAULT 0,
  data TEXT, -- JSON stringifié
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE OFFERS (NÉGOCIATIONS)
-- ================================
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  tripId TEXT,
  parcelId TEXT,
  priceOffered REAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (parcelId) REFERENCES parcels(id) ON DELETE CASCADE
);

-- ================================
-- INDEX POUR PERFORMANCES
-- ================================

-- Index Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(isActive, isBanned);

-- Index Trips
CREATE INDEX idx_trips_user ON trips(userId);
CREATE INDEX idx_trips_dates ON trips(departureDate);
CREATE INDEX idx_trips_route ON trips(departure, destination);
CREATE INDEX idx_trips_status ON trips(status);

-- Index Parcels
CREATE INDEX idx_parcels_user ON parcels(userId);
CREATE INDEX idx_parcels_route ON parcels(origin, destination);
CREATE INDEX idx_parcels_status ON parcels(status);

-- Index Messages
CREATE INDEX idx_messages_conversation ON messages(conversationId);
CREATE INDEX idx_messages_sender ON messages(senderId);
CREATE INDEX idx_messages_unread ON messages(isRead);

-- Index Reviews
CREATE INDEX idx_reviews_reviewed ON reviews(reviewedId);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewerId);

-- Index Notifications
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_unread ON notifications(isRead);

-- Index Conversations
CREATE INDEX idx_conversations_participants ON conversations(participant1Id, participant2Id);

-- Index Offers
CREATE INDEX idx_offers_sender ON offers(senderId);
CREATE INDEX idx_offers_receiver ON offers(receiverId);
CREATE INDEX idx_offers_status ON offers(status);

-- ================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ================================

-- Utilisateur de test
INSERT INTO users (
  id, email, password, firstName, lastName, 
  isVerified, rating
) VALUES (
  'test-user-1', 
  'test@cheapship.fr', 
  'hashed_password_here',
  'Test', 
  'User',
  1,
  8.5
);

-- Vol de test
INSERT INTO trips (
  id, userId, departure, destination, 
  departureDate, availableSpace, pricePerKg
) VALUES (
  'test-trip-1',
  'test-user-1',
  'Paris',
  'Londres', 
  '2024-12-01T10:00:00Z',
  5,
  15.0
);

-- Colis de test
INSERT INTO parcels (
  id, userId, title, weight, origin, destination, maxPrice
) VALUES (
  'test-parcel-1',
  'test-user-1',
  'Documents importants',
  0.5,
  'Lyon',
  'Berlin',
  25.0
);