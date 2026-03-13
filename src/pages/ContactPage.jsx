import SEO from '../components/SEO.jsx';

export default function ContactPage() {
  return (
    <article className="content-page">
      <SEO
        title="Contact | Backgammon Local"
        description="Contact the site owner with questions, bug reports, or feedback about this browser-based backgammon game."
        path="/contact"
      />
      <h1>Contact</h1>
      <p>
        Thanks for playing Backgammon Local. If you have feedback, spot a bug, or want to ask a question about how the game works, we&apos;d
        love to hear from you. This project is browser-based and built to stay simple, so direct feedback helps improve both gameplay and
        usability over time.
      </p>
      <p>
        Whether you are a brand-new player using the rules pages or a regular player practicing against the computer, your input is useful.
        Small reports often uncover issues quickly, and practical suggestions help prioritize quality-of-life improvements.
      </p>
      <p>
        The easiest way to reach out is by email: <a href="mailto:contact@example.com">contact@example.com</a>
      </p>
      {/* TODO: Replace placeholder contact@example.com with the production support email before launch. */}

      <h2>Common reasons to contact us</h2>
      <p>You can contact us for things like:</p>
      <ul>
        <li>Bug reports or unexpected game behavior.</li>
        <li>Gameplay feedback, including difficulty and AI behavior.</li>
        <li>Questions about rules, legal moves, or page content.</li>
        <li>Business or partnership inquiries.</li>
      </ul>

      <h2>How to report a bug effectively</h2>
      <p>
        If you&apos;re reporting a bug, adding a little technical detail makes it much easier to diagnose. Please include your device type,
        operating system, browser name and version, and what you were doing just before the issue happened.
      </p>
      <p>
        It also helps to include the exact dice roll or board situation when possible, plus any error messages you saw. If the issue is
        visual, a screenshot is useful. If the bug can be reproduced consistently, list clear steps in order so we can verify it quickly.
      </p>

      <h2>Response expectations</h2>
      <p>
        We may not be able to reply immediately to every message, but all feedback is reviewed and used to guide improvements. Clear,
        respectful reports are appreciated and usually lead to faster fixes.
      </p>
      <p>
        If your message is about a production-critical issue, include that in the subject line and provide as much context as possible in the
        first email.
      </p>
    </article>
  );
}
