'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Layers,
  ListCheck,
  Table,
  Copy,
  Check,
  Rocket,
  ShieldCheck,
  FileCode,
  ArrowRight,
  AlertTriangle,
  FileCheck2,
  Square,
  CheckSquare,
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Download,
  FileText,
  TrendingUp,
  Target
} from 'lucide-react';
import {
  GapAnalysisResult,
  CareerReadinessPlan,
  PracticalTask,
  SkillActionPlan
} from './types';
import { MatchScoreCard } from './MatchScoreCard';

interface GapAnalysisMatrixProps {
  data: GapAnalysisResult;
  className?: string;
}

type TabType = 'all' | 'matched' | 'missing' | 'nice_to_have' | 'readiness' | 'quick_wins';
type ViewMode = 'checklist' | 'matrix';

interface UnifiedItem {
  id: string;
  name: string;
  type: 'matched' | 'missing_mandatory' | 'nice_to_have';
  category: string;
  status: 'matched' | 'missing';
  isMandatory: boolean;
  impactOrBonus?: string;
  evidence?: string;
  recommendation?: string;
  confidence?: number;
  chunkIndex?: number;
  readinessPlan?: CareerReadinessPlan;
  projectedScoreDelta?: number;
  roiPriority?: 'Quick Win' | 'Core Investment' | 'Secondary';
  evidenceStrength?: 'high' | 'moderate' | 'surface';
  quantifiedMetrics?: string[];
}

