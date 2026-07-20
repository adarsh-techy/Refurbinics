import NotificationBell from './NotificationBell';
import RepeatIntakeAlert from './RepeatIntakeAlert';
import ThemeToggle from './ThemeToggle';
import UkClock from './UkClock';

function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-end border-b-[0.5px] border-emerald-200 bg-white px-6 dark:border-emerald-950 dark:bg-black">
      <div className="flex items-center gap-5">
        <UkClock />
        <RepeatIntakeAlert />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Navbar;
