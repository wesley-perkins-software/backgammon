import SEO from '../components/SEO.jsx';

export default function RulesPage() {
  return (
    <article className="content-page">
      <SEO
        title="Backgammon Rules - How to Play"
        description="Learn the core backgammon rules: opening roll, moving checkers, hitting blots, entering from the bar, doubles, bearing off, and passing when blocked."
        path="/rules"
      />
      <h1>How to Play Backgammon</h1>
      <ol>
        <li><strong>Opening roll:</strong> each player rolls one die. Higher die starts and uses both numbers for the first turn. Ties roll again.</li>
        <li><strong>Move direction:</strong> players move checkers in opposite directions toward their home boards.</li>
        <li><strong>Using dice:</strong> you must use both dice numbers if legal; if only one can be played, you must play that one.</li>
        <li><strong>Points and stacks:</strong> you can land on empty points, your own points, or points with exactly one opponent checker.</li>
        <li><strong>Hitting blots:</strong> landing on a point with one opponent checker hits it and sends it to the bar.</li>
        <li><strong>The bar:</strong> checkers on the bar must re-enter before any other checker can move.</li>
        <li><strong>Doubles:</strong> when both dice match, you play that number four times.</li>
        <li><strong>Bearing off:</strong> once all 15 checkers are in your home board, you can remove checkers based on die values.</li>
        <li><strong>No legal moves:</strong> if none of your dice can be used legally, your turn is a pass.</li>
      </ol>
    </article>
  );
}
