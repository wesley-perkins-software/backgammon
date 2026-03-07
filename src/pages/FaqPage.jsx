import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

const faqItems = [
  {
    q: 'What if I have no legal moves?',
    a: 'If neither die can be played legally, your turn passes automatically. This can happen during normal movement or while trying to enter from the bar. Passing is not optional when legal moves do not exist.'
  },
  {
    q: 'How does the opening roll work?',
    a: 'Each side rolls one die to start the game. The higher number moves first and uses both values as the first turn. If both sides roll the same number, roll again until one side is higher.'
  },
  {
    q: 'How do doubles work in backgammon?',
    a: 'Doubles give you four moves of the same value instead of two moves. For example, 5-5 lets you play four separate 5-point moves. Each sub-move must still be legal based on point occupancy and direction.'
  },
  {
    q: 'What happens when a checker is hit?',
    a: 'A checker is hit when an opponent lands on a blot, which is a point occupied by one checker. The hit checker goes to the bar and must re-enter before any other checker can move. This can cause major tempo swings in contact games.'
  },
  {
    q: 'What is the bar in backgammon?',
    a: 'The bar is the middle area where hit checkers are placed. A checker on the bar has priority and must re-enter first. If entry points are blocked, you may lose the turn.'
  },
  {
    q: 'How do I bear off correctly?',
    a: 'You can bear off only after all 15 of your checkers are in your home board. Use rolled numbers to remove matching checkers, or remove from the highest available point when an exact match does not exist. If contact remains, avoid careless blots during bear-off.'
  },
  {
    q: 'Is this random?',
    a: "Yes. Dice values use cryptographically secure randomness when available through your browser crypto API. If that API is unavailable, the app falls back to Math.random()."
  },
  {
    q: 'Does this site save my game?',
    a: 'Yes, your current game state is saved locally in your browser storage. That means you can close the page and continue later on the same browser and device. It is designed for convenient stop-and-resume practice.'
  },
  {
    q: 'Do I need an account to play?',
    a: 'No account is required. You can load the homepage and begin playing immediately. The experience is designed for no-signup, browser-first play.'
  },
  {
    q: 'Can I clear saved data?',
    a: 'Yes. You can use the in-game Clear Saved Game control if available, or remove site data directly in browser settings. Clearing site data removes locally saved game progress for this browser.'
  },
  {
    q: 'Can I play on mobile?',
    a: 'Yes, you can play in modern mobile browsers as well as desktop browsers. For the smoothest experience, keep your browser updated and use landscape mode when you want more board space.'
  },
  {
    q: 'Is this multiplayer backgammon?',
    a: 'This experience is focused on single-player backgammon against the computer. If your goal is practice and skill building, this format is ideal because you can play at your own pace.'
  },
  {
    q: 'Where can I learn the full rules?',
    a: 'Visit our <a href="/rules">complete backgammon rules</a> page for step-by-step beginner explanations. It covers setup, movement, hitting, entering from the bar, and bearing off. You can also use the <a href="/glossary">backgammon glossary</a> for term definitions.'
  },
  {
    q: 'How can I improve my decisions faster?',
    a: 'Start with one focus per session, such as reducing blots or making more points. Then review turns where you were hit and identify safer alternatives. For structured advice, read our <a href="/strategy">beginner backgammon strategy</a> guide and <a href="/single-player-backgammon">single-player backgammon practice</a> page.'
  }
];

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a.replace(/<[^>]+>/g, '')
      }
    }))
  };

  return (
    <article className="content-page">
      <SEO
        title="Backgammon FAQ | Rules, Dice, Bar, and Bearing Off Answers"
        description="Get clear answers to common backgammon questions about legal moves, opening roll, doubles, blots, bar entry, local save, and single-player play."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <h1>Backgammon FAQ</h1>
      <p>
        These frequently asked questions cover core rules and practical play details for beginners. If you want a full structured lesson,
        start with our <Link to="/rules">complete backgammon rules guide</Link> and then continue to
        <Link to="/strategy"> beginner backgammon strategy tips</Link>.
      </p>
      {faqItems.map((item) => (
        <section key={item.q}>
          <h2>{item.q}</h2>
          <p dangerouslySetInnerHTML={{ __html: item.a }} />
        </section>
      ))}
    </article>
  );
}
