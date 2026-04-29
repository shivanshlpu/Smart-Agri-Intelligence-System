const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/predictionController");

router.post("/loss",   protect, ctrl.getLossPrediction);
router.post("/price",  protect, ctrl.getPricePrediction);
router.post("/supply", protect, ctrl.getSupplyPrediction);
router.post("/soil",   protect, ctrl.getSoilPrediction);

module.exports = router;
