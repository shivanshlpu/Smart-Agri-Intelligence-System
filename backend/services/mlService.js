const axios = require("axios");
const ML_URL = process.env.ML_SERVER_URL || "http://localhost:8000";

const predictLoss   = (data) => axios.post(`${ML_URL}/predict/loss`,   data, { timeout: 60000 });
const predictPrice  = (data) => axios.post(`${ML_URL}/predict/price`,  data, { timeout: 60000 });
const predictSupply = (data) => axios.post(`${ML_URL}/predict/supply`, data, { timeout: 60000 });
const predictSoil   = (data) => axios.post(`${ML_URL}/predict/soil`,   data, { timeout: 60000 });
const checkHealth   = ()     => axios.get(`${ML_URL}/health`,               { timeout: 15000 });

module.exports = { predictLoss, predictPrice, predictSupply, predictSoil, checkHealth };
