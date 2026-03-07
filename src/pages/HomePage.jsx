import { Link } from 'react-router-dom';
import GameExperience from '../App.jsx';
import SEO, { SITE_URL } from '../components/SEO.jsx';

const faqItems = [
  {
    q: 'Do I need an account to play?',
    a: 'No. You can play immediately with no signup or download.'
  },
  {
    q: 'Can beginners use this site?',
    a: 'Yes. The game is designed for simple, clear play and includes guides for rules and strategy.'
  },
  {
    q: 'Does the game save my progress?',
    a: 'Your current game is stored locally in your browser so you can continue later on the same device.'
  },
  {
    q: 'Can I practice against the computer?',
    a: 'Yes. This is built for single-player backgammon practice against a computer opponent.'
  }
];

export default function HomePage() {
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Backgammon Local',
    url: `${SITE_URL}/`,
    description:
      'Play backgammon online for free against the computer. Backgammon Local runs in your browser, requires no sign-up, and saves progress locally.',
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
        title="Play Backgammon Online for Free | Backgammon Local"
        description="Play backgammon online for free in your browser. No sign-up required. Practice against the computer, learn the rules, and improve your strategy."
        path="/"
        jsonLd={webAppJsonLd}
      />

      <section className="home-game-hero" aria-labelledby="home-play-heading">
        <div className="home-hero-topline">
          <h1 id="home-play-heading">Play Backgammon Online</h1>
          <Link className="cta-button cta-secondary" to="/play">Open full screen /play</Link>
        </div>
        <GameExperience showSeo={false} showHeader={false} className="home-embedded-game" />
      </section>

      <article className="content-page home-content-stack">
        <section>
          <h2>Intro</h2>
          <p>
            Welcome to Backgammon Local, a fast way to play backgammon online without creating an account. The board loads directly in
            your browser, so you can start immediately and focus on the game instead of setup screens.
          </p>
          <p>
            This site is built for players who want free backgammon online with clear controls, beginner-friendly learning resources, and
            steady single-player practice against the computer.
          </p>
          <p>
            New here? Use the board above first, then continue with our <Link to="/rules">complete backgammon rules</Link>,
            <Link to="/strategy"> beginner backgammon strategy</Link>, and
            <Link to="/faq"> frequently asked questions</Link>.
          </p>
        </section>

        <section>
          <h2>Free Online Backgammon</h2>
          <p>
            If your goal is to play backgammon free, this site keeps things simple: open, roll, and play. There is no signup, no
            subscription gate, and no download required to start a game.
          </p>
          <p>
            Because the app runs browser-first, it is convenient for quick sessions during a break or longer practice blocks when you
            want to improve your decision making. You can return later and continue where you left off because game state is saved locally
            in the same browser.
          </p>
          <p>
            Looking specifically for no-install play? Visit <Link to="/free-backgammon-online">free backgammon online</Link> for a
            focused overview.
          </p>
        </section>

        <section>
          <h2>How to Play Backgammon</h2>
          <p>
            Backgammon begins with an opening roll: each side rolls one die, and the higher number takes the first turn using both values.
            Checkers then move according to the dice, and each die must be used legally whenever possible.
          </p>
          <p>
            You can land on open points, points you already occupy, or points with one opposing checker. A single opposing checker is a
            blot, and landing there hits it to the bar. Any checker on the bar must re-enter before other checkers can move.
          </p>
          <p>
            Once all 15 checkers reach your home board, you can bear off by removing checkers using rolled values. The first player to
            bear off all checkers wins. For a full walkthrough with examples and common mistakes, read our
            <Link to="/rules"> complete backgammon rules for beginners</Link>.
          </p>
        </section>

        <section>
          <h2>Play Backgammon Against the Computer</h2>
          <p>
            Practicing backgammon vs computer is an efficient way to improve because you can play at your own pace and see many game
            situations in a short time. It is especially useful when you are learning legal moves and want to reinforce core patterns.
          </p>
          <p>
            Single-player games help you build comfort with transitions: opening development, contact play, racing, and bear-off. You can
            pause and resume later on the same browser, which makes it easier to fit practice into daily routines.
          </p>
          <p>
            Want structured solo improvement tips? Read our
            <Link to="/single-player-backgammon"> single-player backgammon practice guide</Link>.
          </p>
        </section>

        <section>
          <h2>Backgammon Strategy Basics</h2>
          <p>
            Strong beginner strategy starts with safety. Reduce unnecessary blots, especially in range of opposing checkers, and avoid
            creating easy hitting targets unless the reward is clear.
          </p>
          <p>
            Build useful points to control space. Made points improve safety, block routes, and can connect into primes that trap opposing
            back checkers. At the same time, keep track of pip count so you know whether you are racing ahead or need to maintain contact.
          </p>
          <p>
            Choosing when to hit is a key skill. Hitting can gain tempo, but reckless hits can leave your own blots exposed. Better play
            comes from balancing aggression with board structure and timing. For deeper practical guidance, read
            <Link to="/strategy"> beginner backgammon strategy tips</Link>.
          </p>
        </section>

        <section>
          <h2>Why Play Backgammon Here?</h2>
          <h3>No account required</h3>
          <p>
            You can start a game right away with no registration flow. That keeps the experience friction-free for casual players and
            repeat practice.
          </p>
          <h3>Instant browser play</h3>
          <p>
            The game launches directly on the page, with no installation steps. It is quick to access whether you are playing one short
            game or a full session.
          </p>
          <h3>Local save for continuity</h3>
          <p>
            Your progress is saved locally in your browser, so you can return later without losing your current board state on that same
            device.
          </p>
          <h3>Simple, readable interface</h3>
          <p>
            Clean controls and clear board presentation help beginners focus on core decisions: movement, safety, timing, and race
            management.
          </p>
          <p>
            Keep learning with the <Link to="/glossary">backgammon glossary</Link> and
            <Link to="/free-backgammon-online"> free backgammon online guide</Link>.
          </p>
        </section>

        <section>
          <h2>Frequently Asked Questions</h2>
          {faqItems.map((item) => (
            <section key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </section>
          ))}
          <p>
            Need detailed answers about dice, passing turns, entering from the bar, and bearing off? Visit the full
            <Link to="/faq"> backgammon FAQ page</Link>.
          </p>
        </section>
      </article>
    </>
  );
}
