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

export interface GapAnalysisResponse {
  matched_skills: MatchedSkill[];
  missing_mandatory_skills: MissingMandatorySkill[];
  nice_to_haves: NiceToHaveSkill[];
  match_score: number;
  summary: string;
  stats?: GapAnalysisStats;
  analyzed_at?: string;
}

export interface GapAnalysisRequest {
  job_description?: string;
  jobDescription?: string;
  resume_chunks?: string[] | { text: string; id?: string | number }[];
  resumeChunks?: string[] | { text: string; id?: string | number }[];
}
