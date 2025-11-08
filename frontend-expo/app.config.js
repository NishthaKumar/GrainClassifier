// Load .env into process.env and expose SERVER_URL to Expo via `extra`
const dotenv = require('dotenv');
dotenv.config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      SERVER_URL: process.env.SERVER_URL || 'http://127.0.0.1:5001',
    },
  };
};
