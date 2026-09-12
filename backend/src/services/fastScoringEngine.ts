import { RecalculateScoreResponse } from '../types/scoreTypes.js';

// Pre-curated technical knowledge graph of common tech keywords and aliases
const KNOWN_TECH_KEYWORDS = [
  'typescript', 'javascript', 'python', 'golang', 'rust', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'next.js', 'vue', 'angular', 'svelte', 'node.js', 'express', 'fastapi', 'django', 'flask', 'spring boot',
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'pinecone', 'qdrant', 'chroma', 'weaviate', 'pgvector', 'vector databases', 'vector database', 'rag', 'llm', 'llms',
  'openai', 'anthropic', 'langchain', 'llamaindex', 'huggingface', 'pytorch', 'tensorflow', 'embeddings',
  'docker', 'kubernetes', 'k8s', 'helm', 'terraform', 'ansible', 'aws', 'amazon web services', 'gcp', 'google cloud',
  'azure', 'ecs', 'eks', 's3', 'rds', 'lambda', 'cloudformation', 'ci/cd', 'github actions', 'gitlab ci',
  'graphql', 'rest', 'restful', 'grpc', 'microservices', 'kafka', 'rabbitmq', 'sqs', 'sns',
  'linux', 'git', 'sql', 'nosql', 'prometheus', 'grafana', 'datadog', 'cloudwatch',
  'unit testing', 'jest', 'vitest', 'cypress', 'playwright', 'agile', 'scrum'
];

// Strong action verbs for impact assessment
const STRONG_ACTION_VERBS = [
  'architected', 'engineered', 'spearheaded', 'designed', 'developed', 'deployed', 'implemented',
  'optimized', 'benchmarked', 'accelerated', 'reduced', 'scaled', 'containerized', 'orchestrated',
  'automated', 'built', 'led', 'mentored', 'modernized', 'refactored', 'integrated', 'delivered'
];

