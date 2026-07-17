import NotificationBell from './NotificationBell';
import RepeatIntakeAlert from './RepeatIntakeAlert';
import UkClock from './UkClock';

function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-end border-b-[0.5px] border-emerald-950 bg-black px-6">
      <div className="flex items-center gap-5">
        <UkClock />
        <RepeatIntakeAlert />
        <NotificationBell />
      </div>
    </header>
  );
}

export default Navbar;
