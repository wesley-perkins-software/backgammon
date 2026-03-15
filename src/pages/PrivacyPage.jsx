import SEO from '../components/SEO.jsx';

export default function PrivacyPage() {
  return (
    <article className="content-page">
      <SEO
        title="Privacy - Backgammon"
        description="Read the Backgammon privacy policy: no required account, browser-based game storage, limited data collection, and steps to clear local data."
        path="/privacy"
      />
      <h1>Privacy</h1>
      <p>
        We designed Backgammon so you can play without creating an account or sharing personal profile details. This page explains what
        data is used, why it is used, and what choices you have.
      </p>

      <h2>Information we collect</h2>
      <p>Backgammon is primarily a browser-based game and does not require direct personal information to start playing.</p>
      <ul>
        <li>No required sign-up information for core gameplay.</li>
        <li>No required name, email address, or payment details to play a local match.</li>
        <li>Basic technical data may be processed by hosting infrastructure for security and delivery.</li>
      </ul>

      <h2>How game data is stored</h2>
      <p>
        Game progress may be saved in your browser storage on your current device so your match can continue between visits. This local
        storage is controlled by your browser environment.
      </p>

      <h2>How to clear your data</h2>
      <p>
        You can remove locally saved game data at any time by clearing this site&apos;s storage from your browser settings. If you use
        multiple browsers or devices, each one stores data separately.
      </p>

      <h2>Third-party services</h2>
      <p>
        Infrastructure providers (such as hosting, content delivery, and analytics tools, if enabled) may process technical request data
        like IP address, browser type, and timestamps to operate and secure the service.
      </p>
      <h2>Policy updates</h2>
      <p>
        We may update this Privacy page as features evolve. Material changes should be reflected on this page with updated wording so
        visitors can review current practices.
      </p>
    </article>
  );
}
