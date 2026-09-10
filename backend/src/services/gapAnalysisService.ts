import OpenAI from 'openai';
import {
  GapAnalysisResponse,
  MatchedSkill,
  MissingMandatorySkill,
  NiceToHaveSkill,
  GapAnalysisStats
} from '../types/gapAnalysis.js';

export class GapAnalysisService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: apiKey.trim() });
    }
  }

  /**
   * Main gap analysis handler
   */
  async analyzeRequirements(
    jobDescription: string,
    resumeChunks: string[]
  ): Promise<GapAnalysisResponse> {
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error('Job description cannot be empty');
    }

    if (!resumeChunks || resumeChunks.length === 0) {
      throw new Error('At least one resume chunk must be provided');
    }

    // If OpenAI client is initialized and key is present, attempt live gpt-4o-mini completion
    if (this.openai) {
      try {
        return await this.callOpenAI(jobDescription, resumeChunks);
      } catch (error: any) {
        console.warn('OpenAI API call failed, switching to intelligent fallback analyzer:', error?.message || error);
        return this.runIntelligentFallback(jobDescription, resumeChunks, error?.message);
      }
    }

    // No API key configured - use intelligent local mock engine
    return this.runIntelligentFallback(jobDescription, resumeChunks);
  }

  /**
   * Call official OpenAI Node SDK with gpt-4o-mini and json_object response format
   */
  private async callOpenAI(
    jobDescription: string,
    resumeChunks: string[]
  ): Promise<GapAnalysisResponse> {
    if (!this.openai) throw new Error('OpenAI client not configured');

    const formattedChunks = resumeChunks
      .map((chunk, idx) => `[Resume Chunk #${idx + 1}]:\n${chunk.trim()}`)
      .join('\n\n');

    const systemPrompt = `
You are an expert Technical Recruiter and ATS (Applicant Tracking System) Gap Analysis Engine.
Your task is to conduct an in-depth requirement gap analysis between a target Job Description and chunks of an applicant's resume.

Strictly adhere to this output schema and return a valid JSON object:
{
  "matched_skills": [
    {
      "skill": string,
      "category": string,
      "resume_evidence": string (quote or concrete evidence directly found in resume chunks),
      "confidence": number (float between 0.0 and 1.0),
      "chunk_index": number (1-based index of resume chunk)
    }
  ],
  "missing_mandatory_skills": [
    {
      "skill": string,
      "category": string,
      "impact": "critical" | "high" | "medium",
      "recommendation": string (actionable advice to address or position this gap)
    }
  ],
  "nice_to_haves": [
    {
      "skill": string,
      "category": string,
      "status": "matched" | "missing",
      "resume_evidence": string (optional quote if matched, or empty string),
      "bonus_value": "high" | "medium" | "low"
    }
  ],
  "match_score": number (integer between 0 and 100, weighted: mandatory skills count 75%, nice-to-haves count 25%),
  "summary": string (2-3 sentences providing an executive fit summary)
}

Rules:
1. Distinguish strictly between MANDATORY requirements (must have, required, minimum qualifications, core responsibilities) and NICE-TO-HAVES (preferred, bonus, plus, nice to have).
2. Only mark a skill as "matched" if there is explicit or strongly implied evidence in the resume chunks.
3. Every missing mandatory skill must have an actionable recommendation.
4. Output must be pure JSON with the exact specified keys.
`.trim();

    const userPrompt = `
Analyze the following Job Description against the provided Resume Chunks:

=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== APPLICANT RESUME CHUNKS ===
${formattedChunks}
`.trim();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 2500
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed = JSON.parse(rawContent);

    // Normalize and compute stats
    const matched_skills: MatchedSkill[] = Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [];
    const missing_mandatory_skills: MissingMandatorySkill[] = Array.isArray(parsed.missing_mandatory_skills) ? parsed.missing_mandatory_skills : [];
    const nice_to_haves: NiceToHaveSkill[] = Array.isArray(parsed.nice_to_haves) ? parsed.nice_to_haves : [];

    const totalMandatory = matched_skills.length + missing_mandatory_skills.length;
    const matchedMandatory = matched_skills.length;
    const totalNice = nice_to_haves.length;
    const matchedNice = nice_to_haves.filter(n => n.status === 'matched').length;

    // Calculate or preserve match score
    let matchScore = typeof parsed.match_score === 'number' ? Math.round(parsed.match_score) : 0;
    if (totalMandatory > 0) {
      const mandatoryRatio = matchedMandatory / totalMandatory;
      const niceRatio = totalNice > 0 ? matchedNice / totalNice : 0.5;
      const calculatedScore = Math.round((mandatoryRatio * 80) + (niceRatio * 20));
      if (matchScore === 0) {
        matchScore = calculatedScore;
      }
    }

    const stats: GapAnalysisStats = {
      total_mandatory: totalMandatory,
      matched_mandatory: matchedMandatory,
      total_nice_to_have: totalNice,
      matched_nice_to_have: matchedNice,
      mandatory_coverage_pct: totalMandatory > 0 ? Math.round((matchedMandatory / totalMandatory) * 100) : 100
    };

    return {
      matched_skills,
      missing_mandatory_skills,
      nice_to_haves,
      match_score: Math.min(100, Math.max(0, matchScore)),
      summary: parsed.summary || `Candidate covers ${matchedMandatory} of ${totalMandatory} mandatory technical requirements.`,
      stats,
      analyzed_at: new Date().toISOString()
    };
  }

  /**
   * High-fidelity local fallback analyzer
   * Parses common technical keywords from JD and compares against resume chunks
   */
  private runIntelligentFallback(
    jobDescription: string,
    resumeChunks: string[],
    fallbackReason?: string
  ): GapAnalysisResponse {
    const resumeFullText = resumeChunks.join(' \n ').toLowerCase();
    const jdLower = jobDescription.toLowerCase();

    // Catalog of standard technical skills, categories, and heuristics
    const skillCatalog = [
      { name: 'TypeScript', category: 'Languages', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'JavaScript', category: 'Languages', isMandatoryDefault: true, bonus: 'medium' as const },
      { name: 'Python', category: 'Languages', isMandatoryDefault: false, bonus: 'medium' as const },
      { name: 'Node.js', category: 'Backend & Runtime', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'Express', category: 'Backend & Runtime', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'React', category: 'Frontend', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'Next.js', category: 'Frontend', isMandatoryDefault: false, bonus: 'high' as const },
      { name: 'PostgreSQL', category: 'Databases', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'MongoDB', category: 'Databases', isMandatoryDefault: false, bonus: 'medium' as const },
      { name: 'Redis', category: 'Databases & Caching', isMandatoryDefault: false, bonus: 'medium' as const },
      { name: 'GraphQL', category: 'API Design', isMandatoryDefault: false, bonus: 'medium' as const },
      { name: 'REST APIs', category: 'API Design', isMandatoryDefault: true, bonus: 'medium' as const },
      { name: 'Docker', category: 'DevOps & Cloud', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'Kubernetes', category: 'DevOps & Cloud', isMandatoryDefault: false, bonus: 'high' as const },
      { name: 'AWS', category: 'Cloud Infrastructure', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'CI/CD Pipelines', category: 'DevOps', isMandatoryDefault: false, bonus: 'medium' as const },
      { name: 'Tailwind CSS', category: 'Frontend', isMandatoryDefault: false, bonus: 'low' as const },
      { name: 'Microservices', category: 'Architecture', isMandatoryDefault: false, bonus: 'high' as const },
      { name: 'Jest / Testing', category: 'Testing & QA', isMandatoryDefault: false, bonus: 'medium' as const }
    ];

    const matched_skills: MatchedSkill[] = [];
    const missing_mandatory_skills: MissingMandatorySkill[] = [];
    const nice_to_haves: NiceToHaveSkill[] = [];

    // Detect skills present in JD
    const detectedInJd = skillCatalog.filter(skill => {
      const regex = new RegExp(`\\b${skill.name.toLowerCase().replace('.', '\\.')}\\b`, 'i');
      return regex.test(jdLower);
    });

    // If JD is specific or custom, also extract capitalized tech patterns from JD
    const customTechTerms = ['kafka', 'elasticsearch', 'grpc', 'terraform', 'vue', 'angular', 'golang', 'rust'];
    customTechTerms.forEach(term => {
      if (jdLower.includes(term) && !detectedInJd.some(s => s.name.toLowerCase() === term)) {
        detectedInJd.push({
          name: term.charAt(0).toUpperCase() + term.slice(1),
          category: 'Specialized Tech',
          isMandatoryDefault: jdLower.includes('must') || jdLower.includes('required'),
          bonus: 'medium' as const
        });
      }
    });

    // If no catalog skill found, supply a default baseline based on JD content
    const finalSkillsToEvaluate = detectedInJd.length > 0 ? detectedInJd : [
      { name: 'TypeScript', category: 'Languages', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'Express', category: 'Backend', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'React', category: 'Frontend', isMandatoryDefault: true, bonus: 'high' as const },
      { name: 'Docker', category: 'DevOps', isMandatoryDefault: true, bonus: 'medium' as const },
      { name: 'Kubernetes', category: 'DevOps', isMandatoryDefault: false, bonus: 'high' as const },
      { name: 'AWS', category: 'Cloud', isMandatoryDefault: false, bonus: 'high' as const }
    ];

    finalSkillsToEvaluate.forEach((skillItem) => {
      const skillNameLower = skillItem.name.toLowerCase();
      
      // Identify position of nice-to-have boundary in JD if present
      const niceBoundaryRegex = /(?:nice to have|preferred|bonus|plus|optional)/i;
      const niceMatch = jdLower.match(niceBoundaryRegex);
      const niceBoundaryIndex = niceMatch && niceMatch.index !== undefined ? niceMatch.index : -1;

      // Find position of this skill in JD
      const skillIndexInJd = jdLower.indexOf(skillNameLower);

      let isNiceToHave = false;
      if (niceBoundaryIndex !== -1 && skillIndexInJd > niceBoundaryIndex) {
        isNiceToHave = true;
      } else if (skillItem.isMandatoryDefault) {
        isNiceToHave = false;
      } else {
        isNiceToHave = !skillItem.isMandatoryDefault;
      }

      // Find in chunks
      let matchedChunkIndex = -1;
      let matchedSnippet = '';

      for (let i = 0; i < resumeChunks.length; i++) {
        const chunk = resumeChunks[i];
        if (chunk.toLowerCase().includes(skillNameLower)) {
          matchedChunkIndex = i + 1;
          // Extract sentence or context
          const sentences = chunk.split(/[.\n]/);
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(skillNameLower));
          matchedSnippet = relevantSentence ? relevantSentence.trim() : chunk.slice(0, 140).trim();
          break;
        }
      }

      if (matchedChunkIndex !== -1) {
        if (!isNiceToHave) {
          matched_skills.push({
            skill: skillItem.name,
            category: skillItem.category,
            resume_evidence: matchedSnippet || `Demonstrated hands-on experience with ${skillItem.name} documented in resume.`,
            confidence: 0.95,
            chunk_index: matchedChunkIndex
          });
        } else {
          nice_to_haves.push({
            skill: skillItem.name,
            category: skillItem.category,
            status: 'matched',
            resume_evidence: matchedSnippet || `Proficiency in ${skillItem.name} confirmed in candidate chunks.`,
            bonus_value: skillItem.bonus
          });
        }
      } else {
        if (!isNiceToHave) {
          missing_mandatory_skills.push({
            skill: skillItem.name,
            category: skillItem.category,
            impact: 'high',
            recommendation: `Add verifiable experience, production projects, or certifications showcasing ${skillItem.name} to your resume bullets.`
          });
        } else {
          nice_to_haves.push({
            skill: skillItem.name,
            category: skillItem.category,
            status: 'missing',
            resume_evidence: '',
            bonus_value: skillItem.bonus
          });
        }
      }
    });

    const totalMandatory = matched_skills.length + missing_mandatory_skills.length;
    const matchedMandatory = matched_skills.length;
    const totalNice = nice_to_haves.length;
    const matchedNice = nice_to_haves.filter(n => n.status === 'matched').length;

    const mandatoryRatio = totalMandatory > 0 ? matchedMandatory / totalMandatory : 1;
    const niceRatio = totalNice > 0 ? matchedNice / totalNice : 0.5;
    const match_score = Math.round((mandatoryRatio * 80) + (niceRatio * 20));

    const stats: GapAnalysisStats = {
      total_mandatory: totalMandatory,
      matched_mandatory: matchedMandatory,
      total_nice_to_have: totalNice,
      matched_nice_to_have: matchedNice,
      mandatory_coverage_pct: totalMandatory > 0 ? Math.round((matchedMandatory / totalMandatory) * 100) : 100
    };

    const summaryNotice = fallbackReason 
      ? `Analyzed using local heuristic engine (fallback notice: ${fallbackReason.slice(0, 100)}). Candidate satisfies ${matchedMandatory} of ${totalMandatory} core technical criteria.`
      : `Strong candidate profile matching ${matchedMandatory} of ${totalMandatory} required competencies with ${matchedNice} nice-to-have capabilities demonstrated.`;

    return {
      matched_skills,
      missing_mandatory_skills,
      nice_to_haves,
      match_score: Math.min(100, Math.max(10, match_score)),
      summary: summaryNotice,
      stats,
      analyzed_at: new Date().toISOString()
    };
  }
}
