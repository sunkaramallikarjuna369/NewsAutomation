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
  Shield,
  FileText,
  Film,
  Upload,
  ChevronRight,
  ArrowRight,
  Newspaper,
  ExternalLink,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";

interface DailyArticle {
  source: string;
  title: string;
  summary: string;
  url: string;
  published_date: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [trending, setTrending] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [dailyNews, setDailyNews] = useState<DailyArticle[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

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

  const handleFetchDaily = async () => {
    setDailyLoading(true);
    try {
      const res = await newsApi.daily();
      setDailyNews(res.data.articles || []);
    } catch {
      setDailyNews([]);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleDailyTopicClick = (title: string) => {
    const cleaned = title.replace(/\s*\|.*$/, "").replace(/\s*-\s*$/, "").trim();
    setTopic(cleaned);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completedVideos = videos.filter((v) => v.status === "completed").length;
  const processingVideos = videos.filter((v) => v.status === "processing").length;
  const publishedVideos = videos.filter((v) => v.youtube_video_id).length;

  const workflowSteps = [
    {
      number: 1,
      title: "Configure API Keys",
      description: "Set up Groq, NewsAPI, and other service keys in Settings",
      icon: SettingsIcon,
      color: "from-purple-500 to-indigo-600",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/20",
      action: () => navigate("/settings"),
      actionLabel: "Open Settings",
      done: settings?.has_groq_api_key || false,
    },
    {
      number: 2,
      title: "Enter Topic & Aggregate",
      description: "Type a news topic and fetch articles from 10-15 sources",
      icon: Search,
      color: "from-cyan-500 to-blue-600",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
      action: () => document.getElementById("topic-input")?.focus(),
      actionLabel: "Enter Topic Above",
      done: false,
    },
    {
      number: 3,
      title: "Verify Facts",
      description: "AI cross-checks facts across sources with confidence scores",
      icon: Shield,
      color: "from-green-500 to-emerald-600",
      textColor: "text-green-400",
      borderColor: "border-green-500/20",
      action: () => navigate("/create"),
      actionLabel: "Go to Create",
      done: false,
    },
    {
      number: 4,
      title: "Generate Script",
      description: "AI writes a professional 90-second news anchor script",
      icon: FileText,
      color: "from-yellow-500 to-orange-600",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/20",
      action: () => navigate("/create"),
      actionLabel: "Go to Create",
      done: false,
    },
    {
      number: 5,
      title: "Generate Voice & Video",
      description: "Convert script to speech with Edge TTS and assemble final video",
      icon: Film,
      color: "from-pink-500 to-rose-600",
      textColor: "text-pink-400",
      borderColor: "border-pink-500/20",
      action: () => navigate("/create"),
      actionLabel: "Go to Create",
      done: false,
    },
    {
      number: 6,
      title: "Upload to YouTube",
      description: "Publish your video directly to YouTube from the app",
      icon: Upload,
      color: "from-red-500 to-red-600",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      action: () => navigate("/videos"),
      actionLabel: "My Videos",
      done: false,
    },
  ];

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
              id="topic-input"
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

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-cyan-400" />
          How It Works — Step by Step
        </h2>
        <p className="text-sm text-gray-400 mb-5">Follow these steps to create your first automated news video</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`relative rounded-xl border ${step.borderColor} p-5 hover:bg-gray-800/50 transition-all cursor-pointer group`}
                onClick={step.action}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm font-bold text-white">{step.number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                      {step.done && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">Done</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
                    <div className={`mt-3 flex items-center gap-1 text-xs ${step.textColor} group-hover:underline`}>
                      <Icon className="h-3.5 w-3.5" />
                      {step.actionLabel}
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Video} label="Total Videos" value={videos.length} color="cyan" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedVideos} color="green" />
        <StatCard icon={Clock} label="Processing" value={processingVideos} color="yellow" />
        <StatCard icon={Youtube} label="Published" value={publishedVideos} color="red" />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-cyan-400" />
            Daily News Headlines
          </h2>
          <button
            onClick={handleFetchDaily}
            disabled={dailyLoading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {dailyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {dailyNews.length > 0 ? "Refresh" : "Fetch Today's News"}
          </button>
        </div>
        {dailyNews.length === 0 && !dailyLoading && (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Click "Fetch Today's News" to load latest headlines from RSS feeds</p>
            <p className="text-xs text-gray-500 mt-1">Sources: The Hindu, Indian Express, NDTV, Reuters, Times of India</p>
          </div>
        )}
        {dailyLoading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-gray-400">Fetching latest headlines...</p>
          </div>
        )}
        {dailyNews.length > 0 && (
          <div className="space-y-3">
            {dailyNews.map((article, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white leading-snug">{article.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-cyan-400 font-medium">{article.source}</span>
                    {article.published_date && (
                      <span className="text-xs text-gray-500">{article.published_date}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDailyTopicClick(article.title)}
                    className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <Zap className="h-3 w-3" />
                    Make Video
                  </button>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Read
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
