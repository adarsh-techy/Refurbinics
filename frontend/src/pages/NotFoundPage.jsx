import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white dark:bg-surface-950">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-neutral-100">404 — Page not found</h1>
      <Link to="/" className="text-brand-600 hover:underline dark:text-emerald-400">
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
