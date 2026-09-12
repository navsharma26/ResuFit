import {
  CoverLetterPersona,
  PersonaToneConfig,
  ToneAttributes
} from '../types/coverLetter.js';

export const PERSONA_CONFIGS: Record<CoverLetterPersona, PersonaToneConfig> = {
  strict_enterprise: {
    id: 'strict_enterprise',
    name: 'Strict Enterprise',
    voice: 'Authoritative, dignified, polished executive decorum',
    formality: 'high',
    pacing: 'Deliberate, structured, and comprehensive',
    description:
      'Engineered for Fortune 500s, enterprise institutions, and regulated environments prioritizing governance, architectural scale, and cross-functional stability.',
    targetAudience: 'Enterprise Hiring Committees, VPs of Engineering, and Corporate Talent Acquisition',
    guidelines: [
      'Maintain formal executive decorum with respectful salutation (e.g., "Dear Hiring Committee") and formal closing (e.g., "Sincerely").',
      'Emphasize governance, architectural resilience, risk mitigation, and proven organizational methodologies.',
      'Frame technical accomplishments through the lens of long-term business continuity, SLA adherence, and enterprise scale.',
      'Highlight cross-functional stakeholder collaboration, team mentorship, and adherence to rigorous engineering standards.',
      'Use polished, sophisticated syntax with clean paragraph transitions; avoid slang, overly casual expressions, or informal abbreviations.'
    ]
  },
  startup_tech_lead: {
    id: 'startup_tech_lead',
    name: 'Startup Tech Lead',
    voice: 'Dynamic, pragmatic, high-velocity builder mindset',
    formality: 'balanced',
    pacing: 'Energetic, confident, and action-oriented',
    description:
      'Designed for high-growth tech startups and scale-ups that value rapid execution, end-to-end technical stewardship, and 0-to-1 impact.',
    targetAudience: 'Founders, CTOs, and Engineering Leads looking for proactive technical owners',
    guidelines: [
      'Adopt an energetic, modern, and direct tone that signals immediate technical capability and bias for action.',
      'Emphasize rapid shipping velocity, pragmatic architectural decisions, and end-to-end feature ownership.',
      'Frame achievements around resolving critical technical bottlenecks, scaling systems under tight timelines, and driving user/product value.',
      'Demonstrate enthusiasm for fast-paced collaboration, wearing multiple hats, and tackling ambiguous problems.',
      'Use crisp, modern technical phrasing with a professional yet conversational opening (e.g., "Hi [Company/Team] Engineering Team,") and confident sign-off.'
    ]
  },
  concise_direct: {
    id: 'concise_direct',
    name: 'Concise & Direct',
    voice: 'High signal-to-noise ratio, metric-driven, bullet-forward executive brief',
    formality: 'direct',
    pacing: 'Rapid, scannable, zero-fluff',
    description:
      'Optimized for time-pressed hiring managers and technical directors who demand instant qualification mapping without generic filler.',
    targetAudience: 'Senior Technical Managers who review hundreds of applications and want immediate proof of fit',
    guidelines: [
      'Eliminate generic pleasantries, corporate clichés, and introductory filler; declare alignment and value in the very first sentence.',
      'Structure the core value proposition using high-impact bullet points directly matching candidate evidence to key job requirements.',
      'Lead with hard metrics, quantitative accomplishments, and verified technical competencies.',
      'Maintain a laser focus on high signal-to-noise ratio—every sentence must carry tangible evidence.',
      'Keep the total length compact and scannable in under 30 seconds, concluding with a direct one-sentence call to action.'
    ]
  }
};

/**
 * Normalizes input string to supported CoverLetterPersona enum, defaulting to 'strict_enterprise'
 */
export function normalizePersona(persona?: string): CoverLetterPersona {
  if (!persona) {
    return 'strict_enterprise';
  }
  const clean = persona.trim().toLowerCase();
  if (clean === 'startup_tech_lead' || clean === 'tech_lead' || clean === 'startup') {
    return 'startup_tech_lead';
  }
  if (clean === 'concise_direct' || clean === 'concise' || clean === 'direct') {
    return 'concise_direct';
  }
  return 'strict_enterprise';
}

