const { Vonage } = require('@vonage/server-sdk');

class VonageService {
  constructor() {
    this.vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      signatureSecret: process.env.VONAGE_SIGNATURE_SECRET
    });
  }

  async sendVerificationSMS(phone) {
    try {
      console.log(`Envoi SMS de vérification vers: ${phone}`);
      
      // Valider le format du numéro
      if (!this.validateInternationalPhone(phone)) {
        throw new Error('Format de numéro de téléphone invalide');
      }
      
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

  formatPhoneNumber(phone, defaultCountryCode = null) {
    // Nettoyer le numéro (garder seulement les chiffres et le +)
    let cleanNumber = phone.replace(/[^\d+]/g, '');
    
    // Si le numéro commence déjà par + et a le bon format
    if (cleanNumber.startsWith('+') && cleanNumber.length >= 10) {
      return cleanNumber.substring(1); // Enlever le + pour Vonage
    }
    
    // Si le numéro commence par + sans le +, mais a plus de 10 chiffres
    if (!cleanNumber.startsWith('+') && cleanNumber.length >= 10 && !cleanNumber.startsWith('0')) {
      return cleanNumber;
    }
    
    // Si le numéro commence par 0 (format national)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
      
      // Utiliser le code pays par défaut si fourni
      if (defaultCountryCode) {
        const countryDigits = defaultCountryCode.replace('+', '');
        return countryDigits + cleanNumber;
      } else {
        throw new Error('Code pays requis pour les numéros nationaux (commençant par 0)');
      }
    }
    
    // Autres cas : format non reconnu
    throw new Error('Format de numéro invalide. Utilisez le format international (+33123456789)');
  }

  validateInternationalPhone(phone) {
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Vérifier les formats acceptés :
    // - +33123456789 (avec +)
    // - 33123456789 (sans +)
    // Au minimum 8 chiffres après l'indicatif pays
    const intlPattern = /^(\+?[1-9]\d{1,3})[1-9]\d{6,14}$/;
    
    return intlPattern.test(cleanPhone);
  }

  maskPhoneNumber(phone) {
    // Masquer le numéro pour l'affichage : +33***456789 -> +33***89
    if (phone.length < 8) return phone;
    
    const countryCode = phone.substring(0, 3);
    const lastDigits = phone.slice(-2);
    
    return `${countryCode}***${lastDigits}`;
  }

  // Méthode pour déterminer le pays à partir du numéro
  getCountryFromPhone(phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    const countryCodes = {
      '1': 'US/CA',
      '33': 'FR',
      '34': 'ES', 
      '39': 'IT',
      '44': 'GB',
      '49': 'DE',
      '20': 'EG',
      '212': 'MA',
      '213': 'DZ',
      '216': 'TN',
      '218': 'LY'
      // Ajouter d'autres codes selon vos besoins
    };
    
    // Tester les codes pays les plus longs en premier
    for (let i = 3; i >= 1; i--) {
      const code = cleanPhone.substring(0, i);
      if (countryCodes[code]) {
        return {
          code: code,
          country: countryCodes[code]
        };
      }
    }
    
    return null;
  }

  // Méthode pour envoyer des messages génériques (non-vérification)
  async sendSMS(phone, message) {
    try {
      const response = await this.vonage.sms.send({
        to: phone.replace(/\s/g, ''),
        from: "Cheapship",
        text: message
      });
      
      return {
        success: response.messages[0].status === '0',
        messageId: response.messages[0]['message-id'],
        status: response.messages[0].status,
        errorText: response.messages[0]['error-text']
      };
      
    } catch (error) {
      console.error('Erreur envoi SMS générique:', error);
      throw error;
    }
  }
}

module.exports = new VonageService();