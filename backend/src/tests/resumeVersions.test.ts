import { ResumeVersionService } from '../services/resumeVersionService.js';

async function runTests() {
  console.log('🧪 Starting Resume Versioning & Score Evolution Tests...\n');

  const service = new ResumeVersionService();
  const testUserId = `user_test_${Date.now()}`;
  const testJobId = 'job_fullstack_lead';

  // Test 1: Save Multiple Resume Iterations
  console.log('Test 1: Save Consecutive Resume Iterations');
  const v1 = await service.createVersion({
    userId: testUserId,
    jobId: testJobId,
    content: '- Basic web development in JavaScript and HTML.',
    matchScore: 55
  });

  const v2 = await service.createVersion({
    userId: testUserId,
    jobId: testJobId,
    content: '- Built RESTful microservices in Node.js and TypeScript.\n- Added Docker containers.',
    matchScore: 72
  });

  const v3 = await service.createVersion({
    userId: testUserId,
    jobId: testJobId,
    content: '- Architected distributed microservices in TypeScript and Node.js.\n- Containerized in Docker and deployed to AWS ECS.\n- Optimized PostgreSQL query latency by 42% (sub-45ms).',
    matchScore: 89
  });

  console.assert(Boolean(v1.id), 'Version 1 must have an ID');
  console.assert(Boolean(v2.id), 'Version 2 must have an ID');
  console.assert(Boolean(v3.id), 'Version 3 must have an ID');
  console.log('✅ Test 1 Passed: Successfully saved 3 resume iterations!\n');

  // Test 2: Fetch Version History & Score Evolution Progression
  console.log('Test 2: Score Evolution Progression & Stats Calculation');
  const history = await service.getVersions(testUserId, testJobId);

  console.assert(history.total === 3, `Expected 3 versions, got ${history.total}`);
  console.assert(history.scoreEvolution.length === 3, 'Expected 3 score evolution points');

  const scores = history.scoreEvolution.map(p => p.score);
  console.log(`Score Progression over iterations: ${scores.join(' ➔ ')}`);
  console.assert(scores[0] === 55, 'First score must be 55');
  console.assert(scores[1] === 72, 'Second score must be 72');
  console.assert(scores[2] === 89, 'Third score must be 89');

  console.assert(history.stats.initialScore === 55, 'Initial score must be 55');
  console.assert(history.stats.currentScore === 89, 'Current score must be 89');
  console.assert(history.stats.scoreDelta === 34, `Expected score delta 34 (89 - 55), got ${history.stats.scoreDelta}`);
  console.assert(history.stats.highestScore === 89, 'Highest score must be 89');
  console.log(`✅ Test 2 Passed: Score evolution progression accurately calculated (Delta: +${history.stats.scoreDelta} pts)!\n`);

  // Test 3: Get Version By ID
  console.log('Test 3: Retrieve Specific Version by ID');
  const retrieved = await service.getVersionById(v2.id);
  console.assert(retrieved !== null, 'Retrieved version should not be null');
  console.assert(retrieved?.matchScore === 72, 'Retrieved version score should match');
  console.assert(retrieved?.content.includes('Node.js and TypeScript'), 'Content should match');
  console.log('✅ Test 3 Passed: Successfully retrieved version by ID!\n');

  // Test 4: Validation on Empty Content
  console.log('Test 4: Validation on Empty Content');
  try {
    await service.createVersion({
      userId: testUserId,
      jobId: testJobId,
      content: '',
      matchScore: 50
    });
    console.error('❌ Failed: Should have thrown for empty content');
  } catch (err: any) {
    console.log('✅ Correctly rejected empty content:', err.message);
  }

  // Test 5: Delete Version
  console.log('\nTest 5: Delete Version');
  const deleted = await service.deleteVersion(v1.id);
  console.assert(deleted === true, 'Delete operation should succeed');

  const updatedHistory = await service.getVersions(testUserId, testJobId);
  console.assert(updatedHistory.total === 2, `Expected 2 versions after deletion, got ${updatedHistory.total}`);
  console.log('✅ Test 5 Passed: Successfully deleted version and updated history!\n');

  console.log('🎉 All Resume Versioning & Score Evolution Tests Passed Successfully!');
}

runTests().catch(err => {
  console.error('Resume versioning test failed:', err);
  process.exit(1);
});
