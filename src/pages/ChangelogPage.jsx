import SEO from '../components/SEO.jsx';

const entries = [
  { date: '2026-02-20', text: 'Added SEO landing pages, page metadata, structured data, sitemap, and robots configuration.' },
  { date: '2026-02-10', text: 'Improved in-app navigation and documentation links for rules and strategy.' },
  { date: '2026-01-29', text: 'Refined dice visuals and animation timing for turn transitions.' },
  { date: '2026-01-12', text: 'Enhanced undo flow and reset options for easier recovery from mistakes.' },
  { date: '2025-12-18', text: 'Initial release of Backgammon Local with single-player computer mode and local save support.' }
];

export default function ChangelogPage() {
  return (
    <article className="content-page">
      <SEO
        title="Backgammon Local Changelog"
        description="Track recent Backgammon Local updates, improvements, and release notes in reverse chronological order."
        path="/changelog"
      />
      <h1>Changelog</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.date}>
            <strong>{entry.date}:</strong> {entry.text}
          </li>
        ))}
      </ul>
    </article>
  );
}
