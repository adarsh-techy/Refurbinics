import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../services/api-client';
import { setUser } from '../auth/auth-slice';
import PageHeader from '../../components/ui/PageHeader';

const inputClasses =
  'w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-surface-600 dark:bg-surface-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30';
const labelClasses = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-neutral-200';

function ClientProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await apiClient.patch('/auth/change-password', { newPassword });
      dispatch(setUser(data.user));
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />

      <div className="flex max-w-lg flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-neutral-100">Account</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-neutral-400">Name</dt>
              <dd className="font-medium text-slate-900 dark:text-neutral-100">{user?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-neutral-400">Email</dt>
              <dd className="font-medium text-slate-900 dark:text-neutral-100">{user?.email}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-neutral-100">Change Password</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClasses}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className={labelClasses}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                className={inputClasses}
                required
              />
            </div>

            {error && <p className="text-sm text-critical-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-brand-700 dark:text-emerald-400">Password updated.</p>}

            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {submitting ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientProfilePage;
