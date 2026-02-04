/**
 * Popup Script
 * Handles settings UI and communication with content script
 */

const DEFAULT_SETTINGS = {
  widgetVisible: true,
  weekdayOnly: false,
  maxLessonsForLevel5: 10
};

/**
 * Load settings from chrome.storage.sync
 * @returns {Promise<Object>} Settings object
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    return { ...DEFAULT_SETTINGS, ...result.settings };
  } catch (e) {
    console.warn('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to chrome.storage.sync
 * @param {Object} settings - Settings to save
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set({ settings });
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

/**
 * Update a single setting and notify content script
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
async function updateSetting(key, value) {
  const settings = await loadSettings();
  settings[key] = value;
  await saveSettings(settings);

  // Notify content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes('scrimba.com')) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings
      });
    }
  } catch (e) {
    // Tab may not be a Scrimba page or content script not loaded
    console.debug('Could not notify content script', e);
  }
}

/**
 * Initialize the popup UI
 */
async function initPopup() {
  const settings = await loadSettings();

  const widgetVisibleCheckbox = document.getElementById('widget-visible');
  const weekdayOnlyCheckbox = document.getElementById('weekday-only');
  const maxLessonsInput = document.getElementById('max-lessons');

  // Set initial values
  widgetVisibleCheckbox.checked = settings.widgetVisible;
  weekdayOnlyCheckbox.checked = settings.weekdayOnly;
  maxLessonsInput.value = settings.maxLessonsForLevel5;

  // Attach event listeners
  widgetVisibleCheckbox.addEventListener('change', (e) => {
    updateSetting('widgetVisible', e.target.checked);
  });

  weekdayOnlyCheckbox.addEventListener('change', (e) => {
    updateSetting('weekdayOnly', e.target.checked);
  });

  maxLessonsInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value, 10);
    // Clamp value between 5 and 50
    const clampedValue = Math.min(100, Math.max(5, value || 10));
    e.target.value = clampedValue;
    updateSetting('maxLessonsForLevel5', clampedValue);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);
