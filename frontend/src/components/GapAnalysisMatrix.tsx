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
  ChevronDown,
  ChevronUp,
  Quote,
  Lightbulb,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { GapAnalysisResult, MatchedSkill, MissingMandatorySkill, NiceToHaveSkill } from './types';
import { MatchScoreCard } from './MatchScoreCard';

interface GapAnalysisMatrixProps {
  data: GapAnalysisResult;
  className?: string;
}

type TabType = 'all' | 'matched' | 'missing' | 'nice_to_have';
type ViewMode = 'checklist' | 'matrix';

export const GapAnalysisMatrix: React.FC<GapAnalysisMatrixProps> = ({ data, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('checklist');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    const list: Array<{
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
    }> = [];

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
        chunkIndex: s.chunk_index
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
        recommendation: s.recommendation
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
        evidence: s.resume_evidence
      });
    });

    return list;
  }, [data]);

  // Filtered items based on active tab, category, and search query
  const filteredItems = useMemo(() => {
    return unifiedItems.filter(item => {
      // Tab filter
      if (activeTab === 'matched' && item.type !== 'matched') return false;
      if (activeTab === 'missing' && item.type !== 'missing_mandatory') return false;
      if (activeTab === 'nice_to_have' && item.type !== 'nice_to_have') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesEvidence = item.evidence?.toLowerCase().includes(query);
        const matchesRec = item.recommendation?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesEvidence && !matchesRec) return false;
      }

      return true;
    });
  }, [unifiedItems, activeTab, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedSkill(prev => (prev === id ? null : id));
  };

  const handleCopyReport = () => {
    const markdown = [
      `# ResuFit Requirement Gap Analysis`,
      `**Overall Match Score**: ${data.match_score}/100`,
      `**Summary**: ${data.summary}`,
      '',
      `## 1. Matched Skills (${data.matched_skills.length})`,
      ...data.matched_skills.map(s => `- [x] **${s.skill}** (${s.category}): "${s.resume_evidence}"`),
      '',
      `## 2. Missing Mandatory Skills (${data.missing_mandatory_skills.length})`,
      ...data.missing_mandatory_skills.map(s => `- [ ] **${s.skill}** [${s.impact?.toUpperCase()} IMPACT]: ${s.recommendation}`),
      '',
      `## 3. Nice-to-Haves (${data.nice_to_haves.length})`,
      ...data.nice_to_haves.map(s => `- [${s.status === 'matched' ? 'x' : ' '}] **${s.skill}** (${s.status.toUpperCase()})`)
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
              title="Copy formatted markdown report to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Analysis Report</span>
                </>
              )}
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
                placeholder="Search skills, category, or evidence..."
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
            <div className="checklist-container">
              {filteredItems.map(item => {
                const isExpanded = expandedSkill === item.id;

                return (
                  <div
                    key={item.id}
                    className={`checklist-item ${item.type} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="checklist-main-row"
                      onClick={() => (item.evidence || item.recommendation) && toggleExpand(item.id)}
                    >
                      {/* Status Checkbox / Icon */}
                      <div className="checklist-status-box">
                        {item.type === 'matched' ? (
                          <div className="icon-box-matched">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                        ) : item.type === 'missing_mandatory' ? (
                          <div className="icon-box-missing">
                            <XCircle className="w-5 h-5 text-rose-500" />
                          </div>
                        ) : item.status === 'matched' ? (
                          <div className="icon-box-nice-matched">
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                          </div>
                        ) : (
                          <div className="icon-box-nice-missing">
                            <HelpCircle className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Skill Info */}
                      <div className="checklist-info">
                        <div className="checklist-title-row">
                          <span className="skill-name">{item.name}</span>
                          <span className="category-pill">{item.category}</span>

                          {item.type === 'missing_mandatory' && (
                            <span className={`impact-badge impact-${item.impactOrBonus || 'high'}`}>
                              {item.impactOrBonus?.toUpperCase() || 'HIGH'} DEFICIT
                            </span>
                          )}

                          {item.type === 'nice_to_have' && (
                            <span className={`nice-status-badge ${item.status}`}>
                              {item.status === 'matched' ? 'BONUS EARNED' : 'OPTIONAL BOOST'}
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Preview */}
                        <div className="checklist-subtext">
                          {item.type === 'matched' && item.evidence && (
                            <p className="evidence-snippet">
                              <span className="evidence-label">Resume Proof:</span> &ldquo;
                              {item.evidence.length > 100
                                ? `${item.evidence.slice(0, 100)}...`
                                : item.evidence}
                              &rdquo;
                            </p>
                          )}
                          {item.type === 'missing_mandatory' && item.recommendation && (
                            <p className="recommendation-snippet">
                              <span className="rec-label">Action:</span>{' '}
                              {item.recommendation.length > 110
                                ? `${item.recommendation.slice(0, 110)}...`
                                : item.recommendation}
                            </p>
                          )}
                          {item.type === 'nice_to_have' && (
                            <p className="nice-snippet">
                              {item.status === 'matched'
                                ? 'Bonus skill acquired — boosts candidate competitiveness.'
                                : 'Not detected in resume — non-mandatory preference.'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Expand / Details Toggle */}
                      {(item.evidence || item.recommendation) && (
                        <div className="expand-trigger">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <div className="checklist-expanded-drawer">
                        {item.evidence && (
                          <div className="evidence-full-box">
                            <div className="drawer-header">
                              <Quote className="w-4 h-4 text-emerald-400" />
                              <span>Direct Resume Evidence</span>
                              {item.chunkIndex && (
                                <span className="chunk-tag">Resume Chunk #{item.chunkIndex}</span>
                              )}
                            </div>
                            <blockquote className="quote-text">&ldquo;{item.evidence}&rdquo;</blockquote>
                          </div>
                        )}

                        {item.recommendation && (
                          <div className="recommendation-full-box">
                            <div className="drawer-header">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              <span>Gap Remediation Advice</span>
                            </div>
                            <p className="rec-full-text">{item.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
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
                    <th>Verification Status</th>
                    <th>Detail / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className={`matrix-row ${item.type}`}>
                      <td className="font-semibold text-white">{item.name}</td>
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
                        ) : item.recommendation ? (
                          <span className="table-rec-preview" title={item.recommendation}>
                            {item.recommendation.slice(0, 60)}...
                          </span>
                        ) : (
                          <span className="text-neutral-500">—</span>
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
    </div>
  );
};
