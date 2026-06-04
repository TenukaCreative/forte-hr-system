import { msalInstance, loginRequest } from './msalConfig';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const loginWithAzure = async () => {
  await msalInstance.initialize();
  const msalResponse = await msalInstance.loginPopup(loginRequest);
  msalInstance.setActiveAccount(msalResponse.account);

  const tokenResponse = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: msalResponse.account,
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

export const logoutFromAzure = async () => {
  await msalInstance.initialize();
  const account = msalInstance.getActiveAccount();
  if (account) {
    await msalInstance.logoutPopup({ account });
  }
};
