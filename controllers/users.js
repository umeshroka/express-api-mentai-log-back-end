const express = require("express");
const router = express.Router();

const Log = require("../models/log");

const verifyToken = require("../middleware/verify-token");

router.get("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user._id !== req.params.userId) {
      return res.status(403).json({ err: "Unauthorized" });
    }

    const logs = await Log.find({ author: req.params.userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(7);

    if (!logs.length) {
      return res.status(404).json({ error: "No logs found." });
    }

    const sentimentData = logs.map((log) => ({
      date: log.createdAt.toISOString().split("T")[0], // Format: YYYY-MM-DD
      score: log.analysis.sentiment.score,
    }));

    const emotionsData = logs.map((log) => ({
      date: log.createdAt.toISOString().split("T")[0],
      emotions: log.analysis.emotions,
    }));

    const countOccurrences = (items) => {
      return items.flatMap((item) => item || []).reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});
    };

    const keywordData = countOccurrences(logs.flatMap((log) => log.analysis.keywords));
    const entityData = countOccurrences(logs.flatMap((log) => log.analysis.entities));


    res.json({ sentimentData, emotionsData, keywordData, entityData });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
