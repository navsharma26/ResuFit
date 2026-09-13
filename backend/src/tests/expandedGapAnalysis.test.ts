import { GapAnalysisService } from '../services/gapAnalysisService.js';

async function runExpandedGapAnalysisTests() {
  console.log('🧪 Starting Expanded Gap Analysis & Career Readiness Tests...\n');

  const service = new GapAnalysisService();

  // Test 1: Modern AI/LLM & RAG Stack Detection with Quantified Metrics
  console.log('Test 1: Modern AI/LLM & RAG Stack Detection with Evidence Metrics');
  const aiJobDescription = `
    Job Title: Senior AI Systems Engineer
    Requirements:
    - Must have hands-on experience with OpenAI API, RAG Architecture, and Vector Embeddings.
    - Production experience with Pinecone or pgvector vector databases.
    - Required: Docker containerization for AI models.
    Nice to have:
    - Familiarity with LangChain and Redis caching.
  `;

  const aiResumeChunks = [
    `Senior AI Engineer @ Cognition Labs
     - Built enterprise RAG Architecture pipeline utilizing OpenAI API (gpt-4o) for document Q&A across 500,000+ internal documents.
     - Benchmarked and deployed Pinecone vector database, achieving sub-45ms cosine similarity lookup speeds.
     - Containerized multi-tenant inference services into Docker containers processing 12+ microservices.`,
    `Skills: Vector Embeddings, Python, Redis, Git.`
  ];

  const aiResult = await service.analyzeRequirements(aiJobDescription, aiResumeChunks);

  console.assert(Array.isArray(aiResult.matched_skills), 'matched_skills should be an array');
  const matchedNames = aiResult.matched_skills.map(s => s.skill.toLowerCase());

  console.assert(matchedNames.includes('docker'), 'Docker should be matched');
  console.assert(matchedNames.includes('openai api'), 'OpenAI API should be matched');
  console.assert(matchedNames.includes('pinecone'), 'Pinecone should be matched');
  console.assert(matchedNames.includes('rag architecture'), 'RAG Architecture should be matched');
  console.assert(matchedNames.includes('vector embeddings'), 'Vector Embeddings should be matched');

  // Verify quantified metrics extraction on high-depth evidence
  const pineconeMatch = aiResult.matched_skills.find(s => s.skill.toLowerCase() === 'pinecone');
  console.assert(pineconeMatch !== undefined, 'Pinecone must be found in matched skills');
  console.assert(pineconeMatch?.evidence_strength === 'high', 'Pinecone with sub-45ms metric must have high evidence strength');
  console.assert(Array.isArray(pineconeMatch?.quantified_metrics), 'Quantified metrics must be an array');
  console.assert(pineconeMatch!.quantified_metrics!.some(m => m.includes('45ms') || m.includes('sub-45ms')), 'Metric sub-45ms must be extracted');

  const dockerMatch = aiResult.matched_skills.find(s => s.skill.toLowerCase() === 'docker');
  console.assert(dockerMatch?.evidence_strength === 'high', 'Docker with 12+ microservices metric must have high evidence strength');
  console.assert(dockerMatch!.quantified_metrics!.some(m => m.includes('12+ microservices')), 'Metric 12+ microservices must be extracted');

  console.log('✅ Test 1 Passed: AI/LLM stack and quantified evidence metrics verified!\n');

  // Test 2: Evidence Depth Classification (High vs Moderate vs Surface)
  console.log('Test 2: Evidence Depth Classification (High vs Moderate vs Surface)');
  const highEvidence = service.analyzeEvidenceSnippet('Architected and deployed 12+ microservices processing $40M+ in daily transaction volume, improving query times by 42%.');
  console.assert(highEvidence.strength === 'high', 'High-impact metric snippet must be classified as high strength');
  console.assert(highEvidence.confidence >= 0.95, 'High strength snippet must have high confidence');
  console.assert(highEvidence.metrics.length >= 2, 'Multiple metrics must be extracted ($40M+, 42%, 12+ microservices)');

  const moderateEvidence = service.analyzeEvidenceSnippet('Built backend REST APIs using Node.js and Express.');
  console.assert(moderateEvidence.strength === 'moderate', 'Single action verb without metric should be moderate strength');

  const surfaceEvidence = service.analyzeEvidenceSnippet('Familiar with Kubernetes and heard of Terraform in team standups.');
  console.assert(surfaceEvidence.strength === 'surface', 'Weak qualifier snippet must be classified as surface strength');
  console.assert(surfaceEvidence.confidence <= 0.70, 'Surface snippet must have lowered confidence');

  console.log('✅ Test 2 Passed: Evidence depth classifier successfully differentiates high, moderate, and surface claims!\n');

  // Test 3: Projected ATS Score Delta & ROI Priority Calculation
  console.log('Test 3: Projected ATS Score Delta & ROI Priority Calculation');
  const cloudJobDescription = `
    Job Title: Lead Cloud & Backend Engineer
    Mandatory Requirements:
    - 5+ years with Golang and REST APIs.
    - Required: Apache Kafka for real-time event streaming.
    - Required: Terraform for Infrastructure as Code.
    - Required: Docker containerization.
    Nice to Have:
    - Playwright for end-to-end automated testing.
    - OAuth 2.0 and JWT security architecture.
  `;

  const candidateResumeChunks = [
    `Backend Developer with 4 years building REST APIs and containerizing services using Docker.`
  ];

  const cloudResult = await service.analyzeRequirements(cloudJobDescription, candidateResumeChunks);

  // Missing mandatory should include Golang, Kafka, Terraform
  const missingMandatory = cloudResult.missing_mandatory_skills;
  console.assert(missingMandatory.length >= 3, 'Must have at least 3 missing mandatory skills');

  // Verify projected_score_delta is assigned to all missing mandatory items
  missingMandatory.forEach(item => {
    console.assert(typeof item.projected_score_delta === 'number' && item.projected_score_delta! > 0, `Item ${item.skill} must have positive projected_score_delta`);
    console.assert(item.roi_priority === 'Quick Win' || item.roi_priority === 'Core Investment', `Item ${item.skill} must have valid ROI priority`);
    console.assert(item.readiness_plan?.projected_score_delta === item.projected_score_delta, `Readiness plan must mirror projected_score_delta`);
  });

  // Verify missing nice-to-haves (Playwright, OAuth) receive score deltas and Quick Win prioritization
  const missingNice = cloudResult.nice_to_haves.filter(n => n.status === 'missing');
  console.assert(missingNice.length >= 1, 'Must have missing nice-to-have items');
  missingNice.forEach(n => {
    console.assert(typeof n.projected_score_delta === 'number' && n.projected_score_delta! > 0, `Nice-to-have ${n.skill} must have projected_score_delta`);
    console.assert(n.roi_priority === 'Quick Win' || n.roi_priority === 'Secondary', `Nice-to-have ${n.skill} must have ROI priority`);
  });

  console.log('✅ Test 3 Passed: Projected score deltas and ROI priorities accurately assigned!\n');

  // Test 4: Specialized Blueprints for RAG, Kafka, Terraform, Golang, Playwright, OAuth
  console.log('Test 4: Specialized Blueprints & Verifiable Artifacts');

  // RAG Blueprint
  const ragPlan = service.generateReadinessPlan('Pinecone', 'AI & Databases', true);
  console.assert(ragPlan.suggested_proof.some(p => p.toLowerCase().includes('vector')), 'Pinecone blueprint must include vector proof');
  console.assert(ragPlan.estimated_time !== undefined, 'Pinecone blueprint must specify estimated_time');
  console.assert(ragPlan.difficulty === 'Advanced', 'Pinecone difficulty must be Advanced');

  // Kafka Blueprint
  const kafkaPlan = service.generateReadinessPlan('Kafka', 'Event Streaming', true);
  console.assert(kafkaPlan.suggested_proof.some(p => p.toLowerCase().includes('kafka')), 'Kafka blueprint must include kafka artifacts');
  console.assert(kafkaPlan.suggested_proof.some(p => p.toLowerCase().includes('dead-letter') || p.toLowerCase().includes('dlq')), 'Kafka blueprint must include DLQ artifact');

  // Terraform Blueprint
  const terraformPlan = service.generateReadinessPlan('Terraform', 'Cloud Infrastructure', true);
  console.assert(terraformPlan.suggested_proof.some(p => p.includes('.tf')), 'Terraform blueprint must include .tf files');
  console.assert(terraformPlan.suggested_proof.some(p => p.toLowerCase().includes('state')), 'Terraform blueprint must include state locking proof');

  // Golang Blueprint
  const golangPlan = service.generateReadinessPlan('Golang', 'Languages', true);
  console.assert(golangPlan.suggested_proof.some(p => p.includes('.proto')), 'Golang blueprint must include .proto files');
  console.assert(golangPlan.suggested_proof.some(p => p.includes('go test -bench')), 'Golang blueprint must include benchmark proof');

  // Playwright Blueprint
  const playwrightPlan = service.generateReadinessPlan('Playwright', 'Testing & QA', false);
  console.assert(playwrightPlan.suggested_proof.some(p => p.includes('playwright.config.ts')), 'Playwright blueprint must include config file');
  console.assert(playwrightPlan.roi_priority === 'Quick Win', 'Playwright must be categorized as Quick Win');

  // OAuth 2.0 Blueprint
  const oauthPlan = service.generateReadinessPlan('OAuth 2.0', 'Security & Auth', false);
  console.assert(oauthPlan.suggested_proof.some(p => p.includes('JWT')), 'OAuth blueprint must include JWT proof');
  console.assert(oauthPlan.suggested_proof.some(p => p.includes('Refresh token rotation')), 'OAuth blueprint must include refresh token rotation proof');

  console.log('✅ Test 4 Passed: All specialized domain blueprints generate verifiable, tailored artifacts!\n');

  // Test 5: Fallback Skill Action Plan Generator API
  console.log('Test 5: Fallback Skill Action Plan Generator API');
  const actionPlan = await service.generateSkillActionPlan('Terraform', 'DevOps & Cloud');
  console.assert(actionPlan.skill === 'Terraform', 'Skill must be Terraform');
  console.assert(actionPlan.tasks.length === 6, 'Must generate exact 6 sequential tasks');
  console.assert(actionPlan.evidence_artifacts.length >= 4, 'Must generate at least 4 evidence artifacts');
  console.assert(actionPlan.estimated_time !== undefined, 'Must provide estimated time');
  console.assert(actionPlan.difficulty !== undefined, 'Must provide difficulty');
  console.assert(actionPlan.roi_priority !== undefined, 'Must provide ROI priority');

  console.log('✅ Test 5 Passed: Skill Action Plan Generator API verified!\n');

  console.log('🎉 ALL Expanded Gap Analysis & Career Readiness Tests Passed Successfully!');
}

runExpandedGapAnalysisTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
