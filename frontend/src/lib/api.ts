import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  googleCallback: (data: { code: string; redirect_uri?: string }) =>
    api.post("/api/auth/google-oauth/callback", data),
  me: () => api.get("/api/auth/me"),
};

export const newsApi = {
  aggregate: (data: { topic: string; target_count?: number }) =>
    api.post("/api/news/aggregate", data),
  verify: (data: { aggregation_id: number }) =>
    api.post("/api/news/verify", data),
  trending: () => api.get("/api/news/trending"),
  daily: () => api.get("/api/news/daily"),
};

export const scriptApi = {
  generate: (data: {
    topic: string;
    verified_facts?: unknown;
    verification_id?: number;
    style?: string;
    duration?: number;
    language?: string;
  }) => api.post("/api/script/generate", data),
  regenerateSegment: (data: { script_id: number; segment_number: number; instructions?: string }) =>
    api.post("/api/script/regenerate-segment", data),
  update: (scriptId: number, data: { script_json: unknown }) =>
    api.put(`/api/script/update/${scriptId}`, data),
  get: (scriptId: number) => api.get(`/api/script/${scriptId}`),
};

export const voiceApi = {
  uploadSample: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/voice/upload-sample", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  generate: (data: { script_id: number; voice_profile_id?: string; preset_voice?: string }) =>
    api.post("/api/voice/generate", data),
  listVoices: () => api.get("/api/voice/voices"),
};

export const avatarApi = {
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/avatar/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  generate: (data: { audio_file_path: string; avatar_id?: string }) =>
    api.post("/api/avatar/generate", data),
};

export const videoApi = {
  generate: (data: {
    script_id: number;
    audio_file_path?: string;
    avatar_video_path?: string;
    use_avatar?: boolean;
  }) => api.post("/api/video/generate", data),
  status: (jobId: number) => api.get(`/api/video/status/${jobId}`),
  list: () => api.get("/api/video/list"),
  download: (videoId: number) =>
    api.get(`/api/video/download/${videoId}`, { responseType: "blob" }),
};

export const youtubeApi = {
  authUrl: () => api.get("/api/youtube/auth-url"),
  connect: (refreshToken: string) =>
    api.post(`/api/youtube/connect?refresh_token=${refreshToken}`),
  upload: (data: {
    video_id: number;
    title: string;
    description: string;
    tags: string[];
    privacy: string;
    schedule_time?: string;
  }) => api.post("/api/youtube/upload", data),
  status: () => api.get("/api/youtube/status"),
};

export const settingsApi = {
  get: () => api.get("/api/settings/"),
  update: (data: Record<string, unknown>) => api.post("/api/settings/", data),
};

export default api;
