const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", ctrl.register);
router.post("/login",    ctrl.login);
router.get("/me",        protect, ctrl.getMe);
router.put("/profile",   protect, ctrl.updateProfile);

module.exports = router;
