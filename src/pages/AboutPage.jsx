import SEO from '../components/SEO.jsx';

export default function AboutPage() {
  return (
    <article className="content-page">
      <SEO
        title="About Backgammon"
        description="Learn about Backgammon, a lightweight browser game focused on fast play, clear controls, and beginner-friendly learning resources."
        path="/about"
      />
      <h1>About Backgammon</h1>
      <p>Backgammon is built for quick play against a computer opponent, right in your browser.</p>
      <p>The goal is to keep the experience simple: open the app, roll, move, and learn.</p>
      <p>Alongside the game board, we provide rules, strategy guidance, and FAQ content for new players.</p>
    </article>
  );
}
