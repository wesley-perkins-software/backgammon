import SEO from '../components/SEO.jsx';

export default function AboutPage() {
  return (
    <article className="content-page">
      <SEO
        title="About Backgammon Local"
        description="Learn about Backgammon Local, a lightweight browser backgammon app focused on fast play, clear UX, and beginner-friendly learning resources."
        path="/about"
      />
      <h1>About Backgammon Local</h1>
      <p>Backgammon Local is a frontend-only project built for quick play against a computer opponent.</p>
      <p>The goal is to keep the experience simple: open the app, roll, move, and learn.</p>
      <p>Alongside the game board, we provide rules, strategy guidance, and FAQ content for new players.</p>
    </article>
  );
}
