import React, { useEffect } from 'react';

export function HelmetProvider({ children }) {
  return children;
}

export function Helmet({ children }) {
  useEffect(() => {
    const created = [];
    const nodes = React.Children.toArray(children);

    for (const child of nodes) {
      if (!child || !child.type) continue;

      if (child.type === 'title') {
        document.title = child.props.children;
        continue;
      }

      if (child.type === 'meta' || child.type === 'link' || child.type === 'script') {
        const el = document.createElement(child.type);
        Object.entries(child.props || {}).forEach(([key, value]) => {
          if (key === 'children' || key === 'dangerouslySetInnerHTML') return;
          if (value !== undefined) {
            el.setAttribute(key, value);
          }
        });
        if (child.type === 'script' && child.props?.dangerouslySetInnerHTML?.__html) {
          el.textContent = child.props.dangerouslySetInnerHTML.__html;
        }
        document.head.appendChild(el);
        created.push(el);
      }
    }

    return () => {
      created.forEach((el) => el.remove());
    };
  }, [children]);

  return null;
}
