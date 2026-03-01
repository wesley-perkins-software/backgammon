import SEO from '../components/SEO.jsx';

const faqItems = [
  {
    q: 'What if I have no legal moves?',
    a: 'If neither die can be played according to the rules, your turn passes automatically to the opponent.'
  },
  {
    q: 'How does the opening roll work?',
    a: 'Each side rolls one die. The higher number starts and uses both dice values for that first turn. If tied, roll again.'
  },
  {
    q: 'Is this random?',
    a: "Yes. Dice values use cryptographically secure randomness when available (via your browser's crypto API), with a Math.random() fallback if crypto is unavailable."
  },
  {
    q: 'Does it save my game?',
    a: 'Yes. Backgammon Local stores state in localStorage on your device so you can resume in the same browser.'
  },
  {
    q: 'Do I need an account to play?',
    a: 'No account is required. You can open the site and begin a game immediately.'
  },
  {
    q: 'Can I clear saved data?',
    a: 'Yes. Use the Clear Saved Game button in the game controls or manually clear site data in your browser settings.'
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
        text: item.a
      }
    }))
  };

  return (
    <article className="content-page">
      <SEO
        title="Backgammon Local FAQ"
        description="Frequently asked questions about Backgammon Local, including opening roll rules, legal move passes, randomness, and local save behavior."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <h1>Frequently Asked Questions</h1>
      {faqItems.map((item) => (
        <section key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </section>
      ))}
    </article>
  );
}
