import { spawnSync } from 'child_process';

console.log('🚀 Running Full ResuFit Backend Test Suite...\n');

const tests = [
  'src/tests/gapAnalysis.test.ts',
  'src/tests/coverLetter.test.ts',
  'src/tests/recalculateScore.test.ts',
  'src/tests/resumeVersions.test.ts'
];

let failed = false;

for (const testFile of tests) {
  console.log(`\n========================================`);
  console.log(`▶ Running: ${testFile}`);
  console.log(`========================================\n`);

  const result = spawnSync('npx', ['tsx', testFile], {
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`❌ ${testFile} failed with status ${result.status}`);
  }
}

// Run Jest Calibration Suite
console.log(`\n========================================`);
console.log(`▶ Running Jest Calibration Suite (tests/hybridScoring.test.ts)`);
console.log(`========================================\n`);

const jestResult = spawnSync('npx', ['jest', 'tests/hybridScoring.test.ts', '--colors'], {
  stdio: 'inherit',
  env: process.env
});

if (jestResult.status !== 0) {
  failed = true;
  console.error(`❌ Jest calibration test failed with status ${jestResult.status}`);
}

if (failed) {
  console.error('\n❌ One or more test suites failed.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL ResuFit Backend Test Suites Passed Successfully!');
}
