const { TwitterApi } = require("twitter-api-v2");
const Post = require("../models/Post");
const { extractDetails } = require("./extractors");

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
async function fetchTweetsAndSave(query = "help OR urgent OR rescue", maxResults = 10) {
  try {
    const response = await twitterClient.v2.search(query, {
      "tweet.fields": ["author_id", "created_at"],
      max_results: maxResults,
    });

    const tweets = response.data || [];
    const savedPosts = [];

    for (const tweet of tweets) {
      const exists = await Post.findOne({ "source.postId": tweet.id });
      if (exists) continue;
      const post = new Post({
        rawText: tweet.text,
        source: {
          platform: "Twitter",
          postId: tweet.id,
          author: tweet.author_id,
          url: `https://twitter.com/i/web/status/${tweet.id}`,
        },
        processingStatus: "Processing",
      });

      try {
        const extracted = await extractDetails(post.rawText);

        post.processedText = post.rawText;
        post.classification = extracted.classification;
        post.extractedDetails = {
          names: extracted.names,
          contacts: extracted.contacts,
          locations: extracted.locations,
          helpType: extracted.helpType,
          timestamps: extracted.timestamps,
          quantities: extracted.quantities,
          rawNlpResponse: extracted.rawNlpResponse,
        };
        post.processingStatus = "Completed";
      } catch (err) {
        console.error("Error processing tweet:", err.message);
        post.processingStatus = "Failed";
        post.processingErrors.push({
          stage: "NLP Extraction",
          message: err.message,
        });
      }

      const saved = await post.save();
      savedPosts.push(saved);
    }

    return savedPosts;
  } catch (err) {
    console.error("Twitter fetch error:", err.message);
    throw err;
  }
}

module.exports = { fetchTweetsAndSave };
