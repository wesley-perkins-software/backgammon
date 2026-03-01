import { Link } from 'react-router-dom';
import GameExperience from '../App.jsx';
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
    <>
      <SEO
        title="Backgammon Local - Play Free in Your Browser"
        description="Backgammon Local is a free, beginner-friendly backgammon game that runs in your browser and saves progress locally with no account required."
        path="/"
        jsonLd={webAppJsonLd}
      />

      <section className="home-game-hero" aria-labelledby="home-play-heading">
        <div className="home-hero-topline">
          <h1 id="home-play-heading">Play Backgammon Local</h1>
          <Link className="cta-button cta-secondary" to="/play">Open full screen /play</Link>
        </div>
        <GameExperience showSeo={false} showHeader={false} className="home-embedded-game" />
      </section>

      <article className="content-page home-content-stack">
        <section>
          <h2>Play instantly with local save</h2>
          <p>
            Backgammon Local runs fully in your browser, so you can begin playing immediately against the computer.
            There is no account sign-up and no external game profile to manage.
          </p>
          <p>
            Your match is stored with localStorage on this browser, making it easy to close and come back later
            without losing progress.
          </p>
        </section>

        <section>
          <h2>Rules preview</h2>
          <p>
            New to backgammon? Learn the opening roll, checker movement, hitting blots, entering from the bar,
            doubles, bearing off, and how turns pass when there are no legal moves.
          </p>
          <p>
            The full guide explains each basic rule in practical terms so beginners can start playing with confidence.
          </p>
          <p><Link to="/rules">Read full rules</Link></p>
        </section>

        <section>
          <h2>Strategy preview</h2>
          <p>
            Beginner strategy focuses on balancing safety and speed: reduce blots, build useful points, and track race
            progress with pip counts.
          </p>
          <p>
            Small decisions each roll add up, especially during contact play and bear-off.
          </p>
          <p><Link to="/strategy">Read beginner strategy tips</Link></p>
        </section>

        <section>
          <h2>FAQ preview</h2>
          <p>
            Common questions include opening roll behavior, whether randomness is fair, what happens when no moves are
            legal, and whether your game is saved.
          </p>
          <p>
            We also cover how to clear saved data and what privacy expectations to have in a frontend-only app.
          </p>
          <p><Link to="/faq">Read the FAQ</Link></p>
        </section>
      </article>
    </>
  );
}
