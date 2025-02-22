const mongoose = require("mongoose");

const emotionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const sentimentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const keywordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const entitiesSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

const logSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    text: {
      type: String,
      required: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emotion: [emotionSchema],
    sentiment: [sentimentSchema],
    keyword: [keywordSchema],
    entities: [entitiesSchema],
  },
  { timestamps: true }
);

const log = mongoose.model("log", logSchema);

module.exports = log;
