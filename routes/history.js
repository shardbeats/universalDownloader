const express = require("express");
const router = express.Router();
const {
  handleListHistory,
  handleAddHistory,
  handleClearHistory,
  handleStatsHistory,
} = require("../controllers/historyController");

router.get("/", handleListHistory);
router.post("/", handleAddHistory);
router.delete("/", handleClearHistory);
router.get("/stats", handleStatsHistory);

module.exports = router;
