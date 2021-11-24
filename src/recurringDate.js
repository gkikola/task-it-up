const proto = {
  durationUnit: null,
  durationLength: null,
  weekOfMonth: null,
  dayOfMonth: null,
  daysOfWeek: [],
  hour: null,
  minute: null,
  onWeekends: 'no change',
  endDate: null,
  count: null,
};

function createRecurringDate(durationUnit, durationLength) {
  const date = Object.create(proto);
  date.durationUnit = durationUnit;
  date.durationLength = durationLength;

  return date;
}

export { createRecurringDate };
