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

interface HelpStep {
  text: string;
  detail?: string;
  substeps?: string[];
}

interface ApiKeyHelpInfo {
  title: string;
  what: string;
  why: string;
  steps: HelpStep[];
  url: string;
  free: string;
  tip?: string;
}

const API_KEY_HELP: Record<string, ApiKeyHelpInfo> = {
  groq: {
    title: "How to get your Groq API Key",
    what: "Groq provides ultra-fast AI language models (like Llama 3.1 70B) that power script generation and fact verification in this app.",
    why: "Required for AI features. Without this key, you cannot generate news scripts or verify facts.",
    steps: [
      {
        text: "Open your browser and go to console.groq.com",
        detail: "This is the Groq developer console where you manage your API access.",
      },
      {
        text: "Create a free account",
        substeps: [
          "Click 'Sign Up' on the top-right corner",
          "You can sign up with Google, GitHub, or email",
          "Verify your email if required",
          "You will be taken to the Groq dashboard",
        ],
      },
      {
        text: "Navigate to API Keys",
        substeps: [
          "Look at the left sidebar menu",
          "Click on 'API Keys'",
          "You will see a list of your existing keys (empty if new account)",
        ],
      },
      {
        text: "Create a new API key",
        substeps: [
          "Click the 'Create API Key' button",
          "Give it a name like 'NewsAI Studio'",
          "Click 'Submit' or 'Create'",
        ],
      },
      {
        text: "Copy the API key",
        detail: "IMPORTANT: The key will only be shown ONCE. It starts with 'gsk_'. Copy it immediately and save it somewhere safe.",
      },
      {
        text: "Paste the key in the field below and click 'Save Settings'",
      },
    ],
    url: "https://console.groq.com",
    free: "Free tier: 14,400 requests/day, 6,000 tokens/min",
    tip: "The free tier is very generous. You likely won't need to upgrade unless you process hundreds of videos per day.",
  },
  newsapi: {
    title: "How to get your NewsAPI Key",
    what: "NewsAPI aggregates headlines and articles from 80,000+ news sources worldwide. It adds more sources beyond RSS feeds.",
    why: "Optional. The app already fetches news from RSS feeds for free. NewsAPI adds additional sources like CNN, BBC, etc.",
    steps: [
      {
        text: "Open your browser and go to newsapi.org",
      },
      {
        text: "Click 'Get API Key' (top-right) or go directly to newsapi.org/register",
      },
      {
        text: "Fill in the registration form",
        substeps: [
          "Enter your First Name and Last Name",
          "Enter your Email Address",
          "Enter a Password",
          "Select 'Individual' as account type",
          "Check 'I agree to the terms'",
          "Click 'Submit'",
        ],
      },
      {
        text: "Find your API key",
        detail: "After registration, your API key is shown immediately on the dashboard. It is also sent to your email.",
      },
      {
        text: "Copy the API key and paste it in the field below",
      },
    ],
    url: "https://newsapi.org/register",
    free: "Free tier: 100 requests/day (developer plan)",
    tip: "100 requests/day is enough for ~50 news topics. The app caches results, so repeated searches for the same topic don't count.",
  },
  gnews: {
    title: "How to get your GNews API Key",
    what: "GNews is a backup news aggregation API. It provides news articles from Google News in a structured format.",
    why: "Optional backup source. Useful when NewsAPI quota is exhausted or for additional coverage.",
    steps: [
      {
        text: "Open your browser and go to gnews.io",
      },
      {
        text: "Click 'Register' or go to gnews.io/register",
      },
      {
        text: "Fill in the registration form",
        substeps: [
          "Enter your Email",
          "Enter a Password and confirm it",
          "Click 'Register'",
          "Check your email for a verification link and click it",
        ],
      },
      {
        text: "Get your API key from the dashboard",
        substeps: [
          "After verifying your email, log in at gnews.io",
          "Go to 'Dashboard' from the top menu",
          "Your API key is displayed on the dashboard page",
          "Click the copy icon next to it",
        ],
      },
      {
        text: "Paste the key in the field below",
      },
    ],
    url: "https://gnews.io/register",
    free: "Free tier: 100 requests/day",
    tip: "You only need this if you also have NewsAPI. Together they give you 200 API requests/day plus unlimited RSS feeds.",
  },
  pexels: {
    title: "How to get your Pexels API Key",
    what: "Pexels provides free, high-quality stock photos. The app uses them as background images in your generated news videos.",
    why: "Optional. Without this, videos will use solid color backgrounds. With Pexels, videos get professional stock image backgrounds.",
    steps: [
      {
        text: "Open your browser and go to pexels.com",
      },
      {
        text: "Create an account",
        substeps: [
          "Click 'Join' (top-right corner)",
          "Sign up with Google, Facebook, Apple, or Email",
          "If using email: enter your name, email, and password",
          "Verify your email if required",
        ],
      },
      {
        text: "Go to the API page",
        substeps: [
          "Once logged in, go to pexels.com/api",
          "Or click your profile icon > 'Image & Video API'",
        ],
      },
      {
        text: "Request API access",
        substeps: [
          "Click 'Your API Key' or 'Get Started'",
          "If asked, fill in a description: e.g. 'NewsAI Studio - automated news video platform'",
          "Agree to the terms of service",
          "Click 'Generate API Key'",
        ],
      },
      {
        text: "Copy the API key shown and paste it in the field below",
      },
    ],
    url: "https://www.pexels.com/api/",
    free: "Free tier: 200 requests/hour, 20,000/month",
    tip: "Very generous limits. One video typically needs 5-10 image requests, so 20,000/month supports thousands of videos.",
  },
  elevenlabs: {
    title: "How to get your ElevenLabs API Key",
    what: "ElevenLabs provides premium AI voice cloning with extremely natural-sounding voices. Higher quality than the default Edge TTS.",
    why: "Optional premium upgrade. The app uses free Edge TTS by default, which already sounds good. ElevenLabs is for professional-grade voice quality.",
    steps: [
      {
        text: "Open your browser and go to elevenlabs.io",
      },
      {
        text: "Create an account",
        substeps: [
          "Click 'Sign Up' (top-right)",
          "Sign up with Google or email",
          "Verify your email if required",
        ],
      },
      {
        text: "Navigate to your API key",
        substeps: [
          "After logging in, you'll see the ElevenLabs workspace",
          "Click your profile icon or initials in the bottom-left corner",
          "Click 'Profile + API key' from the menu",
        ],
      },
      {
        text: "Copy the API key",
        substeps: [
          "You will see your API key (partially hidden with dots)",
          "Click the eye icon to reveal it, or click the copy icon",
          "The key looks like a long string of letters and numbers",
        ],
      },
      {
        text: "Paste the key in the field below and click 'Save Settings'",
      },
    ],
    url: "https://elevenlabs.io",
    free: "Free tier: ~10,000 characters/month (~10 minutes of audio). Paid from $5/month.",
    tip: "Try the free Edge TTS first (it's the default, no key needed). Only get ElevenLabs if you want premium voice cloning quality.",
  },
  did: {
    title: "How to get your D-ID API Key",
    what: "D-ID creates AI-powered talking head videos from a photo. It animates a still photo to look like the person is speaking.",
    why: "Optional. The app can use SadTalker (free, local GPU) by default, or generate videos without an avatar. D-ID is a cloud alternative.",
    steps: [
      {
        text: "Open your browser and go to studio.d-id.com",
      },
      {
        text: "Create an account",
        substeps: [
          "Click 'Sign Up' or 'Get Started Free'",
          "Sign up with Google, Apple, or email",
          "Verify your email if required",
        ],
      },
      {
        text: "Navigate to API Keys",
        substeps: [
          "After logging in, click your profile icon (top-right)",
          "Click 'Settings' from the dropdown",
          "In Settings, find the 'API Keys' section",
        ],
      },
      {
        text: "Generate a new API key",
        substeps: [
          "Click 'Generate API Key' or 'Create Key'",
          "The key will be displayed (shown only once)",
          "Copy it immediately and save it somewhere safe",
        ],
      },
      {
        text: "Paste the key in the field below and click 'Save Settings'",
      },
    ],
    url: "https://studio.d-id.com",
    free: "Free tier: 20 videos free (5 min total), then from $5.90/month",
    tip: "If you have a GPU, SadTalker (free, unlimited) is used by default. D-ID is only needed for cloud-based avatar generation without a GPU.",
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
              <span className="font-medium text-cyan-400 text-base">How to set up YouTube API & connect your channel</span>
              <button
                type="button"
                onClick={() => setShowYtHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 p-2 bg-gray-700/50 rounded text-gray-300">
              <p><strong className="text-white">What:</strong> YouTube Data API v3 lets this app upload videos directly to your YouTube channel.</p>
              <p className="mt-1"><strong className="text-white">Why:</strong> Required only if you want to publish videos to YouTube from the dashboard. You can still generate videos without this.</p>
              <p className="mt-1"><strong className="text-amber-400">Note:</strong> This is the most complex setup because it involves Google Cloud Console. Follow each step carefully.</p>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-cyan-500 pl-3">
                <p className="font-medium text-white mb-2">Step 1: Create a Google Cloud Project</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>Open your browser and go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">console.cloud.google.com</a></li>
                  <li>Sign in with the <strong>same Google account</strong> you use for YouTube</li>
                  <li>At the very top of the page, you will see a blue bar. Look for a dropdown that says "Select a project" (or shows a project name)</li>
                  <li>Click that dropdown &rarr; A popup will appear</li>
                  <li>Click <strong>"New Project"</strong> (top-right of the popup)</li>
                  <li>In the "Project name" field, type: <code className="bg-gray-700 px-1 rounded">NewsAI Studio</code></li>
                  <li>Leave "Organization" and "Location" as default</li>
                  <li>Click <strong>"Create"</strong></li>
                  <li>Wait a few seconds. A notification bell will show "Project created". Click <strong>"Select Project"</strong> to switch to it</li>
                </ol>
              </div>

              <div className="border-l-2 border-cyan-500 pl-3">
                <p className="font-medium text-white mb-2">Step 2: Enable the YouTube Data API v3</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>Make sure your new project is selected (check the dropdown at the top)</li>
                  <li>In the left sidebar, click the hamburger menu (three horizontal lines, top-left) if the sidebar is hidden</li>
                  <li>Navigate to: <strong>"APIs & Services"</strong> &rarr; <strong>"Library"</strong></li>
                  <li>In the search bar, type: <code className="bg-gray-700 px-1 rounded">YouTube Data API v3</code></li>
                  <li>Click on <strong>"YouTube Data API v3"</strong> from the results (it has a red YouTube icon)</li>
                  <li>Click the big blue <strong>"Enable"</strong> button</li>
                  <li>Wait a few seconds until you see the API dashboard. The status should show "Enabled"</li>
                </ol>
              </div>

              <div className="border-l-2 border-amber-500 pl-3">
                <p className="font-medium text-white mb-2">Step 3: Configure the OAuth Consent Screen</p>
                <p className="text-gray-400 text-xs mb-2">This tells Google what your app is and who can use it. You must do this before creating credentials.</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>In the left sidebar, go to <strong>"APIs & Services"</strong> &rarr; <strong>"OAuth consent screen"</strong></li>
                  <li>Select <strong>"External"</strong> as user type (the only option for personal accounts)</li>
                  <li>Click <strong>"Create"</strong></li>
                  <li>Fill in the required fields:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-400">
                      <li><strong>App name:</strong> <code className="bg-gray-700 px-1 rounded">NewsAI Studio</code></li>
                      <li><strong>User support email:</strong> Select your email from the dropdown</li>
                      <li><strong>Developer contact email:</strong> Type your email address</li>
                      <li>Leave all other fields blank/default</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Save and Continue"</strong></li>
                  <li>On the "Scopes" page: Click <strong>"Add or Remove Scopes"</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-400">
                      <li>In the search/filter box, type <code className="bg-gray-700 px-1 rounded">youtube.upload</code></li>
                      <li>Check the box next to <code className="bg-gray-700 px-1 rounded">.../auth/youtube.upload</code></li>
                      <li>Also search for and add <code className="bg-gray-700 px-1 rounded">youtube.readonly</code></li>
                      <li>Click <strong>"Update"</strong> at the bottom</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Save and Continue"</strong></li>
                  <li>On the "Test users" page: Click <strong>"+ Add Users"</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-400">
                      <li>Enter your own Gmail/Google email address</li>
                      <li>Click <strong>"Add"</strong></li>
                      <li>This is required because the app will be in "Testing" mode</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Save and Continue"</strong>, then <strong>"Back to Dashboard"</strong></li>
                </ol>
              </div>

              <div className="border-l-2 border-cyan-500 pl-3">
                <p className="font-medium text-white mb-2">Step 4: Create OAuth 2.0 Client Credentials</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>In the left sidebar, go to <strong>"APIs & Services"</strong> &rarr; <strong>"Credentials"</strong></li>
                  <li>Click <strong>"+ Create Credentials"</strong> (top of the page)</li>
                  <li>Select <strong>"OAuth client ID"</strong> from the dropdown</li>
                  <li>For "Application type", select <strong>"Web application"</strong></li>
                  <li>Name it: <code className="bg-gray-700 px-1 rounded">NewsAI Studio Web Client</code></li>
                  <li>Under <strong>"Authorized redirect URIs"</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-400">
                      <li>Click <strong>"+ Add URI"</strong></li>
                      <li>Enter exactly: <code className="bg-gray-700 px-1 rounded">http://localhost:8000/api/youtube/callback</code></li>
                    </ul>
                  </li>
                  <li>Click <strong>"Create"</strong></li>
                  <li>A popup will show your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                  <li><span className="text-amber-400">IMPORTANT:</span> Copy BOTH values immediately. You can also click "Download JSON" to save them</li>
                </ol>
              </div>

              <div className="border-l-2 border-green-500 pl-3">
                <p className="font-medium text-white mb-2">Step 5: Add credentials to your .env file</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>Open the file <code className="bg-gray-700 px-1 rounded">backend/.env</code> in a text editor (Notepad, VS Code, etc.)</li>
                  <li>Find or add these three lines and replace with your actual values:
                    <pre className="bg-gray-700 p-2 rounded mt-1 text-xs overflow-x-auto leading-relaxed">YOUTUBE_CLIENT_ID=paste-your-client-id-here{"\n"}YOUTUBE_CLIENT_SECRET=paste-your-client-secret-here{"\n"}YOUTUBE_REDIRECT_URI=http://localhost:8000/api/youtube/callback</pre>
                  </li>
                  <li>Save the file</li>
                  <li>Restart your backend server (stop it with Ctrl+C, then run <code className="bg-gray-700 px-1 rounded">uvicorn app.main:app --reload --port 8000</code> again)</li>
                </ol>
              </div>

              <div className="border-l-2 border-green-500 pl-3">
                <p className="font-medium text-white mb-2">Step 6: Connect your YouTube channel</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300 ml-1">
                  <li>Come back to this Settings page in the browser</li>
                  <li>Click the red <strong>"Connect YouTube"</strong> button below</li>
                  <li>A Google sign-in window will open</li>
                  <li>Sign in with the <strong>same Google account</strong> you added as a test user in Step 3</li>
                  <li>You may see a warning: "This app isn't verified" &mdash; click <strong>"Continue"</strong> (this is normal for test mode)</li>
                  <li>Grant all requested permissions (upload videos, manage your YouTube account)</li>
                  <li>You will be redirected back to this page</li>
                  <li>The status should now show a green checkmark: <strong>"YouTube channel connected"</strong></li>
                </ol>
              </div>

              <div className="mt-3 p-2 bg-gray-700/50 rounded">
                <p className="text-amber-400 font-medium text-xs mb-1">Troubleshooting:</p>
                <ul className="list-disc list-inside text-gray-400 text-xs space-y-1">
                  <li>"Error 401" or "Access Denied": Make sure you added your email as a test user in Step 3</li>
                  <li>"Redirect URI mismatch": The URI in Google Cloud must exactly match <code className="bg-gray-700 px-1 rounded">http://localhost:8000/api/youtube/callback</code></li>
                  <li>"API not enabled": Go back to Step 2 and make sure YouTube Data API v3 is enabled</li>
                  <li>Backend error: Make sure the .env file is saved and the backend server was restarted after editing</li>
                </ul>
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
                <span className="text-xs text-gray-500">Free: 10,000 quota units/day (~50 uploads)</span>
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

          <div className="mb-3 p-2 bg-gray-700/50 rounded text-gray-300 text-xs">
            <p><strong className="text-white">What:</strong> {help.what}</p>
            <p className="mt-1"><strong className="text-white">Why:</strong> {help.why}</p>
          </div>

          <div className="space-y-3">
            {help.steps.map((step, i) => (
              <div key={i} className="border-l-2 border-cyan-500/50 pl-2">
                <p className="text-gray-200">
                  <span className="text-cyan-400 font-medium">Step {i + 1}:</span> {step.text}
                </p>
                {step.detail && (
                  <p className="text-gray-400 text-xs mt-0.5 ml-1">{step.detail}</p>
                )}
                {step.substeps && (
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-gray-400 text-xs">
                    {step.substeps.map((sub, j) => (
                      <li key={j}>{sub}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {help.tip && (
            <div className="mt-3 p-2 bg-gray-700/50 rounded text-xs">
              <span className="text-amber-400 font-medium">Tip:</span>{" "}
              <span className="text-gray-300">{help.tip}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-700">
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
