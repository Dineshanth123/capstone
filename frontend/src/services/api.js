import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const textPostsAPI = {
  getPosts: () => api.get("/text-posts"),

  createPost: (postData) => api.post("/text-posts", postData),

  processPost: (id) => api.post(`/text-posts/process/${id}`),

  processAllPosts: () => api.post("/text-posts/process-all"),

  getUrgentPosts: () => api.get("/text-posts/urgent"),

  getStats: () => api.get("/text-posts/stats"),

  fetchTwitterPosts: (query = "news", limit = 10) =>
    api.get(
      `/text-posts/twitter/fetch?query=${encodeURIComponent(
        query,
      )}&limit=${limit}`,
    ),

  deleteAllPosts: () => api.delete("/text-posts"),
};

export const imagePostsAPI = {
  getImages: () => api.get("/image-posts"),

  uploadImage: (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.post("/image-posts/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  processImage: (id) => api.post(`/image-posts/process/${id}`),

  processAllImages: () => api.post("/image-posts/process-all"),

  deleteAllImages: () => api.delete("/image-posts/delete-all"),
};

export const rootAPI = {
  getStatus: () => api.get("/"),
};

export default api;
