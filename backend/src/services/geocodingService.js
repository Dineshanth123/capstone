const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "openstreetmap", 
  httpAdapter: "https",
  formatter: null,
};

const geocoder = NodeGeocoder(options);


async function geocodeLocation(locationName) {
  try {
    if (!locationName || typeof locationName !== "string") {
      return null;
    }

    const results = await geocoder.geocode(locationName);

    if (results && results.length > 0) {
      const location = results[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: location.formattedAddress,
        country: location.country,
        city: location.city,
        state: location.state,
        zipcode: location.zipcode,
      };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for "${locationName}":`, error.message);
    return null;
  }
}

async function geocodeMultipleLocations(locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const geocodedLocations = await Promise.all(
    locations.map(async (location) => {
      const locationName =
        typeof location === "string" ? location : location.name;
      const coordinates = await geocodeLocation(locationName);

      return {
        name: locationName,
        coordinates: coordinates
          ? {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }
          : null,
        formattedAddress: coordinates?.formattedAddress || null,
      };
    }),
  );

  return geocodedLocations;
}

async function reverseGeocode(latitude, longitude) {
  try {
    const results = await geocoder.reverse({ lat: latitude, lon: longitude });

    if (results && results.length > 0) {
      return {
        formattedAddress: results[0].formattedAddress,
        city: results[0].city,
        state: results[0].state,
        country: results[0].country,
      };
    }

    return null;
  } catch (error) {
    console.error(
      `Reverse geocoding error for (${latitude}, ${longitude}):`,
      error.message,
    );
    return null;
  }
}

function isValidCoordinates(latitude, longitude) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
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
  const distance = R * c;
  return distance;
}

module.exports = {
  geocodeLocation,
  geocodeMultipleLocations,
  reverseGeocode,
  isValidCoordinates,
  calculateDistance,
};
