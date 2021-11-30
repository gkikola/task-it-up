class RecurringDate {
  durationUnit = null;
  durationLength = null;
  weekOfMonth = null;
  dayOfMonth = null;
  daysOfWeek = [];
  hour = null;
  minute = null;
  onWeekends = 'no change';
  endDate = null;
  count = null;

  constructor(durationUnit, durationLength) {
    this.durationUnit = durationUnit;
    this.durationLength = durationLength;
  }
};

export default RecurringDate;
