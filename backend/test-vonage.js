const { Vonage } = require('@vonage/server-sdk');
require('dotenv').config();

console.log('Test avec numéro français +33664161759');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

vonage.sms.send({
  to: '+41792593183', // Numéro français sans le +
  from: 'Cheapship',
  text: 'Test SMS Cheapship - Code: 123456'
})
.then(resp => {
  console.log('=== RÉSULTAT SMS FRANCE ===');
  console.log(JSON.stringify(resp, null, 2));
  console.log('Status:', resp.messages[0].status);
  console.log('Price:', resp.messages[0]['message-price']);
  console.log('Network:', resp.messages[0].network);
})
.catch(err => {
  console.log('=== ERREUR ===');
  console.log(JSON.stringify(err, null, 2));
});