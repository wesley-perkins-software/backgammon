import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

export default function NotFoundPage() {
  return (
    <article className="content-page">
      <SEO
        title="Page Not Found | Play Backgammon"
        description="The page you requested could not be found. Visit the Play Backgammon homepage, rules, strategy, and FAQ pages from here."
        path="/404"
        robots="noindex,follow"
      />
      <h1>Page Not Found</h1>
      <p>
        We couldn&apos;t find that page. You can return to the <Link to="/">homepage</Link> or continue with one of the core guides below.
      </p>
      <ul>
        <li><Link to="/rules">Backgammon rules</Link></li>
        <li><Link to="/strategy">Beginner strategy</Link></li>
        <li><Link to="/faq">Backgammon FAQ</Link></li>
        <li><Link to="/glossary">Backgammon glossary</Link></li>
      </ul>
    </article>
  );
}
