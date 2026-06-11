const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return `${window.location.origin}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

