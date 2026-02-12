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
  HelpCircle,
  X,
} from "lucide-react";

const API_KEY_HELP: Record<string, { title: string; steps: string[]; url: string; free: string }> = {
  groq: {
    title: "How to get your Groq API Key",
    steps: [
      "Go to console.groq.com",
      "Sign up with Google or email (free)",
      "Click 'API Keys' in the left sidebar",
      "Click 'Create API Key'",
      "Copy the key (starts with gsk_...)",
      "Paste it in the field below",
    ],
    url: "https://console.groq.com",
    free: "Free tier: 14,400 requests/day, 6,000 tokens/min",
  },
  newsapi: {
    title: "How to get your NewsAPI Key",
    steps: [
      "Go to newsapi.org/register",
      "Sign up with your email",
      "Your API key appears on the dashboard immediately",
      "Copy the key",
      "Paste it in the field below",
    ],
    url: "https://newsapi.org/register",
    free: "Free tier: 100 requests/day",
  },
  gnews: {
    title: "How to get your GNews API Key",
    steps: [
      "Go to gnews.io/register",
      "Sign up with your email",
      "Go to Dashboard > API Key",
      "Copy the key",
      "Paste it in the field below",
    ],
    url: "https://gnews.io/register",
    free: "Free tier: 100 requests/day",
  },
  pexels: {
    title: "How to get your Pexels API Key",
    steps: [
      "Go to pexels.com/api",
      "Click 'Get Started' and create an account",
      "After login, go to pexels.com/api/new",
      "Fill in app name (e.g. 'NewsAI Studio') and description",
      "Your API key will be displayed",
      "Copy and paste it in the field below",
    ],
    url: "https://www.pexels.com/api/",
    free: "Free tier: 200 requests/hour, 20,000/month",
  },
  elevenlabs: {
    title: "How to get your ElevenLabs API Key",
    steps: [
      "Go to elevenlabs.io",
      "Sign up for an account",
      "Click your profile icon (bottom-left)",
      "Go to 'API Keys'",
      "Copy the API key",
      "Paste it in the field below",
    ],
    url: "https://elevenlabs.io",
    free: "Free tier: ~10,000 characters/month. Paid from $5/month.",
  },
  did: {
    title: "How to get your D-ID API Key",
    steps: [
      "Go to d-id.com",
      "Sign up for an account",
      "Go to Settings > API Keys",
      "Generate a new API key",
      "Copy the key",
      "Paste it in the field below",
    ],
    url: "https://www.d-id.com",
    free: "Free tier: 20 videos free, then paid from $5.90/month",
  },
};

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ytConnecting, setYtConnecting] = useState(false);
  const [showYtHelp, setShowYtHelp] = useState(false);

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
          Click the <HelpCircle className="inline h-3.5 w-3.5 text-cyan-400" /> icon for step-by-step instructions.
        </p>

        <div className="space-y-4">
          <ApiKeyInput
            label="Groq API Key (LLM - Required for AI features)"
            value={formData.groq_api_key}
            onChange={(v) => setFormData({ ...formData, groq_api_key: v })}
            configured={settings?.has_groq_api_key}
            hint="Free tier: 14,400 req/day. Get key at console.groq.com"
            helpKey="groq"
          />
          <ApiKeyInput
            label="NewsAPI Key"
            value={formData.newsapi_key}
            onChange={(v) => setFormData({ ...formData, newsapi_key: v })}
            configured={settings?.has_newsapi_key}
            hint="Optional. 100 req/day free. RSS feeds work without this."
            helpKey="newsapi"
          />
          <ApiKeyInput
            label="GNews API Key"
            value={formData.gnews_api_key}
            onChange={(v) => setFormData({ ...formData, gnews_api_key: v })}
            configured={settings?.has_gnews_api_key}
            hint="Optional backup source. 100 req/day free."
            helpKey="gnews"
          />
          <ApiKeyInput
            label="Pexels API Key"
            value={formData.pexels_api_key}
            onChange={(v) => setFormData({ ...formData, pexels_api_key: v })}
            configured={settings?.has_pexels_api_key}
            hint="Optional. For stock images in videos."
            helpKey="pexels"
          />
          <ApiKeyInput
            label="ElevenLabs API Key (Premium Voice)"
            value={formData.elevenlabs_api_key}
            onChange={(v) => setFormData({ ...formData, elevenlabs_api_key: v })}
            configured={settings?.has_elevenlabs_api_key}
            hint="Optional premium voice cloning. Edge TTS is free by default."
            helpKey="elevenlabs"
          />
          <ApiKeyInput
            label="D-ID API Key (Cloud Avatar)"
            value={formData.did_api_key}
            onChange={(v) => setFormData({ ...formData, did_api_key: v })}
            configured={settings?.has_did_api_key}
            hint="Optional cloud avatar. SadTalker (local GPU) is free by default."
            helpKey="did"
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Connection
          </h2>
          <button
            type="button"
            onClick={() => setShowYtHelp(!showYtHelp)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
            title="How to set up YouTube connection"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {showYtHelp && (
          <div className="mb-4 p-4 bg-gray-800 border border-cyan-500/30 rounded-lg text-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-cyan-400">How to set up YouTube API & connect your channel</span>
              <button
                type="button"
                onClick={() => setShowYtHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-white mb-1">Step 1: Create a Google Cloud Project</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-300 ml-2">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">console.cloud.google.com</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Select a project" at the top, then "New Project"</li>
                  <li>Name it (e.g. "NewsAI Studio") and click "Create"</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-white mb-1">Step 2: Enable YouTube Data API v3</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-300 ml-2">
                  <li>In Google Cloud Console, go to "APIs & Services" &gt; "Library"</li>
                  <li>Search for "YouTube Data API v3"</li>
                  <li>Click on it and press "Enable"</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-white mb-1">Step 3: Create OAuth 2.0 Credentials</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-300 ml-2">
                  <li>Go to "APIs & Services" &gt; "Credentials"</li>
                  <li>Click "+ Create Credentials" &gt; "OAuth client ID"</li>
                  <li>If prompted, configure the OAuth consent screen first:
                    <ul className="list-disc list-inside ml-4 text-gray-400">
                      <li>Choose "External" user type</li>
                      <li>Fill in app name, support email, and developer email</li>
                      <li>Add scope: "youtube.upload"</li>
                      <li>Add your email as a test user</li>
                    </ul>
                  </li>
                  <li>Back in Credentials, select "Web application" as type</li>
                  <li>Add authorized redirect URI: <code className="bg-gray-700 px-1 rounded">http://localhost:8000/api/youtube/callback</code></li>
                  <li>Click "Create"</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-white mb-1">Step 4: Copy your credentials</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-300 ml-2">
                  <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> shown</li>
                  <li>Add them to your <code className="bg-gray-700 px-1 rounded">backend/.env</code> file:
                    <pre className="bg-gray-700 p-2 rounded mt-1 text-xs overflow-x-auto">YOUTUBE_CLIENT_ID=your-client-id-here{"\n"}YOUTUBE_CLIENT_SECRET=your-client-secret-here{"\n"}YOUTUBE_REDIRECT_URI=http://localhost:8000/api/youtube/callback</pre>
                  </li>
                  <li>Restart your backend server</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-white mb-1">Step 5: Connect from this page</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-300 ml-2">
                  <li>Click the "Connect YouTube" button below</li>
                  <li>Sign in with the Google account that owns your YouTube channel</li>
                  <li>Grant permission to upload videos</li>
                  <li>You'll be redirected back and the status will show "Connected"</li>
                </ol>
              </div>

              <div className="mt-2 flex items-center justify-between pt-2 border-t border-gray-700">
                <a
                  href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Google Cloud Console
                </a>
                <span className="text-xs text-gray-500">Free: 10,000 quota units/day</span>
              </div>
            </div>
          </div>
        )}

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
  helpKey,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  configured?: boolean;
  hint?: string;
  helpKey?: string;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const help = helpKey ? API_KEY_HELP[helpKey] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          {help && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              title="How to get this key"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        {configured && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Configured
          </span>
        )}
      </div>

      {showHelp && help && (
        <div className="mb-2 p-3 bg-gray-800 border border-cyan-500/30 rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-cyan-400">{help.title}</span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            {help.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="mt-2 flex items-center justify-between">
            <a
              href={help.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              Open {help.url.replace("https://", "").replace("http://", "")}
            </a>
            <span className="text-xs text-gray-500">{help.free}</span>
          </div>
        </div>
      )}

      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "............  (already set, enter new to update)" : "Enter API key"}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
