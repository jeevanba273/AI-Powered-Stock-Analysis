const TOKEN_KEY = 'ns_auth_token';
const USER_KEY = 'ns_auth_user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getUser = (): string | null => localStorage.getItem(USER_KEY);

export const setAuth = (token: string, username: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
