import { api } from '../app/api';

export const toImageUrl = (src?: string | null): string => {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  // handle /uploads/... returned by backend
  if (src.startsWith('/')) {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    return `${base}${src}`;
  }
  return src;
};
