export interface MatchedSkill {
  skill: string;
  category: string;
  resume_evidence: string;
  confidence: number;
  chunk_index?: number;
  evidence_strength?: 'high' | 'moderate' | 'surface';
  quantified_metrics?: string[];
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
  projected_score_delta?: number;
  roi_priority?: 'Quick Win' | 'Core Investment' | 'Secondary';
}

export interface CareerReadinessPlan {
  why_it_matters: string;
  evidence_found: string;
  evidence_status: 'none' | 'partial' | 'verified';
  recommended_action: string;
  suggested_proof: string[];
  tasks?: PracticalTask[];
  evidence_artifacts?: string[];
  projected_score_delta?: number;
  estimated_time?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  roi_priority?: 'Quick Win' | 'Core Investment' | 'Secondary';
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
  projected_score_delta?: number;
  estimated_time?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  roi_priority?: 'Quick Win' | 'Core Investment' | 'Secondary';
}

export interface MissingMandatorySkill {
  skill: string;
  category: string;
  impact: 'critical' | 'high' | 'medium';
  recommendation: string;
  readiness_plan?: CareerReadinessPlan;
  projected_score_delta?: number;
  roi_priority?: 'Quick Win' | 'Core Investment' | 'Secondary';
}

export interface NiceToHaveSkill {
  skill: string;
  category: string;
  status: 'matched' | 'missing';
  resume_evidence?: string;
  bonus_value: 'high' | 'medium' | 'low';
  readiness_plan?: CareerReadinessPlan;
  projected_score_delta?: number;
  roi_priority?: 'Quick Win' | 'Core Investment' | 'Secondary';
  evidence_strength?: 'high' | 'moderate' | 'surface';
  quantified_metrics?: string[];
}

export interface GapAnalysisStats {
  total_mandatory: number;
  matched_mandatory: number;
  total_nice_to_have: number;
  matched_nice_to_have: number;
  mandatory_coverage_pct: number;
}

export interface GapAnalysisResponse {
  matched_skills: MatchedSkill[];
  missing_mandatory_skills: MissingMandatorySkill[];
  nice_to_haves: NiceToHaveSkill[];
  match_score: number;
  summary: string;
  career_readiness?: CareerReadinessItem[];
  stats?: GapAnalysisStats;
  analyzed_at?: string;
}

export interface GapAnalysisRequest {
  job_description?: string;
  jobDescription?: string;
  jd?: string;
  job?: string;
  resume_chunks?: string[] | { text: string; id?: string | number }[];
  resumeChunks?: string[] | { text: string; id?: string | number }[];
  chunks?: string[] | { text: string; id?: string | number }[];
  resume_text?: string;
  resumeText?: string;
  resume?: string;
  resume_context?: string | string[];
  resumeContext?: string | string[];
}

export interface GapAnalysisActionPlanRequest {
  skill?: string;
  name?: string;
  category?: string;
  job_description?: string;
  jobDescription?: string;
  resume_context?: string | string[];
  resumeContext?: string | string[];
}
