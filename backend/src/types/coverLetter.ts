export type CoverLetterPersona = 'strict_enterprise' | 'startup_tech_lead' | 'concise_direct';

export interface PersonaToneConfig {
  id: CoverLetterPersona;
  name: string;
  voice: string;
  formality: 'high' | 'balanced' | 'direct';
  pacing: string;
  description: string;
  targetAudience: string;
  guidelines: string[];
}

export interface CoverLetterRequest {
  job_description?: string;
  jobDescription?: string;
  resume_chunks?: Array<string | { text?: string }>;
  resumeChunks?: Array<string | { text?: string }>;
  resume_context?: string;
  resumeContext?: string;
  persona?: CoverLetterPersona | string;
}

export interface ToneAttributes {
  voice: string;
  formality: string;
  pacing: string;
}

export interface CoverLetterResponse {
  cover_letter: string;
  persona: CoverLetterPersona;
  persona_label: string;
  tone_attributes: ToneAttributes;
  grounded_claims: string[];
  grounding_score: number;
  created_at: string;
  model_used?: string;
  is_fallback?: boolean;
}
