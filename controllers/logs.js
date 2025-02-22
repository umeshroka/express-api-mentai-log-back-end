// controllers/logs.js

const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const log = require("../models/log.js");
const router = express.Router();

// add routes here
router.post("/", verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const log = await log.create(req.body);
    log._doc.author = req.user;
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const logs = await log.find({})
      .populate("author")
      .sort({ createdAt: "desc" });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/:logId", verifyToken, async (req, res) => {
    try {
      const log = await log.findById(req.params.logId).populate([
        'author',
        'comments.author',
      ]);
      res.status(200).json(log);
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

  router.put("/:logId", verifyToken, async (req, res) => {
    try {
      // Find the log:
      const log = await log.findById(req.params.logId);
  
      // Check permissions:
      if (!log.author.equals(req.user._id)) {
        return res.status(403).send("You're not allowed to do that!");
      }
  
      // Update log:
      const updatedlog = await log.findByIdAndUpdate(
        req.params.logId,
        req.body,
        { new: true }
      );
  
      // Append req.user to the author property:
      updatedlog._doc.author = req.user;
  
      // Issue JSON response:
      res.status(200).json(updatedlog);
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

  router.delete("/:logId", verifyToken, async (req, res) => {
    try {
      const log = await log.findById(req.params.logId);
  
      if (!log.author.equals(req.user._id)) {
        return res.status(403).send("You're not allowed to do that!");
      }
  
      const deletedlog = await log.findByIdAndDelete(req.params.logId);
      res.status(200).json(deletedlog);
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

  router.post("/:logId/comments", verifyToken, async (req, res) => {
    try {
      req.body.author = req.user._id;
      const log = await log.findById(req.params.logId);
      log.comments.push(req.body);
      await log.save();
  
      // Find the newly created comment:
      const newComment = log.comments[log.comments.length - 1];
  
      newComment._doc.author = req.user;
  
      // Respond with the newComment:
      res.status(201).json(newComment);
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

  router.put("/:logId/comments/:commentId", verifyToken, async (req, res) => {
    try {
      const log = await log.findById(req.params.logId);
      const comment = log.comments.id(req.params.commentId);
  
      // ensures the current user is the author of the comment
      if (comment.author.toString() !== req.user._id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to edit this comment" });
      }
  
      comment.text = req.body.text;
      await log.save();
      res.status(200).json({ message: "Comment updated successfully" });
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

  router.delete("/:logId/comments/:commentId", verifyToken, async (req, res) => {
    try {
      const log = await log.findById(req.params.logId);
      const comment = log.comments.id(req.params.commentId);
  
      // ensures the current user is the author of the comment
      if (comment.author.toString() !== req.user._id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to edit this comment" });
      }
  
      log.comments.remove({ _id: req.params.commentId });
      await log.save();
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

module.exports = router;
