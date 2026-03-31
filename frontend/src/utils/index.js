export const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

export const formatUrgency = (urgency) => {
  const urgencyColors = {
    High: "#f44336",
    Medium: "#ff9800",
    Low: "#4caf50",
    "Needs Review": "#2196f3",
    "Not Applicable": "#9e9e9e",
  };
  return urgencyColors[urgency] || "#9e9e9e";
};

export const formatHelpType = (helpType) => {
  const helpTypeColors = {
    Medical: "#f44336",
    Food: "#4caf50",
    Shelter: "#2196f3",
    Rescue: "#ff5722",
    Evacuation: "#9c27b0",
    Information: "#607d8b",
    Other: "#795548",
  };
  return helpTypeColors[helpType] || "#9e9e9e";
};

export const handleError = (error) => {
  console.error("Error:", error);
  let message = "Something went wrong";

  if (error.response) {
    message = error.response.data?.message || error.response.statusText;
  } else if (error.request) {
    message = "Network error - please check your connection";
  } else {
    message = error.message;
  }

  return {
    error: true,
    message,
  };
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const getProcessingStatusColor = (status) => {
  const colors = {
    Pending: "#ff9800",
    Processing: "#2196f3",
    Completed: "#4caf50",
    Failed: "#f44336",
  };
  return colors[status] || "#9e9e9e";
};
