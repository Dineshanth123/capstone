const express = require("express");
const {
  getPosts,
  createPost,
  processPost,
  processAllPosts,
  getUrgentPosts,
  getStats,
  fetchTwitterPosts,
  deleteAllPosts,
} = require("../controllers/textPostController");
const { testNotificationSetup } = require("../services/notificationService");

const router = express.Router();

router.get("/", getPosts);
router.post("/", createPost);
router.post("/process/:id", processPost);
router.post("/process-all", processAllPosts);
router.get("/urgent", getUrgentPosts);
router.get("/stats", getStats);
router.get("/twitter/fetch", fetchTwitterPosts);
router.delete("/", deleteAllPosts);

router.get("/test-notifications", async (req, res) => {
  try {
    const results = await testNotificationSetup();
    res.json({
      message: "Notification configuration test",
      ...results,
    });
  } catch (error) {
    res.status(500).json({ message: "Test failed", error: error.message });
  }
});

module.exports = router;
