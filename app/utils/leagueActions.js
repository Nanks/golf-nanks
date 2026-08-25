export const getLocalIsoDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// A calendar event's `status` field is one of these once it's been resolved
// (via the CalendarEventModal status picker), or unset/null while still live.
export const TERMINAL_EVENT_STATUSES = ['complete', 'rain', 'handicap', 'practice', 'canceled'];

export const isEventFinished = (status) => TERMINAL_EVENT_STATUSES.includes((status || '').toLowerCase());

