const resolveApiUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    const isLocalBrowser =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname);

    if (!isLocalBrowser) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
    }
  }

  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    return `http://${window.location.hostname}:4000/api`;
  }

  return 'http://localhost:4000/api';
};

export const API_URL = resolveApiUrl();
export const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${SERVER_ORIGIN}${url}`;
  }
  return `${SERVER_ORIGIN}/${url}`;
}
