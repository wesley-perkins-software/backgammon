import SEO from '../components/SEO.jsx';

const tips = [
  'Prioritize safety early by reducing blots in range of your opponent.',
  'Bring checkers from the back steadily so you do not get trapped.',
  'Make points in your home board to build a prime and block entries.',
  'Avoid stacking too many checkers on one point unless tactical.',
  'Use doubles to improve board structure, not only to race.',
  'When ahead in the race, simplify and avoid unnecessary hits.',
  'When behind, create contact by hitting and blocking key points.',
  'Watch pip counts to decide whether to race or play for contact.',
  'Enter from the bar safely whenever possible before attacking.',
  'During bear-off, reduce wastage by matching dice to checker distance.'
];

export default function StrategyPage() {
  return (
    <article className="content-page">
      <SEO
        title="Backgammon Beginner Strategy Tips"
        description="Improve your play with beginner backgammon strategy tips covering safety, pip counts, timing, hitting, racing, and efficient bear-off decisions."
        path="/strategy"
      />
      <h1>Beginner Backgammon Strategy</h1>
      <p>These practical tips help new players make stronger decisions without memorizing advanced theory.</p>
      <ul>
        {tips.map((tip) => <li key={tip}>{tip}</li>)}
      </ul>
    </article>
  );
}
