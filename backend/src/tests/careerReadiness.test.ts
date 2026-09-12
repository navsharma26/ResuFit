import { GapAnalysisService } from '../services/gapAnalysisService.js';

async function runCareerReadinessTests() {
  console.log('🧪 Starting Evidence-Based Career Readiness Engine Tests...\n');

  const service = new GapAnalysisService();

  // Test Case 1: Docker missing mandatory requirement blueprint
  console.log('Test 1: Missing Mandatory Requirement (Docker) - Verifiable Blueprint');
  const result1 = await service.analyzeRequirements(
    'We require Node.js, PostgreSQL, Docker, and REST APIs.',
    [
      'Built a Node.js REST API with Express.',
      'Designed PostgreSQL schema with normalized relational tables.'
    ]
  );

  console.assert(Array.isArray(result1.missing_mandatory_skills), 'missing_mandatory_skills should be an array');
  const dockerSkill = result1.missing_mandatory_skills.find(s => s.skill.toLowerCase() === 'docker');
  console.assert(dockerSkill !== undefined, 'Docker must be detected as missing mandatory');
  console.assert(dockerSkill?.readiness_plan !== undefined, 'Docker must have a readiness_plan');

  const dockerPlan = dockerSkill!.readiness_plan!;
  console.assert(typeof dockerPlan.why_it_matters === 'string' && dockerPlan.why_it_matters.length > 20, 'why_it_matters must be informative');
  console.assert(dockerPlan.evidence_status === 'none', 'evidence_status must be "none" when not in resume');
  console.assert(dockerPlan.evidence_found === 'No supporting evidence found in the provided resume.', 'evidence_found must strictly state absence of evidence');
  console.assert(typeof dockerPlan.recommended_action === 'string' && dockerPlan.recommended_action.length > 20, 'recommended_action must provide practical advice');
  console.assert(Array.isArray(dockerPlan.suggested_proof) && dockerPlan.suggested_proof.length >= 3, 'suggested_proof must provide at least 3 proof artifacts');

  // Verify Docker specific artifacts are suggested
  const proofsJoined = dockerPlan.suggested_proof.join(' ').toLowerCase();
  console.assert(proofsJoined.includes('dockerfile'), 'Suggested proof must include Dockerfile');
  console.assert(proofsJoined.includes('readme'), 'Suggested proof must include README');

  console.log('✅ Test 1 Passed: Docker blueprint generated with honest proof artifacts!\n');

  // Test Case 2: Nice-to-Have missing requirement (e.g. Kubernetes)
  console.log('Test 2: Missing Nice-to-Have Requirement (Kubernetes) - Optional Readiness Blueprint');
  const result2 = await service.analyzeRequirements(
    'Required: TypeScript, Express. Nice to have: Kubernetes, GraphQL.',
    [
      'Experienced TypeScript engineer building Express backend services.'
    ]
  );

  const k8sSkill = result2.nice_to_haves.find(n => n.skill.toLowerCase() === 'kubernetes');
  console.assert(k8sSkill !== undefined, 'Kubernetes must be detected in nice_to_haves');
  console.assert(k8sSkill?.status === 'missing', 'Kubernetes status must be missing');
  console.assert(k8sSkill?.readiness_plan !== undefined, 'Missing nice-to-have must have readiness_plan');
  console.assert(k8sSkill!.readiness_plan!.suggested_proof.length >= 3, 'Kubernetes must have proof artifacts');
  console.assert(k8sSkill!.readiness_plan!.evidence_status === 'none', 'Kubernetes evidence_status must be none');

  console.log('✅ Test 2 Passed: Missing nice-to-have receives valid readiness plan!\n');

  // Test Case 3: Arbitrary / Custom requirement not in hardcoded catalog
  console.log('Test 3: Arbitrary / Custom Requirement (Kafka Event Streaming)');
  const result3 = await service.analyzeRequirements(
    'Requirements: Must have Kafka and Elasticsearch experience for real-time pipeline.',
    [
      'Full-stack developer building standard web apps with React.'
    ]
  );

  const kafkaSkill = result3.missing_mandatory_skills.find(s => s.skill.toLowerCase().includes('kafka'));
  console.assert(kafkaSkill !== undefined, 'Custom tech (Kafka) should be detected');
  console.assert(kafkaSkill?.readiness_plan !== undefined, 'Custom tech must have generated readiness_plan');
  console.assert(kafkaSkill!.readiness_plan!.suggested_proof.length >= 3, 'Custom tech must have suggested proof artifacts');
  console.assert(kafkaSkill!.readiness_plan!.evidence_found === 'No supporting evidence found in the provided resume.', 'Custom tech must reflect absence of evidence');

  console.log('✅ Test 3 Passed: Dynamic readiness blueprint generated for arbitrary technology!\n');

  // Test Case 4: Consolidated top-level career_readiness array
  console.log('Test 4: Consolidated career_readiness response array');
  console.assert(Array.isArray(result1.career_readiness), 'result.career_readiness must be an array');
  console.assert(result1.career_readiness!.length > 0, 'result.career_readiness must contain items');
  const readinessItem = result1.career_readiness![0];
  console.assert(typeof readinessItem.skill === 'string', 'Readiness item must have skill name');
  console.assert(typeof readinessItem.why_it_matters === 'string', 'Readiness item must have why_it_matters');
  console.assert(typeof readinessItem.recommended_action === 'string', 'Readiness item must have recommended_action');
  console.assert(Array.isArray(readinessItem.suggested_proof), 'Readiness item must have suggested_proof');

  console.log('✅ Test 4 Passed: Consolidated career_readiness array is populated correctly!\n');

  // Test Case 5: Partial evidence detection when keyword is mentioned without full proof
  console.log('Test 5: Partial evidence detection (Keyword mentioned in passing)');
  const planPartial = service.generateReadinessPlan(
    'Docker',
    'DevOps',
    true,
    'Must have Docker experience.',
    'Heard about Docker in team standup.'
  );
  console.assert(planPartial.evidence_status === 'partial', 'Partial mention must set evidence_status to partial');
  console.assert(planPartial.evidence_found.includes('Keyword "Docker" appears'), 'Evidence found must note keyword presence without deep proof');

  console.log('✅ Test 5 Passed: Partial evidence detection correctly assessed!\n');

  // Test Case 6: User Benchmark Evaluation Cases (Docker, Node.js, AWS)
  console.log('Test 6: User Benchmark Cases (Docker, Node.js, AWS)');
  const benchmarkResult = await service.analyzeRequirements(
    'We require Docker, Node.js, and AWS in our production stack.',
    [
      'Built a Node.js REST API with Express.',
      'Familiar with AWS cloud concepts.'
    ]
  );

  // Case 1: Docker (No mention) -> Missing + Action Plan
  const dockerMissing = benchmarkResult.missing_mandatory_skills.find(s => s.skill.toLowerCase() === 'docker');
  console.assert(dockerMissing !== undefined, 'Benchmark Case 1: Docker must be missing');
  console.assert(dockerMissing?.readiness_plan !== undefined, 'Benchmark Case 1: Docker must have action plan');
  console.assert(dockerMissing?.readiness_plan?.evidence_status === 'none', 'Benchmark Case 1: Docker evidence_status must be none');

  // Case 2: Node.js ("Built Node.js REST API") -> Supported evidence
  const nodeMatched = benchmarkResult.matched_skills.find(s => s.skill.toLowerCase().includes('node'));
  console.assert(nodeMatched !== undefined, 'Benchmark Case 2: Node.js must be matched with supported evidence');
  console.assert(nodeMatched?.resume_evidence.includes('Node.js REST API'), 'Benchmark Case 2: Node.js must quote supported evidence');

  // Case 3: AWS ("Familiar with AWS") -> Partial/unclear, not expert
  const awsGap = benchmarkResult.missing_mandatory_skills.find(s => s.skill.toLowerCase() === 'aws');
  console.assert(awsGap !== undefined, 'Benchmark Case 3: AWS must not be marked as a verified expert match');
  console.assert(awsGap?.readiness_plan?.evidence_status === 'partial', 'Benchmark Case 3: AWS evidence_status must be partial');
  console.assert(awsGap?.readiness_plan?.evidence_found.includes('surface-level familiarity'), 'Benchmark Case 3: AWS evidence must note surface familiarity');

  console.log('✅ Test 6 Passed: All 3 user benchmark cases (Docker, Node.js, AWS) pass with exact expected classifications!\n');

  console.log('🎉 All Evidence-Based Career Readiness Engine tests passed successfully!');
}

runCareerReadinessTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
