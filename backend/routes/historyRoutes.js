const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/historyController");

router.get("/",              protect, ctrl.getHistory);
router.get("/stats",         protect, ctrl.getStats);
router.post("/bulk-delete",  protect, ctrl.bulkDelete);
router.get("/:id",           protect, ctrl.getSingle);
router.delete("/:id",        protect, ctrl.deleteRecord);

module.exports = router;
