import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { settingsApi, youtubeApi } from "@/lib/api";
import { Settings as SettingsType } from "@/types";
import {
  Key,
  Save,
  Loader2,
  CheckCircle2,
  Youtube,
  ExternalLink,
  Globe,
  Palette,
  Clock,
} from "lucide-react";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ytConnecting, setYtConnecting] = useState(false);

  const [formData, setFormData] = useState({
    groq_api_key: "",
    newsapi_key: "",
    gnews_api_key: "",
    pexels_api_key: "",
    elevenlabs_api_key: "",
    did_api_key: "",
    default_language: "en",
    default_style: "neutral",
    default_duration: 90,
    dark_mode: true,
  });

  useEffect(() => {
    loadSettings();
    const ytToken = searchParams.get("youtube_token");
    if (ytToken) {
      connectYoutube(ytToken);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettings(res.data);
      setFormData((prev) => ({
        ...prev,
        default_language: res.data.default_language,
        default_style: res.data.default_style,
        default_duration: res.data.default_duration,
        dark_mode: res.data.dark_mode,
      }));
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const connectYoutube = async (token: string) => {
    setYtConnecting(true);
    try {
      await youtubeApi.connect(token);
      await loadSettings();
    } catch {
      // silently handle
    } finally {
      setYtConnecting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updateData: Record<string, unknown> = {};
      if (formData.groq_api_key) updateData.groq_api_key = formData.groq_api_key;
      if (formData.newsapi_key) updateData.newsapi_key = formData.newsapi_key;
      if (formData.gnews_api_key) updateData.gnews_api_key = formData.gnews_api_key;
      if (formData.pexels_api_key) updateData.pexels_api_key = formData.pexels_api_key;
      if (formData.elevenlabs_api_key) updateData.elevenlabs_api_key = formData.elevenlabs_api_key;
      if (formData.did_api_key) updateData.did_api_key = formData.did_api_key;
      updateData.default_language = formData.default_language;
      updateData.default_style = formData.default_style;
      updateData.default_duration = formData.default_duration;
      updateData.dark_mode = formData.dark_mode;

      await settingsApi.update(updateData);
      setSaved(true);
      await loadSettings();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectYoutube = async () => {
    try {
      const res = await youtubeApi.authUrl();
      window.open(res.data.auth_url, "_blank");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || "Failed to get YouTube auth URL");
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Configure API keys and preferences</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-cyan-400" />
          API Keys
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Add your API keys to enable AI-powered features. Keys are stored securely per user.
        </p>

        <div className="space-y-4">
          <ApiKeyInput
            label="Groq API Key (LLM - Required for AI features)"
            value={formData.groq_api_key}
            onChange={(v) => setFormData({ ...formData, groq_api_key: v })}
            configured={settings?.has_groq_api_key}
            hint="Free tier: 14,400 req/day. Get key at console.groq.com"
          />
          <ApiKeyInput
            label="NewsAPI Key"
            value={formData.newsapi_key}
            onChange={(v) => setFormData({ ...formData, newsapi_key: v })}
            configured={settings?.has_newsapi_key}
            hint="Optional. 100 req/day free. RSS feeds work without this."
          />
          <ApiKeyInput
            label="GNews API Key"
            value={formData.gnews_api_key}
            onChange={(v) => setFormData({ ...formData, gnews_api_key: v })}
            configured={settings?.has_gnews_api_key}
            hint="Optional backup source. 100 req/day free."
          />
          <ApiKeyInput
            label="Pexels API Key"
            value={formData.pexels_api_key}
            onChange={(v) => setFormData({ ...formData, pexels_api_key: v })}
            configured={settings?.has_pexels_api_key}
            hint="Optional. For stock images in videos."
          />
          <ApiKeyInput
            label="ElevenLabs API Key (Premium Voice)"
            value={formData.elevenlabs_api_key}
            onChange={(v) => setFormData({ ...formData, elevenlabs_api_key: v })}
            configured={settings?.has_elevenlabs_api_key}
            hint="Optional premium voice cloning. Edge TTS is free by default."
          />
          <ApiKeyInput
            label="D-ID API Key (Cloud Avatar)"
            value={formData.did_api_key}
            onChange={(v) => setFormData({ ...formData, did_api_key: v })}
            configured={settings?.has_did_api_key}
            hint="Optional cloud avatar. SadTalker (local GPU) is free by default."
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube Connection
        </h2>
        {settings?.has_youtube_connected ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>YouTube channel connected</span>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-3">
              Connect your YouTube account to upload videos directly from the dashboard.
            </p>
            <button
              onClick={handleConnectYoutube}
              disabled={ytConnecting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {ytConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Connect YouTube
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-cyan-400" />
          Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Globe className="h-4 w-4" /> Language
            </label>
            <select
              value={formData.default_language}
              onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
            <select
              value={formData.default_style}
              onChange={(e) => setFormData({ ...formData, default_style: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="neutral">Neutral</option>
              <option value="investigative">Investigative</option>
              <option value="explanatory">Explanatory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.default_duration}
              onChange={(e) => setFormData({ ...formData, default_duration: parseInt(e.target.value) || 90 })}
              min={60}
              max={300}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-green-400 text-sm flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

function ApiKeyInput({
  label,
  value,
  onChange,
  configured,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  configured?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {configured && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Configured
          </span>
        )}
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "••••••••  (already set, enter new to update)" : "Enter API key"}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
