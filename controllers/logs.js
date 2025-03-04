// controllers/logs.js

const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Log = require("../models/log.js");
const { analyseText } = require("../services/watsonService.js");
const router = express.Router();

// add routes here
router.post("/", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const analysis = await analyseText(text);
    if (!analysis) {
      return res.status(500).json({ error: "Failed to analyze text" });
    }

    const emotions = analysis.emotion?.document?.emotion || {};
    const sentiment = analysis.sentiment?.document || {};
    const keywords = analysis.keywords?.[0]?.text || "";
    const entities = analysis.entities?.[0]?.text || "";

    const log = await Log.create({
      title: req.body.title,
      text,
      author: req.user._id,
      analysis: {
        emotions,
        sentiment,
        keywords,
        entities,
      },
    });

    const populatedLog = await Log.findById(log._id).populate("author");

    res.status(201).json(populatedLog);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const logs = await Log.find({ author: req.user._id })
      .populate("author")
      .sort({ createdAt: "desc" });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/:logId", verifyToken, async (req, res) => {
  try {
    const log = await Log.findById(req.params.logId).populate("author");

    // Check permissions:
    if (!log.author.equals(req.user._id)) {
      return res.status(403).send("Unauthorized");
    }
    res.status(200).json(log);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put("/:logId", verifyToken, async (req, res) => {
  try {
    // Find the log:
    const log = await Log.findById(req.params.logId);

    // Check if the logged-in user is the owner:
    if (!log.author.equals(req.user._id)) {
      return res.status(403).json({ error: "You're not allowed to do that!" });
    }

    // Destructure only allowed fields:
    const { title, text } = req.body;
    let updatedLogData = { title };

    // If text is changed, reanalyze:
    if (text && text !== log.text) {
      const analysis = await analyseText(text);
      if (!analysis) {
        return res.status(500).json({ error: "Failed to analyze text" });
      }

      updatedLogData.text = text;
      updatedLogData.analysis = {
        emotions: analysis.emotion?.document?.emotion || {},
        sentiment: analysis.sentiment?.document || {},
        keywords: analysis.keywords?.[0]?.text || "",
        entities: analysis.entities?.[0]?.text || "",
      };
    }

    // Update the log:
    const updatedLog = await Log.findByIdAndUpdate(req.params.logId, updatedLogData, { new: true }).populate("author");

    // Send JSON response:
    res.status(200).json(updatedLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:logId", verifyToken, async (req, res) => {
  try {
    const log = await Log.findById(req.params.logId);

    if (!log.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedlog = await Log.findByIdAndDelete(req.params.logId);
    res.status(200).json(deletedlog);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