export class FastScoringEngine {
  /**
   * Recalculates match score in-memory with sub-10ms latency
   */
  calculateScore(
    resumeText: string,
    jobDescription: string,
    previousScore?: number
  ): RecalculateScoreResponse {
    const startTime = performance.now();

    const cleanResume = resumeText.trim();
    const cleanJD = jobDescription.trim();

    if (!cleanJD) {
      throw new Error('Job description cannot be empty');
    }

    // Extract target keywords from Job Description
    const jdKeywords = this.extractKeywordsFromJD(cleanJD);

    // Analyze Resume Text against extracted JD keywords
    const resumeLower = cleanResume.toLowerCase();
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of jdKeywords.all) {
      if (this.containsKeyword(resumeLower, kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    // Mandatory keywords breakdown
    let matchedMandatoryCount = 0;
    for (const mKw of jdKeywords.mandatory) {
      if (this.containsKeyword(resumeLower, mKw.toLowerCase())) {
        matchedMandatoryCount++;
      }
    }

    const totalMandatory = jdKeywords.mandatory.length || 1;
    const mandatoryCoveragePct = Math.round((matchedMandatoryCount / totalMandatory) * 100);

    const totalKeywords = jdKeywords.all.length || 1;
    const keywordOverlapPct = Math.round((matchedKeywords.length / totalKeywords) * 100);

    // Extract Metrics and Impact (e.g. 40%, $10M, sub-45ms, 500k, 10x, 99.99%)
    const metricsDetected = this.extractMetrics(cleanResume);

    // Extract Action Verbs
    const actionVerbsDetected = this.extractActionVerbs(resumeLower);

    // Calculate Sub-Scores
    // 1. Mandatory Coverage (Max 55 points)
    const mandatoryScore = (matchedMandatoryCount / totalMandatory) * 55;

    // 2. Keyword Overlap (Max 25 points)
    const overlapScore = (matchedKeywords.length / totalKeywords) * 25;

    // 3. Impact & Metric Density (Max 12 points)
    // 2 points per distinct metric (up to 8) + 1 point per strong action verb (up to 4)
    const metricPoints = Math.min(8, metricsDetected.length * 2);
    const verbPoints = Math.min(4, actionVerbsDetected.length);
    const impactDensityScore = Math.min(100, Math.round(((metricPoints + verbPoints) / 12) * 100));

    // 4. Structure & Readability (Max 8 points)
    const readabilityScore = this.calculateReadability(cleanResume);
    const readabilityPoints = (readabilityScore / 100) * 8;

    // Final Weighted Hybrid Match Score (0 - 100)
    let rawScore = Math.round(mandatoryScore + overlapScore + metricPoints + verbPoints + readabilityPoints);

    // Edge case: if resume text is completely empty, score is 0
    if (cleanResume.length === 0) {
      rawScore = 0;
    }

    const matchScore = Math.min(100, Math.max(0, rawScore));
    const scoreDelta = previousScore !== undefined ? matchScore - previousScore : 0;

    // Generate real-time actionable suggestions
    const suggestions = this.generateSuggestions(missingKeywords, metricsDetected, actionVerbsDetected, cleanResume);

    const endTime = performance.now();
    const latencyMs = Math.round((endTime - startTime) * 100) / 100;

    return {
      match_score: matchScore,
      previous_score: previousScore,
      score_delta: scoreDelta,
      mandatory_coverage_pct: mandatoryCoveragePct,
      keyword_overlap_pct: keywordOverlapPct,
      impact_density_score: impactDensityScore,
      readability_score: readabilityScore,
      matched_keywords: matchedKeywords,
      missing_keywords: missingKeywords,
      metrics_detected: metricsDetected,
      action_verbs_detected: actionVerbsDetected,
      suggestions,
      calculated_at: new Date().toISOString(),
      latency_ms: latencyMs
    };
  }

  /**
   * Helper to check keyword presence with word boundary awareness
   */
  private containsKeyword(text: string, keyword: string): boolean {
    // Escape special regex characters
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // If keyword has spaces or punctuation (e.g. "next.js", "c++", "ci/cd"), simple regex
    if (/[\s./+#-]/.test(keyword)) {
      return text.includes(keyword);
    }
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }

  /**
   * Extracts keywords from job description
   */
  private extractKeywordsFromJD(jd: string): { all: string[]; mandatory: string[] } {
    const jdLower = jd.toLowerCase();
    const allSet = new Set<string>();
    const mandatorySet = new Set<string>();

    // Split JD into sections to distinguish mandatory vs preferred
    const mandatorySectionRegex = /(?:mandatory|minimum qualifications|required|core skills|requirements)([\s\S]*?)(?:preferred|nice to have|bonus|about us|$)/i;
    const mandatoryMatch = jd.match(mandatorySectionRegex);
    const mandatoryText = mandatoryMatch ? mandatoryMatch[1].toLowerCase() : jdLower;

    for (const kw of KNOWN_TECH_KEYWORDS) {
      if (this.containsKeyword(jdLower, kw)) {
        // Capitalize for display
        const displayKw = this.formatKeywordDisplay(kw);
        allSet.add(displayKw);

        if (this.containsKeyword(mandatoryText, kw)) {
          mandatorySet.add(displayKw);
        }
      }
    }

    // Also look for uppercase technical acronyms in JD (e.g. AWS, RAG, API, SDK, IAM, VPC, CI/CD)
    const acronymMatches = jd.match(/\b[A-Z0-9]{2,6}(?:\/[A-Z0-9]{2,6})?\b/g) || [];
    const stopWords = new Set(['AND', 'THE', 'FOR', 'YOU', 'WILL', 'WITH', 'OUR', 'NOT', 'ARE', 'THIS', 'FROM']);
    for (const acronym of acronymMatches) {
      if (!stopWords.has(acronym) && acronym.length >= 2) {
        allSet.add(acronym);
        if (mandatoryText.toUpperCase().includes(acronym)) {
          mandatorySet.add(acronym);
        }
      }
    }

    const allArray = Array.from(allSet);
    const mandatoryArray = Array.from(mandatorySet);

    return {
      all: allArray.length > 0 ? allArray : ['TypeScript', 'Node.js', 'Docker', 'AWS'],
      mandatory: mandatoryArray.length > 0 ? mandatoryArray : allArray.slice(0, Math.ceil(allArray.length * 0.6))
    };
  }

  /**
   * Formats keywords nicely for UI display
   */
  private formatKeywordDisplay(kw: string): string {
    const map: Record<string, string> = {
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'python': 'Python',
      'react': 'React',
      'next.js': 'Next.js',
      'node.js': 'Node.js',
      'fastapi': 'FastAPI',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'pinecone': 'Pinecone',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'terraform': 'Terraform',
      'aws': 'AWS',
      'gcp': 'GCP',
      'ci/cd': 'CI/CD',
      'graphql': 'GraphQL',
      'sql': 'SQL',
      'nosql': 'NoSQL',
      'redis': 'Redis',
      'rag': 'RAG',
      'llm': 'LLM',
      'llms': 'LLMs',
      'pgvector': 'pgvector',
      'github actions': 'GitHub Actions'
    };
    return map[kw] || (kw.charAt(0).toUpperCase() + kw.slice(1));
  }

  /**
   * Extracts quantifiable metrics and performance numbers
   */
  private extractMetrics(text: string): string[] {
    const metrics: string[] = [];
    // Matches percentages (e.g. 42%, 99.99%)
    const pctMatches = text.match(/\b\d+(?:\.\d+)?%/g) || [];
    metrics.push(...pctMatches);

    // Matches dollar amounts (e.g. $40M, $1.5M, $500k)
    const dollarMatches = text.match(/\$\d+(?:\.\d+)?[kKmMbB]?\+?/g) || [];
    metrics.push(...dollarMatches);

    // Matches latency/time metrics (e.g. 45ms, sub-45ms, 25 minutes, 3 days)
    const latencyMatches = text.match(/(?:sub-)?\d+\s*(?:ms|seconds|minutes|hours|days)/gi) || [];
    metrics.push(...latencyMatches);

    // Matches volume numbers (e.g. 500,000+, 10x, 12+ microservices)
    const volumeMatches = text.match(/\b\d{1,3}(?:,\d{3})+\+?|\b\d+x\b/gi) || [];
    metrics.push(...volumeMatches);

    // Return deduplicated list
    return Array.from(new Set(metrics)).slice(0, 6);
  }

  /**
   * Extracts strong action verbs
   */
  private extractActionVerbs(textLower: string): string[] {
    const verbs: string[] = [];
    for (const verb of STRONG_ACTION_VERBS) {
      if (this.containsKeyword(textLower, verb)) {
        verbs.push(verb.charAt(0).toUpperCase() + verb.slice(1));
      }
    }
    return Array.from(new Set(verbs)).slice(0, 6);
  }

  /**
   * Computes bullet readability and formatting score (0 - 100)
   */
  private calculateReadability(text: string): number {
    if (!text.trim()) return 0;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*'));

    let score = 50; // baseline

    // Bonus for clear bullet points
    if (bullets.length >= 3) {
      score += 25;
    } else if (bullets.length > 0) {
      score += 15;
    }

    // Average length check (ideal bullet is 40 - 180 characters)
    if (bullets.length > 0) {
      const avgLen = bullets.reduce((acc, b) => acc + b.length, 0) / bullets.length;
      if (avgLen >= 50 && avgLen <= 180) {
        score += 25;
      } else {
        score += 10;
      }
    } else if (lines.length > 2) {
      score += 15;
    }

    return Math.min(100, Math.max(20, score));
  }

  /**
   * Generates real-time suggestions
   */
  private generateSuggestions(
    missingKeywords: string[],
    metrics: string[],
    verbs: string[],
    resumeText: string
  ): string[] {
    const suggestions: string[] = [];

    if (missingKeywords.length > 0) {
      const topMissing = missingKeywords.slice(0, 3).join(', ');
      suggestions.push(`Incorporate key skills: ${topMissing} to boost your keyword overlap.`);
    }

    if (metrics.length < 2) {
      suggestions.push('Add quantifiable metrics (e.g., % improvement, scale volume, latency ms) to demonstrate proven business impact.');
    }

    if (verbs.length < 3) {
      suggestions.push('Begin bullets with decisive action verbs like "Architected", "Optimized", or "Spearheaded".');
    }

    if (!resumeText.includes('•') && !resumeText.includes('- ')) {
      suggestions.push('Format achievements as clean bullet points ("• " or "- ") for optimal ATS parsing.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Exceptional alignment! Resume demonstrates strong keyword match and verified impact metrics.');
    }

    return suggestions.slice(0, 4);
  }
}
