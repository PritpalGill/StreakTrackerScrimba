/**
 * Widget Module
 * Handles all widget rendering and UI logic for the Scrimba Streak Tracker
 */

const StreakWidget = {
  currentMonth: null,
  minMonth: null,
  maxMonth: null,
  activityByDate: {},
  currentStreak: 0,
  bestStreak: 0,
  settings: {
    widgetVisible: true,
    weekdayOnly: false,
    maxLessonsForLevel5: 10
  },

  /**
   * Initialize the month navigator with bounds
   * @param {Date|null} oldestLessonDate - The oldest lesson completion date
   */
  initMonthNavigator(oldestLessonDate) {
    this.maxMonth = new Date();
    this.maxMonth.setDate(1);
    // uncomment below if testing purposes
    // this.maxMonth = new Date(2028, 1, 1);
    this.maxMonth.setHours(0, 0, 0, 0);
    

    this.currentMonth = new Date();
    this.currentMonth.setDate(1);
    this.currentMonth.setHours(0, 0, 0, 0);

    if (oldestLessonDate) {
      this.minMonth = new Date(oldestLessonDate);
      this.minMonth.setDate(1);
      this.minMonth.setHours(0, 0, 0, 0);
    } else {
      // If no lessons, min is current month
      this.minMonth = new Date(this.currentMonth);
    }
  },

  /**
   * Check if can navigate to previous month
   * @returns {boolean}
   */
  canGoBack() {
    return this.currentMonth > this.minMonth;
  },

  /**
   * Check if can navigate to next month
   * @returns {boolean}
   */
  canGoForward() {
    return this.currentMonth < this.maxMonth;
  },

  /**
   * Navigate to previous month
   * @returns {boolean} Whether navigation was successful
   */
  goBack() {
    if (this.canGoBack()) {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      return true;
    }
    return false;
  },

  /**
   * Navigate to next month
   * @returns {boolean} Whether navigation was successful
   */
  goForward() {
    if (this.canGoForward()) {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      return true;
    }
    return false;
  },

  /**
   * Get formatted month label
   * @returns {string}
   */
  getMonthLabel() {
    return this.currentMonth.toLocaleDateString('en-US', {
      // keep short so don't doesn't go to 2 lines
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Create the left chevron SVG
   * @returns {string}
   */
  getLeftChevronSVG() {
    return `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  /**
   * Create the right chevron SVG
   * @returns {string}
   */
  getRightChevronSVG() {
    return `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  /**
   * Create the main widget element
   * @returns {HTMLElement}
   */
  createWidgetElement() {
    const widget = document.createElement('section');
    widget.id = 'scrimba-streak-widget';
    widget.setAttribute('role', 'complementary');
    widget.setAttribute('aria-label', 'Streak Tracker');

    widget.innerHTML = `
      <!-- Header -->
      <div class="streak-header-container">
        <div class="streak-header">
          <span class="streak-title">Streak</span>
        </div>

        <!-- Month Navigator -->
        <div class="streak-month-nav">
          <button class="month-nav-btn prev" aria-label="Previous month" id="streak-prev-month">
            ${this.getLeftChevronSVG()}
          </button>
          <span class="month-label" id="streak-month-label" aria-live="polite" aria-atomic="true">${this.getMonthLabel()}</span>
          <button class="month-nav-btn next" aria-label="Next month" id="streak-next-month">
            ${this.getRightChevronSVG()}
          </button>
        </div>
      </div>

      <!-- Weekday Labels -->
      <div class="streak-weekdays" role="row">
        <span role="columnheader" aria-label="Sunday">Su</span>
        <span role="columnheader" aria-label="Monday">Mo</span>
        <span role="columnheader" aria-label="Tuesday">Tu</span>
        <span role="columnheader" aria-label="Wednesday">We</span>
        <span role="columnheader" aria-label="Thursday">Th</span>
        <span role="columnheader" aria-label="Friday">Fr</span>
        <span role="columnheader" aria-label="Saturday">Sa</span>
      </div>

      <!-- Calendar Grid -->
      <div class="streak-grid" id="streak-grid" role="grid" aria-label="${this.getMonthLabel()} activity calendar">
        <!-- Cells will be injected here -->
      </div>

      <!-- Legend -->
      <div class="streak-legend" role="img" aria-label="Activity levels: grey for no activity, lighter green for 1-2 lessons, darker green for more lessons, up to 10 or more">
        <span class="legend-label" aria-hidden="true">Less</span>
        <div class="legend-squares" aria-hidden="true">
          <div class="legend-square level-0"></div>
          <div class="legend-square level-1"></div>
          <div class="legend-square level-2"></div>
          <div class="legend-square level-3"></div>
          <div class="legend-square level-4"></div>
          <div class="legend-square level-5"></div>
        </div>
        <span class="legend-label" aria-hidden="true">More</span>
      </div>

      <!-- Tooltip -->
      <div class="streak-tooltip" role="status" aria-live="polite" id="streak-tooltip">
        <span class="tooltip-date" id="tooltip-date"></span>
        <span class="tooltip-count" id="tooltip-count"></span>
      </div>

      <!-- Stats Footer -->
      <div class="streak-stats" role="region" aria-label="Streak statistics">
        <div class="stat-box" aria-label="Current streak: ${this.currentStreak} days">
          <div class="stat-value-row">
            <svg class="stat-icon" aria-hidden="true" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M256.5 37.6C265.8 29.8 279.5 30.1 288.4 38.5C300.7 50.1 311.7 62.9 322.3 75.9C335.8 92.4 352 114.2 367.6 140.1C372.8 133.3 377.6 127.3 381.8 122.2C382.9 120.9 384 119.5 385.1 118.1C393 108.3 402.8 96 415.9 96C429.3 96 438.7 107.9 446.7 118.1C448 119.8 449.3 121.4 450.6 122.9C460.9 135.3 474.6 153.2 488.3 175.3C515.5 219.2 543.9 281.7 543.9 351.9C543.9 475.6 443.6 575.9 319.9 575.9C196.2 575.9 96 475.7 96 352C96 260.9 137.1 182 176.5 127C196.4 99.3 216.2 77.1 231.1 61.9C239.3 53.5 247.6 45.2 256.6 37.7zM321.7 480C347 480 369.4 473 390.5 459C432.6 429.6 443.9 370.8 418.6 324.6C414.1 315.6 402.6 315 396.1 322.6L370.9 351.9C364.3 359.5 352.4 359.3 346.2 351.4C328.9 329.3 297.1 289 280.9 268.4C275.5 261.5 265.7 260.4 259.4 266.5C241.1 284.3 207.9 323.3 207.9 370.8C207.9 439.4 258.5 480 321.6 480z" fill="#FF6B35" stroke="#FF6B35" stroke-width="1" />
            </svg>
            <span class="stat-value" id="current-streak-value">${this.currentStreak}</span>
            <span class="stat-unit" aria-hidden="true">days</span>
          </div>
          <span class="stat-label">Current Streak</span>
        </div>
        <div class="stat-box" aria-label="Best streak: ${this.bestStreak} days">
          <div class="stat-value-row">
            <svg class="stat-icon" aria-hidden="true" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z" fill="#FFD700" stroke="#FFD700" stroke-width="1" />
            </svg>
            <span class="stat-value" id="best-streak-value">${this.bestStreak}</span>
            <span class="stat-unit" aria-hidden="true">days</span>
          </div>
          <span class="stat-label">Best Streak</span>
        </div>
      </div>
    `;

    return widget;
  },

  /**
   * Create error state widget
   * @returns {HTMLElement}
   */
  createErrorWidget() {
    const widget = document.createElement('section');
    widget.id = 'scrimba-streak-widget';
    widget.className = 'error-state';
    widget.setAttribute('role', 'complementary');
    widget.setAttribute('aria-label', 'Streak Tracker');

    widget.innerHTML = `
      <div class="streak-header">
        <span class="streak-title">Streak</span>
      </div>
      <div class="streak-error">
        <p>Unable to load streak data</p>
        <button class="retry-btn" id="streak-retry">Retry</button>
      </div>
    `;

    return widget;
  },

  /**
   * Render the calendar grid for the current month
   */
  renderCalendarGrid() {
    const grid = document.getElementById('streak-grid');
    if (!grid) return;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const maxLessons = this.settings.maxLessonsForLevel5 || 10;
    const days = StreakCalculator.generateMonthCalendar(year, month, this.activityByDate, maxLessons);

    // Update grid's aria-label with current month
    grid.setAttribute('aria-label', `${this.getMonthLabel()} activity calendar`);

    grid.innerHTML = days.map(day => {
      if (day.empty) {
        return '<div class="streak-cell empty"></div>';
      }

      const classes = ['streak-cell', `level-${day.level}`];
      if (day.isToday) classes.push('today');
      if (day.isFuture) classes.push('future');

      const ariaCurrent = day.isToday ? 'aria-current="date"' : '';
      const ariaDisabled = day.isFuture ? 'aria-disabled="true"' : '';
      const tabIndex = day.isFuture ? '-1' : '0';

      return `
        <div class="${classes.join(' ')}"
             data-date="${day.date}"
             data-count="${day.count}"
             tabindex="${tabIndex}"
             role="gridcell"
             ${ariaCurrent}
             ${ariaDisabled}
             aria-label="${this.formatDateForAria(day.date)}, ${day.count} lessons completed">
          <span class="day-number">${day.day}</span>
        </div>
      `;
    }).join('');

    this.updateNavigationButtons();
  },

  /**
   * Format date for aria-label
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {string} Formatted date
   */
  formatDateForAria(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Format date for tooltip display
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {string} Formatted date
   */
  formatDateForTooltip(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Update navigation button states
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('streak-prev-month');
    const nextBtn = document.getElementById('streak-next-month');
    const monthLabel = document.getElementById('streak-month-label');

    if (prevBtn) {
      prevBtn.disabled = !this.canGoBack();
      prevBtn.classList.toggle('disabled', !this.canGoBack());
    }

    if (nextBtn) {
      nextBtn.disabled = !this.canGoForward();
      nextBtn.classList.toggle('disabled', !this.canGoForward());
    }

    if (monthLabel) {
      monthLabel.textContent = this.getMonthLabel();
    }
  },

  /**
   * Update streak stats display
   */
  updateStats() {
    const currentEl = document.getElementById('current-streak-value');
    const bestEl = document.getElementById('best-streak-value');

    if (currentEl) currentEl.textContent = this.currentStreak;
    if (bestEl) bestEl.textContent = this.bestStreak;
  },

  /**
   * Show tooltip for a cell
   * @param {HTMLElement} cell - The cell element
   * @param {MouseEvent} event - The mouse event
   */
  showTooltip(cell, event) {
    const tooltip = document.getElementById('streak-tooltip');
    const dateEl = document.getElementById('tooltip-date');
    const countEl = document.getElementById('tooltip-count');

    if (!tooltip || !dateEl || !countEl) return;

    const date = cell.dataset.date;
    const count = parseInt(cell.dataset.count, 10);

    dateEl.textContent = this.formatDateForTooltip(date);
    countEl.textContent = count === 1 ? '1 lesson completed' : `${count} lessons completed`;

    // Position tooltip
    const widget = document.getElementById('scrimba-streak-widget');
    const widgetRect = widget.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    // Reset transform to measure tooltip size
    tooltip.style.transform = '';
    tooltip.style.left = '0';
    tooltip.style.top = '0';
    tooltip.classList.add('visible');

    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;

    // Calculate centered position
    let left = cellRect.left - widgetRect.left + cellRect.width / 2 - tooltipWidth / 2;

    // Clamp to widget bounds with padding
    const padding = 4;
    const widgetWidth = widgetRect.width;
    const minLeft = padding;
    const maxLeft = widgetWidth - tooltipWidth - padding;

    left = Math.max(minLeft, Math.min(left, maxLeft));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${cellRect.top - widgetRect.top - 8}px`;
    tooltip.style.transform = 'translateY(-100%)';
  },

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('streak-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  },

  /**
   * Attach event listeners to the widget
   */
  attachEventListeners() {
    // Month navigation
    const prevBtn = document.getElementById('streak-prev-month');
    const nextBtn = document.getElementById('streak-next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.goBack()) {
          this.renderCalendarGrid();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.goForward()) {
          this.renderCalendarGrid();
        }
      });
    }

    // Cell hover for tooltip
    const grid = document.getElementById('streak-grid');
    if (grid) {
      grid.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.streak-cell:not(.empty):not(.future)');
        if (cell) {
          this.showTooltip(cell, e);
        }
      });

      grid.addEventListener('mouseout', (e) => {
        const cell = e.target.closest('.streak-cell');
        if (cell) {
          this.hideTooltip();
        }
      });

      // Keyboard navigation for cells
      grid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const cell = e.target.closest('.streak-cell:not(.empty):not(.future)');
          if (cell) {
            this.showTooltip(cell, e);
          }
        } else if (e.key === 'Escape') {
          this.hideTooltip();
        }
      });

      grid.addEventListener('focusout', () => {
        this.hideTooltip();
      });
    }
  },

  /**
   * Find the injection point in the sidebar
   * @returns {Object|null} Object with parent and nextSibling, or null if not found
   */
  findInjectionPoint() {
    const nav = document.querySelector('app-nav');
    if (!nav) return null;

    const anchorSection = nav.querySelector('section.kz-bn');
    const nextSibling = nav.querySelector('div.kz-by');

    if (anchorSection && nextSibling && nextSibling.parentNode) {
      // Use the parent of both elements (the div container inside app-nav)
      return {
        parent: nextSibling.parentNode,
        nextSibling: nextSibling
      };
    }

    return null;
  },

  /**
   * Inject the widget into the Scrimba sidebar
   * @returns {boolean} Whether injection was successful
   */
  injectWidget() {
    // Check if already injected
    if (document.getElementById('scrimba-streak-widget')) {
      return true;
    }

    const injectionPoint = this.findInjectionPoint();
    if (!injectionPoint) return false;

    const widget = this.createWidgetElement();
    injectionPoint.parent.insertBefore(widget, injectionPoint.nextSibling);
    this.renderCalendarGrid();
    this.attachEventListeners();
    return true;
  },

  /**
   * Show error state in the widget
   */
  showErrorState() {
    // Remove existing widget if any
    const existing = document.getElementById('scrimba-streak-widget');
    if (existing) {
      existing.remove();
    }

    const injectionPoint = this.findInjectionPoint();
    if (!injectionPoint) return;

    const widget = this.createErrorWidget();
    injectionPoint.parent.insertBefore(widget, injectionPoint.nextSibling);
  },

  /**
   * Remove the widget from the page
   */
  removeWidget() {
    const widget = document.getElementById('scrimba-streak-widget');
    if (widget) {
      widget.remove();
    }
  },

  /**
   * Update widget with new data
   * @param {Object} data - Object containing lessons and settings
   */
  update(data) {
    const { lessons, settings } = data;
    this.settings = settings;

    if (!settings.widgetVisible) {
      this.removeWidget();
      return;
    }

    const result = StreakCalculator.calculateStreaks(lessons, settings.weekdayOnly);
    this.activityByDate = result.activityByDate;
    this.currentStreak = result.currentStreak;
    this.bestStreak = result.bestStreak;

    const oldestDate = StreakCalculator.getOldestLessonDate(lessons);
    this.initMonthNavigator(oldestDate);

    // Inject or update widget
    if (!document.getElementById('scrimba-streak-widget')) {
      this.injectWidget();
    } else {
      this.renderCalendarGrid();
      this.updateStats();
    }
  }
};

// Make available globally for other content scripts
window.StreakWidget = StreakWidget;
