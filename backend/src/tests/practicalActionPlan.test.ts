import { GapAnalysisService } from '../services/gapAnalysisService.js';

async function runPracticalActionPlanTests() {
  console.log('🧪 Starting Practical Skill Action Plans Test Suite...\n');

  const service = new GapAnalysisService();

  // Test 1: Generate Action Plan for Docker (Exact prompt example alignment)
  console.log('Test 1: Practical Action Plan for Docker');
  const dockerPlan = await service.generateSkillActionPlan('Docker', 'DevOps');

  console.assert(dockerPlan.skill === 'Docker', 'Skill name must be Docker');
  console.assert(Array.isArray(dockerPlan.tasks) && dockerPlan.tasks.length === 6, 'Must generate 6 practical tasks');

  // Verify sequential tasks
  const expectedTaskSteps = [
    'Learn Docker images, containers, and basic commands.',
    'Create a Dockerfile for an existing Node.js API.',
    'Build and run the container.',
    'Configure environment variables safely.',
    'Test the API.',
    'Document the setup in README.'
  ];

  dockerPlan.tasks.forEach((task, idx) => {
    console.assert(task.step === idx + 1, `Task step should be ${idx + 1}`);
    console.assert(
      task.description.toLowerCase().trim() === expectedTaskSteps[idx].toLowerCase().trim(),
      `Task ${idx + 1} description should match expected: got "${task.description}" vs "${expectedTaskSteps[idx]}"`
    );
  });

  // Verify Evidence Artifacts
  console.assert(Array.isArray(dockerPlan.evidence_artifacts), 'Evidence artifacts must be an array');
  const artifacts = dockerPlan.evidence_artifacts;
  console.assert(artifacts.includes('Dockerfile'), 'Must include Dockerfile');
  console.assert(artifacts.includes('compose.yaml if needed'), 'Must include compose.yaml if needed');
  console.assert(artifacts.includes('README'), 'Must include README');
  console.assert(artifacts.includes('API test results'), 'Must include API test results');
  console.assert(artifacts.includes('GitHub repository'), 'Must include GitHub repository');

  // Verify Self-reported guideline & honesty constraint
  console.assert(
    dockerPlan.honest_guideline.toLowerCase().includes('self-reported'),
    'Honest guideline must state progress is self-reported'
  );
  console.assert(
    !dockerPlan.honest_guideline.toLowerCase().includes('automatically added'),
    'Should not say automatically added to resume'
  );

  console.log('✅ Test 1 Passed: Docker Action Plan has exact 6 practical tasks and 5 evidence artifacts!\n');

  // Test 2: Generic / Arbitrary skill generation (e.g. Kafka or custom tech)
  console.log('Test 2: Arbitrary Skill Action Plan (Kafka)');
  const kafkaPlan = await service.generateSkillActionPlan('Kafka', 'Message Broker');
  console.assert(kafkaPlan.skill === 'Kafka', 'Skill should be Kafka');
  console.assert(Array.isArray(kafkaPlan.tasks) && kafkaPlan.tasks.length >= 5, 'Should generate structured tasks for arbitrary skill');
  console.assert(Array.isArray(kafkaPlan.evidence_artifacts) && kafkaPlan.evidence_artifacts.length >= 3, 'Should generate evidence artifacts');
  console.assert(
    kafkaPlan.honest_guideline.toLowerCase().includes('self-reported'),
    'Arbitrary skill guideline must specify self-reported progress'
  );

  console.log('✅ Test 2 Passed: Arbitrary skill action plan generated correctly!\n');

  // Test 3: Validation on empty skill
  console.log('Test 3: Empty Skill Input Validation');
  let threw = false;
  try {
    await service.generateSkillActionPlan('', 'DevOps');
  } catch (err: any) {
    threw = true;
    console.assert(err.message.includes('empty'), 'Should throw empty skill error');
  }
  console.assert(threw, 'Should reject empty skill name');

  console.log('✅ Test 3 Passed: Empty skill input rejected gracefully!\n');

  // Test 4: Integration with Gap Analysis - Missing skills have tasks and artifacts populated
  console.log('Test 4: Gap Analysis auto-populates tasks & artifacts in readiness plans');
  const gapResult = await service.analyzeRequirements(
    'Required skills: Node.js, Docker, PostgreSQL.',
    ['Experienced Node.js developer with Express.js APIs.']
  );

  const missingDocker = gapResult.missing_mandatory_skills.find(s => s.skill.toLowerCase() === 'docker');
  console.assert(missingDocker !== undefined, 'Docker must be missing');
  console.assert(missingDocker?.readiness_plan?.tasks !== undefined, 'readiness_plan must include tasks');
  console.assert(missingDocker?.readiness_plan?.tasks?.length === 6, 'Docker readiness plan must have 6 tasks');
  console.assert(missingDocker?.readiness_plan?.evidence_artifacts !== undefined, 'readiness_plan must include evidence_artifacts');
  console.assert(missingDocker?.readiness_plan?.evidence_artifacts?.length === 5, 'Docker readiness plan must have 5 artifacts');

  console.log('✅ Test 4 Passed: Gap analysis missing items embed practical tasks and evidence artifacts!\n');

  console.log('🎉 All Practical Skill Action Plan tests passed successfully!');
}

runPracticalActionPlanTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
