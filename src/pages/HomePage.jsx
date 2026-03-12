import { Link } from 'react-router-dom';
import GameExperience from '../App.jsx';
import SEO, { SITE_URL } from '../components/SEO.jsx';

const faqPreviewItems = [
  {
    q: 'Do I need an account to play?',
    a: 'No. You can start a game right away in your browser without creating an account.'
  },
  {
    q: 'Does the game save my progress?',
    a: 'Yes. Your current match is saved locally in your browser so you can resume on the same device.'
  },
  {
    q: 'Can I play on mobile?',
    a: 'Yes. The homepage is designed to be usable on phones and tablets for quick practice sessions.'
  }
];

export default function HomePage() {
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Backgammon',
    url: `${SITE_URL}/`,
    description:
      'Play backgammon online for free against the computer in your browser. No sign-up, no download, and local save support for quick practice.',
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
        title="Play Backgammon Online Free in Your Browser"
        description="Play free backgammon online instantly in your browser. Practice against the computer, learn the rules, improve strategy, and explore beginner-friendly guides."
        path="/"
        jsonLd={webAppJsonLd}
      />

      <section className="home-game-hero" aria-labelledby="home-play-heading">
        <div className="home-hero-topline">
          <h1 id="home-play-heading">Play Backgammon Online</h1>
        </div>
        <GameExperience showSeo={false} showHeader={false} className="home-embedded-game" />
      </section>

      <article className="content-page home-content-stack">
        <section>
          <h2>Play Backgammon Instantly</h2>
          <p>
            Start playing immediately in your browser with no account setup and no installation steps. The game board above is ready for
            quick matches whether you want a short break or a longer focused session.
          </p>
          <p>
            This is free backgammon online designed for clear, game-first play. You can practice against the computer, learn how legal
            moves work, and build confidence with the flow of turns, hits, and races.
          </p>
          <p>
            Your progress is saved locally in the browser on your current device, so you can leave and come back to continue where you
            stopped. If you want an expanded overview of no-login browser play, visit the{' '}
            <Link to="/free-backgammon-online">free backgammon online page</Link>.
          </p>
          <p>
            If you are brand new, you can treat this homepage as a simple starting point: play first, then use the short guides below to
            learn rules, strategy, and common terms at your own pace.
          </p>
        </section>

        <section>
          <h2>How to Play Backgammon</h2>
          <p>
            Backgammon is played by two players moving 15 checkers each around the board. Movement is determined by dice rolls, and the
            opening roll decides who starts and with which combined numbers.
          </p>
          <p>
            During play, landing on a single opposing checker hits that blot and sends it to the bar. Checkers on the bar must re-enter
            before other moves can be made, which makes board control and entry points important.
          </p>
          <p>
            After all of your checkers reach the home board, you bear off to remove them from play. The first player to bear off all 15
            checkers wins. For full rules, edge cases, and examples, <Link to="/rules">read the full backgammon rules</Link>.
          </p>
          <p>
            The complete guide also explains doubles, forced moves, and practical examples that help beginners avoid common early
            mistakes.
          </p>
        </section>

        <section>
          <h2>Backgammon Strategy Basics</h2>
          <p>
            Good early strategy starts with avoiding exposed blots unless there is a clear tactical reason. Safer positions reduce the
            chances of getting hit and losing tempo.
          </p>
          <p>
            Build useful points when you can. Made points protect your own checkers, block opposing movement, and can connect into primes
            that limit re-entry and escape routes.
          </p>
          <p>
            Keep an eye on pip count to judge whether you should race or stay in contact. Choosing when to hit is often about timing:
            aggressive plays can gain momentum, but overextending can create weak returns. To go deeper,{' '}
            <Link to="/strategy">read beginner backgammon strategy tips</Link>.
          </p>
          <p>
            As you improve, strategy becomes less about memorizing one pattern and more about comparing risk, timing, and board shape on
            every roll.
          </p>
        </section>

        <section>
          <h2>Practice Backgammon Against the Computer</h2>
          <p>
            Single-player backgammon is useful because you can repeat positions quickly and focus on decisions without waiting for an
            opponent. It is a practical way to build consistency when learning.
          </p>
          <p>
            Regular practice helps you spot legal move patterns faster, handle races more confidently, and improve bear-off choices under
            different dice outcomes. Quick restarts in the browser make it easy to train in short bursts.
          </p>
          <p>
            For a focused solo-training path, visit the <Link to="/single-player-backgammon">single-player backgammon practice page</Link>.
          </p>
          <p>
            You can use repeated solo sessions to build stronger instincts before playing more competitive matches elsewhere.
          </p>
        </section>

        <section>
          <h2>Backgammon Terms and Concepts</h2>
          <p>
            Learning a few core terms makes guides and strategy advice easier to follow. A <strong>blot</strong> is a single checker that
            can be hit. The <strong>bar</strong> is where hit checkers wait before they re-enter.
          </p>
          <p>
            <strong>Pip count</strong> is the total distance your checkers need to move before bearing off. A <strong>prime</strong> is a
            row of made points that blocks movement. To <strong>bear off</strong> means removing checkers once all are in your home board.
          </p>
          <p>
            If you want fuller definitions and examples, explore the <Link to="/glossary">complete backgammon glossary</Link>.
          </p>
          <p>
            Understanding this vocabulary will also make rule explanations and strategy tips much easier to follow during real games.
          </p>
        </section>

        <section>
          <h2>Frequently Asked Questions</h2>
          {faqPreviewItems.map((item) => (
            <section key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </section>
          ))}
          <p>
            For complete answers about turns, legal moves, saving, and gameplay details, visit the{' '}
            <Link to="/faq">full backgammon FAQ</Link>.
          </p>
        </section>

        <section>
          <h2>Learn More About Backgammon</h2>
          <p>
            Use these internal guides as a quick navigation hub when you want to jump from live play to deeper learning content.
          </p>
          <ul>
            <li>
              <Link to="/rules">Backgammon rules and gameplay guide</Link>
            </li>
            <li>
              <Link to="/strategy">Backgammon strategy for beginners</Link>
            </li>
            <li>
              <Link to="/glossary">Backgammon glossary of terms and concepts</Link>
            </li>
            <li>
              <Link to="/single-player-backgammon">Practice backgammon against the computer</Link>
            </li>
            <li>
              <Link to="/faq">Frequently asked questions about backgammon play</Link>
            </li>
            <li>
              <Link to="/about">About this backgammon project</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy and local data details</Link>
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}
