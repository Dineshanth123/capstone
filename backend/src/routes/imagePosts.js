const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  uploadImage,
  getAllImages,
  processImage,
  processAllImages,
  deleteAllImages,
} = require("../controllers/imagePostController");

const router = express.Router();

router.get("/", getAllImages);
router.post("/upload", upload.single("image"), uploadImage);
router.post("/process/:id", processImage);
router.post("/process-all", processAllImages);
router.delete("/delete-all", deleteAllImages);

module.exports = router;
