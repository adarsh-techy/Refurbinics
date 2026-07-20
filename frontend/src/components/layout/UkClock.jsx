import { useEffect, useState } from 'react';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

// Live UK (Europe/London) date/time, independent of the viewer's own
// timezone — correct across BST/GMT since Intl handles the DST switch.
function UkClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden text-right leading-tight sm:block">
      <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-neutral-200">
        {TIME_FORMATTER.format(now)}{' '}
        <span className="text-xs font-normal text-emerald-600/70 dark:text-neutral-500">UK</span>
      </p>
      <p className="text-xs text-emerald-600/70 dark:text-neutral-500">{DATE_FORMATTER.format(now)}</p>
    </div>
  );
}

export default UkClock;
