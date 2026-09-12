import { PrismaClient } from '@prisma/client';
import {
  ResumeVersionRecord,
  ResumeVersionHistoryResponse,
  ScoreEvolutionPoint
} from '../types/versionTypes.js';

export class ResumeVersionService {
  private prisma: PrismaClient | null = null;
  private inMemoryStore: ResumeVersionRecord[] = [];
  private useInMemory = false;

  constructor() {
    try {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      });
    } catch (err) {
      console.warn('Could not initialize PrismaClient, using in-memory store fallback:', err);
      this.useInMemory = true;
    }
  }

  /**
   * Creates and persists a new ResumeVersion
   */
  async createVersion(data: {
    userId: string;
    jobId: string;
    content: string;
    matchScore: number;
  }): Promise<ResumeVersionRecord> {
    const { userId, jobId, content, matchScore } = data;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Resume content cannot be empty');
    }

    if (this.prisma && !this.useInMemory) {
      try {
        const created = await this.prisma.resumeVersion.create({
          data: {
            userId: userId || 'default_user',
            jobId: jobId || 'default_job',
            content: content.trim(),
            matchScore: Math.round(matchScore || 0)
          }
        });
        return created;
      } catch (err: any) {
        console.warn('Prisma DB write failed (falling back to resilient store):', err?.message || err);
        this.useInMemory = true;
      }
    }

    // In-memory fallback
    const monotonicTime = new Date(Date.now() + this.inMemoryStore.length * 10).toISOString();
    const fallbackRecord: ResumeVersionRecord = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: userId || 'default_user',
      jobId: jobId || 'default_job',
      content: content.trim(),
      matchScore: Math.round(matchScore || 0),
      createdAt: monotonicTime
    };

    this.inMemoryStore.unshift(fallbackRecord);
    return fallbackRecord;
  }

  /**
   * Retrieves versions and computes score evolution metrics
   */
  async getVersions(
    userId?: string,
    jobId?: string,
    limit = 50
  ): Promise<ResumeVersionHistoryResponse> {
    let rawVersions: ResumeVersionRecord[] = [];

    if (this.prisma && !this.useInMemory) {
      try {
        const whereClause: any = {};
        if (userId) whereClause.userId = userId;
        if (jobId) whereClause.jobId = jobId;

        rawVersions = await this.prisma.resumeVersion.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit
        });
      } catch (err: any) {
        console.warn('Prisma DB query failed (falling back to resilient store):', err?.message || err);
        this.useInMemory = true;
      }
    }

    if (this.useInMemory || !this.prisma) {
      rawVersions = this.inMemoryStore.filter(v => {
        if (userId && v.userId !== userId) return false;
        if (jobId && v.jobId !== jobId) return false;
        return true;
      }).slice(0, limit);
    }

    // Chronological order (oldest to newest) to calculate score progression
    const chronological = [...rawVersions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const scoreEvolution: ScoreEvolutionPoint[] = chronological.map((v, idx) => ({
      versionId: v.id,
      iteration: idx + 1,
      score: v.matchScore,
      createdAt: new Date(v.createdAt).toISOString()
    }));

    const scores = chronological.map(v => v.matchScore);
    const initialScore = scores.length > 0 ? scores[0] : 0;
    const currentScore = scores.length > 0 ? scores[scores.length - 1] : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const scoreDelta = currentScore - initialScore;

    return {
      versions: rawVersions,
      total: rawVersions.length,
      scoreEvolution,
      stats: {
        initialScore,
        currentScore,
        scoreDelta,
        highestScore,
        lowestScore,
        totalIterations: rawVersions.length
      }
    };
  }

  /**
   * Retrieves single version by ID
   */
  async getVersionById(id: string): Promise<ResumeVersionRecord | null> {
    if (this.prisma && !this.useInMemory) {
      try {
        return await this.prisma.resumeVersion.findUnique({
          where: { id }
        });
      } catch (err) {
        this.useInMemory = true;
      }
    }

    const found = this.inMemoryStore.find(v => v.id === id);
    return found || null;
  }

  /**
   * Deletes a version by ID
   */
  async deleteVersion(id: string): Promise<boolean> {
    if (this.prisma && !this.useInMemory) {
      try {
        await this.prisma.resumeVersion.delete({
          where: { id }
        });
        return true;
      } catch (err) {
        this.useInMemory = true;
      }
    }

    const initialLen = this.inMemoryStore.length;
    this.inMemoryStore = this.inMemoryStore.filter(v => v.id !== id);
    return this.inMemoryStore.length < initialLen;
  }
}
