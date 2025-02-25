const dotenv = require("dotenv");
dotenv.config();

const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

const nlu = new NaturalLanguageUnderstandingV1({
  version: "2022-04-07",
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  }),
  serviceUrl: process.env.WATSON_URL,
});

const analyseText = async (text) => {
  try {
    const response = await nlu.analyze({
      text: text,
      features: {
        emotion: { document: true },
        entities: { limit: 3},
        keywords: { limit: 3},
        sentiment: { document: true},
      },
    });

    return response.result;
  } catch (error) {
    console.error("Wastson NLU error:", error);
    return null;
  }
};

module.exports = { analyseText };