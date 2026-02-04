/**
 * Content Script - Main entry point
 * Handles initialization, page script injection, and settings management
 */

(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    widgetVisible: true,
    weekdayOnly: false,
    maxLessonsForLevel5: 10
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  let lessons = [];
  let isInitialized = false;
  let pageScriptInjected = false;

  /**
   * Load settings from chrome.storage.sync
   * @returns {Promise<Object>} Settings object
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      return { ...DEFAULT_SETTINGS, ...result.settings };
    } catch (e) {
      console.warn('Scrimba Streak Tracker: Failed to load settings', e);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Inject the page script into the page context
   * This allows us to access the page's OP object
   */
  function injectPageScript() {
    if (pageScriptInjected) return;

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/page-script.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    pageScriptInjected = true;
  }

  /**
   * Wait for the sidebar navigation to be available
   * @param {Function} callback - Callback with nav element or null
   * @param {number} maxAttempts - Maximum poll attempts
   * @param {number} interval - Polling interval in ms
   */
  function waitForNav(callback, maxAttempts = 50, interval = 100) {
    let attempts = 0;

    const check = () => {
      const nav = document.querySelector('app-nav');
      const anchorSection = nav?.querySelector('section.kz-bn');
      const nextSibling = nav?.querySelector('div.kz-by');

      if (nav && anchorSection && nextSibling) {
        callback(nav);
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
   * Request lesson data from the page script
   */
  function requestLessonData() {
    window.dispatchEvent(new CustomEvent('scrimba-streak-request'));
  }

  /**
   * Handle lesson data received from page script
   * @param {CustomEvent} event - Event with lesson data
   */
  function handleLessonData(event) {
    const { error, lessons: lessonData } = event.detail;

    if (error || !lessonData) {
      StreakWidget.showErrorState();
      attachRetryListener();
      return;
    }

    lessons = lessonData;

    StreakWidget.update({
      lessons,
      settings: currentSettings
    });

    isInitialized = true;
  }

  /**
   * Initialize the widget
   */
  function initializeWidget() {
    // Inject page script and request data
    injectPageScript();

    // Give the page script a moment to initialize, then request data
    setTimeout(() => {
      requestLessonData();
    }, 100);
  }

  /**
   * Attach retry button listener
   */
  function attachRetryListener() {
    const retryBtn = document.getElementById('streak-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        requestLessonData();
      });
    }
  }

  /**
   * Apply settings changes
   * @param {Object} settings - New settings object
   */
  function applySettings(settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...settings };

    if (!currentSettings.widgetVisible) {
      StreakWidget.removeWidget();
      return;
    }

    if (isInitialized && lessons.length > 0) {
      StreakWidget.update({
        lessons,
        settings: currentSettings
      });
    } else {
      initializeWidget();
    }
  }

  /**
   * Listen for messages from popup
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED') {
      applySettings(message.settings);
    }
    return true;
  });

  /**
   * Listen for lesson data from page script
   */
  window.addEventListener('scrimba-streak-data', handleLessonData);

  /**
   * Main initialization
   */
  async function main() {
    // Load settings first
    currentSettings = await loadSettings();

    // Exit if widget is disabled
    if (!currentSettings.widgetVisible) {
      return;
    }

    // Wait for the navigation sidebar to be ready
    waitForNav((nav) => {
      if (!nav) {
        console.warn('Scrimba Streak Tracker: Navigation sidebar not found');
        return;
      }

      // Initialize the widget
      initializeWidget();
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
