import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended, // Utilise la config recommandée d'ESLint
  {
    files: ['**/*.js'], // Applique à tous les fichiers .js
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node, // Définit les variables globales de Node.js (ex: __dirname, process)
      },
    },
    rules: {
      // Ajoute ici des règles personnalisées si besoin
      // ex: 'no-console': 'warn'
    },
  },
];