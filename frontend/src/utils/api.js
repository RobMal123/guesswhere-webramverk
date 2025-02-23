const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Something went wrong');
    }

    return response.json();
  },

  // API methods
  async getRandomLocation() {
    return this.fetch('/locations/random');
  },

  async submitGuess(guessData) {
    return this.fetch('/submit-guess', {
      method: 'POST',
      body: JSON.stringify(guessData),
    });
  },

  async getLeaderboard() {
    return this.fetch('/leaderboard/');
  },
}; 