export const GapAnalysisMatrix: React.FC<GapAnalysisMatrixProps> = ({ data, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('checklist');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);

  // Interactive checkbox state for suggested proof deliverables
  const [completedProofs, setCompletedProofs] = useState<Record<string, boolean>>({});

  // Practical Tasks and Evidence Artifacts completion tracking
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [completedArtifacts, setCompletedArtifacts] = useState<Record<string, boolean>>({});

  // Dynamic generated action plans from /api/gap-analysis/action-plan
  const [dynamicPlans, setDynamicPlans] = useState<Record<string, SkillActionPlan>>({});
  const [generatingPlans, setGeneratingPlans] = useState<Record<string, boolean>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Selected item for the [View Action Plan] detailed modal
  const [selectedModalItem, setSelectedModalItem] = useState<UnifiedItem | null>(null);

  // Extract unique categories across all items
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.matched_skills.forEach(s => s.category && set.add(s.category));
    data.missing_mandatory_skills.forEach(s => s.category && set.add(s.category));
    data.nice_to_haves.forEach(s => s.category && set.add(s.category));
    return ['all', ...Array.from(set)];
  }, [data]);

  // Unified items for filtering and matrix display
  const unifiedItems = useMemo(() => {
    const list: UnifiedItem[] = [];

    data.matched_skills.forEach((s, idx) => {
      list.push({
        id: `matched-${idx}-${s.skill}`,
        name: s.skill,
        type: 'matched',
        category: s.category || 'General',
        status: 'matched',
        isMandatory: true,
        evidence: s.resume_evidence,
        confidence: s.confidence,
        chunkIndex: s.chunk_index,
        evidenceStrength: s.evidence_strength,
        quantifiedMetrics: s.quantified_metrics
      });
    });

    data.missing_mandatory_skills.forEach((s, idx) => {
      list.push({
        id: `missing-${idx}-${s.skill}`,
        name: s.skill,
        type: 'missing_mandatory',
        category: s.category || 'General',
        status: 'missing',
        isMandatory: true,
        impactOrBonus: s.impact,
        recommendation: s.recommendation,
        readinessPlan: s.readiness_plan,
        projectedScoreDelta: s.projected_score_delta || s.readiness_plan?.projected_score_delta,
        roiPriority: s.roi_priority || s.readiness_plan?.roi_priority
      });
    });

    data.nice_to_haves.forEach((s, idx) => {
      list.push({
        id: `nice-${idx}-${s.skill}`,
        name: s.skill,
        type: 'nice_to_have',
        category: s.category || 'Preferred',
        status: s.status,
        isMandatory: false,
        impactOrBonus: s.bonus_value,
        evidence: s.resume_evidence,
        readinessPlan: s.readiness_plan,
        projectedScoreDelta: s.projected_score_delta || s.readiness_plan?.projected_score_delta,
        roiPriority: s.roi_priority || s.readiness_plan?.roi_priority,
        evidenceStrength: s.evidence_strength,
        quantifiedMetrics: s.quantified_metrics
      });
    });

    return list;
  }, [data]);

  // Count items with active readiness plans
  const readinessCount = useMemo(() => {
    return unifiedItems.filter(item => item.status === 'missing' && item.readinessPlan).length;
  }, [unifiedItems]);

  // Count items identified as Quick Wins
  const quickWinsCount = useMemo(() => {
    return unifiedItems.filter(item => 
      item.roiPriority === 'Quick Win' || 
      item.readinessPlan?.roi_priority === 'Quick Win'
    ).length;
  }, [unifiedItems]);

  // Filtered items based on active tab, category, and search query
  const filteredItems = useMemo(() => {
    return unifiedItems.filter(item => {
      // Tab filter
      if (activeTab === 'matched' && item.type !== 'matched') return false;
      if (activeTab === 'missing' && item.type !== 'missing_mandatory') return false;
      if (activeTab === 'nice_to_have' && item.type !== 'nice_to_have') return false;
      if (activeTab === 'readiness' && (!item.readinessPlan || item.status !== 'missing')) return false;
      if (activeTab === 'quick_wins' && item.roiPriority !== 'Quick Win' && item.readinessPlan?.roi_priority !== 'Quick Win') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesEvidence = item.evidence?.toLowerCase().includes(query);
        const matchesRec = item.recommendation?.toLowerCase().includes(query);
        const matchesWhy = item.readinessPlan?.why_it_matters.toLowerCase().includes(query);
        const matchesProof = item.readinessPlan?.suggested_proof.some(p => p.toLowerCase().includes(query));
        const matchesMetric = item.quantifiedMetrics?.some(m => m.toLowerCase().includes(query));
        if (!matchesName && !matchesCat && !matchesEvidence && !matchesRec && !matchesWhy && !matchesProof && !matchesMetric) return false;
      }

      return true;
    });
  }, [unifiedItems, activeTab, selectedCategory, searchQuery]);

  const toggleProof = (key: string) => {
    setCompletedProofs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleArtifact = (key: string) => {
    setCompletedArtifacts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGenerateActionPlan = async (item: UnifiedItem) => {
    setGeneratingPlans(prev => ({ ...prev, [item.id]: true }));
    try {
      const res = await fetch('/api/gap-analysis/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: item.name,
          category: item.category
        })
      });
      if (res.ok) {
        const plan: SkillActionPlan = await res.json();
        setDynamicPlans(prev => ({ ...prev, [item.id]: plan }));
        setExpandedPlans(prev => ({ ...prev, [item.id]: true }));
      }
    } catch (err) {
      console.error('Failed to generate action plan:', err);
    } finally {
      setGeneratingPlans(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const generateMarkdownRoadmap = () => {
    let md = `# ResuFit — Career Readiness & Skill Gap Action Plan\n\n`;
    md += `**Target Fit Score:** ${data.match_score}%\n`;
    md += `**Summary:** ${data.summary}\n`;
    md += `**Mandatory Coverage:** ${data.stats?.matched_mandatory || 0} of ${data.stats?.total_mandatory || 0} (${data.stats?.mandatory_coverage_pct || 0}%)\n\n`;

    md += `## 1. Verified Core Competencies (${data.matched_skills.length})\n`;
    data.matched_skills.forEach(s => {
      const strength = s.evidence_strength ? ` [Depth: ${s.evidence_strength.toUpperCase()}]` : '';
      const metricsText = s.quantified_metrics && s.quantified_metrics.length > 0 ? ` [Key Metrics: ${s.quantified_metrics.join(', ')}]` : '';
      md += `- [x] **${s.skill}** (${s.category})${strength}${metricsText}\n`;
      if (s.resume_evidence) {
        md += `  > Evidence: "${s.resume_evidence.trim()}"\n`;
      }
    });

    md += `\n## 2. Priority Remediation Roadmaps (Missing Mandatory Requirements)\n`;
    data.missing_mandatory_skills.forEach(s => {
      const delta = s.projected_score_delta || s.readiness_plan?.projected_score_delta;
      const deltaText = delta ? ` [Projected Score Delta: +${delta} pts]` : '';
      const roi = s.roi_priority || s.readiness_plan?.roi_priority;
      const roiText = roi ? ` [ROI: ${roi}]` : '';
      md += `### 🎯 ${s.skill} (${s.category})${deltaText}${roiText}\n`;
      if (s.readiness_plan) {
        md += `**Why It Matters:** ${s.readiness_plan.why_it_matters}\n\n`;
        md += `**Recommended Action:** ${s.readiness_plan.recommended_action}\n\n`;
        if (s.readiness_plan.tasks && s.readiness_plan.tasks.length > 0) {
          md += `**Step-by-Step Practical Tasks:**\n`;
          s.readiness_plan.tasks.forEach(t => {
            md += `- [ ] Step ${t.step}: **${t.title}** — ${t.description}\n`;
          });
          md += `\n`;
        }
        if (s.readiness_plan.suggested_proof && s.readiness_plan.suggested_proof.length > 0) {
          md += `**Verifiable Proof Deliverables:**\n`;
          s.readiness_plan.suggested_proof.forEach(p => {
            md += `- [ ] Proof Artifact: ${p}\n`;
          });
          md += `\n`;
        }
      }
    });

    if (data.nice_to_haves.some(n => n.status === 'missing')) {
      md += `## 3. Nice-to-Have Differentiators\n`;
      data.nice_to_haves.filter(n => n.status === 'missing').forEach(n => {
        const delta = n.projected_score_delta || n.readiness_plan?.projected_score_delta;
        const deltaText = delta ? ` [Projected Score Delta: +${delta} pts]` : '';
        md += `### 💡 ${n.skill} (${n.category})${deltaText}\n`;
        if (n.readiness_plan) {
          md += `**Recommended Action:** ${n.readiness_plan.recommended_action}\n\n`;
          if (n.readiness_plan.suggested_proof) {
            n.readiness_plan.suggested_proof.forEach(p => {
              md += `- [ ] Proof Artifact: ${p}\n`;
            });
            md += `\n`;
          }
        }
      });
    }

    md += `\n---\n*Generated by ResuFit AI Career Readiness Engine — Follow honest progression: Learn → Practice → Build → Document → Verify → Add.*\n`;
    return md;
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateMarkdownRoadmap();
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ResuFit-Career-Readiness-Plan-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const mdContent = generateMarkdownRoadmap();
    navigator.clipboard.writeText(mdContent);
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2000);
  };

  const handleCopyReport = () => {
    const markdown = [
      `# ResuFit Requirement Gap Analysis & Career Readiness Report`,
      `**Overall Match Score**: ${data.match_score}/100`,
      `**Summary**: ${data.summary}`,
      '',
      `## 1. Verified Resume Skills (${data.matched_skills.length})`,
      ...data.matched_skills.map(s => `- [x] **${s.skill}** (${s.category}): "${s.resume_evidence}"`),
      '',
      `## 2. Missing Mandatory Requirements & Career Readiness Plans (${data.missing_mandatory_skills.length})`,
      ...data.missing_mandatory_skills.map(s => {
        let block = `- [ ] **${s.skill}** [${s.impact?.toUpperCase() || 'HIGH'} DEFICIT]\n  - **Recommendation**: ${s.recommendation}`;
        if (s.readiness_plan) {
          block += `\n  - **Why It Matters**: ${s.readiness_plan.why_it_matters}`;
          block += `\n  - **Evidence Audit**: ${s.readiness_plan.evidence_status.toUpperCase()} ("${s.readiness_plan.evidence_found}")`;
          block += `\n  - **Recommended Action**: ${s.readiness_plan.recommended_action}`;
          block += `\n  - **Suggested Proof Artifacts**: ${s.readiness_plan.suggested_proof.join('; ')}`;
        }
        return block;
      }),
      '',
      `## 3. Nice-to-Haves (${data.nice_to_haves.length})`,
      ...data.nice_to_haves.map(s => {
        let block = `- [${s.status === 'matched' ? 'x' : ' '}] **${s.skill}** (${s.status.toUpperCase()})`;
        if (s.status === 'missing' && s.readiness_plan) {
          block += `\n  - **Career Readiness Plan**: ${s.readiness_plan.recommended_action}`;
          block += `\n  - **Proof**: ${s.readiness_plan.suggested_proof.join('; ')}`;
        }
        return block;
      }),
      '',
      `> 🛡️ **Trust & Accuracy Rule**: Never fabricate experience on your resume. Follow the honest progression: Learn → Practice → Build → Document → Verify → Add.`
    ].join('\n');

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`gap-analysis-wrapper ${className}`}>
      {/* Side-by-Side Dual Pane: Match Score Card alongside the Visual Matrix / Checklist */}
      <div className="gap-analysis-grid">
        {/* Left / Sticky Pane: Match Score Card */}
        <div className="score-pane">
          <MatchScoreCard data={data} />

          {/* Quick Action Box */}
          <div className="quick-actions-card">
            <button
              onClick={handleCopyReport}
              className="copy-report-btn"
              title="Copy formatted markdown report with Career Readiness Plans to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Report & Action Plans</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowMarkdownModal(true)}
              className="export-roadmap-btn"
              id="export-markdown-roadmap-btn"
              title="Preview and export full Career Readiness Roadmap to Markdown"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Export Action Roadmap (.md)</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Visual Matrix & Interactive Checklist */}
        <div className="matrix-pane">
          {/* Controls Bar: Tabs, View Mode, Category, Search */}
          <div className="matrix-toolbar">
            <div className="tabs-row">
              <button
                className={`matrix-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Requirements
                <span className="tab-count">{unifiedItems.length}</span>
              </button>
              <button
                className={`matrix-tab matched-tab ${activeTab === 'matched' ? 'active' : ''}`}
                onClick={() => setActiveTab('matched')}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Matched
                <span className="tab-count">{data.matched_skills.length}</span>
              </button>
              <button
                className={`matrix-tab missing-tab ${activeTab === 'missing' ? 'active' : ''}`}
                onClick={() => setActiveTab('missing')}
              >
                <XCircle className="w-3.5 h-3.5" />
                Missing Mandatory
                <span className="tab-count">{data.missing_mandatory_skills.length}</span>
              </button>
              <button
                className={`matrix-tab nice-tab ${activeTab === 'nice_to_have' ? 'active' : ''}`}
                onClick={() => setActiveTab('nice_to_have')}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Nice-to-Haves
                <span className="tab-count">{data.nice_to_haves.length}</span>
              </button>
              <button
                className={`matrix-tab readiness-tab ${activeTab === 'readiness' ? 'active' : ''}`}
                onClick={() => setActiveTab('readiness')}
                style={{
                  color: activeTab === 'readiness' ? '#ffffff' : '#818cf8',
                  borderColor: activeTab === 'readiness' ? '#6366f1' : 'transparent',
                  background: activeTab === 'readiness' ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
                }}
              >
                <Rocket className="w-3.5 h-3.5" />
                Career Readiness
                <span className="tab-count" style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc' }}>
                  {readinessCount}
                </span>
              </button>
              <button
                className={`matrix-tab quick-wins-tab ${activeTab === 'quick_wins' ? 'active' : ''}`}
                onClick={() => setActiveTab('quick_wins')}
                id="tab-quick-wins"
                style={{
                  color: activeTab === 'quick_wins' ? '#ffffff' : '#34d399',
                  borderColor: activeTab === 'quick_wins' ? '#10b981' : 'transparent',
                  background: activeTab === 'quick_wins' ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick Wins
                <span className="tab-count" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
                  {quickWinsCount}
                </span>
              </button>
            </div>

            <div className="view-mode-toggles">
              <button
                className={`view-btn ${viewMode === 'checklist' ? 'active' : ''}`}
                onClick={() => setViewMode('checklist')}
                title="Checklist View"
              >
                <ListCheck className="w-4 h-4" />
                <span>Checklist</span>
              </button>
              <button
                className={`view-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                onClick={() => setViewMode('matrix')}
                title="Matrix Grid View"
              >
                <Table className="w-4 h-4" />
                <span>Matrix</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Search skills, category, proof artifacts, or action plans..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="search-clear-btn">
                  ×
                </button>
              )}
            </div>

            {categories.length > 2 && (
              <div className="category-select-wrapper">
                <Filter className="filter-icon w-3.5 h-3.5" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="all">All Categories ({categories.length - 1})</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Content: Checklist vs Matrix View */}
          {filteredItems.length === 0 ? (
            <div className="empty-filter-state">
              <Layers className="w-8 h-8 text-neutral-500" />
              <p>No requirements match the current filters.</p>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="reset-filters-btn"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'checklist' ? (
            <div className="checklist-container space-y-4">
              {filteredItems.map(item => {
                const isMatched = item.status === 'matched';
                const hasReadiness = Boolean(item.readinessPlan);

                /* ==========================================================
                   1. MATCHED REQUIREMENT CARD (Clean Verified Presentation)
                   ========================================================== */
                if (isMatched) {
                  return (
                    <div key={item.id} className="checklist-item matched">
                      <div className="checklist-main-row">
                        {/* Checkmark Icon */}
                        <div className="checklist-status-box">
                          <div className="icon-box-matched">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                        </div>

                        {/* Title & Evidence */}
                        <div className="checklist-info">
                          <div className="checklist-title-row">
                            <span className="skill-name">{item.name}</span>
                            <span className="category-pill">{item.category}</span>
                            {item.type === 'nice_to_have' && (
                              <span className="nice-status-badge matched">BONUS EARNED</span>
                            )}
                            {item.evidenceStrength && (
                              <span className={`evidence-depth-chip depth-${item.evidenceStrength}`} title={`Evidence depth classified as ${item.evidenceStrength}`}>
                                {item.evidenceStrength === 'high' ? 'High Depth' : item.evidenceStrength === 'moderate' ? 'Moderate' : 'Surface Mention'}
                              </span>
                            )}
                          </div>

                          {item.evidence && (
                            <p className="evidence-snippet">
                              <span className="evidence-label">Resume Proof:</span> &ldquo;
                              {item.evidence}&rdquo;
                            </p>
                          )}

                          {item.quantifiedMetrics && item.quantifiedMetrics.length > 0 && (
                            <div className="metrics-chip-group">
                              <span className="text-[11px] text-neutral-400 font-medium">Verified Metrics:</span>
                              {item.quantifiedMetrics.map((m, idx) => (
                                <span key={idx} className="metric-chip" title="Quantified metric detected in resume proof">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                /* ==========================================================
                   2. MISSING REQUIREMENT CARD (Practical Skill Action Plans)
                   ========================================================== */
                const planData = dynamicPlans[item.id];
                const readiness = item.readinessPlan;
                const whyItMatters = planData?.why_it_matters || readiness?.why_it_matters || `Proficiency in ${item.name} is a key requirement for delivering outcomes in ${item.category}.`;
                const evidenceFound = readiness?.evidence_found || 'No supporting evidence found in the provided resume.';
                const recommendedAction = planData?.recommended_action || readiness?.recommended_action || item.recommendation || `Build and verify a practical project implementing ${item.name}.`;
                
                const tasks: PracticalTask[] = planData?.tasks || readiness?.tasks || [];
                const artifacts: string[] = planData?.evidence_artifacts || readiness?.evidence_artifacts || readiness?.suggested_proof || [];
                
                const completedTaskCount = tasks.filter(t => completedTasks[`${item.name}-task-${t.step}`]).length;
                const totalTaskCount = tasks.length;
                const taskProgressPct = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;
                
                const isPlanExpanded = expandedPlans[item.id] !== undefined ? expandedPlans[item.id] : true;
                const isGenerating = Boolean(generatingPlans[item.id]);

                return (
                  <div key={item.id} className="checklist-item missing-mandatory">
                    <div className="checklist-missing-card-inner">
                      {/* Flow 1: Missing Requirement Header */}
                      <div className="missing-card-header">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="icon-box-missing">
                            <XCircle className="w-5 h-5 text-rose-500" />
                          </div>
                          <span className="skill-name-prominent">{item.name}</span>
                          <span className="category-pill">{item.category}</span>

                          {/* Projected ATS Score Delta */}
                          {(item.projectedScoreDelta || item.readinessPlan?.projected_score_delta) && (
                            <span
                              className="score-delta-chip"
                              title="Estimated ATS match score points gained by adding verifiable proof for this requirement"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              +{item.projectedScoreDelta || item.readinessPlan?.projected_score_delta} pts
                            </span>
                          )}

                          {/* ROI Priority */}
                          {(item.roiPriority || item.readinessPlan?.roi_priority) && (
                            <span
                              className={`roi-priority-chip ${(item.roiPriority || item.readinessPlan?.roi_priority || '').toLowerCase().replace(' ', '-')}`}
                              title={
                                (item.roiPriority || item.readinessPlan?.roi_priority) === 'Quick Win'
                                  ? 'High ROI: Low-to-moderate effort with direct mandatory/bonus impact'
                                  : 'Core Investment: Foundational capability requiring deliberate practice'
                              }
                            >
                              {(item.roiPriority || item.readinessPlan?.roi_priority) === 'Quick Win' ? (
                                <>
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>Quick Win</span>
                                </>
                              ) : (
                                <>
                                  <Target className="w-3 h-3 text-indigo-400" />
                                  <span>{item.roiPriority || item.readinessPlan?.roi_priority}</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <span className="missing-status-tag">
                          {item.isMandatory ? 'Missing' : 'Optional Boost'}
                        </span>
                      </div>

                      <div className="missing-card-body">
                        {/* Flow 2: Why it matters */}
                        <div className="readiness-field-group">
                          <span className="readiness-field-label">Why it matters:</span>
                          <p className="readiness-field-text">{whyItMatters}</p>
                        </div>

                        {/* Resume Evidence Audit */}
                        <div className="readiness-field-group">
                          <span className="readiness-field-label">Resume Evidence:</span>
                          <p className="readiness-field-evidence">{evidenceFound}</p>
                        </div>

                        {/* Flow 3: Recommended Action */}
                        <div className="readiness-field-group">
                          <span className="readiness-field-label">Recommended Action:</span>
                          <p className="readiness-field-action">{recommendedAction}</p>
                        </div>

                        {/* Flow 4: Generate Action Plan interaction */}
                        <div className="action-plan-interaction-row">
                          <button
                            onClick={() => handleGenerateActionPlan(item)}
                            disabled={isGenerating}
                            className="btn-generate-action-plan"
                            id={`generate-action-plan-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            {isGenerating ? (
                              <>
                                <span className="action-plan-spinner" />
                                <span>Generating Action Plan...</span>
                              </>
                            ) : planData ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Regenerate Action Plan</span>
                              </>
                            ) : (
                              <>
                                <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Generate Action Plan</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedModalItem(item)}
                            className="view-action-plan-btn"
                            id={`view-action-plan-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Action Plan</span>
                          </button>
                        </div>

                        {/* Flow 5: Practical Tasks (Ordered 1..6) */}
                        {tasks.length > 0 && isPlanExpanded && (
                          <div className="readiness-field-group practical-tasks-group">
                            <div className="tasks-section-header">
                              <span className="readiness-field-label">Action Plan:</span>
                              <span className="tasks-count-pill">
                                {completedTaskCount} of {totalTaskCount} Tasks Done
                              </span>
                            </div>

                            <div className="practical-tasks-checklist">
                              {tasks.map((task) => {
                                const key = `${item.name}-task-${task.step}`;
                                const isChecked = Boolean(completedTasks[key]);
                                return (
                                  <div
                                    key={task.step}
                                    onClick={() => toggleTask(key)}
                                    className={`task-check-row ${isChecked ? 'checked' : ''}`}
                                    title="Click to toggle task completion"
                                  >
                                    <div className="task-check-icon">
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      ) : (
                                        <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="task-check-content">
                                      <span className={`task-step-number ${isChecked ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                        {task.step}.
                                      </span>
                                      <span className={`task-description ${isChecked ? 'line-through text-neutral-500' : 'text-slate-200'}`}>
                                        {task.description}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Flow 6: Evidence Artifacts */}
                        {artifacts.length > 0 && isPlanExpanded && (
                          <div className="readiness-field-group evidence-artifacts-group">
                            <span className="readiness-field-label">Evidence Artifacts:</span>
                            <div className="evidence-artifacts-list">
                              {artifacts.map((artifact, aIdx) => {
                                const key = `${item.name}-artifact-${aIdx}`;
                                const isChecked = Boolean(completedArtifacts[key]);
                                return (
                                  <div
                                    key={aIdx}
                                    onClick={() => toggleArtifact(key)}
                                    className={`artifact-item-row ${isChecked ? 'checked' : ''}`}
                                    title="Click to toggle artifact preparation"
                                  >
                                    {isChecked ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                      <span className="artifact-bullet-point">•</span>
                                    )}
                                    <span className={`artifact-text ${isChecked ? 'line-through text-neutral-500' : 'text-sky-300'}`}>
                                      {artifact}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Flow 7: Completion Tracking */}
                        {totalTaskCount > 0 && isPlanExpanded && (
                          <div className="completion-tracking-box">
                            <div className="completion-tracking-header">
                              <div className="flex items-center gap-2">
                                <span className="tracking-score-label">Completion Tracking:</span>
                                <span className="tracking-progress-stat">
                                  {completedTaskCount} of {totalTaskCount} tasks completed ({taskProgressPct}%)
                                </span>
                              </div>
                              <span className="self-reported-pill">
                                Self-Reported
                              </span>
                            </div>

                            <div className="tracking-progress-track">
                              <div
                                className="tracking-progress-fill"
                                style={{ width: `${taskProgressPct}%` }}
                              />
                            </div>

                            <p className="tracking-disclaimer">
                              🛡️ <strong>Self-Reported Candidate Progress:</strong> Not an external certification. Completing tasks helps you build evidence, but does not automatically add {item.name} to your resume until verified.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Visual Matrix Table View */
            <div className="matrix-table-container">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Requirement / Skill</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Evidence / Action Plan</th>
                    <th>Suggested Proof</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className={`matrix-row ${item.type}`}>
                      <td className="font-semibold text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{item.name}</span>
                          {item.projectedScoreDelta && (
                            <span className="score-delta-chip text-[10px] py-0 px-1.5" title="Projected ATS Score Delta">
                              +{item.projectedScoreDelta} pts
                            </span>
                          )}
                          {item.evidenceStrength && (
                            <span className={`evidence-depth-chip depth-${item.evidenceStrength} text-[10px] py-0 px-1.5`}>
                              {item.evidenceStrength}
                            </span>
                          )}
                          {item.readinessPlan && (
                            <span className="table-readiness-dot" title="Has Career Readiness Plan" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="category-pill">{item.category}</span>
                      </td>
                      <td>
                        {item.isMandatory ? (
                          <span className="table-badge mandatory">Mandatory</span>
                        ) : (
                          <span className="table-badge optional">Nice-to-Have</span>
                        )}
                      </td>
                      <td>
                        {item.status === 'matched' ? (
                          <span className="status-pill status-matched">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Matched
                          </span>
                        ) : (
                          <span className="status-pill status-missing">
                            <XCircle className="w-3.5 h-3.5" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="matrix-detail-cell">
                        {item.evidence ? (
                          <span className="table-evidence-preview" title={item.evidence}>
                            &ldquo;{item.evidence.slice(0, 60)}...&rdquo;
                          </span>
                        ) : item.readinessPlan ? (
                          <div className="table-rec-wrap" title={item.readinessPlan.recommended_action}>
                            <span className="font-semibold text-sky-400">Action: </span>
                            {item.readinessPlan.recommended_action.slice(0, 65)}...
                          </div>
                        ) : item.recommendation ? (
                          <span className="table-rec-preview" title={item.recommendation}>
                            {item.recommendation.slice(0, 60)}...
                          </span>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>
                      <td>
                        {item.readinessPlan && item.readinessPlan.suggested_proof.length > 0 ? (
                          <div className="table-proof-pills">
                            <span className="proof-mini-tag">
                              {item.readinessPlan.suggested_proof[0]}
                            </span>
                            {item.readinessPlan.suggested_proof.length > 1 && (
                              <span className="proof-mini-tag more">
                                +{item.readinessPlan.suggested_proof.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {item.readinessPlan ? (
                          <button
                            onClick={() => setSelectedModalItem(item)}
                            className="btn-table-action"
                            title="Open Action Plan"
                          >
                            Plan
                          </button>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          DETAILED [VIEW ACTION PLAN] MODAL
          ==================================================================== */}
      {selectedModalItem && selectedModalItem.readinessPlan && (
        <div className="action-plan-modal-backdrop" onClick={() => setSelectedModalItem(null)}>
          <div className="action-plan-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="action-plan-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="modal-title">
                    Action Plan: <span className="text-white font-bold">{selectedModalItem.name}</span>
                  </h3>
                  <span className="modal-subtitle">
                    {selectedModalItem.category} • {selectedModalItem.isMandatory ? 'Mandatory Requirement' : 'Preferred Skill'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedModalItem(null)}
                className="modal-close-btn"
                title="Close Action Plan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const modalPlan = dynamicPlans[selectedModalItem.id];
              const modalTasks: PracticalTask[] = modalPlan?.tasks || selectedModalItem.readinessPlan.tasks || [];
              const modalArtifacts: string[] = modalPlan?.evidence_artifacts || selectedModalItem.readinessPlan.evidence_artifacts || selectedModalItem.readinessPlan.suggested_proof || [];
              const modalCompletedTasks = modalTasks.filter(t => completedTasks[`${selectedModalItem.name}-task-${t.step}`]).length;
              const modalTaskTotal = modalTasks.length;
              const modalTaskPct = modalTaskTotal > 0 ? Math.round((modalCompletedTasks / modalTaskTotal) * 100) : 0;
              const isGeneratingModal = Boolean(generatingPlans[selectedModalItem.id]);

              return (
                <div className="action-plan-modal-body space-y-5">
                  {/* Section 1: Why it matters */}
                  <div className="modal-section">
                    <div className="modal-section-label">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Why This Matters for the Target Role</span>
                    </div>
                    <p className="modal-section-text">
                      {modalPlan?.why_it_matters || selectedModalItem.readinessPlan.why_it_matters}
                    </p>
                  </div>

                  {/* Section 2: Resume Evidence Audit */}
                  <div className="modal-section">
                    <div className="modal-section-label">
                      <FileCheck2 className="w-4 h-4 text-blue-400" />
                      <span>Resume Evidence Audit</span>
                      <span className={`evidence-status-pill ${selectedModalItem.readinessPlan.evidence_status}`}>
                        {selectedModalItem.readinessPlan.evidence_status === 'none'
                          ? 'No Evidence Found'
                          : selectedModalItem.readinessPlan.evidence_status === 'partial'
                          ? 'Partial Mention'
                          : 'Verified'}
                      </span>
                    </div>
                    <p className="modal-evidence-quote">
                      &ldquo;{selectedModalItem.readinessPlan.evidence_found}&rdquo;
                    </p>
                  </div>

                  {/* Section 3: Recommended Practical Action */}
                  <div className="modal-section">
                    <div className="modal-section-label">
                      <Rocket className="w-4 h-4 text-emerald-400" />
                      <span>Recommended Practical Action</span>
                    </div>
                    <div className="modal-action-box">
                      <p className="text-emerald-300 font-medium">
                        {modalPlan?.recommended_action || selectedModalItem.readinessPlan.recommended_action}
                      </p>
                    </div>
                  </div>

                  {/* Section 4: Practical Tasks Checklist */}
                  {modalTasks.length > 0 && (
                    <div className="modal-section">
                      <div className="modal-section-label justify-between">
                        <div className="flex items-center gap-1.5">
                          <ListCheck className="w-4 h-4 text-sky-400" />
                          <span>Action Plan: Practical Tasks</span>
                        </div>
                        <span className="text-xs font-mono text-neutral-400">
                          {modalCompletedTasks} of {modalTaskTotal} Done
                        </span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {modalTasks.map(task => {
                          const key = `${selectedModalItem.name}-task-${task.step}`;
                          const isChecked = Boolean(completedTasks[key]);
                          return (
                            <div
                              key={task.step}
                              onClick={() => toggleTask(key)}
                              className={`modal-task-item ${isChecked ? 'completed' : ''}`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                              )}
                              <span className={`text-xs font-mono ${isChecked ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                {task.step}.
                              </span>
                              <span className={`text-xs ${isChecked ? 'line-through text-neutral-400' : 'text-slate-200'}`}>
                                {task.description}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 5: Suggested Proof & Evidence Artifacts */}
                  {modalArtifacts.length > 0 && (
                    <div className="modal-section">
                      <div className="modal-section-label">
                        <FileCode className="w-4 h-4 text-indigo-400" />
                        <span>Evidence Artifacts (Deliverables)</span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {modalArtifacts.map((artifact, aIdx) => {
                          const key = `${selectedModalItem.name}-artifact-${aIdx}`;
                          const isChecked = Boolean(completedArtifacts[key]);
                          return (
                            <div
                              key={aIdx}
                              onClick={() => toggleArtifact(key)}
                              className={`modal-proof-item ${isChecked ? 'completed' : ''}`}
                            >
                              {isChecked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <span className="text-neutral-500">•</span>
                              )}
                              <span className={`font-mono text-xs ${isChecked ? 'line-through text-neutral-400' : 'text-slate-200'}`}>
                                {artifact}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 6: Completion Tracking */}
                  {modalTaskTotal > 0 && (
                    <div className="modal-section">
                      <div className="completion-tracking-box">
                        <div className="completion-tracking-header">
                          <div className="flex items-center gap-2">
                            <span className="tracking-score-label">Completion Tracking:</span>
                            <span className="tracking-progress-stat">
                              {modalCompletedTasks} of {modalTaskTotal} tasks ({modalTaskPct}%)
                            </span>
                          </div>
                          <span className="self-reported-pill">
                            Self-Reported
                          </span>
                        </div>
                        <div className="tracking-progress-track">
                          <div
                            className="tracking-progress-fill"
                            style={{ width: `${modalTaskPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 7: Honest Progression Flow */}
                  <div className="modal-section">
                    <div className="modal-section-label">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Honest Progression: From Zero to Verified Bullet</span>
                    </div>
                    <div className="honest-progression-bar">
                      <span className="progression-step">1. Learn</span>
                      <ArrowRight className="w-3 h-3 progression-arrow" />
                      <span className="progression-step">2. Practice</span>
                      <ArrowRight className="w-3 h-3 progression-arrow" />
                      <span className="progression-step">3. Build</span>
                      <ArrowRight className="w-3 h-3 progression-arrow" />
                      <span className="progression-step">4. Document</span>
                      <ArrowRight className="w-3 h-3 progression-arrow" />
                      <span className="progression-step">5. Verify</span>
                      <ArrowRight className="w-3 h-3 progression-arrow" />
                      <span className="progression-step active">6. Add to Resume</span>
                    </div>
                  </div>

                  {/* Trust Warning */}
                  <div className="modal-trust-callout">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-neutral-300">
                      <strong>Self-Reported Progress:</strong> Never claim {selectedModalItem.name} on your resume before completing the proof artifacts. Once verified, add the project to your resume and link the proof in your portfolio/GitHub.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="action-plan-modal-footer">
              <button
                onClick={() => handleGenerateActionPlan(selectedModalItem)}
                disabled={Boolean(generatingPlans[selectedModalItem.id])}
                className="btn-generate-action-plan text-xs"
              >
                {Boolean(generatingPlans[selectedModalItem.id]) ? (
                  <>
                    <span className="action-plan-spinner" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Regenerate with AI</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedModalItem(null)}
                className="btn-covercraft-white text-xs px-4 py-2"
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CAREER READINESS ACTION ROADMAP (MARKDOWN EXPORT MODAL)
          ==================================================================== */}
      {showMarkdownModal && (
        <div className="roadmap-modal-backdrop" onClick={() => setShowMarkdownModal(false)}>
          <div className="roadmap-modal-card" onClick={e => e.stopPropagation()}>
            <div className="roadmap-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Career Readiness Action Roadmap</h3>
                  <span className="text-xs text-neutral-400">Exportable Markdown document with remediation tasks & proof deliverables</span>
                </div>
              </div>
              <button
                onClick={() => setShowMarkdownModal(false)}
                className="modal-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="roadmap-modal-body">
              <pre className="roadmap-markdown-pre">
                {generateMarkdownRoadmap()}
              </pre>
            </div>

            <div className="roadmap-modal-footer">
              <button
                onClick={handleCopyMarkdown}
                className="btn-covercraft-white text-xs px-3.5 py-2 flex items-center gap-1.5"
                id="copy-markdown-roadmap-btn"
              >
                {markdownCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Markdown!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="btn-generate-action-plan text-xs px-4 py-2 flex items-center gap-1.5"
                id="download-markdown-roadmap-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
