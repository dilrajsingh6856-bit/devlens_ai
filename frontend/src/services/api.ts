class ApiService {
  private getBaseUrl(): string {
    return localStorage.getItem("devlens_api_url") || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("devlens_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.getBaseUrl()}/${cleanEndpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Request failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // Auth Operations
  async getGitHubAuthUrl(): Promise<{ url: string }> {
    return this.request<{ url: string }>("auth/github");
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string; user: any }> {
    return this.request<{ access_token: string; user: any }>("auth/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async getMe(): Promise<any> {
    return this.request<any>("auth/me");
  }

  // AI Insights
  async analyzeProfile(username: string): Promise<any> {
    return this.request<any>("profile/analyze", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  async analyzeRepository(username: string, repoName: string): Promise<any> {
    return this.request<any>("repository/analyze", {
      method: "POST",
      body: JSON.stringify({ username, repo_name: repoName }),
    });
  }

  // Open Source Recommendations
  async getOpenSourceRecommendations(languages: string[], skillScore: number): Promise<any[]> {
    const langsParam = encodeURIComponent(languages.join(","));
    return this.request<any[]>(`opensource/recommend?languages=${langsParam}&skill_score=${skillScore}`);
  }
}

// Simple extension for string stripping
if (!String.prototype.lstrip) {
  String.prototype.lstrip = function (char: string = "/") {
    if (this.startsWith(char)) {
      return this.substring(char.length);
    }
    return this.toString();
  };
}

declare global {
  interface String {
    lstrip(char?: string): string;
  }
}

export const api = new ApiService();
