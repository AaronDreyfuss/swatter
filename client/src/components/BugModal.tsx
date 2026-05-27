import { useState, FormEvent } from 'react';
import { Bug, Severity, BugStatus } from '../types';

interface BugFormPayload {
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  errorMessage?: string;
  severity: Severity;
  status?: BugStatus;
}

interface Props {
  bug?: Bug;
  onClose: () => void;
  onSubmit: (payload: BugFormPayload) => Promise<Bug>;
}

const severities: { value: Severity; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const statuses: { value: BugStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

function BugModal({ bug, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(bug?.title ?? '');
  const [description, setDescription] = useState(bug?.description ?? '');
  const [expectedBehavior, setExpectedBehavior] = useState(bug?.expectedBehavior ?? '');
  const [actualBehavior, setActualBehavior] = useState(bug?.actualBehavior ?? '');
  const [errorMessage, setErrorMessage] = useState(bug?.errorMessage ?? '');
  const [severity, setSeverity] = useState<Severity>(bug?.severity ?? 'MEDIUM');
  const [status, setStatus] = useState<BugStatus>(bug?.status ?? 'OPEN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        title,
        description,
        expectedBehavior,
        actualBehavior,
        errorMessage: errorMessage || undefined,
        severity,
        ...(bug ? { status } : {}),
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setError(message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {bug ? 'Edit bug' : 'Log a bug'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="form-label">Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="input resize-none"
              />
            </div>
            <div>
              <label htmlFor="expectedBehavior" className="form-label">Expected behavior</label>
              <textarea
                id="expectedBehavior"
                name="expectedBehavior"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                required
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label htmlFor="actualBehavior" className="form-label">Actual behavior</label>
              <textarea
                id="actualBehavior"
                name="actualBehavior"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                required
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label htmlFor="errorMessage" className="form-label">
                Error message / stack trace{' '}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="errorMessage"
                name="errorMessage"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                rows={3}
                className="input resize-none font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {bug && (
                <div>
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BugStatus)}
                    className="input"
                  >
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={bug ? '' : 'col-span-2'}>
                <label htmlFor="severity" className="form-label">Severity</label>
                <select
                  id="severity"
                  name="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="input"
                >
                  {severities.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : bug ? 'Save changes' : 'Log bug'}
              </button>
              <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BugModal;
