import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ExternalLink, Code, Sparkles, MapPin, Users, Award, 
  Activity, Compass, LogOut, ChevronRight, CheckCircle2, AlertTriangle, 
  ListFilter, BookOpen
} from 'lucide-react';

import { SkillRadarChart } from '../components/SkillRadarChart';
import { TechnologyUsageGraph } from '../components/TechnologyUsageGraph';
import { InternshipReadinessGauge } from '../components/InternshipReadinessGauge';
import { RepositoryAnalysisModal } from '../components/RepositoryAnalysisModal';

interface ProfileDashboardProps {
  username: string;
  onNavigateHome: () => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ username, onNavigateHome }) => {
  const { logout, user: authUser } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Repository static analysis modal state
  const [_selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoAnalysis, setRepoAnalysis] = useState<any>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'insights' | 'opensource'>('insights');
  const [osRecs, setOsRecs] = useState<any[]>([]);
  const [osLoading, setOsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.analyzeProfile(username)
      .then((res) => {
        setProfileData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile analysis error:", err);
        setError("Failed to load profile analysis. Verify username exists or API server is running.");
        setLoading(false);
      });
  }, [username]);

  // Fetch Open Source Recommendations
  useEffect(() => {
    if (activeTab === 'opensource' && profileData) {
      setOsLoading(true);
      const langs = profileData.recommended_technologies || ["Python"];
      api.getOpenSourceRecommendations(langs, profileData.internship_readiness_score)
        .then((res) => {
          setOsRecs(res);
          setOsLoading(false);
        })
        .catch((err) => {
          console.error("Open source recommend error:", err);
          setOsLoading(false);
        });
    }
  }, [activeTab, profileData]);

  // Handle repository analysis trigger
  const handleAnalyzeRepo = (repoName: string) => {
    setSelectedRepo(repoName);
    setRepoLoading(true);
    setIsModalOpen(true);
    api.analyzeRepository(username, repoName)
      .then((res) => {
        setRepoAnalysis(res);
        setRepoLoading(false);
      })
      .catch((err) => {
        console.error("Repo analysis error:", err);
        setRepoAnalysis(null);
        setRepoLoading(false);
        setIsModalOpen(false);
        alert("Failed to analyze repository. Try again or check API limits.");
      });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRepo(null);
    setRepoAnalysis(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-400 font-semibold animate-pulse">Retrieving profile metrics and generating AI mentor reports...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 bg-red-950 bg-opacity-35 border border-red-900 rounded-full">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Oops! Something went wrong</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">{error || "Failed to load data."}</p>
        </div>
        <button
          onClick={onNavigateHome}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
        >
          Return to Lookup
        </button>
      </div>
    );
  }

  const hasTestingWeakness = profileData.weaknesses.some((w: string) => w.toLowerCase().includes("test") || w.toLowerCase().includes("qa"));
  const hasReadmeWeakness = profileData.weaknesses.some((w: string) => w.toLowerCase().includes("readme") || w.toLowerCase().includes("doc"));

  const repoList = profileData.repositories || [];

  return (
    <div className="min-h-screen flex flex-col pb-12">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-850 bg-zinc-950 bg-opacity-80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
          <div className="bg-primary-950 border border-primary-900 p-1.5 rounded-lg">
            <Sparkles className="text-primary-400" size={16} />
          </div>
          <span className="text-md font-bold tracking-tight text-white glow-text">DevLens AI</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Logged in as: <strong className="text-zinc-200">{authUser?.github_username || username}</strong>
          </span>
          <button
            onClick={() => {
              logout();
              onNavigateHome();
            }}
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 mt-8 flex-1 flex flex-col space-y-8 min-w-0">
        
        {/* Profile Card Header */}
        <div className="glass-card p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <img 
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`} 
              alt={username}
              className="w-16 h-16 rounded-2xl border-2 border-zinc-800 bg-zinc-900"
            />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                <span>{username.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                <a 
                  href={`https://github.com/${username}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </h2>
              <p className="text-xs font-mono text-zinc-500">@{username}</p>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Full-stack developer building open source apps and preparing for tech internships.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1.5 text-xs text-zinc-500">
                <span className="flex items-center space-x-1">
                  <MapPin size={12} />
                  <span>San Francisco, CA</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users size={12} />
                  <span>23 followers</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Tabs Selector */}
          <div className="flex bg-zinc-950 p-1 border border-zinc-850 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'insights' 
                  ? 'bg-zinc-900 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              AI Insights
            </button>
            <button
              onClick={() => setActiveTab('opensource')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'opensource' 
                  ? 'bg-zinc-900 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Open Source Mentor
            </button>
          </div>
        </div>

        {/* INSIGHTS TAB CONTENT */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Metrics Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Readiness score */}
              <div className="glass-card p-6 md:col-span-1 flex flex-col items-center justify-between min-h-[300px]">
                <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider w-full text-left">Internship Readiness</h3>
                <InternshipReadinessGauge score={profileData.internship_readiness_score} />
                <p className="text-[10px] text-zinc-500 leading-normal text-center pt-2 border-t border-zinc-900">
                  Rating based on coding activity, portfolio diversity, and languages.
                </p>
              </div>

              {/* Portfolio Score Card */}
              <div className="glass-card p-6 md:col-span-1 flex flex-col justify-between min-h-[300px]">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Portfolio Score</h3>
                  <div className="space-y-1">
                    <span className="text-5xl font-extrabold text-white glow-text">{profileData.portfolio_quality_score}</span>
                    <span className="text-sm font-semibold text-zinc-500">/ 100</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {profileData.internship_readiness_explanation}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-zinc-500 pt-3 border-t border-zinc-900">
                  <Award size={12} className="text-primary-500" />
                  <span>Quality criteria matching industry standards.</span>
                </div>
              </div>

              {/* Skill Radar Chart Card */}
              <div className="glass-card p-6 md:col-span-1 flex flex-col justify-between min-h-[300px]">
                <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Skill Radar</h3>
                <SkillRadarChart 
                  portfolioScore={profileData.portfolio_quality_score}
                  readinessScore={profileData.internship_readiness_score}
                  hasTestingWeakness={hasTestingWeakness}
                  hasReadmeWeakness={hasReadmeWeakness}
                />
              </div>

              {/* Language Distribution Chart Card */}
              <div className="glass-card p-6 md:col-span-1 flex flex-col justify-between min-h-[300px]">
                <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Technology Stack</h3>
                <TechnologyUsageGraph repos={repoList} />
              </div>

            </div>

            {/* Strengths & Weaknesses Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider flex items-center space-x-2">
                  <CheckCircle2 className="text-emerald-500" size={16} />
                  <span>Key Strengths</span>
                </h3>
                <ul className="space-y-3">
                  {profileData.strengths.map((str: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start space-x-2">
                      <ChevronRight size={12} className="text-emerald-500 mt-1 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses / Improvements */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="text-amber-500" size={16} />
                  <span>Improvement Areas</span>
                </h3>
                <ul className="space-y-3">
                  {profileData.weaknesses.map((weak: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-300 leading-relaxed flex items-start space-x-2">
                      <ChevronRight size={12} className="text-amber-500 mt-1 flex-shrink-0" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coding habits, Missing Skills, and CV feedback */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coding Habits */}
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                  <Activity size={12} className="text-primary-400" />
                  <span>Coding Habits</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-zinc-400">
                  {profileData.coding_habits.map((habit: string, idx: number) => (
                    <li key={idx} className="leading-relaxed flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>{habit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills */}
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                  <Code size={12} className="text-primary-400" />
                  <span>Missing Skills</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-zinc-400">
                  {profileData.missing_skills.map((skill: string, idx: number) => (
                    <li key={idx} className="leading-relaxed flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resume Feedback */}
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                  <BookOpen size={12} className="text-primary-400" />
                  <span>Resume Insights</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  {profileData.resume_feedback}
                </p>
              </div>
            </div>

            {/* Learning Roadmap Monthly Timeline */}
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider flex items-center space-x-2">
                  <Compass className="text-primary-500" size={16} />
                  <span>Personalized Learning Roadmap</span>
                </h3>
                <p className="text-xs text-zinc-500">Custom sequential timeline generated from your profile analysis.</p>
              </div>

              <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-8">
                {profileData.learning_roadmap.map((step: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Circle timeline nodes */}
                    <div className="absolute -left-[31px] top-1 bg-zinc-950 border-2 border-primary-500 rounded-full w-4 h-4 group-hover:bg-primary-500 transition-colors"></div>
                    
                    <div className="space-y-2 text-left">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary-400 bg-primary-950 bg-opacity-50 border border-primary-900 border-opacity-40 px-2.5 py-0.5 rounded-full">
                        {step.phase}
                      </span>
                      <h4 className="text-sm font-bold text-white">{step.focus}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-500 block mb-1">Topics to Master</span>
                          <ul className="space-y-1 text-xs text-zinc-400 list-disc list-inside">
                            {step.topics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-500 block mb-1">Action Items</span>
                          <ul className="space-y-1 text-xs text-zinc-400 list-disc list-inside">
                            {step.action_items.map((ai: string, i: number) => <li key={i}>{ai}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Next Projects */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider">Suggested Portfolio Additions</h3>
                <p className="text-xs text-zinc-500">Suggested next projects tailored to fill your missing technical skills.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileData.suggested_projects.map((proj: any, idx: number) => (
                  <div key={idx} className="glass-card p-5 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 bg-opacity-40 border border-amber-900 px-2 py-0.5 rounded">
                          {proj.difficulty}
                        </span>
                        <div className="flex space-x-1">
                          {proj.tech_stack.map((t: string, i: number) => (
                            <span key={i} className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">{proj.description}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-900">
                      <span className="text-[10px] font-semibold text-zinc-500 block mb-1.5">Skills Gained:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.learning_outcomes.map((out: string, i: number) => (
                          <span key={i} className="text-[10px] text-zinc-300 bg-zinc-900 bg-opacity-50 border border-zinc-850 px-2 py-0.5 rounded-full">
                            ✓ {out}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Repositories health scorecards */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-wider">Repository Health Scorecards</h3>
                <p className="text-xs text-zinc-500">Inspect codebase health, find code smells, complexity, and refactor Opportunities.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {repoList.map((r: any, i: number) => (
                  <div key={i} className="glass-card p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1 text-left">
                      <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <Code size={14} className="text-primary-400" />
                        <span>{r.name}</span>
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-zinc-500 pt-1.5">
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-400 font-medium">
                          {r.language || 'Unknown'}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users size={12} />
                          <span>{r.stargazers_count !== undefined ? r.stargazers_count : (r.stars || 0)} stars</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAnalyzeRepo(r.name)}
                      className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white py-1.5 rounded-lg transition-colors"
                    >
                      <Sparkles size={12} className="text-primary-400" />
                      <span>Analyze Code Quality</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* OPEN SOURCE MENTOR TAB CONTENT */}
        {activeTab === 'opensource' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-left space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Compass className="text-primary-500" size={20} />
                <span>Open Source Contribution Assistant</span>
              </h3>
              <p className="text-xs text-zinc-500">AI-curated public repositories matched to your current language capabilities and experience level.</p>
            </div>

            {osLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-zinc-500">Searching GitHub for matching beginner-friendly issues...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {osRecs.map((repo, idx) => (
                  <div key={idx} className="glass-card p-6 flex flex-col md:flex-row gap-6 text-left">
                    {/* Left: Repo Details */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-white flex items-center space-x-2">
                            <span>{repo.owner} / {repo.name}</span>
                            <a 
                              href={repo.html_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </h4>
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                            ⭐ {repo.stars.toLocaleString()} stars
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">{repo.description}</p>
                      </div>

                      <div className="bg-zinc-900 bg-opacity-30 border border-zinc-850 p-4 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center space-x-1.5">
                          <Activity size={10} />
                          <span>Why it matches you</span>
                        </span>
                        <p className="text-xs text-zinc-300 leading-normal">{repo.match_reason}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Codebase Architecture</span>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">{repo.project_structure}</p>
                      </div>
                    </div>

                    {/* Divider for responsiveness */}
                    <div className="hidden md:block w-px bg-zinc-850 self-stretch"></div>

                    {/* Right: Best First Issue */}
                    <div className="w-full md:w-80 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center space-x-1">
                          <ListFilter size={10} />
                          <span>Recommended First Issue</span>
                        </span>
                        
                        <div className="space-y-1.5">
                          <h5 className="text-xs font-semibold text-white flex items-center justify-between">
                            <span>{repo.first_issue_title}</span>
                            {repo.first_issue_url && (
                              <a 
                                href={repo.first_issue_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-primary-400 hover:text-primary-300 ml-2"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </h5>
                          <p className="text-xs text-zinc-400 leading-relaxed font-light">
                            {repo.first_issue_explanation}
                          </p>
                        </div>
                      </div>

                      <a
                        href={repo.first_issue_url || repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white py-2 rounded-lg transition-colors"
                      >
                        Explore Issues on GitHub
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Static analysis modal */}
      <RepositoryAnalysisModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isLoading={repoLoading}
        analysis={repoAnalysis}
      />
    </div>
  );
};
