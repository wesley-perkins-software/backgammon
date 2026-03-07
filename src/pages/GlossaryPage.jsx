import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

const terms = [
  {
    term: 'Anchor',
    definition:
      'An anchor is a point you hold in your opponent’s home board. It gives your back checkers a safe landing spot and can create chances to hit if your opponent leaves a blot.'
  },
  {
    term: 'Back Checkers',
    definition:
      'These are your farthest-behind checkers, usually still in the opponent’s outer board. Managing them early helps you avoid getting trapped behind a prime.'
  },
  {
    term: 'Backgammon',
    definition:
      'A backgammon is a triple game win (worth three points in match play), earned when your opponent has not borne off any checkers and still has at least one checker on the bar or in your home board.'
  },
  {
    term: 'Bar',
    definition:
      'The bar is the middle strip of the board where hit checkers are placed. A checker on the bar must re-enter before any other checker can move.'
  },
  {
    term: 'Bear Off',
    definition:
      'Bearing off means removing your checkers from the board after all 15 are in your home board. The first player to bear off all checkers wins the game.'
  },
  {
    term: 'Blot',
    definition:
      'A blot is a point occupied by only one checker. Blots are vulnerable because an opposing checker can land on that point and hit it.'
  },
  {
    term: 'Contact Position',
    definition:
      'A position where players can still hit each other because checkers overlap in movement paths. Contact positions reward timing, blocking, and safe play.'
  },
  {
    term: 'Crawford Rule',
    definition:
      'In match play, the Crawford rule removes doubling rights for one game when a player reaches one point from winning the match. It does not apply to single-game casual play.'
  },
  {
    term: 'Cube (Doubling Cube)',
    definition:
      'The doubling cube is used in match play to raise game stakes from 1 to 2, 4, 8, and beyond. If you only play single games against the computer, you may not use it.'
  },
  {
    term: 'Double',
    definition:
      'When both dice show the same number, you play that number four times. Doubles can create big tactical swings by letting you build points or escape danger quickly.'
  },
  {
    term: 'Enter',
    definition:
      'To enter means bringing a checker from the bar back onto the board. You enter into the opponent’s home board using the rolled die value as the destination point.'
  },
  {
    term: 'Gammon',
    definition:
      'A gammon is a double game win (worth two points in match play), earned when the loser has not borne off any checkers by the time the winner finishes.'
  },
  {
    term: 'Hit',
    definition:
      'To hit is to land on an opponent blot and send that checker to the bar. Hitting can slow your opponent and create extra turns of pressure.'
  },
  {
    term: 'Home Board',
    definition:
      'Your home board is the final six points where you try to collect all checkers before bearing off. Strong home boards make entering from the bar harder for opponents.'
  },
  {
    term: 'Inner Board',
    definition:
      'Another name for the home board. It is the six-point section where bearing off becomes possible once all your checkers are there.'
  },
  {
    term: 'Legal Move',
    definition:
      'A legal move follows all rules for occupancy, direction, and dice usage. If only one die can be used, you must play that one.'
  },
  {
    term: 'Outer Board',
    definition:
      'The outer board is the half of your side that is farther from bearing off. It is where racing and transition play often happen before final bear-off.'
  },
  {
    term: 'Pip',
    definition:
      'A pip is one point of movement for a checker. If a checker is five points from home, it is five pips away.'
  },
  {
    term: 'Pip Count',
    definition:
      'Pip count is the total number of pips all your checkers must move to bear off. Comparing pip counts helps decide whether to race or keep contact.'
  },
  {
    term: 'Point',
    definition:
      'A point is one triangular space on the board. You make a point by occupying it with two or more of your checkers.'
  },
  {
    term: 'Prime',
    definition:
      'A prime is a wall of consecutive made points, usually four to six long, that blocks opposing checkers from moving past.'
  },
  {
    term: 'Race',
    definition:
      'A race starts when players can no longer hit each other. The game becomes a pure contest of efficient movement and bear-off accuracy.'
  },
  {
    term: 'Slot',
    definition:
      'To slot is to place a single checker on an important point in hope of covering it next turn. Slotting can be powerful but carries blot risk.'
  },
  {
    term: 'Stack',
    definition:
      'A stack is a tall pile of checkers on one point. Small stacks are normal, but overstacking can reduce flexibility and force awkward future rolls.'
  },
  {
    term: 'Timing',
    definition:
      'Timing refers to how long you can maintain contact or a blocking structure before being forced to break it. Good timing lets your plan stay effective.'
  },
  {
    term: 'Turn Pass',
    definition:
      'A turn pass happens when you have no legal move with the dice rolled. You lose that turn and your opponent rolls next.'
  }
];

export default function GlossaryPage() {
  return (
    <article className="content-page">
      <SEO
        title="Backgammon Glossary: Terms Every Beginner Should Know"
        description="Learn essential backgammon terms including pip count, blot, anchor, prime, bar, and bear off in this beginner-friendly backgammon glossary."
        path="/glossary"
      />
      <h1>Backgammon Glossary</h1>
      <p>
        If you are learning backgammon terms for the first time, this glossary gives clear, practical definitions you can use while
        playing. Understanding the language of the game makes rules easier to follow and strategy easier to apply.
      </p>
      <p>
        For step-by-step movement and legality details, visit the <Link to="/rules">complete backgammon rules</Link>. If you want
        decision-making help, continue with our <Link to="/strategy">beginner backgammon strategy guide</Link> after reviewing
        key terms.
      </p>
      <section>
        <h2>Backgammon Terms A–Z</h2>
        {terms.map((item) => (
          <section key={item.term}>
            <h3>{item.term}</h3>
            <p>{item.definition}</p>
          </section>
        ))}
      </section>
    </article>
  );
}
