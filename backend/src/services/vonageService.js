const { Vonage } = require('@vonage/server-sdk');

class VonageService {
  constructor() {
    this.vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET
    });
  }

  async sendVerificationSMS(phone) {
    try {
      console.log(`Envoi SMS de vérification vers: ${phone}`);
      
      // Générer un code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const response = await this.vonage.sms.send({
        to: phone.replace(/\s/g, ''),
        from: "Cheapship",
        text: `Votre code de verification Cheapship: ${code}. Valide 10 minutes.`
      });
      
      console.log('=== RÉPONSE SMS VONAGE ===');
      console.log(JSON.stringify(response, null, 2));
      console.log('========================');
      
      if (response.messages[0].status === '0') {
        return {
          success: true,
          code: code,
          messageId: response.messages[0]['message-id'],
          status: response.messages[0].status
        };
      } else {
        throw new Error(`SMS failed: ${response.messages[0]['error-text']}`);
      }
      
    } catch (error) {
      console.log('=== ERREUR SMS VONAGE ===');
      console.log(JSON.stringify(error, null, 2));
      console.log('========================');
      throw error;
    }
  }

  formatPhoneNumber(phone, countryCode = '+33') {
    let cleanNumber = phone.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('0')) {
      cleanNumber = countryCode.replace('+', '') + cleanNumber.substring(1);
    }
    
    if (!cleanNumber.startsWith(countryCode.replace('+', ''))) {
      cleanNumber = countryCode.replace('+', '') + cleanNumber;
    }
    
    return cleanNumber;
  }
}

module.exports = new VonageService();