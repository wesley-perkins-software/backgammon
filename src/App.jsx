import SEO from './components/SEO.jsx';
import BoardSurface from './components/board/BoardSurface.jsx';
import useGameController from './hooks/useGameController.js';
import * as defaultClock from './platform/clock.js';
import * as defaultMedia from './platform/media.js';
import * as defaultRandom from './platform/random.js';
import * as defaultStorage from './platform/storage.js';

export default function App({ showSeo = true, seoPath = '/', seoTitle = 'Play Backgammon Online Locally', seoDescription = 'Play Backgammon against the computer with automatic save and beginner-friendly controls.', showHeader = true, className = '', adapters = {} }) {
  const {
    clock = defaultClock,
    media = defaultMedia,
    random = defaultRandom,
    storage = defaultStorage
  } = adapters;
  const controller = useGameController({ clock, media, random, storage });

  return (
    <section className={`app ${className}`.trim()} aria-label="Backgammon game">
      {showSeo && <SEO title={seoTitle} description={seoDescription} path={seoPath} />}
      {showHeader && (
        <header className="header">
          <h1>Backgammon</h1>
          <p className="subtitle">Play as Player against the computer, automatically saved in your browser.</p>
        </header>
      )}

      <BoardSurface {...controller} />
    </section>
  );
}
