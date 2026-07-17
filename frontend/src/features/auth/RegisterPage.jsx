import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register } from './auth-slice';

const inputClasses =
  'w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-surface-600 dark:bg-surface-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30';
const labelClasses = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-neutral-200';

// TEMPORARY: initial-setup page for creating the first admin accounts.
// Remove this page (and the /auth/register backend route) once real
// admin management (Users page, super_admin only) is in use.
function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await dispatch(register({ name, email, password, role }));
    if (register.fulfilled.match(result)) {
      navigate('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 dark:from-surface-950 dark:to-surface-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
            R
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-neutral-100">Create Admin Account</h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Temporary setup page — removed once the app is fully built.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-7 shadow-sm dark:border-surface-700 dark:bg-surface-900"
        >
          <div>
            <label className={labelClasses}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClasses}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-critical-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-1 w-full rounded-md bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {status === 'loading' ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-emerald-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
