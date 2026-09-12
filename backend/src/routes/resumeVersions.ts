import { Router, Request, Response } from 'express';
import { ResumeVersionService } from '../services/resumeVersionService.js';
import { CreateResumeVersionRequest } from '../types/versionTypes.js';

const router = Router();
const versionService = new ResumeVersionService();

/**
 * GET /api/resume-versions
 * Fetch past resume versions and score evolution stats
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

    const history = await versionService.getVersions(userId, jobId, limit);
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Error fetching resume versions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to retrieve resume version history.'
    });
  }
});

/**
 * POST /api/resume-versions
 * Save a new resume version iteration
 */
router.post('/', async (req: Request<{}, {}, CreateResumeVersionRequest>, res: Response) => {
  try {
    const {
      userId,
      user_id,
      jobId,
      job_id,
      content,
      matchScore,
      match_score
    } = req.body;

    const rawContent = content;
    const finalUserId = userId || user_id || 'default_user';
    const finalJobId = jobId || job_id || 'default_job';
    const finalScore = typeof matchScore === 'number' ? matchScore : (typeof match_score === 'number' ? match_score : 0);

    if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A non-empty "content" string is required to save a resume version.'
      });
    }

    const savedVersion = await versionService.createVersion({
      userId: finalUserId,
      jobId: finalJobId,
      content: rawContent,
      matchScore: finalScore
    });

    return res.status(201).json(savedVersion);
  } catch (error: any) {
    console.error('Error creating resume version:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to save resume version.'
    });
  }
});

/**
 * GET /api/resume-versions/:id
 * Retrieve specific version by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await versionService.getVersionById(id);

    if (!version) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Resume version with ID "${id}" was not found.`
      });
    }

    return res.status(200).json(version);
  } catch (error: any) {
    console.error(`Error fetching resume version ${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to fetch resume version.'
    });
  }
});

/**
 * DELETE /api/resume-versions/:id
 * Delete a resume version iteration
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await versionService.deleteVersion(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Resume version with ID "${id}" was not found.`
      });
    }

    return res.status(200).json({
      message: `Resume version ${id} deleted successfully.`,
      id
    });
  } catch (error: any) {
    console.error(`Error deleting resume version ${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to delete resume version.'
    });
  }
});

export default router;
