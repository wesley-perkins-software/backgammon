import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

export default function RulesPage() {
  return (
    <article className="content-page">
      <SEO
        title="Backgammon Rules for Beginners | How to Play Backgammon"
        description="Learn backgammon rules for beginners with a clear step-by-step guide: setup, movement, doubles, hitting blots, bar entry, bearing off, and winning."
        path="/rules"
      />
      <h1>Backgammon Rules for Beginners</h1>
      <p>
        This guide explains how to play backgammon from the first roll to the final bear off. If you are new to the game, read this page
        once, then play a few rounds and come back. The rules become much easier when you connect each concept to a real board position.
      </p>
      <p>
        You can also pair this page with our <Link to="/glossary">backgammon glossary</Link> for term definitions and then continue to
        <Link to="/strategy"> beginner backgammon strategy</Link> after you understand legal movement.
      </p>

      <h2>What is backgammon?</h2>
      <p>
        Backgammon is a two-sided board game where each player moves 15 checkers according to dice rolls. The objective is to move all
        your checkers into your home board and then bear them off before your opponent does.
      </p>
      <p>
        Even though dice introduce chance, skill matters a lot. Strong players manage risk, avoid unnecessary blots, and make efficient
        racing and bear-off decisions over many turns.
      </p>

      <h2>Board layout and starting setup</h2>
      <p>
        A backgammon board has 24 narrow triangles called points. Points are grouped into four quadrants: your home board, your outer
        board, your opponent’s home board, and your opponent’s outer board. Each player moves in the opposite direction.
      </p>
      <p>
        At the beginning of a standard game, both sides place 15 checkers in a fixed arrangement. If you are using a digital board, this
        setup is handled for you automatically, but it still helps to recognize where your back checkers start and where your home board
        is located.
      </p>
      <p>
        A point occupied by two or more of your checkers is made and blocked for the opponent. A point with one checker is a blot and can
        be hit.
      </p>

      <h2>Opening roll</h2>
      <p>
        The game starts with an opening roll. Each player rolls one die. The player with the higher number moves first and uses both
        values for that first turn. If both dice show the same value, players roll again until one side is higher.
      </p>
      <p>
        This opening turn matters because it sets the tone for early development. Players often try to improve position while minimizing
        early exposure to hits.
      </p>

      <h2>How movement works</h2>
      <p>
        On each turn, you roll two dice and move checkers forward according to those numbers. For example, a roll of 3 and 5 means one
        checker can move 3 points and another can move 5 points, or a single checker can move 3 then 5 if each intermediate landing is
        legal.
      </p>
      <p>
        You must use both dice if legal moves exist for both. If only one die can be played, you must play that die. If neither die can
        be used legally, your turn passes.
      </p>
      <p>
        You may land on empty points, on points occupied by your own checkers, or on points with exactly one opposing checker. You may
        not land on a point occupied by two or more opposing checkers.
      </p>

      <h2>Doubles</h2>
      <p>
        When both dice show the same number, that roll is called doubles. Instead of two moves, you get four moves of that number. For
        example, rolling 4-4 gives you four separate 4-point moves.
      </p>
      <p>
        Doubles can change a position quickly. They are often used to make new points, escape danger, or accelerate a race. You still
        must obey legal occupancy rules for every sub-move.
      </p>

      <h2>Hitting blots</h2>
      <p>
        A blot is any point with exactly one checker. If you land on an opposing blot, you hit it and place that checker on the bar. This
        creates tempo because the opponent must enter from the bar before moving any other checker.
      </p>
      <p>
        Hitting is central to contact play, but it is not always correct. Some hits expose your own blots or break important blocking
        points. A legal hit can still be strategically weak if it damages your position.
      </p>

      <h2>Entering from the bar</h2>
      <p>
        If one of your checkers is on the bar, it has priority. You must re-enter bar checkers before moving any checker already on the
        board. To enter, use a die to land on the corresponding point in your opponent’s home board.
      </p>
      <p>
        Entry is only legal if the destination point is open (empty, occupied by your checkers, or occupied by one opposing checker). If
        the point is blocked by two or more opposing checkers, you cannot enter there with that die.
      </p>
      <p>
        If both entry points for your rolled dice are blocked, and you cannot enter with either number, your turn passes. If one entry is
        possible and the other is blocked, you must make the legal entry.
      </p>

      <h2>When a turn passes</h2>
      <p>
        A turn passes only when no legal move exists for the dice rolled. This can happen in normal movement or while trying to enter from
        the bar. Passing is not optional; it is a forced consequence of blocked points.
      </p>
      <p>
        Beginners sometimes think they can choose to skip a risky legal move. Under standard rules, if a legal move exists, you must make
        it.
      </p>

      <h2>Bearing off</h2>
      <p>
        You may start bearing off only when all 15 of your checkers are in your home board. Before that, every checker must keep moving
        toward home.
      </p>
      <p>
        To bear off, use a die that matches a checker’s distance from the edge. If no checker sits exactly on the required point, you must
        move a checker from a higher point when possible. If neither is available, make any legal move inside the home board.
      </p>
      <p>
        During bear-off, safety still matters in contact positions. If you leave a blot and get hit, that checker goes to the bar and must
        re-enter before you can continue bearing off.
      </p>

      <h2>Winning the game</h2>
      <p>
        The standard winner is the first player to bear off all 15 checkers. In match formats, special outcomes can score extra points:
        a gammon if the loser bears off none, and a backgammon if the loser bears off none and still has a checker on the bar or in the
        winner’s home board.
      </p>
      <p>
        If you are playing simple single games against the computer, the practical objective remains the same: bear off all checkers
        first.
      </p>

      <h2>Common beginner rule mistakes</h2>
      <h3>1) Forgetting dice priority</h3>
      <p>
        New players often use one die and ignore the second even when both are legal. Remember: if both dice can be played, both must be
        played.
      </p>

      <h3>2) Moving other checkers before entering from the bar</h3>
      <p>
        Any checker on the bar must enter first. You cannot make normal moves until bar checkers are legally re-entered.
      </p>

      <h3>3) Misunderstanding blocked points</h3>
      <p>
        You cannot land on a point with two or more opposing checkers. That point is closed to you until it becomes open.
      </p>

      <h3>4) Bearing off too early</h3>
      <p>
        Bearing off starts only when all checkers are in your home board. If even one checker is outside, you must keep moving inward.
      </p>

      <h3>5) Treating passing as optional</h3>
      <p>
        You only pass when no legal move exists. If a legal move is available, even if it feels awkward, you must make it.
      </p>

      <h3>6) Ignoring doubles structure</h3>
      <p>
        Doubles are four moves, not two. Each component move must be legal, and the sequence can matter.
      </p>

      <h3>7) Overlooking blot vulnerability</h3>
      <p>
        A single checker is always a potential target. Sometimes one blot is necessary, but multiple unnecessary blots make your position
        unstable and hard to recover.
      </p>


      <h2>Detailed turn order example</h2>
      <p>
        Suppose you roll 6 and 2. You can move one checker six points and another checker two points, or move one checker in two steps if
        each landing is legal. If the six-point destination is blocked but the two-point destination is open, you still must play the two.
      </p>
      <p>
        If both numbers are playable in some sequence, both must be used. Sequence matters in many turns because playing one die first can
        open or close the second move. Beginners should test both orders before finalizing a move.
      </p>

      <h2>Bar-entry examples beginners can visualize</h2>
      <p>
        Imagine you have one checker on the bar and roll 4 and 1. You try to enter on the opponent home-board points matching 4 and 1. If
        point 4 is blocked by two opposing checkers but point 1 is open, you must enter with the 1 first.
      </p>
      <p>
        After entering with one die, you may use the other die if legal from the new position. If both entry points are blocked and no
        legal entry exists, your turn ends immediately and passes to the opponent.
      </p>

      <h2>What beginners should watch during every turn</h2>
      <p>
        A simple checklist helps avoid rule mistakes: confirm direction of movement, check whether a bar checker must enter, verify which
        points are blocked, and ensure both dice are used when legally possible.
      </p>
      <p>
        During bear-off stages, add one more check: confirm all checkers are in the home board before removing any checker from play.
        These quick checks prevent most beginner errors.
      </p>

      <h2>Rule awareness that improves strategy</h2>
      <p>
        Learning rules is not separate from strategy. Understanding forced moves, blocked points, and bar priority helps you predict the
        opponent’s likely options. Better prediction leads to stronger decisions about safety and attack.
      </p>
      <p>
        For example, if you know your opponent has limited entry numbers from the bar, building home-board points becomes even more
        valuable. If you know both dice must be played when legal, you can set traps that force awkward splits.
      </p>

      <h2>Simple learning plan after you know the rules</h2>
      <p>
        Once legal movement feels comfortable, begin studying decision quality. Focus first on safety, point making, and basic race
        judgment. Then add more advanced ideas like timing and controlled aggression.
      </p>
      <p>
        Continue with our <Link to="/strategy">beginner backgammon strategy guide</Link> and keep the
        <Link to="/glossary"> backgammon glossary</Link> open for quick term lookup during practice.
      </p>
    </article>
  );
}
