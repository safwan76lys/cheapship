const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  // ✅ CORRECTION: createTransport (pas createTransporter)
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,        // smtp.ionos.fr
    port: parseInt(process.env.MAIL_PORT), // 465
    secure: process.env.MAIL_SECURE === 'true', // true pour SSL
    auth: {
      user: process.env.MAIL_USER,      // info@cheapship.fr
      pass: process.env.MAIL_PASS       // Lysft@2236
    },
    // Options supplémentaires pour IONOS
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV === 'development', // Debug en développement
    logger: process.env.NODE_ENV === 'development' // Logs en développement
  });
};

// Service d'envoi d'emails
const emailService = {
  // Envoyer email de vérification
  async sendVerificationEmail(email, token) {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/auth?action=verify&token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,      // "Cheapship <info@cheapship.fr>"
      to: email,
      subject: '✅ Vérifiez votre compte Cheapship',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #ffffff; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>✈️ Bienvenue sur Cheapship !</h1>
            </div>
            <div class="content">
              <h2>Vérifiez votre adresse email</h2>
              <p>Merci de vous être inscrit sur Cheapship ! Pour activer votre compte, cliquez sur le bouton ci-dessous :</p>
              
              <a href="${verificationUrl}" class="button">✅ Vérifier mon email</a>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="background: #f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <p><strong>Ce lien expire dans 24 heures.</strong></p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
              
              <p>Si vous n'avez pas créé de compte Cheapship, ignorez cet email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Cheapship - Transport collaboratif</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de vérification envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email vérification:', error);
      return { success: false, error: error.message };
    }
  },

  // Envoyer email de réinitialisation mot de passe
  async sendPasswordReset(email, token) {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/auth?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,      // "Cheapship <info@cheapship.fr>"
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe Cheapship',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #ffffff; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🔐 Réinitialisation mot de passe</h1>
            </div>
            <div class="content">
              <h2>Réinitialisez votre mot de passe</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe Cheapship.</p>
              
              <a href="${resetUrl}" class="button">🔐 Changer mon mot de passe</a>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="background: #f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul>
                  <li>Ce lien expire dans <strong>1 heure</strong></li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau</li>
                </ul>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
              
              <p><strong>Conseils de sécurité :</strong></p>
              <ul>
                <li>Utilisez un mot de passe unique et complexe</li>
                <li>Minimum 8 caractères avec majuscules, chiffres et caractères spéciaux</li>
                <li>Ne partagez jamais vos identifiants</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2025 Cheapship - Transport collaboratif</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email de réinitialisation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email réinitialisation:', error);
      return { success: false, error: error.message };
    }
  },

  // Tester la configuration email
  async testConnection() {
    const transporter = createTransporter();
    
    try {
      await transporter.verify();
      console.log('✅ Configuration email IONOS valide');
      return { 
        success: true, 
        message: 'Configuration email IONOS valide',
        host: process.env.MAIL_HOST,
        user: process.env.MAIL_USER
      };
    } catch (error) {
      console.error('❌ Erreur configuration email IONOS:', error);
      return { 
        success: false, 
        error: error.message,
        host: process.env.MAIL_HOST,
        user: process.env.MAIL_USER
      };
    }
  }
};

module.exports = emailService;