import { Router, Request, Response } from 'express';
import { CoverLetterService } from '../services/coverLetterService.js';
import { CoverLetterRequest } from '../types/coverLetter.js';
import { PERSONA_CONFIGS } from '../services/coverLetterPromptBuilder.js';

const router = Router();
const coverLetterService = new CoverLetterService();

/**
 * GET /api/cover-letter
 * Route information & persona options schema
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Cover Letter Generation API is online',
    methods: ['POST /api/cover-letter', 'POST /api/cover-letter/generate'],
    supported_personas: Object.values(PERSONA_CONFIGS).map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      voice: cfg.voice,
      formality: cfg.formality,
      pacing: cfg.pacing,
      description: cfg.description,
      target_audience: cfg.targetAudience
    })),
    default_persona: 'strict_enterprise',
    grounding_source: 'Pinecone Vector DB Resume Context',
    expected_body: {
      job_description: 'Full text of the target job description (string)',
      resume_chunks: ['Array of text chunks retrieved from applicant resume/Pinecone (string[])'],
      persona: 'Optional: strict_enterprise | startup_tech_lead | concise_direct (string)'
    }
  });
});

/**
 * Common handler for generating cover letter
 */
async function handleCoverLetterGeneration(req: Request<{}, {}, CoverLetterRequest>, res: Response) {
  try {
    const {
      job_description,
      jobDescription,
      resume_chunks,
      resumeChunks,
      resume_context,
      resumeContext,
      persona
    } = req.body;

    const jdText = job_description || jobDescription;
    const rawChunks = resume_chunks || resumeChunks || (resume_context ? [resume_context] : undefined) || (resumeContext ? [resumeContext] : undefined);

    // Validate Job Description
    if (!jdText || typeof jdText !== 'string' || jdText.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "job_description" string is required in the request body.'
      });
    }

    // Validate Resume Chunks
    if (!rawChunks || !Array.isArray(rawChunks) || rawChunks.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A non-empty "resume_chunks" array (retrieved from Pinecone) is required in the request body.'
      });
    }

    // Normalize chunks to string[]
    const normalizedChunks: string[] = rawChunks.map((chunk) => {
      if (typeof chunk === 'string') {
        return chunk.trim();
      } else if (chunk && typeof chunk === 'object' && 'text' in chunk) {
        return String((chunk as any).text).trim();
      } else {
        return String(chunk || '').trim();
      }
    }).filter(chunk => chunk.length > 0);

    if (normalizedChunks.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one valid text chunk must be provided in "resume_chunks".'
      });
    }

    // Execute Generation
    const result = await coverLetterService.generateCoverLetter(
      jdText.trim(),
      normalizedChunks,
      persona
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred during cover letter generation.'
    });
  }
}

/**
 * POST /api/cover-letter
 */
router.post('/', handleCoverLetterGeneration);

/**
 * POST /api/cover-letter/generate
 */
router.post('/generate', handleCoverLetterGeneration);

export default router;
