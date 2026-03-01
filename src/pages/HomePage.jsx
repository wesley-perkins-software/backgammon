import { Link } from 'react-router-dom';
import SEO, { SITE_URL } from '../components/SEO.jsx';

export default function HomePage() {
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Backgammon Local',
    url: `${SITE_URL}/`,
    description:
      'Play backgammon against the computer in your browser. Backgammon Local is beginner-friendly and saves progress in localStorage without requiring an account.',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  return (
    <article className="content-page">
      <SEO
        title="Backgammon Local - Play Free in Your Browser"
        description="Backgammon Local is a free, beginner-friendly backgammon game that runs in your browser and saves progress locally with no account required."
        path="/"
        jsonLd={webAppJsonLd}
      />
      <h1>Play Backgammon Locally, Anytime</h1>
      <p>
        Backgammon Local is a fast, browser-based way to play classic backgammon against a computer opponent.
        You can start a game immediately, learn as you go, and come back later without signing in.
      </p>
      <p>
        This app stores game progress in your browser&apos;s localStorage, so your board and turn state can be
        restored the next time you open the site on the same device and browser profile.
      </p>
      <p>
        Designed to be beginner friendly, Backgammon Local focuses on clear controls, visible dice, and simple
        navigation to the rules and strategy guides.
      </p>
      <p>
        <Link className="cta-button" to="/play">Play Backgammon Now</Link>
      </p>
    </article>
  );
}
