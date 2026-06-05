import { msalInstance, loginRequest } from './msalConfig';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Call this on app startup to handle the redirect coming back from Microsoft.
export const handleRedirectResult = async () => {
  const result = await msalInstance.handleRedirectPromise();

  // No redirect response — normal page load.
  if (!result) return null;

  msalInstance.setActiveAccount(result.account);

  const tokenResponse = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: result.account,
  });

  const backendResponse = await fetch(`${API_BASE}/auth/microsoft/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: tokenResponse.accessToken }),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json();
    throw new Error(error.message || 'Authentication failed');
  }

  const { token, user } = await backendResponse.json();
  return { token, user };
};

// Initiates login — redirects the whole page to Microsoft.
export const loginWithAzure = async () => {
  await msalInstance.loginRedirect(loginRequest);
  // Page redirects away — nothing after this runs.
};

export const logoutFromAzure = async () => {
  const account = msalInstance.getActiveAccount();
  await msalInstance.logoutRedirect({
    account,
    postLogoutRedirectUri: window.location.origin,
  });
};
