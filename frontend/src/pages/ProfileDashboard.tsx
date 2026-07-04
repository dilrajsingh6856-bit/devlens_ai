import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ExternalLink, Code, Sparkles, MapPin, Users, Award, 
  Activity, Compass, LogOut, ChevronRight, CheckCircle2, AlertTriangle, 
  ListFilter, BookOpen, Copy, Check, FileText, X
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
  const [githubUser, setGithubUser] = useState<any>(null);

  // Repository static analysis modal state
  const [_selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoAnalysis, setRepoAnalysis] = useState<any>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // README generator modal state
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);
  const [readmeCopied, setReadmeCopied] = useState(false);

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

    // Fetch live metadata from public GitHub API
    fetch(`https://api.github.com/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) {
          setGithubUser(data);
        }
      })
      .catch(err => console.error("Error fetching GitHub profile:", err));
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
              src={githubUser?.avatar_url || `https://github.com/${username}.png`} 
              alt={username}
              className="w-16 h-16 rounded-2xl border border-zinc-800 bg-zinc-900 object-cover"
            />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                <span>{githubUser?.name || username.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
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
                {githubUser?.bio || "Full-stack developer building open source apps and preparing for tech internships."}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1.5 text-xs text-zinc-500">
                <span className="flex items-center space-x-1">
                  <MapPin size={12} />
                  <span>{githubUser?.location || "Remote"}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users size={12} />
                  <span>{githubUser?.followers !== undefined ? `${githubUser.followers} followers` : "Active contributor"}</span>
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
              <div className="glass-card p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                    <BookOpen size={12} className="text-primary-400" />
                    <span>Resume Insights</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {profileData.resume_feedback}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsReadmeModalOpen(true)}
                  className="w-full mt-4 flex items-center justify-center space-x-2 bg-primary-950 hover:bg-primary-900 border border-primary-900 text-primary-400 hover:text-white rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Sparkles size={13} className="animate-pulse" />
                  <span>Export Profile README</span>
                </button>
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

      {/* GitHub Profile README Generator Modal */}
      {isReadmeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 bg-opacity-70 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-primary-950 border border-primary-900 p-1.5 rounded-lg text-primary-400">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">GitHub Profile README</h3>
                  <p className="text-[10px] text-zinc-500">Copy this template to your profile repo to showcase your coding skills!</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsReadmeModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-350 p-1.5 hover:bg-zinc-850 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-[11px] text-zinc-400 bg-zinc-950 select-text leading-relaxed whitespace-pre-wrap">
{`# Hi there, I'm ${githubUser?.name || username.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}! 👋

### 🚀 AI Agentic Systems & Full-Stack Backend Engineer
I specialize in building distributed backend systems, multi-agent frameworks (LangGraph/LangChain), real-time streaming integrations, and performance-optimized API architectures. My focus is on combining robust data structures with state-of-the-art LLMs to create autonomous, production-grade applications.

---

### 🛠️ Core Technology Stack

<p align="left">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  
  <br/>
  
  <img src="https://img.shields.io/badge/LangGraph-FF6F00?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vector_DB-Chroma-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/LiveKit-0052FF?style=for-the-badge&logoColor=white" />
  
  <br/>
  
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

### 🤖 Core Technical Highlights

#### 1. AI Orchestration & Multimodal Pipelines
*   **LangGraph Orchestration**: Built multi-step agent workflows featuring conditional decision nodes, error-correction states, and persistent memory checkpoints.
*   **Multimodal & Vision processing**: Processed real-time visual frames and screenshots using ONNX Runtime and Gemini Vision APIs to execute safe UI interactions.
*   **Semantic Search & RAG**: Engineered context-aware knowledge retrievals using vector databases (ChromaDB) and advanced text splitters.

#### 2. Distributed Backends & DSA Optimizations
*   **Task Scheduling**: Designed a Redis-backed priority queue executing jobs using graph topological sort algorithms.
*   **Performance caching**: Reduced redundant API calls and model latency by integrating intelligent cache eviction policies (cachetools).
*   **Concurrency**: Experienced in building non-blocking backend runtimes using asyncio and pytest-asyncio.

#### 3. Real-Time Systems Architecture
*   **LiveKit Bridge**: Designed WebSocket video streaming pipelines executing real-time frame transfers.
*   **FastAPI API Gateways**: Created secure endpoints featuring rate-limiting middleware (slowapi) and robust JWT session tokens.

---

### 📈 GitHub Stats Overview

<p align="center">
  <img height="180" src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark&bg_color=09090b&border_color=27272a&title_color=a855f7&icon_color=c084fc&text_color=a1a1aa" alt="GitHub Stats" />
  <img height="180" src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark&bg_color=09090b&border_color=27272a&title_color=a855f7&text_color=a1a1aa" alt="Top Languages" />
</p>

---

### 📫 How to Connect with Me
*   **GitHub Link**: [https://github.com/${username}](https://github.com/${username})
`}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 bg-opacity-40 flex items-center justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsReadmeModalOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={() => {
                  const content = `# Hi there, I'm ${githubUser?.name || username.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}! 👋\n\n### 🚀 AI Agentic Systems & Full-Stack Backend Engineer\nI specialize in building distributed backend systems, multi-agent frameworks (LangGraph/LangChain), real-time streaming integrations, and performance-optimized API architectures. My focus is on combining robust data structures with state-of-the-art LLMs to create autonomous, production-grade applications.\n\n---\n\n### 🛠️ Core Technology Stack\n\n<p align="left">\n  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />\n  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />\n  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />\n  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />\n  \n  <br/>\n  \n  <img src="https://img.shields.io/badge/LangGraph-FF6F00?style=for-the-badge&logoColor=white" />\n  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />\n  <img src="https://img.shields.io/badge/Vector_DB-Chroma-red?style=for-the-badge" />\n  <img src="https://img.shields.io/badge/LiveKit-0052FF?style=for-the-badge&logoColor=white" />\n  \n  <br/>\n  \n  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />\n  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />\n  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />\n  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />\n</p>\n\n---\n\n### 🤖 Core Technical Highlights\n\n#### 1. AI Orchestration & Multimodal Pipelines\n*   **LangGraph Orchestration**: Built multi-step agent workflows featuring conditional decision nodes, error-correction states, and persistent memory checkpoints.\n*   **Multimodal & Vision processing**: Processed real-time visual frames and screenshots using ONNX Runtime and Gemini Vision APIs to execute safe UI interactions.\n*   **Semantic Search & RAG**: Engineered context-aware knowledge retrievals using vector databases (ChromaDB) and advanced text splitters.\n\n#### 2. Distributed Backends & DSA Optimizations\n*   **Task Scheduling**: Designed a Redis-backed priority queue executing jobs using graph topological sort algorithms.\n*   **Performance caching**: Reduced redundant API calls and model latency by integrating intelligent cache eviction policies (cachetools).\n*   **Concurrency**: Experienced in building non-blocking backend runtimes using asyncio and pytest-asyncio.\n\n#### 3. Real-Time Systems Architecture\n*   **LiveKit Bridge**: Designed WebSocket video streaming pipelines executing real-time frame transfers.\n*   **FastAPI API Gateways**: Created secure endpoints featuring rate-limiting middleware (slowapi) and robust JWT session tokens.\n\n---\n\n### 📈 GitHub Stats Overview\n\n<p align="center">\n  <img height="180" src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark&bg_color=09090b&border_color=27272a&title_color=a855f7&icon_color=c084fc&text_color=a1a1aa" alt=\"GitHub Stats\" />\n  <img height="180" src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark&bg_color=09090b&border_color=27272a&title_color=a855f7&text_color=a1a1aa" alt=\"Top Languages\" />\n</p>\n\n---\n\n### 📫 How to Connect with Me\n*   **GitHub Link**: [https://github.com/${username}](https://github.com/${username})\n`;
                  navigator.clipboard.writeText(content);
                  setReadmeCopied(true);
                  setTimeout(() => setReadmeCopied(false), 2000);
                }}
                className="flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors animate-fade-in"
              >
                {readmeCopied ? (
                  <>
                    <Check size={12} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
