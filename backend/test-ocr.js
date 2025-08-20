const Tesseract = require('tesseract.js');

// Replace with the path to your actual image
const imagePath = 'path/to/your/image.png'; // 👈 Update this!

console.log('Starting OCR...');

Tesseract.recognize(imagePath, 'eng', {
  logger: (m) => console.log(m), // Logs progress
})
  .then(({ data: { text } }) => {
    console.log('OCR Result:\n', text);
  })
  .catch((err) => {
    console.error('OCR Error:', err);
  });