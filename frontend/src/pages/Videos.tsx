import { useState, useEffect } from "react";
import { videoApi, youtubeApi } from "@/lib/api";
import { VideoData } from "@/types";
import {
  Video,
  Download,
  Youtube,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Upload,
} from "lucide-react";

export default function Videos() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    tags: "",
    privacy: "private",
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await videoApi.list();
      setVideos(res.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (video: VideoData) => {
    try {
      const res = await videoApi.download(video.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title}.mp4`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  const openUploadModal = (video: VideoData) => {
    setSelectedVideo(video);
    setUploadForm({
      title: video.title,
      description: video.description || `News coverage: ${video.topic}`,
      tags: (video.tags || []).join(", "),
      privacy: "private",
    });
    setShowUploadModal(true);
  };

  const handleYoutubeUpload = async () => {
    if (!selectedVideo) return;
    setUploadingId(selectedVideo.id);
    try {
      const res = await youtubeApi.upload({
        video_id: selectedVideo.id,
        title: uploadForm.title,
        description: uploadForm.description,
        tags: uploadForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        privacy: uploadForm.privacy,
      });
      setShowUploadModal(false);
      loadVideos();
      alert(`Uploaded! YouTube URL: ${res.data.url}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Videos</h1>
          <p className="text-gray-400 mt-1">{videos.length} videos</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No videos yet</h3>
          <p className="text-gray-500">Create your first video from the dashboard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={() => handleDownload(video)}
              onUpload={() => openUploadModal(video)}
              uploading={uploadingId === video.id}
            />
          ))}
        </div>
      )}

      {showUploadModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Upload to YouTube
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Privacy</label>
                <select
                  value={uploadForm.privacy}
                  onChange={(e) => setUploadForm({ ...uploadForm, privacy: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleYoutubeUpload}
                disabled={uploadingId !== null}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video,
  onDownload,
  onUpload,
  uploading,
}: {
  video: VideoData;
  onDownload: () => void;
  onUpload: () => void;
  uploading: boolean;
}) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    completed: { icon: CheckCircle2, color: "text-green-400", label: "Completed" },
    processing: { icon: Loader2, color: "text-yellow-400", label: "Processing" },
    failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
    pending: { icon: Clock, color: "text-gray-400", label: "Pending" },
  };

  const config = statusConfig[video.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
        <Play className="h-12 w-12 text-gray-600" />
        {video.youtube_video_id && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1">
            <Youtube className="h-3 w-3" />
            Published
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm truncate">{video.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{video.topic}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <StatusIcon className={`h-4 w-4 ${config.color} ${video.status === "processing" ? "animate-spin" : ""}`} />
            <span className={`text-xs ${config.color}`}>{config.label}</span>
          </div>
          <span className="text-xs text-gray-500">{Math.round(video.duration)}s</span>
        </div>
        {video.status === "completed" && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg hover:bg-gray-700"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
            {video.youtube_url ? (
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600/10 text-red-400 text-xs rounded-lg hover:bg-red-600/20"
              >
                <ExternalLink className="h-3 w-3" />
                View on YT
              </a>
            ) : (
              <button
                onClick={onUpload}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Youtube className="h-3 w-3" />}
                Upload
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
