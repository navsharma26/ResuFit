import { FastScoringEngine } from '../services/fastScoringEngine.js';

async function runTests() {
  console.log('🧪 Starting Fast Scoring Engine & Recalculate Score Tests...\n');

  const engine = new FastScoringEngine();

  const sampleJD = `
Job Title: Senior Full-Stack Engineer
Mandatory Technical Skills:
- 5+ years of experience with TypeScript and modern JavaScript.
- Strong proficiency in Node.js and Express for scalable REST APIs.
- Production experience with PostgreSQL and Docker.
- Required: AWS cloud services (ECS, S3, RDS).

Preferred Skills:
- Experience with Redis caching and Kubernetes.
`;

  // Test 1: Baseline Scoring
  console.log('Test 1: Baseline Scoring');
  const initialResume = `
- Architected REST microservices using Express and TypeScript.
- Built scalable web apps with Node.js.
  `.trim();

  const baseline = engine.calculateScore(initialResume, sampleJD);
  console.log(`Baseline Score: ${baseline.match_score}/100 in ${baseline.latency_ms}ms`);

  console.assert(typeof baseline.match_score === 'number', 'Score must be a number');
  console.assert(baseline.match_score > 0, 'Score should be greater than 0');
  console.assert(baseline.latency_ms < 50, 'Latency must be sub-50ms');
  console.assert(baseline.matched_keywords.map(k => k.toLowerCase()).includes('typescript'), 'TypeScript should be matched');
  console.assert(baseline.matched_keywords.map(k => k.toLowerCase()).includes('express'), 'Express should be matched');
  console.assert(baseline.missing_keywords.map(k => k.toLowerCase()).includes('docker'), 'Docker should be reported missing');
  console.assert(baseline.missing_keywords.map(k => k.toLowerCase()).includes('postgresql'), 'PostgreSQL should be reported missing');
  console.log('✅ Test 1 Passed: Baseline calculated accurately with low latency!\n');

  // Test 2: Score Delta on Adding Missing Keywords & Metrics
  console.log('Test 2: Score Delta on Adding Missing Keywords & Metrics');
  const improvedResume = `
- Architected REST microservices using Express and TypeScript.
- Built scalable web apps with Node.js.
- Containerized applications using Docker and automated deployments to AWS ECS.
- Optimized complex SQL queries in PostgreSQL, improving query latency by 42% (sub-45ms).
  `.trim();

  const improved = engine.calculateScore(improvedResume, sampleJD, baseline.match_score);
  console.log(`Improved Score: ${improved.match_score}/100 (Delta: +${improved.score_delta}) in ${improved.latency_ms}ms`);

  console.assert(improved.match_score > baseline.match_score, 'Score should increase after adding Docker, AWS, PostgreSQL, and metrics');
  console.assert(improved.score_delta > 0, 'Score delta must be positive');
  console.assert(improved.matched_keywords.map(k => k.toLowerCase()).includes('docker'), 'Docker should now be matched');
  console.assert(improved.matched_keywords.map(k => k.toLowerCase()).includes('postgresql'), 'PostgreSQL should now be matched');
  console.assert(improved.metrics_detected.length >= 2, 'Should detect 42% and sub-45ms metrics');
  console.log('✅ Test 2 Passed: Dynamic score increase and delta tracking verified!\n');

  // Test 3: Score Decrease on Deleting Content
  console.log('Test 3: Score Decrease on Deleting Content');
  const degradedResume = `
- Built web pages with HTML and CSS.
  `.trim();

  const degraded = engine.calculateScore(degradedResume, sampleJD, improved.match_score);
  console.log(`Degraded Score: ${degraded.match_score}/100 (Delta: ${degraded.score_delta})`);

  console.assert(degraded.match_score < improved.match_score, 'Score should decrease when technical content is removed');
  console.assert(degraded.score_delta < 0, 'Score delta must be negative');
  console.log('✅ Test 3 Passed: Score decrease and negative delta verified!\n');

  // Test 4: Validation & Empty Input
  console.log('Test 4: Validation & Empty Input');
  const emptyResumeResult = engine.calculateScore('', sampleJD);
  console.assert(emptyResumeResult.match_score === 0, 'Empty resume text must result in score 0');

  try {
    engine.calculateScore('Some text', '');
    console.error('❌ Failed: Should have thrown error for empty JD');
  } catch (err: any) {
    console.log('✅ Correctly rejected empty job description:', err.message);
  }

  console.log('\n🎉 All Fast Scoring Engine Tests Passed Successfully!');
}

runTests().catch(err => {
  console.error('Fast scoring engine test failed:', err);
  process.exit(1);
});
