import SEO from '../components/SEO.jsx';

export default function PrivacyPage() {
  return (
    <article className="content-page">
      <SEO
        title="Privacy - Backgammon Local"
        description="Read how Backgammon Local handles privacy: game state stored in localStorage, no required account, and guidance for clearing saved data."
        path="/privacy"
      />
      <h1>Privacy &amp; Local Storage</h1>
      <p>Backgammon Local runs entirely in your browser and does not require an account.</p>
      <p>Game progress is stored in localStorage so your current match can persist between visits on the same device.</p>
      <p>No server-side game profile is needed for normal use, and no personal information is required to play.</p>
      <p>To remove saved game data, use the in-game Clear Saved Game action or clear this site&apos;s storage in your browser settings.</p>
    </article>
  );
}
