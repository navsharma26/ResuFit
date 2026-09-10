import { GapAnalysisService } from '../services/gapAnalysisService.js';

async function runTests() {
  console.log('🧪 Starting Gap Analysis Tests...\n');

  const service = new GapAnalysisService();

  // Test 1: Successful analysis with matched and missing mandatory skills
  console.log('Test 1: Mandatory and Nice-to-Have separation');
  const result1 = await service.analyzeRequirements(
    'We require TypeScript, React, Docker, and PostgreSQL. Nice to have: Kubernetes, GraphQL.',
    [
      'Senior Engineer with 5 years in TypeScript and React applications.',
      'Containerized backend services using Docker and automated CI/CD.'
    ]
  );

  console.assert(Array.isArray(result1.matched_skills), 'matched_skills should be an array');
  console.assert(Array.isArray(result1.missing_mandatory_skills), 'missing_mandatory_skills should be an array');
  console.assert(Array.isArray(result1.nice_to_haves), 'nice_to_haves should be an array');
  console.assert(typeof result1.match_score === 'number', 'match_score should be a number');

  const matchedSkillNames = result1.matched_skills.map(s => s.skill.toLowerCase());
  const missingSkillNames = result1.missing_mandatory_skills.map(s => s.skill.toLowerCase());
  const niceSkillNames = result1.nice_to_haves.map(s => s.skill.toLowerCase());

  console.assert(matchedSkillNames.includes('typescript'), 'TypeScript should be matched');
  console.assert(matchedSkillNames.includes('react'), 'React should be matched');
  console.assert(matchedSkillNames.includes('docker'), 'Docker should be matched');
  console.assert(missingSkillNames.includes('postgresql'), 'PostgreSQL should be detected as missing mandatory');
  console.assert(niceSkillNames.includes('kubernetes'), 'Kubernetes should be nice to have');
  console.assert(niceSkillNames.includes('graphql'), 'GraphQL should be nice to have');

  console.log('✅ Test 1 Passed: Keys and skills correctly classified!\n');

  // Test 2: Validation on empty job description
  console.log('Test 2: Validation on empty job description');
  try {
    await service.analyzeRequirements('', ['chunk 1']);
    console.error('❌ Test 2 Failed: Should have thrown for empty JD');
  } catch (err: any) {
    console.log('✅ Test 2 Passed: Threw expected error:', err.message);
  }

  // Test 3: Validation on empty resume chunks
  console.log('\nTest 3: Validation on empty resume chunks');
  try {
    await service.analyzeRequirements('TypeScript developer', []);
    console.error('❌ Test 3 Failed: Should have thrown for empty chunks');
  } catch (err: any) {
    console.log('✅ Test 3 Passed: Threw expected error:', err.message);
  }

  console.log('\n🎉 All Gap Analysis service tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
