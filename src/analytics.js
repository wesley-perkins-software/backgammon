const GA_MEASUREMENT_ID = 'G-VCLXS3979T';

/**
 * @typedef {Object} CheckerMoveEventParams
 * @property {number|string} [from_point]
 * @property {number|string} [to_point]
 * @property {number} [die_value]
 * @property {boolean} [is_hit]
 * @property {boolean} [is_bear_off]
 * @property {boolean} [from_bar]
 * @property {number} [remaining_dice_count]
 */

function getGtag() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return null;
  }

  return window.gtag;
}

export function trackEvent(eventName, params = {}) {
  const gtag = getGtag();
  if (!gtag) {
    return;
  }

  gtag('event', eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
}

export function trackRollDice() {
  trackEvent('roll_dice');
}

export function trackNewGame() {
  trackEvent('new_game');
}

export function trackUndoMove() {
  trackEvent('undo_move');
}

/** @param {CheckerMoveEventParams} params */
export function trackCheckerMove(params) {
  trackEvent('checker_move', params);
}

function trackPageView() {
  const gtag = getGtag();
  if (!gtag) {
    return;
  }

  gtag('event', 'page_view', {
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
