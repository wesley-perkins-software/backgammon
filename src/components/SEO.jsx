import { Helmet } from 'react-helmet-async';
import { SITE_NAME, toAbsoluteUrl } from '../config/site.js';

export { SITE_URL } from '../config/site.js';

export default function SEO({ title, description, path, jsonLd, robots = 'index,follow' }) {
  const canonical = toAbsoluteUrl(path);
  const socialImage = toAbsoluteUrl('/og-image.svg');

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:alt" content="Play Backgammon game board preview" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
    </Helmet>
  );
}
