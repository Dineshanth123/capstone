const TextPost = require("../models/TextPost");
const ImagePost = require("../models/ImagePost");

const getHeatmapData = async (req, res) => {
  try {
    const { urgency, helpType, timeRange } = req.query;


    const filter = {
      processingStatus: "Completed",
      "extractedDetails.locations.coordinates": { $exists: true, $ne: null },
    };

    if (urgency) {
      filter["classification.urgency"] = urgency;
    }

    
    if (helpType && helpType !== "All") {
      filter["extractedDetails.helpType"] = helpType;
    }

    if (timeRange) {
      const hoursAgo = parseInt(timeRange);
      const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      filter.createdAt = { $gte: timeThreshold };
    }

    const [textPosts, imagePosts] = await Promise.all([
      TextPost.find(filter).select(
        "classification extractedDetails createdAt rawText",
      ),
      ImagePost.find(filter).select(
        "classification extractedDetails createdAt rawText",
      ),
    ]);

    const allPosts = [...textPosts, ...imagePosts];
    const heatmapPoints = [];

    allPosts.forEach((post) => {
      if (post.extractedDetails && post.extractedDetails.locations) {
        post.extractedDetails.locations.forEach((location) => {
          if (
            location.coordinates &&
            location.coordinates.latitude &&
            location.coordinates.longitude
          ) {
            heatmapPoints.push({
              lat: location.coordinates.latitude,
              lng: location.coordinates.longitude,
              intensity: getIntensityFromUrgency(post.classification.urgency),
              urgency: post.classification.urgency,
              helpType: post.extractedDetails.helpType,
              location: location.name,
              formattedAddress: location.formattedAddress,
              confidence: post.classification.confidence,
              timestamp: post.createdAt,
              postId: post._id,
              preview: post.rawText
                ? post.rawText.substring(0, 100)
                : "Image post",
            });
          }
        });
      }
    });

    res.json({
      total: heatmapPoints.length,
      points: heatmapPoints,
      filters: { urgency, helpType, timeRange },
    });
  } catch (err) {
    console.error("Heatmap data error:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching heatmap data", error: err.message });
  }
};

const getLocationStats = async (req, res) => {
  try {
    const { urgency, helpType, timeRange } = req.query;

    const baseMatch = {
      processingStatus: "Completed",
      "extractedDetails.locations": { $exists: true, $ne: [] },
    };

    if (urgency) {
      baseMatch["classification.urgency"] = urgency;
    }
    if (helpType && helpType !== "All") {
      baseMatch["extractedDetails.helpType"] = helpType;
    }
    if (timeRange) {
      const hoursAgo = parseInt(timeRange);
      const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      baseMatch.createdAt = { $gte: timeThreshold };
    }

    const textStats = await TextPost.aggregate([
      { $match: baseMatch },
      { $unwind: "$extractedDetails.locations" },
      {
        $group: {
          _id: "$extractedDetails.locations.name",
          count: { $sum: 1 },
          highUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "High"] }, 1, 0],
            },
          },
          mediumUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "Medium"] }, 1, 0],
            },
          },
          lowUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "Low"] }, 1, 0],
            },
          },
          coordinates: { $first: "$extractedDetails.locations.coordinates" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    const imageStats = await ImagePost.aggregate([
      { $match: baseMatch },
      { $unwind: "$extractedDetails.locations" },
      {
        $group: {
          _id: "$extractedDetails.locations.name",
          count: { $sum: 1 },
          highUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "High"] }, 1, 0],
            },
          },
          mediumUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "Medium"] }, 1, 0],
            },
          },
          lowUrgency: {
            $sum: {
              $cond: [{ $eq: ["$classification.urgency", "Low"] }, 1, 0],
            },
          },
          coordinates: { $first: "$extractedDetails.locations.coordinates" },
        },
      },
    ]);

    const locationMap = new Map();

    [...textStats, ...imageStats].forEach((stat) => {
      const existing = locationMap.get(stat._id) || {
        location: stat._id,
        count: 0,
        highUrgency: 0,
        mediumUrgency: 0,
        lowUrgency: 0,
        coordinates: stat.coordinates,
      };

      existing.count += stat.count;
      existing.highUrgency += stat.highUrgency;
      existing.mediumUrgency += stat.mediumUrgency;
      existing.lowUrgency += stat.lowUrgency;

      locationMap.set(stat._id, existing);
    });

    const combinedStats = Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    res.json(combinedStats);
  } catch (err) {
    console.error("Location stats error:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching location stats", error: err.message });
  }
};

const getHotspots = async (req, res) => {
  try {
    const { radius = 50 } = req.query; 

    const filter = {
      processingStatus: "Completed",
      "classification.urgency": "High",
      "extractedDetails.locations.coordinates": { $exists: true, $ne: null },
    };

    const [textPosts, imagePosts] = await Promise.all([
      TextPost.find(filter).select("classification extractedDetails createdAt"),
      ImagePost.find(filter).select(
        "classification extractedDetails createdAt",
      ),
    ]);

    const allPosts = [...textPosts, ...imagePosts];
    const clusters = [];

    allPosts.forEach((post) => {
      post.extractedDetails.locations?.forEach((location) => {
        if (location.coordinates?.latitude && location.coordinates?.longitude) {
          const point = {
            lat: location.coordinates.latitude,
            lng: location.coordinates.longitude,
            urgency: post.classification.urgency,
          };

          let foundCluster = false;
          for (const cluster of clusters) {
            const distance = calculateDistance(
              point.lat,
              point.lng,
              cluster.centerLat,
              cluster.centerLng,
            );

            if (distance <= parseFloat(radius)) {
              cluster.count++;
              cluster.posts.push(post._id);
              foundCluster = true;
              break;
            }
          }

          if (!foundCluster) {
            clusters.push({
              centerLat: point.lat,
              centerLng: point.lng,
              count: 1,
              posts: [post._id],
              urgency: point.urgency,
            });
          }
        }
      });
    });

    const hotspots = clusters
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map((cluster) => ({
        ...cluster,
        severity:
          cluster.count >= 5
            ? "Critical"
            : cluster.count >= 3
              ? "High"
              : "Medium",
      }));

    res.json({ hotspots, total: hotspots.length });
  } catch (err) {
    console.error("Hotspots error:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching hotspots", error: err.message });
  }
};


function getIntensityFromUrgency(urgency) {
  switch (urgency) {
    case "High":
      return 1.0;
    case "Medium":
      return 0.6;
    case "Low":
      return 0.3;
    default:
      return 0.1;
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  getHeatmapData,
  getLocationStats,
  getHotspots,
};
