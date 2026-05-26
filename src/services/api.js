const API_PORT = '5150';

const isLocalHost = (host) =>
  host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;
  const browserHost = window.location.hostname;

  if (configuredUrl && (isLocalHost(browserHost) || !configuredUrl.includes('localhost'))) {
    return configuredUrl;
  }

  return `${window.location.protocol}//${browserHost}:${API_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

