const GA_MEASUREMENT_ID = 'G-VCLXS3979T';

function trackPageView() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'page_view', {
    send_to: GA_MEASUREMENT_ID,
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function installGaPageTracking() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let lastPathname = null;

  const sendIfPathChanged = () => {
    const { pathname } = window.location;
    if (pathname === lastPathname) {
      return;
    }

    lastPathname = pathname;
    trackPageView();
  };

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function patchedPushState(...args) {
    originalPushState.apply(this, args);
    sendIfPathChanged();
  };

  window.history.replaceState = function patchedReplaceState(...args) {
    originalReplaceState.apply(this, args);
    sendIfPathChanged();
  };

  window.addEventListener('popstate', sendIfPathChanged);
  sendIfPathChanged();

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', sendIfPathChanged);
  };
}
