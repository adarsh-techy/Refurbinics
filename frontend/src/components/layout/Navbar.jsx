import NotificationBell from './NotificationBell';
import RepeatIntakeAlert from './RepeatIntakeAlert';
import ThemeToggle from './ThemeToggle';
import UkClock from './UkClock';

// onMenuClick: opens Sidebar's mobile drawer — the hamburger button only
// renders below the md breakpoint, where the pinned sidebar is hidden.
function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-3 border-b-[0.5px] border-emerald-200 bg-white px-4 dark:border-emerald-950 dark:bg-black sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-2 text-emerald-800/70 hover:bg-emerald-50 hover:text-emerald-900 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white md:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        <UkClock />
        <RepeatIntakeAlert />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Navbar;
