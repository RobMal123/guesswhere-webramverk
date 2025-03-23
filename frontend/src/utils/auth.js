// Authentication utility functions

// Store tokens in localStorage
export const storeTokens = (accessToken, refreshToken, csrfToken, userId, isAdmin) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('csrf_token', csrfToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('isAdmin', isAdmin);
};

// Remove tokens from localStorage
export const removeTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
};

// Get stored tokens
export const getTokens = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const csrfTokenData = localStorage.getItem('csrf_token');
    const userId = localStorage.getItem('userId');

    let csrfToken = null;
    if (csrfTokenData) {
        try {
            // Try to parse as JSON first
            const parsedData = JSON.parse(csrfTokenData);
            if (parsedData.token && parsedData.expiresAt) {
                // Check if token is expired
                if (Date.now() < parsedData.expiresAt) {
                    csrfToken = parsedData.token;
                } else {
                    // Remove expired token
                    localStorage.removeItem('csrf_token');
                }
            }
        } catch (error) {
            // If parsing fails, assume it's a plain string token
            csrfToken = csrfTokenData;
        }
    }

    return {
        accessToken,
        refreshToken,
        csrfToken,
        userId
    };
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const { accessToken, refreshToken } = getTokens();
    return !!(accessToken && refreshToken);
};

// Refresh access token
export const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }
    
    try {
        const response = await fetch('http://localhost:8000/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        removeTokens();
        window.location.href = '/';
        throw error;
    }
};

// Get new CSRF token
export const getNewCsrfToken = async () => {
    const { accessToken } = getTokens();
    
    if (!accessToken) {
        throw new Error('Not authenticated');
    }
    
    try {
        const response = await fetch('http://localhost:8000/csrf-token', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }
        
        const data = await response.json();
        // Store token with expiration time
        const tokenData = {
            token: data.csrf_token,
            expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
        };
        localStorage.setItem('csrf_token', JSON.stringify(tokenData));
        return data.csrf_token;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        throw error;
    }
};

// API request wrapper with automatic token refresh and CSRF handling
export const apiRequest = async (url, options = {}) => {
    options = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // Add access token if available
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;

    try {
        const response = await fetch(fullUrl, options);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || JSON.stringify(errorData);
            } catch (e) {
                errorMessage = `HTTP error! status: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        // Only try to parse JSON if we have JSON content
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Logout function
export const logout = () => {
    removeTokens();
    window.location.href = '/';
};

// Password validation
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
        return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
        return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
        return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
        return "Password must contain at least one special character";
    }
    return null;
};

// Username validation
export const validateUsername = (username) => {
    if (username.length < 3 || username.length > 20) {
        return "Username must be between 3 and 20 characters";
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
        return "Username must start with a letter and contain only letters, numbers, and underscores";
    }
    return null;
};

// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }
    return null;
};

// Add a function to check admin status
export const isAdmin = () => {
    return localStorage.getItem('isAdmin') === 'true';
}; 