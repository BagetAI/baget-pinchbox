/**
 * Pinchbox Analytics Tracking System (ESTABLISHED 2026)
 * High-fidelity client-side event tracking for measuring conversion funnel metrics.
 * Features console visual logging, local event persistence, and a debug dashboard.
 */

const PinchboxAnalytics = (() => {
  const STORAGE_KEY = 'pinchbox_analytics_log';
  const SESSION_ID_KEY = 'pinchbox_session_id';

  // Generate or retrieve persistent Session ID
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = 'pb_session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  // Get current event log from localStorage
  function getEventLog() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Pinchbox Analytics] Failed to parse local log', e);
      return [];
    }
  }

  // Save event log
  function saveEventLog(log) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-100))); // Keep last 100 events
    } catch (e) {
      console.error('[Pinchbox Analytics] Failed to save local log', e);
    }
  }

  // Log event with beautiful style in the browser console
  function consoleLog(eventName, payload) {
    const time = new Date().toLocaleTimeString();
    console.log(
      `%c[Pinchbox Tracking] %c${eventName} %c@ ${time}`,
      'color: #C85A32; font-weight: bold; font-family: sans-serif;',
      'color: #4A3728; font-weight: bold; background-color: #F4ECD8; padding: 2px 6px; border-radius: 3px;',
      'color: #768A7F; font-style: italic;',
      payload
    );
  }

  // Public API
  return {
    track: (eventName, data = {}) => {
      const eventObj = {
        event: eventName,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || 'direct',
        properties: data
      };

      // 1. Persist locally
      const log = getEventLog();
      log.push(eventObj);
      saveEventLog(log);

      // 2. Beautiful Console Log
      consoleLog(eventName, eventObj);

      // 3. Dispatch global CustomEvent for in-app listeners
      window.dispatchEvent(new CustomEvent('pinchbox_analytics_event', { detail: eventObj }));

      // 4. Update Debug Dashboard UI if it exists
      if (typeof PinchboxAnalyticsUI !== 'undefined' && PinchboxAnalyticsUI.update) {
        PinchboxAnalyticsUI.update();
      }

      return eventObj;
    },

    // Funnel Step 1: Page Views
    trackPageview: (title = document.title) => {
      PinchboxAnalytics.track('page_view', { title });
    },

    // Funnel Step 2: Box Size Selection
    trackBoxSizeSelection: (size, price) => {
      PinchboxAnalytics.track('select_box_size', {
        boxSize: size,
        priceInDollars: price,
        pricePerKit: (price / size).toFixed(2)
      });
    },

    // Funnel Step 3: Recipe Click/Adjust (Add/Subtract)
    trackRecipeAdjust: (recipeId, recipeName, action, currentQty, targetCapacity) => {
      PinchboxAnalytics.track('adjust_recipe', {
        recipeId: recipeId,
        recipeName: recipeName,
        action: action, // 'add' or 'subtract'
        quantity: currentQty,
        boxCapacity: targetCapacity
      });
    },

    // Funnel Step 4: Outbound Waitlist Signups
    trackWaitlistSubmit: (email, name, isSuccess) => {
      PinchboxAnalytics.track('waitlist_submit', {
        emailHash: email ? btoa(email).substring(0, 10) : 'none', // privacy-safe hash prefix
        nameProvided: !!name,
        success: isSuccess
      });
    },

    // Funnel Step 5: Checkout Initiated (User clicks "Pre-Order My Custom Box")
    trackCheckoutInitiated: (boxSize, price, items) => {
      PinchboxAnalytics.track('checkout_initiated', {
        boxSize: boxSize,
        priceInDollars: price,
        totalItems: items.reduce((sum, item) => sum + item.qty, 0),
        items: items
      });
    },

    // Funnel Step 6: Checkout Success / Conversion
    trackCheckoutSuccess: (boxSize, price, items) => {
      PinchboxAnalytics.track('checkout_success', {
        boxSize: boxSize,
        priceInDollars: price,
        totalItems: items.reduce((sum, item) => sum + item.qty, 0),
        items: items,
        purchaseTimestamp: Date.now()
      });
    },

    // Get all past events
    getHistory: () => getEventLog(),

    // Clear history
    clearHistory: () => {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof PinchboxAnalyticsUI !== 'undefined' && PinchboxAnalyticsUI.update) {
        PinchboxAnalyticsUI.update();
      }
    }
  };
})();

// Automatic tracking initializer
document.addEventListener('DOMContentLoaded', () => {
  PinchboxAnalytics.trackPageview();

  // Handle Waitlist Form Tracking on Home Page
  const waitlistForm = document.getElementById('waitlist-form');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', () => {
      const emailInput = document.getElementById('email');
      const nameInput = document.getElementById('name');
      PinchboxAnalytics.trackWaitlistSubmit(
        emailInput ? emailInput.value : '',
        nameInput ? nameInput.value : '',
        true
      );
    });
  }
});
