import OpenAI from 'openai';
import {
  GapAnalysisResponse,
  MatchedSkill,
  MissingMandatorySkill,
  NiceToHaveSkill,
  GapAnalysisStats,
  CareerReadinessPlan,
  CareerReadinessItem,
  PracticalTask,
  SkillActionPlan
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
You are an expert Technical Recruiter and ATS (Applicant Tracking System) Gap Analysis Engine with an Evidence-Based Career Readiness Engine.
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
      "recommendation": string (actionable advice to address or position this gap),
      "readiness_plan": {
        "why_it_matters": string (explain why this requirement matters for this specific role),
        "evidence_found": string ("No supporting evidence found in the provided resume." or description of partial context),
        "evidence_status": "none" | "partial" | "verified",
        "recommended_action": string (practical, honest project/action to develop this skill, e.g. containerize an existing API, write tests, build a service),
        "suggested_proof": [string] (array of 3-5 concrete verifiable artifacts, e.g. "Dockerfile", "compose.yaml", "README setup instructions", "GitHub repository", "Test results")
      }
    }
  ],
  "nice_to_haves": [
    {
      "skill": string,
      "category": string,
      "status": "matched" | "missing",
      "resume_evidence": string (optional quote if matched, or empty string),
      "bonus_value": "high" | "medium" | "low",
      "readiness_plan": {
        "why_it_matters": string,
        "evidence_found": string,
        "evidence_status": "none" | "partial" | "verified",
        "recommended_action": string,
        "suggested_proof": [string]
      }
    }
  ],
  "match_score": number (integer between 0 and 100, weighted: mandatory skills count 75%, nice-to-haves count 25%),
  "summary": string (2-3 sentences providing an executive fit summary)
}

