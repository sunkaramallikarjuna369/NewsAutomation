import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { newsApi, scriptApi, videoApi } from "@/lib/api";
import { Verification, ScriptData, ScriptSegment, VideoStatus } from "@/types";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Film,
  Loader2,
  RefreshCw,
  Clock,
  ChevronRight,
  Shield,
  BarChart3,
  Sparkles,
} from "lucide-react";

type Step = "verify" | "script" | "generate";

export default function Create() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get("topic") || "";
  const aggregationId = searchParams.get("aggregation_id");

  const [step, setStep] = useState<Step>("verify");
  const [verification, setVerification] = useState<Verification | null>(null);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (aggregationId) {
      handleVerify();
    }
  }, [aggregationId]);

  const handleVerify = async () => {
    if (!aggregationId) return;
    setLoading(true);
    setError("");
    try {
      const res = await newsApi.verify({ aggregation_id: parseInt(aggregationId) });
      setVerification(res.data);
      setStep("verify");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await scriptApi.generate({
        topic,
        verification_id: verification?.id,
        verified_facts: verification?.verified_facts,
        style: "neutral",
        duration: 90,
        language: "en",
      });
      setScript(res.data);
      setStep("script");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Script generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSegment = async (segmentNumber: number) => {
    if (!script) return;
    setLoading(true);
    try {
      const res = await scriptApi.regenerateSegment({
        script_id: script.id,
        segment_number: segmentNumber,
        instructions: "Make it more engaging and concise",
      });
      setScript(res.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script) return;
    setLoading(true);
    setError("");
    setStep("generate");
    try {
      const res = await videoApi.generate({
        script_id: script.id,
        use_avatar: false,
      });
      setVideoStatus(res.data);
      pollVideoStatus(res.data.job_id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Video generation failed");
      setLoading(false);
    }
  };

  const pollVideoStatus = async (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await videoApi.status(jobId);
        setVideoStatus(res.data);
        if (res.data.status === "completed" || res.data.status === "failed") {
          clearInterval(interval);
          setLoading(false);
          if (res.data.status === "completed") {
            navigate(`/videos`);
          }
        }
      } catch {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  };

  const steps = [
    { id: "verify" as const, label: "Verify Facts", icon: Shield },
    { id: "script" as const, label: "Edit Script", icon: FileText },
    { id: "generate" as const, label: "Generate Video", icon: Film },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Video</h1>
        {topic && <p className="text-gray-400 mt-1">Topic: {topic}</p>}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast = steps.findIndex((x) => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : isPast
                    ? "bg-green-500/10 text-green-400"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-600" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">{error}</div>
      )}

      {step === "verify" && (
        <VerificationPanel
          verification={verification}
          loading={loading}
          onGenerateScript={handleGenerateScript}
        />
      )}

      {step === "script" && script && (
        <ScriptEditor
          script={script}
          loading={loading}
          onRegenerate={handleRegenerateSegment}
          onGenerate={handleGenerateVideo}
          onBack={() => setStep("verify")}
        />
      )}

      {step === "generate" && (
        <VideoProgress videoStatus={videoStatus} loading={loading} />
      )}
    </div>
  );
}

function VerificationPanel({
  verification,
  loading,
  onGenerateScript,
}: {
  verification: Verification | null;
  loading: boolean;
  onGenerateScript: () => void;
}) {
  if (!verification) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-gray-400">Verifying facts across sources...</p>
          </div>
        ) : (
          <p className="text-gray-400">No verification data yet. Go back to the dashboard to start.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Verification Summary
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">
                {Math.round(verification.agreement_score * 100)}%
              </p>
              <p className="text-xs text-gray-400">Agreement</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                verification.controversy_level === "low"
                  ? "bg-green-500/10 text-green-400"
                  : verification.controversy_level === "medium"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {verification.controversy_level} controversy
            </div>
          </div>
        </div>
        {verification.summary && <p className="text-gray-300 text-sm">{verification.summary}</p>}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          Verified Facts ({verification.verified_facts.length})
        </h3>
        <div className="space-y-2">
          {verification.verified_facts.map((fact, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-200">{fact.fact}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {fact.source_count} sources &middot; {Math.round(fact.confidence * 100)}% confidence
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {verification.excluded_claims.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Excluded Claims ({verification.excluded_claims.length})
          </h3>
          <div className="space-y-2">
            {verification.excluded_claims.map((claim, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-200">{claim.claim}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Source: {claim.source} &middot; {claim.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onGenerateScript}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Script
        </button>
      </div>
    </div>
  );
}

function ScriptEditor({
  script,
  loading,
  onRegenerate,
  onGenerate,
  onBack,
}: {
  script: ScriptData;
  loading: boolean;
  onRegenerate: (segmentNumber: number) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const segments = script.script_json?.voiceover_script || [];
  const totalDuration = segments.reduce((sum: number, s: ScriptSegment) => sum + (s.duration_seconds || 0), 0);

  const segmentTypeColors: Record<string, string> = {
    intro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    fact: "bg-green-500/10 text-green-400 border-green-500/20",
    context: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    analysis: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    conclusion: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{script.script_json?.video_title?.primary || script.topic}</h2>
            <p className="text-sm text-gray-400">{script.script_json?.video_title?.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={totalDuration >= 85 && totalDuration <= 95 ? "text-green-400" : "text-yellow-400"}>
                {totalDuration}s
              </span>
              <span className="text-gray-500">/ 90s target</span>
            </div>
            <div className="text-sm text-gray-400">{segments.length} segments</div>
          </div>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              totalDuration >= 85 && totalDuration <= 95 ? "bg-green-500" : "bg-yellow-500"
            }`}
            style={{ width: `${Math.min((totalDuration / 95) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment: ScriptSegment, i: number) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">#{segment.segment_number}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    segmentTypeColors[segment.segment_type] || "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {segment.segment_type}
                </span>
                <span className="text-xs text-gray-500">{segment.duration_seconds}s</span>
              </div>
              <button
                onClick={() => onRegenerate(segment.segment_number)}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{segment.text}</p>
            {segment.visual_cue && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Visual: {segment.visual_cue}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          Back to Verification
        </button>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          Generate Video
        </button>
      </div>
    </div>
  );
}

function VideoProgress({ videoStatus, loading }: { videoStatus: VideoStatus | null; loading: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
      <div className="text-center">
        {loading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generating Video...</h3>
          </>
        ) : videoStatus?.status === "completed" ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Video Complete!</h3>
          </>
        ) : videoStatus?.status === "failed" ? (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
            {videoStatus.error_message && (
              <p className="text-red-400 text-sm">{videoStatus.error_message}</p>
            )}
          </>
        ) : null}

        {videoStatus && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>{videoStatus.progress_message || "Processing..."}</span>
              <span>{videoStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${videoStatus.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
