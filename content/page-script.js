/**
 * Page Script - Injected into the page context
 * This script runs in the page's JavaScript environment and can access OP
 */

(function() {
  'use strict';

  let fetchTimeout = null;

  /**
   * Wait for the OP object to be available
   */
  function waitForOP(callback, maxAttempts = 50, interval = 100) {
    let attempts = 0;

    const check = () => {
      if (typeof OP !== 'undefined' && OP.$all) {
        callback(OP);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, interval);
      } else {
        callback(null);
      }
    };

    check();
  }

  /**
   * Extract lesson data from OP and send to content script
   */
  function extractAndSendLessons() {
    waitForOP((op) => {
      if (!op) {
        // Send error event
        window.dispatchEvent(new CustomEvent('scrimba-streak-data', {
          detail: { error: true, lessons: [] }
        }));
        return;
      }

      try {
        // Extract completed lessons
        // Make sure date is after new Date('2016-01-01T00:00:00.001Z')); to filter out unix time = 0 (1970) dates.
        const lessons = op.$all
          .filter(x => x.$plain?.kind === 'lesson' && x.finished && new Date(x.finished) > new Date('2016-01-01T00:00:00.001Z'))
          .map(lesson => ({
            id: lesson.id,
            finished: lesson.finished
          }));

        // Send data to content script
        window.dispatchEvent(new CustomEvent('scrimba-streak-data', {
          detail: { error: false, lessons: lessons }
        }));
      } catch (e) {
        console.error('Scrimba Streak Tracker: Error extracting lessons', e);
        window.dispatchEvent(new CustomEvent('scrimba-streak-data', {
          detail: { error: true, lessons: [] }
        }));
      }
    });
  }

  function debouncedFetch() {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(() => {
      extractAndSendLessons();
    }, 1500);
  }

  // Listen for requests from content script
  window.addEventListener('scrimba-streak-request', () => {
    extractAndSendLessons();
  });

  if (window.navigation) {
    window.navigation.addEventListener('navigate', (event) => {
      // Only trigger for actual navigations, not reloads
      if (event.navigationType === 'push' || event.navigationType === 'replace') {
        debouncedFetch();
      }
    });
  }

  // Also extract on initial load
  extractAndSendLessons();
})();