/**
 * Retrieves tone config for a given persona
 */
export function getPersonaConfig(persona: CoverLetterPersona): PersonaToneConfig {
  return PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.strict_enterprise;
}

/**
 * Extracts tone attributes for the response payload
 */
export function getToneAttributes(persona: CoverLetterPersona): ToneAttributes {
  const config = getPersonaConfig(persona);
  return {
    voice: config.voice,
    formality: config.formality,
    pacing: config.pacing
  };
}

/**
 * Builds the LLM System Prompt injecting persona guidelines and the strict Pinecone context grounding constraint
 */
export function buildCoverLetterSystemPrompt(persona: CoverLetterPersona): string {
  const config = getPersonaConfig(persona);

  const formattedGuidelines = config.guidelines
    .map((g, idx) => `  ${idx + 1}. ${g}`)
    .join('\n');

  return `
You are an expert AI Career Strategist and Executive Communications Writer specializing in tailoring cover letters for high-caliber engineering candidates.

================================================================================
CRITICAL CONSTRAINT: STRICT FACTUAL GROUNDING IN PINECONE RETRIEVED RESUME CONTEXT
================================================================================
1. ALL claims, experiences, past employers, job titles, technologies, frameworks, and metrics MUST be strictly and explicitly grounded in the retrieved resume context chunks provided by the user.
2. ABSOLUTE ZERO HALLUCINATION: You are strictly forbidden from inventing, assuming, extrapolating, or embellishing any achievements, unverified years of experience, or missing credentials.
3. If the Job Description requires a technology or qualification that does NOT appear anywhere in the retrieved resume context, DO NOT claim experience with it. Instead, emphasize the candidate's verified overlapping strengths or omit the ungrounded requirement entirely.
4. Every fact in the generated cover letter must trace directly back to the candidate's retrieved resume chunks from Pinecone.

================================================================================
SELECTED PERSONA: "${config.name.toUpperCase()}" (${config.id})
================================================================================
Tone Guidelines:
- Voice: ${config.voice}
- Formality: ${config.formality}
- Pacing: ${config.pacing}
- Target Audience: ${config.targetAudience}

Persona-Specific Stylistic Directives:
${formattedGuidelines}

================================================================================
OUTPUT SCHEMA (STRICT JSON ONLY)
================================================================================
You must output a strictly valid JSON object conforming to this schema:
{
  "cover_letter": string (the complete, beautifully formatted cover letter matching the persona's tone and formatting directives),
  "persona": "${config.id}",
  "persona_label": "${config.name}",
  "grounded_claims": [
    string (list of 3 to 6 key factual claims and metrics directly extracted from the resume chunks that were utilized in the letter)
  ],
  "grounding_score": number (integer 100, certifying that all statements are strictly verified against the retrieved context)
}

Do not wrap in Markdown code fences. Return raw valid JSON.
`.trim();
}

/**
 * Builds the LLM User Prompt containing the Target Job Description and the Retrieved Pinecone Resume Context
 */
export function buildCoverLetterUserPrompt(
  jobDescription: string,
  resumeChunks: string[],
  persona: CoverLetterPersona
): string {
  const config = getPersonaConfig(persona);

  const formattedChunks = resumeChunks
    .map((chunk, idx) => `[Pinecone Retrieved Resume Chunk #${idx + 1}]:\n${chunk.trim()}`)
    .join('\n\n');

  return `
Please generate a tailored, grounded cover letter applying the "${config.name}" persona.

=== TARGET JOB DESCRIPTION ===
${jobDescription.trim()}

=== CANDIDATE RETRIEVED RESUME CONTEXT (FROM PINECONE) ===
${formattedChunks}

Remember:
- Embody the tone, pacing, and formatting of persona: "${config.name}" (${config.id}).
- Strictly ground every claim and metric in the retrieved resume context chunks above.
- Return pure JSON conforming to the requested schema.
`.trim();
}
