// Simple cookie-based authentication
export interface AuthData {
  user_id: string;
  email: string;
  role: string;
  expires_at: number;
}

export function setAuthCookie(authData: AuthData) {
  const expiresDate = new Date(authData.expires_at * 1000);
  document.cookie = `sfh_auth=${JSON.stringify(authData)}; expires=${expiresDate.toUTCString()}; path=/; secure; samesite=strict`;
  console.log('Auth cookie set:', { user_id: authData.user_id, email: authData.email, role: authData.role });
}

export function getAuthCookie(): AuthData | null {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('sfh_auth='));
  
  if (!authCookie) {
    return null;
  }
  
  try {
    const cookieValue = authCookie.split('=')[1];
    const authData = JSON.parse(decodeURIComponent(cookieValue));
    
    // Check if cookie is expired
    if (Date.now() > authData.expires_at * 1000) {
      clearAuthCookie();
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    clearAuthCookie();
    return null;
  }
}

export function clearAuthCookie() {
  document.cookie = 'sfh_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('Auth cookie cleared');
}

export function isAuthenticated(): boolean {
  return getAuthCookie() !== null;
}

export function requireAuth(): AuthData {
  const authData = getAuthCookie();
  if (!authData) {
    window.location.href = '/auth/login';
    throw new Error('Not authenticated');
  }
  return authData;
}