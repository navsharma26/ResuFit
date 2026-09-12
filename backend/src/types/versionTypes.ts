export interface ResumeVersionRecord {
  id: string;
  userId: string;
  jobId: string;
  content: string;
  matchScore: number;
  createdAt: Date | string;
}

export interface CreateResumeVersionRequest {
  userId?: string;
  user_id?: string;
  jobId?: string;
  job_id?: string;
  content: string;
  matchScore?: number;
  match_score?: number;
}

export interface ScoreEvolutionPoint {
  versionId: string;
  iteration: number;
  score: number;
  createdAt: string;
}

export interface ResumeVersionHistoryResponse {
  versions: ResumeVersionRecord[];
  total: number;
  scoreEvolution: ScoreEvolutionPoint[];
  stats: {
    initialScore: number;
    currentScore: number;
    scoreDelta: number;
    highestScore: number;
    lowestScore: number;
    totalIterations: number;
  };
}
