import SEO from '../components/SEO.jsx';

export default function PrivacyPage() {
  return (
    <article className="content-page">
      <SEO
        title="Privacy - Backgammon"
        description="Read how Backgammon handles privacy: no required account, game progress saved on your device, and guidance for clearing saved data."
        path="/privacy"
      />
      <h1>Privacy</h1>
      <p>Backgammon runs entirely in your browser and does not require an account.</p>
      <p>Game progress is saved on your current browser and device so your current match can continue between visits.</p>
      <p>No server-side game profile is needed for normal use, and no personal information is required to play.</p>
      <p>To remove saved game data, clear this site&apos;s storage in your browser settings.</p>
    </article>
  );
}
