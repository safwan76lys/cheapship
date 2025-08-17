require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmail() {
  console.log('📧 Test d\'envoi d\'email Cheapship...\n');
  
  const testUser = {
    email: 'info@cheapship.fr',
    fullName: 'Test Cheapship'
  };
  
  console.log('Configuration email:');
  console.log('- SMTP Host:', process.env.MAIL_HOST);
  console.log('- SMTP Port:', process.env.MAIL_PORT);
  console.log('- SMTP User:', process.env.MAIL_USER);
  console.log('- From Email:', process.env.EMAIL_FROM);
  console.log('');
  
  try {
    console.log('Envoi vers:', testUser.email);
    const result = await emailService.sendVerificationEmail(testUser, 'test-token-cheapship-123');
    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', result.messageId);
    if (result.response) {
      console.log('Response:', result.response);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code d\'erreur:', error.code);
    }
    if (error.responseCode) {
      console.error('Code de réponse SMTP:', error.responseCode);
    }
    console.error('Stack:', error.stack);
  }
}

testEmail();

