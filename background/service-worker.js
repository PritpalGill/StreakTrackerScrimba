/**
 * Background Service Worker
 * Handles extension lifecycle and cross-context communication
 */

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const DEFAULT_SETTINGS = {
      widgetVisible: true,
      weekdayOnly: false,
      maxLessonsForLevel5: 10
    };

    try {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
      console.log('Scrimba Streak Tracker: Default settings initialized');
    } catch (e) {
      console.warn('Scrimba Streak Tracker: Failed to initialize settings', e);
    }
  }
});

// Listen for messages from popup or content scripts if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Currently no background message handling needed
  // This can be extended for future features
  return true;
});
