const axios = require("axios");
const ML_URL = process.env.ML_SERVER_URL || "http://localhost:8000";

const predictLoss   = (data) => axios.post(`${ML_URL}/predict/loss`,   data, { timeout: 15000 });
const predictPrice  = (data) => axios.post(`${ML_URL}/predict/price`,  data, { timeout: 15000 });
const predictSupply = (data) => axios.post(`${ML_URL}/predict/supply`, data, { timeout: 15000 });
const checkHealth   = ()     => axios.get(`${ML_URL}/health`,               { timeout: 5000  });

module.exports = { predictLoss, predictPrice, predictSupply, checkHealth };
