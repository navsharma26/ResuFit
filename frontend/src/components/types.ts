export interface MatchedSkill {
  skill: string;
  category: string;
  resume_evidence: string;
  confidence: number;
  chunk_index?: number;
}

export interface PracticalTask {
  step: number;
  title: string;
  description: string;
}

export interface SkillActionPlan {
  skill: string;
  category: string;
  why_it_matters: string;
  recommended_action: string;
  tasks: PracticalTask[];
  evidence_artifacts: string[];
  estimated_time?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  honest_guideline: string;
}

export interface GapAnalysisActionPlanRequest {
  skill: string;
  category?: string;
  job_description?: string;
  jobDescription?: string;
  resume_context?: string | string[];
  resumeContext?: string | string[];
}

export interface CareerReadinessPlan {
  why_it_matters: string;
  evidence_found: string;
  evidence_status: 'none' | 'partial' | 'verified';
  recommended_action: string;
  suggested_proof: string[];
  tasks?: PracticalTask[];
  evidence_artifacts?: string[];
}

export interface CareerReadinessItem {
  skill: string;
  category: string;
  is_mandatory: boolean;
  impact_or_bonus?: string;
  why_it_matters: string;
  evidence_found: string;
  evidence_status: 'none' | 'partial' | 'verified';
  recommended_action: string;
  suggested_proof: string[];
  tasks?: PracticalTask[];
  evidence_artifacts?: string[];
}

export interface MissingMandatorySkill {
  skill: string;
  category: string;
  impact: 'critical' | 'high' | 'medium';
  recommendation: string;
  readiness_plan?: CareerReadinessPlan;
}

export interface NiceToHaveSkill {
  skill: string;
  category: string;
  status: 'matched' | 'missing';
  resume_evidence?: string;
  bonus_value: 'high' | 'medium' | 'low';
  readiness_plan?: CareerReadinessPlan;
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
  career_readiness?: CareerReadinessItem[];
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


