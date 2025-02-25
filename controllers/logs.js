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
    const keywords = analysis.keywords?.map((kw) => kw.text) || [];
    const entities = analysis.entities?.map((ent) => ent.text) || [];

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

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const logs = await Log.find({})
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
    res.status(200).json(log);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put("/:logId", verifyToken, async (req, res) => {
  try {
    // Find the log:
    const log = await Log.findById(req.params.logId);

    // Check permissions:
    if (!log.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update log:
    // Check if the text has changed
    const updatedText = req.body.text || log.text;
    let updatedLog = log;

    if (updatedText !== log.text) {
      // Text has changed, so reanalyze it
      const analysis = await analyseText(updatedText);
      if (!analysis) {
        return res.status(500).json({ error: "Failed to analyze text" });
      }

      // Extract data from Watson's response
      const emotions = analysis.emotion?.document?.emotion || {};
      const sentiment = analysis.sentiment?.document || {};
      const keywords = analysis.keywords?.map((kw) => kw.text) || [];
      const entities = analysis.entities?.map((ent) => ent.text) || [];

      // Update the log with the new data
      updatedLog = await Log.findByIdAndUpdate(
        req.params.logId,
        {
          ...req.body,
          analysis: {
            emotions,
            sentiment,
            keywords,
            entities,
          },
        },
        { new: true }
      );
    } else {
      // If the text hasn't changed, just update other fields
      updatedLog = await Log.findByIdAndUpdate(req.params.logId, req.body, {
        new: true,
      });
    }

    // Append req.user to the author property:
    updatedLog._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedLog);
  } catch (err) {
    res.status(500).json({ err: err.message });
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

// router.post("/:logId/comments", verifyToken, async (req, res) => {
//   try {
//     req.body.author = req.user._id;
//     const log = await Log.findById(req.params.logId);
//     log.comments.push(req.body);
//     await log.save();

//     // Find the newly created comment:
//     const newComment = log.comments[log.comments.length - 1];

//     newComment._doc.author = req.user;

//     // Respond with the newComment:
//     res.status(201).json(newComment);
//   } catch (err) {
//     res.status(500).json({ err: err.message });
//   }
// });

// router.put("/:logId/comments/:commentId", verifyToken, async (req, res) => {
//   try {
//     const log = await log.findById(req.params.logId);
//     const comment = log.comments.id(req.params.commentId);

//     // ensures the current user is the author of the comment
//     if (comment.author.toString() !== req.user._id) {
//       return res
//         .status(403)
//         .json({ message: "You are not authorized to edit this comment" });
//     }

//     comment.text = req.body.text;
//     await log.save();
//     res.status(200).json({ message: "Comment updated successfully" });
//   } catch (err) {
//     res.status(500).json({ err: err.message });
//   }
// });

// router.delete("/:logId/comments/:commentId", verifyToken, async (req, res) => {
//   try {
//     const log = await log.findById(req.params.logId);
//     const comment = log.comments.id(req.params.commentId);

//     // ensures the current user is the author of the comment
//     if (comment.author.toString() !== req.user._id) {
//       return res
//         .status(403)
//         .json({ message: "You are not authorized to edit this comment" });
//     }

//     log.comments.remove({ _id: req.params.commentId });
//     await log.save();
//     res.status(200).json({ message: "Comment deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ err: err.message });
//   }
// });

module.exports = router;
