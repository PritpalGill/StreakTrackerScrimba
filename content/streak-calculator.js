/**
 * Streak Calculator Module
 * Handles all streak calculation logic for the Scrimba Streak Tracker
 */

const StreakCalculator = {
  /**
   * Format a date to local YYYY-MM-DD string
   * @param {Date} date - Date object to format
   * @returns {string} Formatted date string
   */
  formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Parse a YYYY-MM-DD string into a local Date object
   * Avoids timezone issues by parsing components directly
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {Date} Date object in local time
   */
  parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  /**
   * Get the next valid date (skipping weekends if weekdayOnly is true)
   * @param {string} dateStr - Current date string in YYYY-MM-DD format
   * @param {boolean} weekdayOnly - Whether to skip weekends
   * @returns {string} Next valid date string
   */
  getNextValidDate(dateStr, weekdayOnly) {
    const date = this.parseLocalDate(dateStr);
    date.setDate(date.getDate() + 1);

    if (weekdayOnly) {
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
      }
    }

    return this.formatLocalDate(date);
  },

  /**
   * Get the previous valid date (skipping weekends if weekdayOnly is true)
   * @param {string} dateStr - Current date string in YYYY-MM-DD format
   * @param {boolean} weekdayOnly - Whether to skip weekends
   * @returns {string} Previous valid date string
   */
  getPreviousValidDate(dateStr, weekdayOnly) {
    const date = this.parseLocalDate(dateStr);
    date.setDate(date.getDate() - 1);

    if (weekdayOnly) {
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() - 1);
      }
    }

    return this.formatLocalDate(date);
  },

  /**
   * Check if a date is a weekday
   * @param {string} dateStr - Date string in YYYY-MM-DD format
   * @returns {boolean} True if weekday
   */
  isWeekday(dateStr) {
    const date = this.parseLocalDate(dateStr);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  },

  /**
   * Calculate streaks from lesson data
   * @param {Array} lessons - Array of lesson objects with finished timestamps
   * @param {boolean} weekdayOnly - Whether to count only weekdays for streaks
   * @returns {Object} Object containing currentStreak, bestStreak, and activityByDate
   */
  calculateStreaks(lessons, weekdayOnly = false) {
    const activityByDate = {};

    // Group lessons by local date
    lessons.forEach(lesson => {
      if (!lesson.finished) return;

      const date = new Date(lesson.finished);
      const localDate = this.formatLocalDate(date);

      if (!activityByDate[localDate]) {
        activityByDate[localDate] = 0;
      }
      activityByDate[localDate]++;
    });

    // Get sorted unique dates
    const activeDates = Object.keys(activityByDate).sort();

    if (activeDates.length === 0) {
      return { currentStreak: 0, bestStreak: 0, activityByDate };
    }

    const today = this.formatLocalDate(new Date());
    const yesterday = this.formatLocalDate(new Date(Date.now() - 86400000));

    // Calculate best streak by iterating through all dates
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    activeDates.forEach(dateStr => {
      // Skip weekends if weekdayOnly is enabled
      if (weekdayOnly && !this.isWeekday(dateStr)) {
        return;
      }

      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const expectedNext = this.getNextValidDate(lastDate, weekdayOnly);
        if (dateStr === expectedNext) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      bestStreak = Math.max(bestStreak, tempStreak);
      lastDate = dateStr;
    });

    // Calculate current streak: count backwards from today
    let currentStreak = 0;
    const hasRecentActivity = activityByDate[today] || activityByDate[yesterday];

    if (hasRecentActivity) {
      let checkDate = activityByDate[today] ? today : yesterday;

      // If weekdayOnly and starting from a weekend, adjust
      if (weekdayOnly && !this.isWeekday(checkDate)) {
        checkDate = this.getPreviousValidDate(checkDate, weekdayOnly);
      }

      while (activityByDate[checkDate]) {
        if (!weekdayOnly || this.isWeekday(checkDate)) {
          currentStreak++;
        }
        checkDate = this.getPreviousValidDate(checkDate, weekdayOnly);
      }
    }

    return { currentStreak, bestStreak, activityByDate };
  },

  /**
   * Get activity level (0-5) based on lesson count
   * @param {number} count - Number of lessons completed
   * @param {number} maxLessons - Number of lessons for max activity level (default 10)
   * @returns {number} Activity level 0-5
   */
  getActivityLevel(count, maxLessons = 10) {
    if (count === 0) return 0;
    if (count >= maxLessons) return 5;

    // Divide into 5 levels evenly
    const step = maxLessons / 5;
    return Math.min(5, Math.ceil(count / step));
  },

  /**
   * Get the oldest lesson date from an array of lessons
   * @param {Array} lessons - Array of lesson objects
   * @returns {Date|null} Oldest lesson date or null if no lessons
   */
  getOldestLessonDate(lessons) {
    // Exclude older than "2016-01-01T00:00:00.001Z" Scrimba's start date to filter out unix time = 0 (1970) dates.
    const finishedLessons = lessons.filter(l => l.finished && new Date(l.finished) > new Date('2016-01-01T00:00:00.001Z'));
    if (finishedLessons.length === 0) return null;

    let oldest = new Date(finishedLessons[0].finished);
    finishedLessons.forEach(lesson => {
      const date = new Date(lesson.finished);
      if (date < oldest) {
        oldest = date;
      }
    });


    return oldest;
  },

  /**
   * Generate calendar data for a given month
   * @param {number} year - Year
   * @param {number} month - Month (0-indexed)
   * @param {Object} activityByDate - Activity data by date
   * @param {number} maxLessons - Number of lessons for max activity level (default 10)
   * @returns {Array} Array of day objects for the calendar
   */
  generateMonthCalendar(year, month, activityByDate, maxLessons = 10) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const today = this.formatLocalDate(new Date());
    const days = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true });
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = activityByDate[dateStr] || 0;
      const level = this.getActivityLevel(count, maxLessons);
      const isToday = dateStr === today;
      const isFuture = dateStr > today;

      days.push({
        day,
        date: dateStr,
        count,
        level,
        isToday,
        isFuture,
        empty: false
      });
    }

    return days;
  }
};

// Make available globally for other content scripts
window.StreakCalculator = StreakCalculator;
