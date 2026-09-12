import { Router, Request, Response } from 'express';
import { FastScoringEngine } from '../services/fastScoringEngine.js';
import { RecalculateScoreRequest } from '../types/scoreTypes.js';

const router = Router();
const scoringEngine = new FastScoringEngine();

/**
 * GET /api/recalculate-score
 * Documentation & route metadata
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Real-Time Resume Score Recalculation API is online',
    method: 'POST /api/recalculate-score',
    latency_target: '< 15ms in-memory calculation',
    expected_body: {
      resume_text: 'Updated resume bullets or full text (string)',
      job_description: 'Target job description (string)',
      previous_score: 'Optional: last known score to calculate delta (number)'
    },
    output_schema: {
      match_score: 'Recalculated match score (0 - 100)',
      score_delta: 'Difference from previous score (+/-)',
      mandatory_coverage_pct: 'Mandatory technical requirements coverage percentage',
      keyword_overlap_pct: 'Keyword overlap rate',
      impact_density_score: 'Score based on quantified metrics and strong action verbs',
      matched_keywords: 'List of matching keywords found in resume text',
      missing_keywords: 'List of missing high-priority skills from job description',
      metrics_detected: 'Detected metric strings (%, $, ms, scale numbers)',
      action_verbs_detected: 'Detected power verbs (Architected, Deployed, etc.)',
      suggestions: 'Top real-time recommendations to improve score',
      latency_ms: 'Server-side execution time in milliseconds'
    }
  });
});

/**
 * POST /api/recalculate-score
 * Computes updated match score and hybrid metrics in real-time
 */
router.post('/', (req: Request<{}, {}, RecalculateScoreRequest>, res: Response) => {
  try {
    const {
      resume_text,
      resumeText,
      job_description,
      jobDescription,
      previous_score,
      previousScore
    } = req.body;

    const rText = resume_text !== undefined ? resume_text : (resumeText || '');
    const jdText = job_description || jobDescription;
    const prevScore = previous_score !== undefined ? previous_score : previousScore;

    // Validate Job Description
    if (!jdText || typeof jdText !== 'string' || jdText.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid "job_description" string is required in the request body.'
      });
    }

    if (typeof rText !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '"resume_text" must be a string.'
      });
    }

    // Execute synchronous in-memory calculation
    const result = scoringEngine.calculateScore(
      rText,
      jdText,
      typeof prevScore === 'number' ? prevScore : undefined
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error recalculating score:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred during score recalculation.'
    });
  }
});

export default router;
