import { Helmet } from 'react-helmet-async';

const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
export const SITE_URL = configuredSiteUrl || fallbackOrigin;

function resolveCanonical(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export default function SEO({ title, description, path, jsonLd }) {
  const canonical = resolveCanonical(path);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
    </Helmet>
  );
}
