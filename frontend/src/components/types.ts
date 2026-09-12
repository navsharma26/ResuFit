export interface MatchedSkill {
  skill: string;
  category: string;
  resume_evidence: string;
  confidence: number;
  chunk_index?: number;
}

export interface MissingMandatorySkill {
  skill: string;
  category: string;
  impact: 'critical' | 'high' | 'medium';
  recommendation: string;
}

export interface NiceToHaveSkill {
  skill: string;
  category: string;
  status: 'matched' | 'missing';
  resume_evidence?: string;
  bonus_value: 'high' | 'medium' | 'low';
}

export interface GapAnalysisStats {
  total_mandatory: number;
  matched_mandatory: number;
  total_nice_to_have: number;
  matched_nice_to_have: number;
  mandatory_coverage_pct: number;
}

export interface GapAnalysisResult {
  matched_skills: MatchedSkill[];
  missing_mandatory_skills: MissingMandatorySkill[];
  nice_to_haves: NiceToHaveSkill[];
  match_score: number;
  summary: string;
  stats?: GapAnalysisStats;
  analyzed_at?: string;
}

export type CoverLetterPersona = 'strict_enterprise' | 'startup_tech_lead' | 'concise_direct';

export interface CoverLetterResult {
  cover_letter: string;
  persona: CoverLetterPersona;
  persona_label: string;
  tone_attributes: {
    voice: string;
    formality: string;
    pacing: string;
  };
  grounded_claims: string[];
  grounding_score: number;
  created_at: string;
  model_used?: string;
  is_fallback?: boolean;
}

export interface PersonaOption {
  id: CoverLetterPersona;
  name: string;
  badge: string;
  iconName: 'Building' | 'Rocket' | 'Zap';
  shortDesc: string;
  voice: string;
  formality: string;
  pacing: string;
}

export interface RecalculateScoreResult {
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

export interface ResumeVersionItem {
  id: string;
  userId: string;
  jobId: string;
  content: string;
  matchScore: number;
  createdAt: string;
}

export interface ScoreEvolutionPoint {
  versionId: string;
  iteration: number;
  score: number;
  createdAt: string;
}

export interface ResumeVersionHistoryData {
  versions: ResumeVersionItem[];
  total: number;
  scoreEvolution: ScoreEvolutionPoint[];
  stats: {
    initialScore: number;
    currentScore: number;
    scoreDelta: number;
    highestScore: number;
    lowestScore: number;
    totalIterations: number;
  };
}


