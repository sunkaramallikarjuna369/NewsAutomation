import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { newsApi, videoApi, settingsApi } from "@/lib/api";
import { VideoData, Settings } from "@/types";
import {
  Search,
  TrendingUp,
  Video,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  Youtube,
  BarChart3,
  Zap,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [trending, setTrending] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosRes, settingsRes, trendingRes] = await Promise.allSettled([
        videoApi.list(),
        settingsApi.get(),
        newsApi.trending(),
      ]);
      if (videosRes.status === "fulfilled") setVideos(videosRes.value.data);
      if (settingsRes.status === "fulfilled") setSettings(settingsRes.value.data);
      if (trendingRes.status === "fulfilled") setTrending(trendingRes.value.data.trending_topics || []);
    } catch {
      // silently handle
    }
  };

  const handleAggregate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await newsApi.aggregate({ topic: topic.trim(), target_count: 15 });
      const aggregationId = res.data.id;
      navigate(`/create?topic=${encodeURIComponent(topic)}&aggregation_id=${aggregationId}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to aggregate news");
    } finally {
      setLoading(false);
    }
  };

  const completedVideos = videos.filter((v) => v.status === "completed").length;
  const processingVideos = videos.filter((v) => v.status === "processing").length;
  const publishedVideos = videos.filter((v) => v.youtube_video_id).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || user?.username}</h1>
        <p className="text-gray-400 mt-1">Create automated news videos in minutes</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-400" />
          Quick Create
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAggregate()}
              className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter news topic (e.g., India Budget 2026)"
            />
          </div>
          <button
            onClick={handleAggregate}
            disabled={loading || !topic.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Aggregate News (15 sources)
          </button>
        </div>
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}

        {trending.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Trending Topics
            </p>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm text-gray-300 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Video} label="Total Videos" value={videos.length} color="cyan" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedVideos} color="green" />
        <StatCard icon={Clock} label="Processing" value={processingVideos} color="yellow" />
        <StatCard icon={Youtube} label="Published" value={publishedVideos} color="red" />
      </div>

      {settings && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            API Configuration Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ApiStatus label="Groq (LLM)" active={settings.has_groq_api_key} />
            <ApiStatus label="NewsAPI" active={settings.has_newsapi_key} />
            <ApiStatus label="GNews" active={settings.has_gnews_api_key} />
            <ApiStatus label="YouTube" active={settings.has_youtube_connected} />
          </div>
          {!settings.has_groq_api_key && (
            <p className="mt-3 text-sm text-yellow-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Add your Groq API key in Settings for AI-powered script generation
            </p>
          )}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          {videos.length > 0 && (
            <button onClick={() => navigate("/videos")} className="text-sm text-cyan-400 hover:underline">
              View All
            </button>
          )}
        </div>
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No videos yet. Start by entering a topic above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.slice(0, 5).map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                    <Play className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{video.title}</p>
                    <p className="text-xs text-gray-400">
                      {video.topic} &middot; {Math.round(video.duration)}s
                    </p>
                  </div>
                </div>
                <StatusBadge status={video.status} youtubeId={video.youtube_video_id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    green: "text-green-400 bg-green-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorMap[color]} mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function ApiStatus({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-gray-800">
      <div className={`w-2 h-2 rounded-full ${active ? "bg-green-400" : "bg-gray-600"}`} />
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  );
}

function StatusBadge({ status, youtubeId }: { status: string; youtubeId?: string | null }) {
  if (youtubeId) {
    return <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">Published</span>;
  }
  const styles: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400",
    processing: "bg-yellow-500/10 text-yellow-400",
    failed: "bg-red-500/10 text-red-400",
    pending: "bg-gray-500/10 text-gray-400",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
