import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { voiceApi, avatarApi } from "@/lib/api";
import { VoicePreset } from "@/types";
import {
  Mic,
  Camera,
  Upload,
  CheckCircle2,
  Loader2,
  User,
  Volume2,
  Image,
} from "lucide-react";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [voices, setVoices] = useState<VoicePreset[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(user?.voice_preset || "");
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const voiceFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const res = await voiceApi.listVoices();
      setVoices(res.data.voices || []);
    } catch {
      // silently handle
    }
  };

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoiceUploading(true);
    setVoiceMessage("");
    try {
      const res = await voiceApi.uploadSample(file);
      setVoiceMessage(`Voice profile created! Quality score: ${res.data.quality_score}/100`);
      await refreshUser();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setVoiceMessage(axiosErr.response?.data?.detail || "Upload failed");
    } finally {
      setVoiceUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarMessage("");
    try {
      const res = await avatarApi.uploadPhoto(file);
      setAvatarMessage(`Avatar uploaded! Quality score: ${res.data.quality_score}/100`);
      await refreshUser();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setAvatarMessage(axiosErr.response?.data?.detail || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Anchor Profile</h1>
        <p className="text-gray-400 mt-1">Configure your voice and avatar for video generation</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-cyan-400" />
          Voice Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Option A: Choose Preset Voice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedVoice === voice.id
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <Mic className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{voice.name}</p>
                    <p className="text-xs text-gray-500">{voice.language} &middot; {voice.gender}</p>
                  </div>
                  {selectedVoice === voice.id && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Option B: Upload Voice Sample</h3>
            <p className="text-xs text-gray-500 mb-3">
              Upload a 15-30 second audio sample for voice cloning (Coqui XTTS)
            </p>
            <input
              ref={voiceFileRef}
              type="file"
              accept="audio/*"
              onChange={handleVoiceUpload}
              className="hidden"
            />
            <button
              onClick={() => voiceFileRef.current?.click()}
              disabled={voiceUploading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              {voiceUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Audio Sample
            </button>
            {user?.voice_profile_id && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Voice profile active: {user.voice_profile_id}
              </p>
            )}
            {voiceMessage && <p className="mt-2 text-sm text-cyan-400">{voiceMessage}</p>}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-cyan-400" />
          Avatar Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Upload Headshot Photo</h3>
            <p className="text-xs text-gray-500 mb-3">
              Upload a clear headshot photo for the talking-head avatar (SadTalker)
            </p>

            <div className="flex items-start gap-4">
              <div className="w-32 h-32 rounded-xl bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center flex-shrink-0">
                {user?.avatar_image_path ? (
                  <div className="text-center">
                    <Image className="h-8 w-8 text-green-400 mx-auto" />
                    <p className="text-xs text-green-400 mt-1">Uploaded</p>
                  </div>
                ) : (
                  <User className="h-10 w-10 text-gray-600" />
                )}
              </div>

              <div>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {user?.avatar_image_path ? "Replace Photo" : "Upload Photo"}
                </button>


                {avatarMessage && <p className="mt-2 text-sm text-cyan-400">{avatarMessage}</p>}

                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>Requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Clear, front-facing headshot</li>
                    <li>Good lighting, neutral background</li>
                    <li>Minimum 512x512 pixels recommended</li>
                    <li>PNG or JPG format</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
