import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Compass, ShieldAlert, Cpu } from 'lucide-react';

const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface LoginProps {
  onNavigateToDashboard: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToDashboard }) => {
  const { login } = useAuth();
  const [searchUsername, setSearchUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem("devlens_api_url") || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  });

  const handleApiUrlChange = (val: string) => {
    setApiUrl(val);
    localStorage.setItem("devlens_api_url", val);
  };

  const handleResetApiUrl = () => {
    const defaultUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    setApiUrl(defaultUrl);
    localStorage.removeItem("devlens_api_url");
  };

  useEffect(() => {
    // Handle OAuth Callback redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setAuthLoading(true);
      setError(null);
      api.exchangeCodeForToken(code)
        .then((res) => {
          login(res.access_token, res.user);
          // Redirect to their own dashboard
          onNavigateToDashboard(res.user.github_username);
        })
        .catch((err) => {
          console.error("Auth callback failed:", err);
          setError("Failed to authenticate with GitHub. Running in offline/sandbox mode.");
          setAuthLoading(false);
        });
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login, onNavigateToDashboard]);

  const handleConnectGitHub = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await api.getGitHubAuthUrl();
      window.location.href = res.url;
    } catch (err) {
      console.error("Failed to get OAuth URL:", err);
      // Fallback: direct callback with mock code for easy developer sandbox testing
      api.exchangeCodeForToken("mock_oauth_code_demo")
        .then((res) => {
          login(res.access_token, res.user);
          onNavigateToDashboard(res.user.github_username);
        })
        .catch(() => {
          setError("OAuth server unreachable. Running offline.");
          setAuthLoading(false);
        });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let username = searchUsername.trim();
    if (!username) return;
    
    // Clean username: extract from URL if provided (e.g. https://github.com/torvalds)
    if (username.includes("/")) {
      const cleaned = username.replace(/\/$/, ""); // remove trailing slash
      if (cleaned.includes("github.com/")) {
        const parts = cleaned.split("github.com/");
        if (parts.length > 1) {
          username = parts[1].split("/")[0];
        }
      } else {
        username = cleaned.split("/").pop() || username;
      }
    }
    
    onNavigateToDashboard(username.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 z-10 animate-fade-in">
        {/* Header Badge */}
        <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-primary-300 font-semibold tracking-wide">
          <Cpu size={12} className="text-primary-500 animate-pulse-slow" />
          <span>DevLens AI v1.0 • Intelligent GitHub Mentor</span>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Empower Your Code Portfolio <br className="hidden sm:inline" />
            With <span className="text-primary-400 glow-text">AI-Powered Insights</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-lg text-zinc-400 font-light leading-relaxed">
            Analyze your repositories, detect structural code smells, generate technical readmes, and evaluate your readiness for software engineering internships.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-950 bg-opacity-30 border border-red-900 border-opacity-50 px-4 py-2.5 rounded-lg text-xs text-red-400 max-w-md animate-slide-up">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard query and login cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-4">
          {/* Quick Sandbox Lookup */}
          <div className="glass-card p-6 flex flex-col justify-between space-y-6 text-left animate-slide-up">
            <div className="space-y-2">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
                <Search size={20} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Public Lookup</h3>
              <p className="text-xs text-zinc-400 leading-normal">
                Analyze any developer profile or sandbox repositories instantly without connecting your GitHub account.
              </p>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter GitHub username (e.g. torvalds)"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors shadow-lg"
              >
                <span>Analyze Profile</span>
              </button>
            </form>
          </div>

          {/* GitHub Connection */}
          <div className="glass-card p-6 flex flex-col justify-between space-y-6 text-left animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-2">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
                <GithubIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Full AI Mentoring</h3>
              <p className="text-xs text-zinc-400 leading-normal">
                Connect your account to save evaluations, explore code smells in your repositories, and track your personalized roadmap.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConnectGitHub}
                disabled={authLoading}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <GithubIcon className="w-4 h-4" />
                    <span>Connect with GitHub</span>
                  </>
                )}
              </button>
              <div className="text-center text-[10px] text-zinc-500">
                Safe OAuth connection. Read-only permissions requested.
              </div>
              <div className="pt-4 border-t border-zinc-900 mt-2 space-y-1.5 text-left">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                  API Endpoint Target
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => handleApiUrlChange(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                    placeholder="http://localhost:8000/api/v1"
                  />
                  <button 
                    type="button"
                    onClick={handleResetApiUrl}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[10px] text-zinc-400 px-2.5 py-1 rounded transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl pt-8 border-t border-zinc-900 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-primary-400 font-semibold text-sm flex items-center space-x-1">
              <Cpu size={14} />
              <span>Static Code Refactoring</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
              Detect complex modules and redundant blocks. View suggested before-and-after snippets side by side.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-primary-400 font-semibold text-sm flex items-center space-x-1">
              <Compass size={14} />
              <span>Learning Roadmap</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
              Get modular monthly timelines specifying focus technologies, action items, and starter projects.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-primary-400 font-semibold text-sm flex items-center space-x-1">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Open Source Matcher</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
              Discovers repositories matching your skill set and links to beginner-friendly first issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
