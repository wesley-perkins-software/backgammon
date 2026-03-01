import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

function normalize(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function BrowserRouter({ children }) {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to) => {
    const next = normalize(to);
    if (next === pathname) return;
    window.history.pushState({}, '', next);
    setPathname(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const value = useMemo(() => ({ pathname, navigate }), [pathname]);
  return React.createElement(RouterContext.Provider, { value }, children);
}

export function Routes({ children }) {
  const ctx = useContext(RouterContext);
  const elements = React.Children.toArray(children);
  const matched = elements.find((child) => child?.props?.path === ctx.pathname) ||
    elements.find((child) => child?.props?.path === '*');
  return matched ? matched.props.element : null;
}

export function Route() {
  return null;
}

export function Link({ to, onClick, children, ...props }) {
  const { navigate } = useContext(RouterContext);
  const href = normalize(to);

  return React.createElement(
    'a',
    {
      href,
      ...props,
      onClick: (event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }
    },
    children
  );
}

export function NavLink({ to, className, children, ...props }) {
  const { pathname } = useContext(RouterContext);
  const isActive = pathname === normalize(to);
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return React.createElement(
    Link,
    {
      to,
      className: computedClassName,
      'aria-current': isActive ? 'page' : undefined,
      ...props
    },
    children
  );
}
