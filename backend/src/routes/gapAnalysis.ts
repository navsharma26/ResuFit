import { Router, Request, Response } from 'express';
import { GapAnalysisService } from '../services/gapAnalysisService.js';
import { GapAnalysisRequest, GapAnalysisActionPlanRequest } from '../types/gapAnalysis.js';
import { splitIntoChunks } from './uploadResume.js';

const router = Router();
const gapAnalysisService = new GapAnalysisService();

/**
 * GET /api/gap-analysis
 * Route information & schema endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Requirement Gap Analysis API is online',
    method: 'POST',
    path: '/api/gap-analysis',
    expected_body: {
      job_description: 'Full text of the target job description (string)',
      resume_chunks: ['Array of text chunks from applicant resume (string[]) or raw resume_text string']
    },
    output_schema: {
      matched_skills: 'Array of acquired technical skills verified in resume chunks',
      missing_mandatory_skills: 'Array of mandatory skills from JD lacking evidence',
      nice_to_haves: 'Array of preferred/nice-to-have skills with match status',
      match_score: 'Calculated fit percentage (0 - 100)'
    }
  });
});

/**
 * POST /api/gap-analysis
 * Analyzes gap between Job Description and Resume Chunks / Text
 */
router.post('/', async (req: Request<{}, {}, GapAnalysisRequest>, res: Response) => {
  try {
    const {
      job_description,
      jobDescription,
      jd,
      job,
      resume_chunks,
      resumeChunks,
      chunks,
      resume_text,
      resumeText,
      resume,
      resume_context,
      resumeContext
    } = req.body;

    const jdText = job_description || jobDescription || jd || job;
    let rawChunks: any = resume_chunks || resumeChunks || chunks;

    if (!rawChunks) {
      const rawText = resume_text || resumeText || resume || resume_context || resumeContext;
      if (typeof rawText === 'string' && rawText.trim().length > 0) {
        rawChunks = splitIntoChunks(rawText);
      }
    } else if (typeof rawChunks === 'string') {
      rawChunks = splitIntoChunks(rawChunks);
    }

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
        message: 'A non-empty "resume_chunks" array or "resume_text" string is required in the request body.'
      });
    }

    // Normalize chunks to string[]
    const normalizedChunks: string[] = rawChunks.map((chunk: any) => {
      if (typeof chunk === 'string') {
        return chunk.trim();
      } else if (chunk && typeof chunk === 'object' && 'text' in chunk) {
        return String(chunk.text).trim();
      } else {
        return String(chunk || '').trim();
      }
    }).filter(chunk => chunk.length > 0);

    if (normalizedChunks.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one valid text chunk must be provided in "resume_chunks" or "resume_text".'
      });
    }

    // Execute Analysis
    const result = await gapAnalysisService.analyzeRequirements(
      jdText.trim(),
      normalizedChunks
    );

    // Return exact requested keys: matched_skills, missing_mandatory_skills, nice_to_haves
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error executing gap analysis:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred during requirement gap analysis.'
    });
  }
});

/**
 * Common handler for Practical Action Plan generation
 */
async function handleActionPlanGeneration(
  skill: string | undefined,
  category: string | undefined,
  jobDescription: string | undefined,
  resumeContext: string | string[] | undefined,
  res: Response
) {
  try {
    if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "skill" string is required in the request body or query parameters.'
      });
    }

    const actionPlan = await gapAnalysisService.generateSkillActionPlan(
      skill.trim(),
      category || 'Core Skill',
      jobDescription,
      resumeContext
    );

    return res.status(200).json(actionPlan);
  } catch (error: any) {
    console.error('Error generating practical action plan:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred while generating the practical skill action plan.'
    });
  }
}

/**
 * GET /api/gap-analysis/action-plan
 * Allows fetching action plan via query params (e.g. ?skill=Docker&category=DevOps)
 */
router.get('/action-plan', (req: Request, res: Response) => {
  const skill = (req.query.skill as string) || (req.query.name as string);
  const category = (req.query.category as string);
  const jdText = (req.query.job_description as string) || (req.query.jobDescription as string);
  const resumeStr = (req.query.resume_context as string) || (req.query.resumeContext as string);

  return handleActionPlanGeneration(skill, category, jdText, resumeStr, res);
});

/**
 * POST /api/gap-analysis/action-plan
 * Generates or retrieves a structured practical action plan for a missing/partially matched requirement
 */
router.post('/action-plan', (req: Request<{}, {}, GapAnalysisActionPlanRequest>, res: Response) => {
  const {
    skill,
    name,
    category,
    job_description,
    jobDescription,
    resume_context,
    resumeContext
  } = req.body;

  const targetSkill = skill || name || (req.query as any)?.skill;
  const jdText = job_description || jobDescription;
  const resumeStr = resume_context || resumeContext;

  return handleActionPlanGeneration(targetSkill, category, jdText, resumeStr, res);
});

export default router;
