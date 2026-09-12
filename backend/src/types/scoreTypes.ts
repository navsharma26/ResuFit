export interface RecalculateScoreRequest {
  resume_text?: string;
  resumeText?: string;
  job_description?: string;
  jobDescription?: string;
  previous_score?: number;
  previousScore?: number;
}

export interface KeywordMatchDetail {
  keyword: string;
  category: 'mandatory' | 'technical' | 'tool' | 'methodology' | 'preferred';
  count: number;
}

export interface RecalculateScoreResponse {
  match_score: number;
  previous_score?: number;
  score_delta: number;
  mandatory_coverage_pct: number;
  keyword_overlap_pct: number;
  impact_density_score: number;
  readability_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  metrics_detected: string[];
  action_verbs_detected: string[];
  suggestions: string[];
  calculated_at: string;
  latency_ms: number;
}
