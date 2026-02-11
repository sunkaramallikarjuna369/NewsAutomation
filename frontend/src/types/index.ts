export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_google_user: boolean;
  voice_profile_id?: string;
  voice_preset?: string;
  avatar_image_path?: string;
  default_language: string;
  default_style: string;
  default_duration: number;
  dark_mode: boolean;
}

export interface Article {
  source: string;
  source_tier: string;
  title: string;
  summary: string;
  key_facts: string[];
  published_date?: string;
  author?: string;
  credibility_score: number;
  url?: string;
}

export interface NewsAggregation {
  id: number;
  topic: string;
  articles: Article[];
  source_count: number;
  created_at?: string;
}

export interface VerifiedFact {
  fact: string;
  source_count: number;
  sources: string[];
  confidence: number;
}

export interface ExcludedClaim {
  claim: string;
  source: string;
  reason: string;
}

export interface Verification {
  id: number;
  aggregation_id: number;
  topic: string;
  verified_facts: VerifiedFact[];
  excluded_claims: ExcludedClaim[];
  agreement_score: number;
  controversy_level: string;
  summary?: string;
  created_at?: string;
}

export interface ScriptSegment {
  segment_number: number;
  segment_type: string;
  text: string;
  duration_seconds: number;
  visual_cue: string;
  infographic_type: string;
}

export interface ScriptData {
  id: number;
  topic: string;
  language: string;
  style: string;
  target_duration: number;
  script_json: {
    metadata: Record<string, unknown>;
    video_title: { primary: string; subtitle?: string };
    video_description: {
      intro: string;
      body: string;
      timestamps: string[];
      sources: string[];
      hashtags: string[];
    };
    voiceover_script: ScriptSegment[];
    visual_elements: Record<string, unknown>[];
    thumbnail: { headline: string; subtext: string; style: string };
    seo_tags: { primary_keywords: string[]; secondary_keywords: string[]; category: string };
    voice_synthesis_config: Record<string, unknown>;
    avatar_config: Record<string, unknown>;
    quality_assurance: Record<string, unknown>;
  };
  metadata_json?: Record<string, unknown>;
  total_duration: number;
  segment_count: number;
  status: string;
  created_at?: string;
}

export interface VideoData {
  id: number;
  title: string;
  description?: string;
  topic?: string;
  video_path?: string;
  thumbnail_path?: string;
  duration: number;
  status: string;
  progress: number;
  youtube_video_id?: string;
  youtube_url?: string;
  youtube_status?: string;
  tags?: string[];
  created_at?: string;
}

export interface VideoStatus {
  job_id: number;
  video_id: number;
  status: string;
  progress: number;
  progress_message?: string;
  video_path?: string;
  error_message?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  language: string;
  gender: string;
}

export interface Settings {
  has_newsapi_key: boolean;
  has_groq_api_key: boolean;
  has_gnews_api_key: boolean;
  has_pexels_api_key: boolean;
  has_elevenlabs_api_key: boolean;
  has_did_api_key: boolean;
  has_youtube_connected: boolean;
  default_language: string;
  default_style: string;
  default_duration: number;
  dark_mode: boolean;
}
