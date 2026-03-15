const PRIMARY_SITE_URL = 'https://playbackgammon.net';

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');

export const SITE_URL = configuredSiteUrl || PRIMARY_SITE_URL;
export const SITE_NAME = 'Play Backgammon';

export function toAbsoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
