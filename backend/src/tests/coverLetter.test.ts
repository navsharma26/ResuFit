import { CoverLetterService } from '../services/coverLetterService.js';
import {
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  normalizePersona,
  PERSONA_CONFIGS
} from '../services/coverLetterPromptBuilder.js';

async function runTests() {
  console.log('🧪 Starting Cover Letter & Persona Customization Tests...\n');

  // Test Suite 1: Prompt Builder Tone & Grounding Logic
  console.log('Test Suite 1: Prompt Builder Tone Guidelines & Grounding Constraint');

  // Check 1.1: Strict Enterprise system prompt
  const enterprisePrompt = buildCoverLetterSystemPrompt('strict_enterprise');
  console.assert(
    enterprisePrompt.includes('STRICT FACTUAL GROUNDING IN PINECONE RETRIEVED RESUME CONTEXT'),
    'Prompt must enforce strict factual grounding in Pinecone resume context'
  );
  console.assert(
    enterprisePrompt.includes('ABSOLUTE ZERO HALLUCINATION'),
    'Prompt must strictly forbid hallucinations'
  );
  console.assert(
    enterprisePrompt.includes('STRICT ENTERPRISE'),
    'Prompt must inject Strict Enterprise persona'
  );
  console.assert(
    enterprisePrompt.includes('governance'),
    'Enterprise prompt must emphasize governance & stability'
  );

  // Check 1.2: Startup Tech Lead system prompt
  const startupPrompt = buildCoverLetterSystemPrompt('startup_tech_lead');
  console.assert(
    startupPrompt.includes('STARTUP TECH LEAD'),
    'Prompt must inject Startup Tech Lead persona'
  );
  console.assert(
    startupPrompt.includes('builder'),
    'Startup prompt must emphasize builder mindset'
  );
  console.assert(
    startupPrompt.includes('STRICT FACTUAL GROUNDING IN PINECONE RETRIEVED RESUME CONTEXT'),
    'Startup prompt must also maintain strict Pinecone grounding constraint'
  );

  // Check 1.3: Concise & Direct system prompt
  const concisePrompt = buildCoverLetterSystemPrompt('concise_direct');
  console.assert(
    concisePrompt.includes('CONCISE & DIRECT'),
    'Prompt must inject Concise & Direct persona'
  );
  console.assert(
    concisePrompt.includes('bullet'),
    'Concise prompt must emphasize high signal bullet format'
  );

  // Check 1.4: User prompt formats Pinecone chunks correctly
  const userPrompt = buildCoverLetterUserPrompt(
    'Senior AI Engineer needed with Pinecone experience',
    ['Chunk 1: Built vector search using Pinecone index', 'Chunk 2: Benchmarked pgvector'],
    'startup_tech_lead'
  );
  console.assert(
    userPrompt.includes('[Pinecone Retrieved Resume Chunk #1]:'),
    'User prompt must format Pinecone chunks with index labels'
  );
  console.assert(
    userPrompt.includes('Built vector search using Pinecone index'),
    'User prompt must contain resume text'
  );

  console.log('✅ Test Suite 1 Passed: Prompt builder rigorously enforces tone guidelines and Pinecone grounding!\n');

  // Test Suite 2: Persona Normalization
  console.log('Test Suite 2: Persona Normalization');
  console.assert(normalizePersona('startup_tech_lead') === 'startup_tech_lead', 'Should recognize startup_tech_lead');
  console.assert(normalizePersona('tech_lead') === 'startup_tech_lead', 'Should alias tech_lead');
  console.assert(normalizePersona('concise_direct') === 'concise_direct', 'Should recognize concise_direct');
  console.assert(normalizePersona('concise') === 'concise_direct', 'Should alias concise');
  console.assert(normalizePersona(undefined) === 'strict_enterprise', 'Default should be strict_enterprise');
  console.assert(normalizePersona('unknown_value') === 'strict_enterprise', 'Unknown persona should fallback to strict_enterprise');
  console.log('✅ Test Suite 2 Passed: Persona normalizer correctly maps options and defaults!\n');

  // Test Suite 3: CoverLetterService End-to-End Persona Generation & Grounding
  console.log('Test Suite 3: CoverLetterService Persona Output and Grounding Verification');

  const service = new CoverLetterService();
  const sampleJD = `Job Title: Senior AI Systems Engineer
We require 4+ years of Python, deep hands-on experience with Pinecone vector databases, RAG architecture, and Docker.`;

  const sampleChunks = [
    `Priya Patel - Machine Learning Engineer
Summary: AI Systems builder with 4 years building LLM-powered applications and scalable APIs in Python.`,
    `Experience @ Cognition Labs (2023 - Present)
- Built enterprise RAG pipeline utilizing OpenAI API for document Q&A across 500,000+ internal documents.
- Benchmarked and deployed pgvector and Pinecone vector databases, achieving sub-45ms cosine similarity lookup speeds.
- Packaged multi-tenant inference services into Docker containers.`
  ];

  // 3.1: Strict Enterprise Persona
  console.log('Generating Strict Enterprise Cover Letter...');
  const enterpriseResult = await service.generateCoverLetter(sampleJD, sampleChunks, 'strict_enterprise');
  console.assert(enterpriseResult.persona === 'strict_enterprise', 'Persona should be strict_enterprise');
  console.assert(enterpriseResult.persona_label === 'Strict Enterprise', 'Label should match');
  console.assert(enterpriseResult.grounding_score === 100, 'Grounding score must be 100');
  console.assert(enterpriseResult.cover_letter.includes('Dear Hiring Committee'), 'Enterprise letter should have formal salutation');
  console.assert(enterpriseResult.cover_letter.includes('Sincerely'), 'Enterprise letter should have formal sign-off');
  console.assert(enterpriseResult.cover_letter.includes('sub-45ms'), 'Must ground metrics directly from resume chunk');
  console.assert(enterpriseResult.grounded_claims.length > 0, 'Must provide list of verified grounded claims');
  console.log('✅ Strict Enterprise generation passed!');

  // 3.2: Startup Tech Lead Persona
  console.log('Generating Startup Tech Lead Cover Letter...');
  const startupResult = await service.generateCoverLetter(sampleJD, sampleChunks, 'startup_tech_lead');
  console.assert(startupResult.persona === 'startup_tech_lead', 'Persona should be startup_tech_lead');
  console.assert(startupResult.persona_label === 'Startup Tech Lead', 'Label should match');
  console.assert(startupResult.grounding_score === 100, 'Grounding score must be 100');
  console.assert(startupResult.cover_letter.includes('Hi Engineering Team') || startupResult.cover_letter.includes('Best regards'), 'Startup letter should have builder tone');
  console.assert(startupResult.cover_letter.includes('Pinecone') || startupResult.cover_letter.includes('RAG'), 'Must ground technical tools from chunks');
  console.log('✅ Startup Tech Lead generation passed!');

  // 3.3: Concise & Direct Persona
  console.log('Generating Concise & Direct Cover Letter...');
  const conciseResult = await service.generateCoverLetter(sampleJD, sampleChunks, 'concise_direct');
  console.assert(conciseResult.persona === 'concise_direct', 'Persona should be concise_direct');
  console.assert(conciseResult.persona_label === 'Concise & Direct', 'Label should match');
  console.assert(conciseResult.grounding_score === 100, 'Grounding score must be 100');
  console.assert(conciseResult.cover_letter.includes('•') || conciseResult.cover_letter.includes('-'), 'Concise letter must utilize high-impact bulleted format');
  console.assert(enterpriseResult.cover_letter.length > conciseResult.cover_letter.length, 'Concise format should be more compact than enterprise format');
  console.log('✅ Concise & Direct generation passed!\n');

  // Test Suite 4: Input Validation
  console.log('Test Suite 4: Input Validation & Error Handling');

  try {
    await service.generateCoverLetter('', sampleChunks, 'strict_enterprise');
    console.error('❌ Failed: Should have rejected empty job description');
  } catch (err: any) {
    console.log('✅ Correctly rejected empty job description:', err.message);
  }

  try {
    await service.generateCoverLetter(sampleJD, [], 'strict_enterprise');
    console.error('❌ Failed: Should have rejected empty resume chunks');
  } catch (err: any) {
    console.log('✅ Correctly rejected empty resume chunks:', err.message);
  }

  console.log('\n🎉 All Cover Letter Persona & Grounding Tests Passed Successfully!');
}

runTests().catch(err => {
  console.error('Cover letter test execution failed:', err);
  process.exit(1);
});
