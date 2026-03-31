const express = require("express");
const router = express.Router();
const {
  getHeatmapData,
  getLocationStats,
  getHotspots,
} = require("../controllers/heatmapController");

router.get("/data", getHeatmapData);


router.get("/locations", getLocationStats);

router.get("/hotspots", getHotspots);

module.exports = router;
