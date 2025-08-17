const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../config/database');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ================================
// CONVERSATIONS
// ================================

// Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                identityVerified: true,
                rating: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        trip: {
          select: {
            id: true,
            departureCity: true,
            arrivalCity: true,
            departureDate: true,
            arrivalDate: true,
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                identityVerified: true,
                rating: true
              }
            }
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            weight: true,
            value: true,
            maxPrice: true,
            pickupCity: true,
            deliveryCity: true,
            images: true,
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                identityVerified: true,
                rating: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: userId
                },
                readAt: null
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Formatter les conversations pour le frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId);
      const lastMessage = conv.messages[0];
      
      return {
        id: conv.id,
        type: conv.type,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv._count.messages,
        
        // Informations sur l'autre participant
        otherUser: otherParticipant?.user,
        
        // Informations sur le voyage/colis
        trip: conv.trip,
        item: conv.item,
        
        // Dernier message
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.messageType,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.fullName,
          createdAt: lastMessage.createdAt
        } : null
      };
    });

    res.json({
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des conversations' 
    });
  }
});

// Créer ou récupérer une conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participantId, tripId, itemId, type = 'NEGOTIATION' } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur ne se parle pas à lui-même
    if (participantId === userId) {
      return res.status(400).json({
        error: 'Impossible de créer une conversation avec soi-même'
      });
    }

    // Chercher une conversation existante
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { tripId: tripId || null },
          { itemId: itemId || null },
          {
            participants: {
              every: {
                userId: {
                  in: [userId, participantId]
                }
              }
            }
          },
          {
            participants: {
              some: {
                userId: userId
              }
            }
          },
          {
            participants: {
              some: {
                userId: participantId
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                identityVerified: true
              }
            }
          }
        }
      }
    });

    // Si pas de conversation existante, en créer une nouvelle
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type,
          tripId,
          itemId,
          participants: {
            create: [
              { userId: userId, role: 'MEMBER' },
              { userId: participantId, role: 'MEMBER' }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                  identityVerified: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Nouvelle conversation créée:', conversation.id);
    }

    res.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        status: conversation.status,
        participants: conversation.participants,
        createdAt: conversation.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la conversation' 
    });
  }
});

// ================================
// MESSAGES
// ================================

// Récupérer les messages d'une conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Vérifier que l'utilisateur participe à cette conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Accès non autorisé à cette conversation'
      });
    }

    // Récupérer les messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            identityVerified: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Marquer les messages comme lus
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId
        },
        readAt: null
      },
      data: {
        readAt: new Date(),
        status: 'READ'
      }
    });

    // Mettre à jour le lastReadAt du participant
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des messages' 
    });
  }
});

// Envoyer un message
router.post('/', async (req, res) => {
  try {
    const { 
      conversationId, 
      receiverId, 
      content, 
      messageType = 'TEXT',
      metadata,
      replyToId,
      // Paramètres pour créer une conversation automatiquement
      tripId,
      itemId
    } = req.body;
    const senderId = req.user.id;

    let finalConversationId = conversationId;

    // Si pas de conversationId, essayer de créer/trouver une conversation
    if (!conversationId && receiverId) {
      // Chercher une conversation existante
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { tripId: tripId || null },
            { itemId: itemId || null },
            {
              participants: {
                some: { userId: senderId }
              }
            },
            {
              participants: {
                some: { userId: receiverId }
              }
            }
          ]
        }
      });

      // Si pas trouvée, créer une nouvelle conversation
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            type: 'NEGOTIATION',
            tripId,
            itemId,
            participants: {
              create: [
                { userId: senderId, role: 'MEMBER' },
                { userId: receiverId, role: 'MEMBER' }
              ]
            }
          }
        });
        console.log('✅ Nouvelle conversation créée automatiquement:', conversation.id);
      }

      finalConversationId = conversation.id;
    }

    if (!finalConversationId) {
      return res.status(400).json({
        error: 'Conversation introuvable ou impossible à créer'
      });
    }

    // Vérifier que l'utilisateur participe à cette conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: finalConversationId,
        userId: senderId
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Accès non autorisé à cette conversation'
      });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: finalConversationId,
        senderId,
        receiverId,
        content: content.trim(),
        messageType,
        metadata,
        replyToId,
        status: 'SENT'
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            identityVerified: true
          }
        },
        receiver: {
          select: {
            id: true,
            fullName: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: finalConversationId },
      data: { lastMessageAt: new Date() }
    });

    console.log('✅ Message envoyé:', message.id);

    // TODO: Envoyer via Socket.IO si connecté
    // socketService.sendToUser(receiverId, 'newMessage', message);

    // TODO: Créer une notification
    if (receiverId && receiverId !== senderId) {
      try {
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: 'MESSAGE',
            title: 'Nouveau message',
            content: `${message.sender.fullName} vous a envoyé un message`,
            relatedId: message.id,
            metadata: {
              conversationId: finalConversationId,
              senderId,
              senderName: message.sender.fullName
            }
          }
        });
      } catch (notifError) {
        console.warn('⚠️ Erreur création notification:', notifError);
      }
    }

    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: message
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi du message' 
    });
  }
});

// Marquer un message comme lu
router.patch('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Vérifier que le message existe et que l'utilisateur est le destinataire
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message non trouvé'
      });
    }

    // Marquer comme lu
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        readAt: new Date(),
        status: 'READ'
      }
    });

    res.json({
      message: 'Message marqué comme lu',
      data: updatedMessage
    });

  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du message' 
    });
  }
});

// Supprimer un message (soft delete)
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Vérifier que le message appartient à l'utilisateur
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message non trouvé ou non autorisé'
      });
    }

    // Soft delete (modifier le contenu)
    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[Message supprimé]',
        metadata: {
          ...message.metadata,
          deleted: true,
          deletedAt: new Date()
        }
      }
    });

    res.json({
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du message' 
    });
  }
});

module.exports = router;