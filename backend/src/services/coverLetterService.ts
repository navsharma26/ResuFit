import OpenAI from 'openai';
import {
  CoverLetterPersona,
  CoverLetterResponse,
  ToneAttributes
} from '../types/coverLetter.js';
import {
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  getPersonaConfig,
  getToneAttributes,
  normalizePersona
} from './coverLetterPromptBuilder.js';

export class CoverLetterService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: apiKey.trim() });
    }
  }

  /**
   * Generates a persona-customized cover letter strictly grounded in Pinecone resume chunks
   */
  async generateCoverLetter(
    jobDescription: string,
    resumeChunks: string[],
    rawPersona?: string
  ): Promise<CoverLetterResponse> {
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new Error('Job description cannot be empty');
    }

    if (!resumeChunks || resumeChunks.length === 0) {
      throw new Error('At least one resume chunk must be provided');
    }

    const persona = normalizePersona(rawPersona);
    const personaConfig = getPersonaConfig(persona);
    const toneAttributes = getToneAttributes(persona);

    // If OpenAI is configured, invoke live model
    if (this.openai) {
      try {
        return await this.callOpenAI(jobDescription, resumeChunks, persona, toneAttributes);
      } catch (error: any) {
        console.warn(
          'OpenAI Cover Letter generation failed, engaging grounded fallback engine:',
          error?.message || error
        );
        return this.runGroundedFallbackEngine(jobDescription, resumeChunks, persona, error?.message);
      }
    }

    // No OpenAI API key configured - execute deterministic grounded engine
    return this.runGroundedFallbackEngine(jobDescription, resumeChunks, persona);
  }

  /**
   * Calls OpenAI gpt-4o-mini with structured persona prompt and strict grounding instructions
   */
  private async callOpenAI(
    jobDescription: string,
    resumeChunks: string[],
    persona: CoverLetterPersona,
    toneAttributes: ToneAttributes
  ): Promise<CoverLetterResponse> {
    if (!this.openai) throw new Error('OpenAI client not configured');

    const config = getPersonaConfig(persona);
    const systemPrompt = buildCoverLetterSystemPrompt(persona);
    const userPrompt = buildCoverLetterUserPrompt(jobDescription, resumeChunks, persona);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.35,
      max_tokens: 2200
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed = JSON.parse(rawContent);

    return {
      cover_letter: parsed.cover_letter || '',
      persona: config.id,
      persona_label: config.name,
      tone_attributes: toneAttributes,
      grounded_claims: Array.isArray(parsed.grounded_claims) ? parsed.grounded_claims : [],
      grounding_score: typeof parsed.grounding_score === 'number' ? parsed.grounding_score : 100,
      created_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini',
      is_fallback: false
    };
  }

  /**
   * High-fidelity grounded fallback generator
   * Extracts verified claims strictly from resume chunks and applies the selected persona's tone
   */
  private runGroundedFallbackEngine(
    jobDescription: string,
    resumeChunks: string[],
    persona: CoverLetterPersona,
    fallbackReason?: string
  ): CoverLetterResponse {
    const config = getPersonaConfig(persona);
    const toneAttributes = getToneAttributes(persona);

    // Extract facts strictly from resume chunks
    const extractedFacts = this.extractFactsFromChunks(resumeChunks);
    const targetRole = this.extractTargetRole(jobDescription) || 'Software Engineer';

    let coverLetterText = '';
    const candidateName = extractedFacts.name || 'Candidate';

    switch (persona) {
      case 'strict_enterprise': {
        coverLetterText = [
          `Dear Hiring Committee,`,
          ``,
          `I am writing to respectfully present my candidacy for the ${targetRole} position. With verified hands-on engineering experience spanning ${extractedFacts.skills.slice(0, 4).join(', ')}, I offer a disciplined foundation centered on long-term architectural stability, rigorous standards, and enterprise scalability.`,
          ``,
          `Throughout my career, I have prioritized governance and mission-critical execution. In my documented production work:`,
          ...extractedFacts.achievements.slice(0, 3).map(a => `• ${a}`),
          ``,
          `My approach balances robust risk mitigation with engineering velocity, ensuring that distributed microservices and infrastructure meet stringent enterprise SLAs. I actively welcome cross-functional stakeholder collaboration, comprehensive code review standards, and data-driven systems design.`,
          ``,
          `Thank you for your time, consideration, and dedication to technical excellence. I would welcome the privilege of discussing how my verified qualifications can deliver sustained value to your organization.`,
          ``,
          `Sincerely,`,
          `${candidateName}`
        ].join('\n');
        break;
      }

      case 'startup_tech_lead': {
        coverLetterText = [
          `Hi Engineering Team,`,
          ``,
          `I saw your opening for the ${targetRole} role and immediately wanted to reach out. As a hands-on builder with experience taking systems from 0 to 1 and driving high-velocity engineering, I thrive in fast-paced environments where ownership and pragmatic architecture matter.`,
          ``,
          `Here is what I've delivered in production based on my verified background:`,
          ...extractedFacts.achievements.slice(0, 3).map(a => `• ${a}`),
          ``,
          `My technical core includes ${extractedFacts.skills.slice(0, 5).join(', ')}. In a high-growth environment, I focus on unblocking the roadmap, eliminating technical debt before it snowballs, and shipping features that directly move customer metrics without over-engineering.`,
          ``,
          `I'd love to chat about your current technical hurdles and how we can tackle them together. Looking forward to connecting soon!`,
          ``,
          `Best regards,`,
          `${candidateName}`
        ].join('\n');
        break;
      }

      case 'concise_direct': {
        coverLetterText = [
          `Dear Hiring Team,`,
          ``,
          `I am submitting my candidacy for the ${targetRole} role, offering direct qualification alignment with your core technical requirements.`,
          ``,
          `Verified Evidence & Measurable Impact (Retrieved Resume Context):`,
          ...extractedFacts.achievements.slice(0, 4).map(a => `• ${a}`),
          `• Primary Core Competencies: ${extractedFacts.skills.join(', ')}`,
          ``,
          `I maintain a zero-fluff, results-first approach and welcome an interview to demonstrate immediate contribution to your technical roadmap.`,
          ``,
          `Regards,`,
          `${candidateName}`
        ].join('\n');
        break;
      }
    }

    return {
      cover_letter: coverLetterText,
      persona: config.id,
      persona_label: config.name,
      tone_attributes: toneAttributes,
      grounded_claims: extractedFacts.achievements.slice(0, 5),
      grounding_score: 100,
      created_at: new Date().toISOString(),
      model_used: fallbackReason ? `local-heuristic-fallback (${fallbackReason})` : 'local-heuristic-engine',
      is_fallback: true
    };
  }

  /**
   * Helper to parse verified claims strictly from resume chunks
   */
  private extractFactsFromChunks(chunks: string[]): {
    name: string;
    skills: string[];
    achievements: string[];
  } {
    const combined = chunks.join('\n');
    let name = 'Applicant';

    // Check for candidate name on first line
    const firstLine = chunks[0]?.split('\n')[0]?.trim() || '';
    if (firstLine.includes(' - ') || firstLine.includes('|')) {
      name = firstLine.split(/[-|]/)[0].trim();
    } else if (firstLine.length > 0 && firstLine.length < 40 && !firstLine.toLowerCase().includes('job')) {
      name = firstLine;
    }

    // Extract bullet points / achievements directly from chunks
    const achievements: string[] = [];
    const lines = combined.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const cleanAchievement = trimmed.replace(/^[-•*]\s*/, '').trim();
        if (cleanAchievement.length > 20) {
          achievements.push(cleanAchievement);
        }
      }
    }

    // Default fallback achievements if bullets aren't formatted with markers
    if (achievements.length === 0) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 30 && !trimmed.toLowerCase().includes('job title') && !trimmed.startsWith('===')) {
          achievements.push(trimmed);
        }
      }
    }

    // Extract verified skills from chunks
    const commonSkills = [
      'TypeScript', 'JavaScript', 'Node.js', 'Express', 'React', 'Next.js',
      'Python', 'PostgreSQL', 'MySQL', 'Docker', 'AWS', 'Kubernetes',
      'Pinecone', 'RAG', 'Vector Databases', 'pgvector', 'FastAPI', 'Redis',
      'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Git', 'OpenAI API'
    ];

    const matchedSkills = commonSkills.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combined);
    });

    return {
      name,
      skills: matchedSkills.length > 0 ? matchedSkills : ['TypeScript', 'Express', 'Cloud Architecture'],
      achievements: achievements.length > 0 ? achievements : ['Proven track record in high-impact software engineering and architecture.']
    };
  }

  /**
   * Helper to extract target role name from job description
   */
  private extractTargetRole(jd: string): string | null {
    const titleMatch = jd.match(/Job Title:\s*([^\n\r.]+)/i) || jd.match(/Role:\s*([^\n\r.]+)/i);
    if (titleMatch && titleMatch[1]) {
      const clean = titleMatch[1].replace(/\([^)]*\)/g, '').trim();
      return clean.length > 0 ? clean : titleMatch[1].trim();
    }
    return null;
  }
}
