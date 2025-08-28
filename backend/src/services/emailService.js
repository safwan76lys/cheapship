const transporter = require('../config/mail');
const path = require('path');

class EmailService {
  constructor() {
    // Test de connexion au démarrage avec IONOS
    this.testConnection();
  }

  async testConnection() {
    try {
      await transporter.verify();
      console.log('✅ Service email IONOS (smtp.ionos.fr) connecté et prêt');
      console.log('📧 Email configuré:', process.env.EMAIL_FROM);
    } catch (error) {
      console.error('❌ Erreur connexion IONOS smtp.ionos.fr:', error.message);
      console.error('🔧 Vérifiez vos credentials IONOS dans .env');
    }
  }

  async sendVerificationEmail(user, token) {
    // ✅ CORRECTION : URL correcte pour la vérification
    const frontendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://cheapship-frontend.onrender.com'
  : process.env.FRONTEND_URL || 'http://localhost:5173';

const verificationUrl = `${frontendUrl}/auth?token=${token}&verify=true`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: '✅ Vérifiez votre compte Cheapship - Bienvenue !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #059669 0%, #047857 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: linear-gradient(135deg, #059669 0%, #047857 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 12px; 
              margin: 30px 0;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }
            .footer { 
              background-color: #f8fafc;
              text-align: center; 
              padding: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Bienvenue sur Cheapship !</h1>
              <p style="margin: 10px 0 0 0; color: #a7f3d0; font-size: 16px;">Votre voyage commence ici</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Bonjour ${user.fullName} ! 👋</h2>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
                Merci de vous être inscrit sur <strong>Cheapship</strong>, la première plateforme de transport collaboratif géolocalisée ! 🚀
              </p>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
                Pour activer votre compte et commencer à utiliser tous nos services, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" class="button" style="font-size: 16px;">✅ Vérifier mon email</a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
                Besoin d'aide ? Notre équipe support est disponible à<br>
                <a href="mailto:support@cheapship.fr" style="color: #059669; text-decoration: none; font-weight: bold;">support@cheapship.fr</a>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 5px 0;">© 2025 Cheapship. Tous droits réservés.</p>
              <p style="margin: 0;">Transport collaboratif géolocalisé dans toute l'Europe.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bienvenue sur Cheapship !

Bonjour ${user.fullName},

Merci de vous être inscrit sur Cheapship, la première plateforme de transport collaboratif géolocalisée !

Pour activer votre compte, cliquez sur ce lien :
${verificationUrl}

Ce lien expire dans 24 heures.

Besoin d'aide ? Contactez-nous à support@cheapship.fr

© 2025 Cheapship - Transport collaboratif
      `
    };

    try {
      console.log(`📧 Envoi email de vérification IONOS à: ${user.email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de vérification envoyé via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: user.email,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email de vérification IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: '🔑 Réinitialisation de votre mot de passe Cheapship',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 12px; 
              margin: 30px 0;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            }
            .footer { 
              background-color: #f8fafc;
              text-align: center; 
              padding: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔑 Réinitialisation du mot de passe</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Bonjour ${user.fullName},</h2>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
                Vous avez demandé la réinitialisation de votre mot de passe sur votre compte Cheapship.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" class="button" style="font-size: 16px;">🔑 Réinitialiser mon mot de passe</a>
              </div>
              
              <p style="text-align: center; color: #6b7280; font-size: 14px;">
                Ce lien expire dans 1 heure pour votre sécurité.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© 2025 Cheapship. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Réinitialisation du mot de passe - Cheapship

Bonjour ${user.fullName},

Vous avez demandé la réinitialisation de votre mot de passe Cheapship.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

Ce lien expire dans 1 heure.

© 2025 Cheapship - Transport collaboratif
      `
    };

    try {
      console.log(`📧 Envoi email de réinitialisation IONOS à: ${user.email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de réinitialisation envoyé via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: user.email,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email de réinitialisation IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async sendWelcomeEmail(user) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: '🎉 Votre compte Cheapship est activé - Commencez votre aventure !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 12px; 
              margin: 20px 0;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .footer { 
              background-color: #f8fafc;
              text-align: center; 
              padding: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Félicitations ${user.fullName} !</h1>
              <p style="margin: 10px 0 0 0; color: #a7f3d0; font-size: 16px;">Votre compte Cheapship est maintenant activé</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 30px;">
                Bienvenue dans la communauté Cheapship ! 🚀
              </h2>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${dashboardUrl}" class="button" style="font-size: 16px;">🚀 Accéder à mon tableau de bord</a>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© 2025 Cheapship. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Félicitations ! Votre compte Cheapship est activé

Bonjour ${user.fullName},

Votre compte est maintenant 100% activé !

Accédez à votre tableau de bord : ${dashboardUrl}

© 2025 Cheapship - Transport collaboratif
      `
    };

    try {
      console.log(`📧 Envoi email de bienvenue IONOS à: ${user.email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenue envoyé via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: user.email,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email de bienvenue IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async sendAlertEmail(user, notification) {
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${notification.actionUrl}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `🔔 ${notification.title} - Nouvelle opportunité Cheapship`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 12px; 
              margin: 30px 0;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }
            .footer { 
              background-color: #f8fafc;
              text-align: center; 
              padding: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔔 ${notification.title}</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Bonjour ${user.fullName} !</h2>
              
              <p style="margin: 0; color: #4b5563; font-size: 14px;">
                ${notification.message}
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${actionUrl}" class="button" style="font-size: 16px;">🚀 Voir l'offre</a>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© 2025 Cheapship. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Nouvelle opportunité Cheapship - ${notification.title}

Bonjour ${user.fullName},

${notification.message}

Voir l'offre : ${actionUrl}

© 2025 Cheapship - Transport collaboratif
      `
    };

    try {
      console.log(`📧 Envoi email d'alerte IONOS à: ${user.email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email d\'alerte envoyé via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: user.email,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email d\'alerte IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async sendMessageNotificationEmail(user, message, sender) {
    const messagesUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/messages`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `💬 Nouveau message de ${sender.fullName} - Cheapship`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 12px; 
              margin: 30px 0;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
            }
            .footer { 
              background-color: #f8fafc;
              text-align: center; 
              padding: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💬 Nouveau message</h1>
              <p style="margin: 10px 0 0 0; color: #a5f3fc; font-size: 16px;">De ${sender.fullName}</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Bonjour ${user.fullName},</h2>
              
              <p style="margin: 0; color: #334155; font-size: 14px;">
                "${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}"
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${messagesUrl}" class="button" style="font-size: 16px;">💬 Répondre</a>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© 2025 Cheapship. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Nouveau message sur Cheapship

Bonjour ${user.fullName},

Vous avez reçu un nouveau message de ${sender.fullName}.

Message : "${message.content.substring(0, 200)}${message.content.length > 200 ? '...' : ''}"

Répondre : ${messagesUrl}

© 2025 Cheapship - Transport collaboratif
      `
    };

    try {
      console.log(`📧 Envoi notification message IONOS à: ${user.email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Notification message envoyée via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: user.email,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi notification message IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async sendEmail(emailData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
    };

    try {
      console.log(`📧 Envoi email générique IONOS à: ${emailData.to}`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email générique envoyé via IONOS:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        email: emailData.to,
        service: 'IONOS'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email générique IONOS:', error);
      throw new Error(`Erreur envoi email IONOS: ${error.message}`);
    }
  }

  async getServiceStatus() {
    try {
      await transporter.verify();
      return {
        status: 'connected',
        service: 'IONOS',
        smtp: 'smtp.ionos.fr:465',
        from: process.env.EMAIL_FROM,
        ssl: true
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'IONOS',
        error: error.message,
        smtp: 'smtp.ionos.fr:465'
      };
    }
  }

  logEmailSent(type, recipient, success = true) {
    const timestamp = new Date().toISOString();
    const status = success ? '✅' : '❌';
    console.log(`[EMAIL_SERVICE] ${timestamp} ${status} ${type} -> ${recipient}`);
  }
}

module.exports = new EmailService();