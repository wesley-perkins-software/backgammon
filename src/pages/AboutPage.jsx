import SEO from '../components/SEO.jsx';

export default function AboutPage() {
  return (
    <article className="content-page">
      <SEO
        title="About Play Backgammon"
        description="Learn what this free browser Backgammon site offers: quick single-player games, clear rules guidance, strategy basics, and a privacy-first design."
        path="/about"
      />
      <h1>About Play Backgammon</h1>
      <p>
        Play Backgammon is a free browser game designed for fast, low-friction play. You can start a single-player match in seconds, with no
        account, no download, and no setup.
      </p>

      <h2>What this site is built for</h2>
      <p>
        The focus is simple: make backgammon easy to start, easy to understand, and easy to revisit. Whether you are learning the rules
        or returning after years away, the experience is built around clear controls and practical guidance.
      </p>
      <ul>
        <li>Quick games against a computer opponent in your browser.</li>
        <li>Beginner-friendly explanations of legal moves, doubles, bar entry, and bearing off.</li>
        <li>Strategy pages that highlight timing, risk, and board structure instead of jargon.</li>
      </ul>

      <h2>Who this project helps</h2>
      <p>
        This site is primarily for casual players, beginners, and anyone who wants to practice core backgammon decisions without complex
        software or registration.
      </p>

      <h2>Our content approach</h2>
      <p>
        We aim to publish straightforward, accurate content that supports gameplay. Rules and FAQ pages answer common questions quickly,
        while strategy content explains the &ldquo;why&rdquo; behind better moves.
      </p>

      <h2>Product principles</h2>
      <ul>
        <li>Fast access: launch and play with minimal clicks.</li>
        <li>Clarity first: prioritize understandable language over advanced terminology.</li>
        <li>Privacy-aware defaults: keep the core game usable without personal accounts.</li>
      </ul>

      <p>
        If you are new, start with the Rules and FAQ pages. If you already play, use the Strategy section to sharpen decisions on racing,
        safety, and attacking opportunities.
      </p>
    </article>
  );
}
