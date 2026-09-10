'use client';

import React from 'react';
import { Award, AlertTriangle, Sparkles, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { GapAnalysisResult } from './types';

interface MatchScoreCardProps {
  data: GapAnalysisResult;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ data }) => {
  const { match_score, matched_skills, missing_mandatory_skills, nice_to_haves, summary, stats } = data;

  const totalMandatory = stats?.total_mandatory ?? (matched_skills.length + missing_mandatory_skills.length);
  const matchedMandatory = stats?.matched_mandatory ?? matched_skills.length;
  const totalNice = stats?.total_nice_to_have ?? (nice_to_haves.length);
  const matchedNice = stats?.matched_nice_to_have ?? (nice_to_haves.filter(n => n.status === 'matched').length);
  const mandatoryPct = totalMandatory > 0 ? Math.round((matchedMandatory / totalMandatory) * 100) : 100;

  // Score tiering logic
  let scoreTier = {
    title: 'Top Tier Candidate',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Sparkles
  };

  if (match_score < 50) {
    scoreTier = {
      title: 'High Gap / Critical Deficits',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      icon: AlertTriangle
    };
  } else if (match_score < 75) {
    scoreTier = {
      title: 'Moderate Fit / Key Gaps',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      icon: Flame
    };
  }

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (match_score / 100) * circumference;

  return (
    <div className="match-score-card">
      <div className="score-card-header">
        <div className="score-badge-label">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Match Score & Fit Matrix</span>
        </div>
        <span
          className="score-tier-pill"
          style={{
            backgroundColor: scoreTier.bg,
            borderColor: scoreTier.border,
            color: scoreTier.color
          }}
        >
          <scoreTier.icon className="w-3.5 h-3.5" />
          {scoreTier.title}
        </span>
      </div>

      {/* Circular Radial Gauge */}
      <div className="radial-score-container">
        <svg className="radial-svg" width="160" height="160" viewBox="0 0 160 160">
          <circle
            className="radial-bg"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
          />
          <circle
            className="radial-progress"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            stroke={scoreTier.color}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="radial-content">
          <span className="radial-number">{match_score}</span>
          <span className="radial-unit">/ 100</span>
          <span className="radial-sub">Match Index</span>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="score-metrics-grid">
        <div className="metric-box">
          <div className="metric-header">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="metric-title">Mandatory Requirements</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-primary">{matchedMandatory} / {totalMandatory}</span>
            <span className="metric-pct">{mandatoryPct}%</span>
          </div>
          <div className="metric-progress-bar">
            <div
              className="metric-progress-fill bg-emerald-500"
              style={{ width: `${mandatoryPct}%` }}
            />
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="metric-title">Nice-to-Have Boosters</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-primary">{matchedNice} / {totalNice}</span>
            <span className="metric-pct">
              {totalNice > 0 ? Math.round((matchedNice / totalNice) * 100) : 0}%
            </span>
          </div>
          <div className="metric-progress-bar">
            <div
              className="metric-progress-fill bg-purple-500"
              style={{ width: `${totalNice > 0 ? (matchedNice / totalNice) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="score-summary-box">
        <div className="summary-title">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Executive ATS Evaluation</span>
        </div>
        <p className="summary-text">{summary}</p>
      </div>
    </div>
  );
};