CRITICAL RULES & TRUST GUIDELINES:
1. Distinguish strictly between MANDATORY requirements (must have, required, minimum qualifications, core responsibilities) and NICE-TO-HAVES (preferred, bonus, plus, nice to have).
2. Only mark a skill as "matched" if there is explicit or strongly implied evidence in the resume chunks.
3. TRUST & HONESTY: NEVER tell the candidate to falsely claim or fabricate skills on their resume. Always encourage: Learn -> Practice -> Build -> Document -> Verify -> Add honestly.
4. If no evidence exists in the resume chunks, set evidence_status to 'none' and evidence_found strictly to 'No supporting evidence found in the provided resume.'.
5. For missing or partial requirements, recommended_action must specify practical, tangible work (e.g., containerizing an existing project, writing tests, building a service).
6. suggested_proof must list concrete, verifiable artifacts (code files, configs, setup guides, GitHub repositories, automated tests).
7. Output must be pure JSON with the exact specified keys.
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
      max_tokens: 3000
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed = JSON.parse(rawContent);

    // Normalize and compute stats
    const matched_skills: MatchedSkill[] = Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [];
    const missing_mandatory_skills: MissingMandatorySkill[] = Array.isArray(parsed.missing_mandatory_skills) 
      ? parsed.missing_mandatory_skills.map((s: any) => {
          const readiness = s.readiness_plan || this.generateReadinessPlan(s.skill, s.category || 'Core Skill', true, jobDescription, formattedChunks);
          return {
            skill: s.skill,
            category: s.category || 'General',
            impact: s.impact || 'high',
            recommendation: s.recommendation || `Add verifiable proof of ${s.skill} to your experience.`,
            readiness_plan: readiness
          };
        })
      : [];

    const nice_to_haves: NiceToHaveSkill[] = Array.isArray(parsed.nice_to_haves)
      ? parsed.nice_to_haves.map((n: any) => {
          let readiness = n.readiness_plan;
          if (n.status === 'missing' && !readiness) {
            readiness = this.generateReadinessPlan(n.skill, n.category || 'Nice-to-Have', false, jobDescription, formattedChunks);
          }
          return {
            skill: n.skill,
            category: n.category || 'Preferred',
            status: n.status === 'matched' ? 'matched' : 'missing',
            resume_evidence: n.resume_evidence || '',
            bonus_value: n.bonus_value || 'medium',
            readiness_plan: readiness
          };
        })
      : [];

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

    // Compile consolidated career readiness items
    const career_readiness: CareerReadinessItem[] = [];

    missing_mandatory_skills.forEach(s => {
      if (s.readiness_plan) {
        career_readiness.push({
          skill: s.skill,
          category: s.category,
          is_mandatory: true,
          impact_or_bonus: s.impact,
          ...s.readiness_plan
        });
      }
    });

    nice_to_haves.filter(n => n.status === 'missing').forEach(n => {
      if (n.readiness_plan) {
        career_readiness.push({
          skill: n.skill,
          category: n.category,
          is_mandatory: false,
          impact_or_bonus: n.bonus_value,
          ...n.readiness_plan
        });
      }
    });

    return {
      matched_skills,
      missing_mandatory_skills,
      nice_to_haves,
      match_score: Math.min(100, Math.max(0, matchScore)),
      summary: parsed.summary || `Candidate covers ${matchedMandatory} of ${totalMandatory} mandatory technical requirements.`,
      career_readiness,
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

      const weakQualifiers = [
        'familiar with',
        'familiarity with',
        'basic knowledge',
        'basic understanding',
        'exposure to',
        'heard of',
        'heard about',
        'learning',
        'studied',
        'beginner in',
        'beginner',
        'interest in'
      ];

      const isWeakClaim = matchedSnippet.length > 0 && weakQualifiers.some(q => matchedSnippet.toLowerCase().includes(q));

      if (matchedChunkIndex !== -1 && !isWeakClaim) {
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
        const candidateContext = matchedSnippet || resumeFullText;
        if (!isNiceToHave) {
          const readiness = this.generateReadinessPlan(skillItem.name, skillItem.category, true, jobDescription, candidateContext);
          missing_mandatory_skills.push({
            skill: skillItem.name,
            category: skillItem.category,
            impact: 'high',
            recommendation: readiness.recommended_action,
            readiness_plan: readiness
          });
        } else {
          const readiness = this.generateReadinessPlan(skillItem.name, skillItem.category, false, jobDescription, candidateContext);
          nice_to_haves.push({
            skill: skillItem.name,
            category: skillItem.category,
            status: 'missing',
            resume_evidence: matchedSnippet || '',
            bonus_value: skillItem.bonus,
            readiness_plan: readiness
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

    // Compile consolidated career readiness items
    const career_readiness: CareerReadinessItem[] = [];

    missing_mandatory_skills.forEach(s => {
      if (s.readiness_plan) {
        career_readiness.push({
          skill: s.skill,
          category: s.category,
          is_mandatory: true,
          impact_or_bonus: s.impact,
          ...s.readiness_plan
        });
      }
    });

    nice_to_haves.filter(n => n.status === 'missing').forEach(n => {
      if (n.readiness_plan) {
        career_readiness.push({
          skill: n.skill,
          category: n.category,
          is_mandatory: false,
          impact_or_bonus: n.bonus_value,
          ...n.readiness_plan
        });
      }
    });

    return {
      matched_skills,
      missing_mandatory_skills,
      nice_to_haves,
      match_score: Math.min(100, Math.max(10, match_score)),
      summary: summaryNotice,
      career_readiness,
      stats,
      analyzed_at: new Date().toISOString()
    };
  }

  /**
   * Evidence-Based Career Readiness Engine
   * Generates actionable, honest remediation plans with concrete proof artifacts for missing or partial requirements.
   * Trust Rule: Encourages Learn -> Practice -> Build -> Document -> Verify -> Add honestly.
   */
  public generateReadinessPlan(
    skillName: string,
    category: string,
    isMandatory: boolean,
    _jobDescription?: string,
    candidateChunksText?: string
  ): CareerReadinessPlan {
    const sLower = skillName.toLowerCase();
    const candidateLower = (candidateChunksText || '').toLowerCase();

    // Check if there is partial mention in the candidate's chunks
    const hasPartialMention = candidateLower.includes(sLower);
    const weakQualifiers = [
      'familiar with',
      'familiarity with',
      'basic knowledge',
      'basic understanding',
      'exposure to',
      'heard of',
      'heard about',
      'learning',
      'studied',
      'beginner in',
      'beginner',
      'interest in'
    ];
    const isWeakClaim = weakQualifiers.some(q => candidateLower.includes(q));

    const evidence_status: 'none' | 'partial' | 'verified' = hasPartialMention ? 'partial' : 'none';
    const evidence_found = hasPartialMention
      ? (isWeakClaim
          ? `Keyword "${skillName}" appears in resume chunks ("${candidateChunksText?.slice(0, 60).trim()}"), but indicates surface-level familiarity rather than verified production depth (partial/unclear evidence).`
          : `Keyword "${skillName}" appears in resume chunks, but lacks quantified impact, architectural depth, or verifiable production evidence.`)
      : 'No supporting evidence found in the provided resume.';

    // Detailed tailored blueprints for common engineering competencies
    const basePlan: CareerReadinessPlan = (() => {
      if (sLower.includes('docker') || sLower.includes('container')) {
        return {
          why_it_matters: 'Docker is foundational for reproducible execution environments, containerized microservice deployments, and parity between development and production.',
          evidence_found,
          evidence_status,
          recommended_action: 'Containerize one of your existing API projects by writing an optimized multi-stage Dockerfile and a local compose.yaml environment.',
          suggested_proof: [
            'Dockerfile with multi-stage build optimization (.dockerignore included)',
            'compose.yaml orchestrating API service and local database dependencies',
            'README.md setup instructions detailing build and run steps',
            'GitHub repository commit history showing working containerization',
            'Automated container health check script or CI build step'
          ]
        };
      }

    if (sLower.includes('postgres') || sLower.includes('sql') || sLower.includes('database')) {
      return {
        why_it_matters: 'Relational database proficiency is essential for data integrity, ACID compliance, complex relational queries, and safe schema migrations.',
        evidence_found,
        evidence_status,
        recommended_action: 'Design and implement a normalized PostgreSQL database schema with foreign keys, indexes, and automated migration scripts.',
        suggested_proof: [
          'Database schema migration files (.sql or Prisma schema)',
          'Query optimization proof using EXPLAIN ANALYZE on indexed queries',
          'Connection pool setup and parameterized query repository pattern in code',
          'Integration test suite verifying database transactions and rollback behavior',
          'Entity Relationship Diagram (ERD) documented in project README'
        ]
      };
    }

    if (sLower.includes('kubernetes') || sLower.includes('k8s')) {
      return {
        why_it_matters: 'Kubernetes orchestrates containerized services across clusters, managing automated self-healing, rolling deployments, and service discovery.',
        evidence_found,
        evidence_status,
        recommended_action: 'Deploy a containerized application to a local Kubernetes cluster (Minikube or Kind) with Deployment, Service, and ConfigMap manifests.',
        suggested_proof: [
          'k8s deployment.yaml specifying replica sets, CPU/memory limits, and restart policies',
          'service.yaml and Ingress controller routing configuration',
          'Liveness and readiness health probe definitions in deployment specs',
          'Local verification instructions with kubectl commands documented in README',
          'GitHub repository containing structured k8s manifests under /k8s directory'
        ]
      };
    }

    if (sLower.includes('redis') || sLower.includes('cache')) {
      return {
        why_it_matters: 'In-memory caching with Redis significantly improves response times, absorbs traffic spikes, and powers distributed session management.',
        evidence_found,
        evidence_status,
        recommended_action: 'Integrate Redis into an existing backend as a cache-aside layer with TTL invalidation, rate limiting, or session store.',
        suggested_proof: [
          'Redis client module with retry and exponential backoff logic',
          'Cache-aside retrieval logic with explicit TTL and key naming conventions',
          'Benchmark report or latency chart showing p99 reduction (cache hit vs miss)',
          'Automated tests verifying cache invalidation upon record mutation',
          'Local compose.yaml service definition for Redis'
        ]
      };
    }

    if (sLower.includes('aws') || sLower.includes('cloud')) {
      return {
        why_it_matters: 'Cloud infrastructure mastery is required to deploy, secure, and scale distributed architectures with enterprise reliability.',
        evidence_found,
        evidence_status,
        recommended_action: 'Deploy a containerized application to an AWS environment (such as ECS Fargate, App Runner, or EC2) with IAM least-privilege security.',
        suggested_proof: [
          'Infrastructure-as-Code template (Terraform, AWS CDK, or CloudFormation)',
          'Cloud architecture diagram illustrating VPC, subnets, and security groups',
          'GitHub Actions workflow automating deployment to AWS',
          'IAM policy document adhering to least-privilege principles',
          'Live staging URL or deployment execution verification log'
        ]
      };
    }

    if (sLower.includes('ci/cd') || sLower.includes('pipeline') || sLower.includes('github actions')) {
      return {
        why_it_matters: 'Automated CI/CD pipelines prevent regressions, standardize linting and testing, and ensure rapid, dependable production releases.',
        evidence_found,
        evidence_status,
        recommended_action: 'Build a multi-stage GitHub Actions workflow that automatically runs linting, unit tests, and security scans on every pull request.',
        suggested_proof: [
          '.github/workflows/ci.yml configuration file with build matrix',
          'Passing build status badge displayed prominently in repository README',
          'Automated test coverage report generated and published as CI artifact',
          'Branch protection rule enforcement requiring passing status checks',
          'Automated semantic release and changelog generation workflow'
        ]
      };
    }

    if (sLower.includes('typescript')) {
      return {
        why_it_matters: 'Strict TypeScript typing eliminates runtime type errors, provides self-documenting codebases, and enhances team refactoring velocity.',
        evidence_found,
        evidence_status,
        recommended_action: 'Build or migrate a project using strict TypeScript with custom interfaces, generic utility types, and zero `any` types.',
        suggested_proof: [
          'tsconfig.json configured with strict: true and noImplicitAny: true',
          'Structured domain models and interface definitions in a dedicated types/ folder',
          'Clean zero-error compilation build (tsc --noEmit)',
          'Automated CI check enforcing type verification',
          'GitHub repository demonstrating comprehensive typed endpoints'
        ]
      };
    }

    if (sLower.includes('graphql')) {
      return {
        why_it_matters: 'GraphQL enables client-driven data querying, avoiding over-fetching and consolidating multiple REST microservices into a single graph.',
        evidence_found,
        evidence_status,
        recommended_action: 'Build a GraphQL service with schema definition, query and mutation resolvers, and DataLoader to solve N+1 query performance issues.',
        suggested_proof: [
          'Schema definition file (.graphql) with strongly typed entities and mutations',
          'DataLoader implementation batching relational database queries',
          'Postman or Apollo Studio test collection export demonstrating queries',
          'Automated integration tests validating schema queries and error handling',
          'GitHub repository documenting GraphQL schema in README'
        ]
      };
    }

    if (sLower.includes('react') || sLower.includes('frontend')) {
      return {
        why_it_matters: 'Modern frontend development requires component modularity, state management predictability, and responsive, accessible UI rendering.',
        evidence_found,
        evidence_status,
        recommended_action: 'Build a responsive web application implementing custom hooks, optimistic UI state updates, and accessible component design.',
        suggested_proof: [
          'Component hierarchy code with custom reusable hooks',
          'State management implementation (Zustand, Redux Toolkit, or Context)',
          'Automated component unit tests using React Testing Library or Vitest',
          'Lighthouse performance and accessibility score audit report (90+)',
          'Live deployed demo URL (Vercel / Netlify / GitHub Pages)'
        ]
      };
    }

    if (sLower.includes('python')) {
      return {
        why_it_matters: 'Python proficiency is standard for AI/ML engineering, data pipelines, automation scripting, and asynchronous REST APIs.',
        evidence_found,
        evidence_status,
        recommended_action: 'Build a Python service using FastAPI or Flask, complete with Pydantic data validation, type hints, and pytest coverage.',
        suggested_proof: [
          'FastAPI/Flask application with Pydantic request/response validation',
          'pytest test suite with fixtures and coverage reports',
          'pyproject.toml or requirements.txt dependency specifications',
          'Type annotations validated via mypy',
          'GitHub repository documenting API endpoints and setup instructions'
        ]
      };
    }

    if (sLower.includes('jest') || sLower.includes('test')) {
      return {
        why_it_matters: 'Automated testing suites ensure regression resilience, validate edge cases, and give teams confidence during refactoring and rapid shipping.',
        evidence_found,
        evidence_status,
        recommended_action: 'Implement a comprehensive test suite with unit, integration, and mock tests targeting high branch coverage on core logic.',
        suggested_proof: [
          'Jest / Vitest configuration with test scripts in package.json',
          'Test suite covering happy paths, edge cases, and error handlers',
          'Mocking of external dependencies and database clients',
          'Code coverage report artifact demonstrating 80%+ line coverage',
          'GitHub Actions workflow executing tests on pull requests'
        ]
      };
    }

    // Dynamic, professional blueprint for any arbitrary / specialized technical skill
    const importance = isMandatory
      ? `This is a core mandatory requirement in the job description, critical for delivering technical outcomes in ${category}.`
      : `This is a preferred differentiator for this role, providing a competitive advantage for complex challenges in ${category}.`;

    return {
      why_it_matters: `Proficiency in ${skillName} demonstrates hands-on domain competency in ${category}. ${importance}`,
      evidence_found,
      evidence_status,
      recommended_action: `Build a standalone proof-of-concept project or extend an existing codebase to implement ${skillName}. Document the architectural rationale, write automated tests, and publish the repository.`,
      suggested_proof: [
        `${skillName} configuration, integration module, or core script in codebase`,
        'README setup instructions detailing architecture, dependencies, and execution steps',
        'GitHub repository with clear, sequential commit history demonstrating implementation',
        `Automated test suite verifying ${skillName} behavior and error handling`,
        'Execution log, benchmark report, or demo recording proving operational correctness'
      ]
    };
  })();

  return {
    ...basePlan,
    tasks: basePlan.tasks || this.getFallbackTasks(skillName, category),
    evidence_artifacts: basePlan.evidence_artifacts || this.getFallbackArtifacts(skillName)
  };
}

  /**
   * Practical Skill Action Plan Generator
   * Produces sequential tasks and verifiable proof deliverables for any technical skill.
   */
  public async generateSkillActionPlan(
    skill: string,
    category: string,
    jobDescription?: string,
    resumeContext?: string | string[]
  ): Promise<SkillActionPlan> {
    if (!skill || skill.trim().length === 0) {
      throw new Error('Skill name cannot be empty');
    }

    const resumeStr = Array.isArray(resumeContext) ? resumeContext.join('\n') : (resumeContext || '');

    if (this.openai) {
      try {
        const systemPrompt = `
You are an expert Technical Career Coach and Practical Engineering Mentor.
Generate a structured, practical, honest action plan to help an engineer learn, build, and verify evidence for a missing skill required by a target job.

Strictly adhere to this output schema and return valid JSON:
{
  "skill": string,
  "category": string,
  "why_it_matters": string (concise explanation of why this skill matters for the role),
  "recommended_action": string (one-sentence practical project recommendation),
  "tasks": [
    {
      "step": number (1 to 6),
      "title": string (short action title),
      "description": string (clear, practical task description)
    }
  ],
  "evidence_artifacts": [
    string (concrete deliverable e.g. "Dockerfile", "README setup instructions", "API test results", "GitHub repository")
  ],
  "estimated_time": string (e.g. "4-6 hours"),
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "honest_guideline": string
}

RULES:
1. Do NOT tell the candidate to falsely claim the skill on their resume.
2. Emphasize honest progression: Learn -> Practice -> Build -> Document -> Verify -> Add honestly.
3. Progress is self-reported and not an external certification.
4. Tasks must be practical and actionable (e.g., building, containerizing, testing).
5. Output 5 to 6 sequential tasks and 4 to 5 verifiable artifacts.
`.trim();

        const userPrompt = `
Skill to develop: ${skill}
Category: ${category}
${jobDescription ? `Target Job Description Context:\n${jobDescription.slice(0, 800)}` : ''}
${resumeStr ? `Candidate Existing Background Context:\n${resumeStr.slice(0, 800)}` : ''}
`.trim();

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 1500
        });

        const raw = completion.choices[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            skill: parsed.skill || skill,
            category: parsed.category || category,
            why_it_matters: parsed.why_it_matters || `Proficiency in ${skill} is key for ${category}.`,
            recommended_action: parsed.recommended_action || `Build and verify a practical project implementing ${skill}.`,
            tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : this.getFallbackTasks(skill, category),
            evidence_artifacts: Array.isArray(parsed.evidence_artifacts) && parsed.evidence_artifacts.length > 0 ? parsed.evidence_artifacts : this.getFallbackArtifacts(skill),
            estimated_time: parsed.estimated_time || '4-6 hours',
            difficulty: parsed.difficulty || 'Intermediate',
            honest_guideline: parsed.honest_guideline || 'Complete all tasks and verify evidence before adding this skill to your resume. Progress is self-reported.'
          };
        }
      } catch (err: any) {
        console.warn('OpenAI action plan generation failed, using intelligent fallback:', err?.message || err);
      }
    }

    return this.getFallbackActionPlan(skill, category, jobDescription, resumeStr);
  }

  /**
   * Deterministic Practical Tasks Catalog
   */
  public getFallbackTasks(skill: string, category: string): PracticalTask[] {
    const sLower = skill.toLowerCase();

    if (sLower.includes('docker') || sLower.includes('container')) {
      return [
        { step: 1, title: 'Learn Docker Fundamentals', description: 'Learn Docker images, containers, and basic commands.' },
        { step: 2, title: 'Create Dockerfile', description: 'Create a Dockerfile for an existing Node.js API.' },
        { step: 3, title: 'Build and Run Container', description: 'Build and run the container.' },
        { step: 4, title: 'Configure Environment Variables', description: 'Configure environment variables safely.' },
        { step: 5, title: 'Test the API', description: 'Test the API.' },
        { step: 6, title: 'Document Setup in README', description: 'Document the setup in README.' }
      ];
    }

    if (sLower.includes('postgres') || sLower.includes('sql') || sLower.includes('database')) {
      return [
        { step: 1, title: 'Learn Relational Modeling', description: 'Learn schema normalization, relational keys, and ACID transaction concepts.' },
        { step: 2, title: 'Design Schema Tables', description: 'Design database tables with primary keys, foreign keys, and unique indexes.' },
        { step: 3, title: 'Write Migration Scripts', description: 'Create database migration scripts and integrate with backend connection pooling.' },
        { step: 4, title: 'Implement CRUD Endpoints', description: 'Implement parameterized SQL queries and transactional boundaries.' },
        { step: 5, title: 'Benchmark & Optimize Queries', description: 'Analyze query execution plans with EXPLAIN ANALYZE.' },
        { step: 6, title: 'Document ERD in README', description: 'Document schema architecture and local migration setup in project README.' }
      ];
    }

    if (sLower.includes('kubernetes') || sLower.includes('k8s')) {
      return [
        { step: 1, title: 'Learn Kubernetes Architecture', description: 'Learn Pods, Deployments, Services, Ingress, and ConfigMaps.' },
        { step: 2, title: 'Launch Local Cluster', description: 'Set up Minikube or Kind for local cluster execution.' },
        { step: 3, title: 'Create Deployment Manifest', description: 'Author deployment.yaml with container images, replicas, and resource limits.' },
        { step: 4, title: 'Configure Services & Ingress', description: 'Configure service.yaml routing rules and expose local endpoints.' },
        { step: 5, title: 'Configure Health Checks', description: 'Implement liveness and readiness probes to verify container resilience.' },
        { step: 6, title: 'Document Setup in README', description: 'Document cluster launch, deployment, and kubectl verification steps.' }
      ];
    }

    if (sLower.includes('redis') || sLower.includes('cache')) {
      return [
        { step: 1, title: 'Learn In-Memory Caching', description: 'Learn Redis data structures, eviction policies, and cache-aside patterns.' },
        { step: 2, title: 'Spin up Redis Instance', description: 'Run Redis locally via Docker compose.yaml.' },
        { step: 3, title: 'Implement Cache Layer', description: 'Integrate Redis client into backend API with TTL key expiration.' },
        { step: 4, title: 'Handle Invalidation', description: 'Implement cache invalidation logic upon record mutations.' },
        { step: 5, title: 'Benchmark Latency Delta', description: 'Benchmark p99 response times before and after caching.' },
        { step: 6, title: 'Document Cache Strategy in README', description: 'Document Redis setup, key naming conventions, and cache invalidation rules.' }
      ];
    }

    if (sLower.includes('aws') || sLower.includes('cloud')) {
      return [
        { step: 1, title: 'Learn AWS Core Services', description: 'Learn ECS, RDS, S3, IAM, and VPC networking primitives.' },
        { step: 2, title: 'Write IaC Configuration', description: 'Author a Terraform or AWS CDK template defining application infrastructure.' },
        { step: 3, title: 'Define IAM Policies', description: 'Configure least-privilege IAM roles for container task execution.' },
        { step: 4, title: 'Deploy Containerized Service', description: 'Deploy your containerized service to AWS ECS Fargate or App Runner.' },
        { step: 5, title: 'Automate Deploy Pipeline', description: 'Build a GitHub Actions workflow targeting AWS deployment.' },
        { step: 6, title: 'Document Cloud Architecture in README', description: 'Document cloud architecture diagram and deployment verification.' }
      ];
    }

    if (sLower.includes('ci/cd') || sLower.includes('pipeline') || sLower.includes('github actions')) {
      return [
        { step: 1, title: 'Learn CI/CD Automation', description: 'Learn workflow triggers, job matrices, runners, and artifact caching.' },
        { step: 2, title: 'Create Workflow File', description: 'Author .github/workflows/ci.yml with test and lint stages.' },
        { step: 3, title: 'Configure Automated Testing', description: 'Ensure test suite executes automatically on every pull request.' },
        { step: 4, title: 'Add Security & Lint Scans', description: 'Integrate automated linter and security vulnerability scans.' },
        { step: 5, title: 'Add Build Status Badge', description: 'Add GitHub Actions build status badge to repository README.' },
        { step: 6, title: 'Document Branch Rules', description: 'Document required status checks and branch protection rules.' }
      ];
    }

    // Generic practical tasks for arbitrary technology
    return [
      { step: 1, title: `Learn ${skill} Core Concepts`, description: `Study official documentation, core paradigms, and CLI / API usage for ${skill}.` },
      { step: 2, title: `Set up Local Environment`, description: `Install required dependencies and configure local project runtime for ${skill}.` },
      { step: 3, title: `Implement Working Module`, description: `Build a standalone module or integrate ${skill} into an existing application.` },
      { step: 4, title: `Configure Best Practices`, description: `Handle configuration, edge cases, error logging, and security best practices.` },
      { step: 5, title: `Verify with Automated Tests`, description: `Write automated tests verifying operational correctness and performance.` },
      { step: 6, title: `Document Setup in README`, description: `Document architecture, configuration instructions, and test results in README.` }
    ];
  }

  /**
   * Deterministic Evidence Artifacts Catalog
   */
  public getFallbackArtifacts(skill: string): string[] {
    const sLower = skill.toLowerCase();

    if (sLower.includes('docker') || sLower.includes('container')) {
      return [
        'Dockerfile',
        'compose.yaml if needed',
        'README',
        'API test results',
        'GitHub repository'
      ];
    }

    if (sLower.includes('postgres') || sLower.includes('sql') || sLower.includes('database')) {
      return [
        'Database migration files (.sql or Prisma schema)',
        'EXPLAIN ANALYZE query optimization log',
        'Repository pattern query code',
        'Integration test results',
        'GitHub repository'
      ];
    }

    if (sLower.includes('kubernetes') || sLower.includes('k8s')) {
      return [
        'deployment.yaml & service.yaml manifests',
        'Ingress routing configuration',
        'README setup instructions',
        'kubectl verification output log',
        'GitHub repository'
      ];
    }

    if (sLower.includes('redis') || sLower.includes('cache')) {
      return [
        'Redis client module with TTL logic',
        'compose.yaml service definition',
        'Benchmark latency test results',
        'README caching documentation',
        'GitHub repository'
      ];
    }

    if (sLower.includes('aws') || sLower.includes('cloud')) {
      return [
        'Terraform or CloudFormation template',
        'Cloud architecture diagram',
        'GitHub Actions deploy workflow',
        'Live endpoint verification log',
        'GitHub repository'
      ];
    }

    return [
      `${skill} configuration or implementation file`,
      'README setup instructions',
      'API test results',
      'Execution or benchmark log',
      'GitHub repository'
    ];
  }

  /**
   * Fallback Action Plan Generator
   */
  public getFallbackActionPlan(
    skill: string,
    category: string,
    _jobDescription?: string,
    _resumeContext?: string
  ): SkillActionPlan {
    const tasks = this.getFallbackTasks(skill, category);
    const artifacts = this.getFallbackArtifacts(skill);

    return {
      skill,
      category,
      why_it_matters: `Understanding ${skill} is critical for role responsibilities in ${category}.`,
      recommended_action: `Build and verify a practical project implementing ${skill} to generate verifiable evidence.`,
      tasks,
      evidence_artifacts: artifacts,
      estimated_time: '4-6 hours',
      difficulty: 'Intermediate',
      honest_guideline: 'Complete all practical tasks and verify evidence artifacts before honestly adding this skill to your resume. Progress is self-reported candidate tracking and does not represent an external certification.'
    };
  }
}
