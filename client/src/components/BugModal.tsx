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

const severities: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

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
    <div>
      <h2>{bug ? 'Edit bug' : 'Log a bug'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="expectedBehavior">Expected behavior</label>
          <textarea
            id="expectedBehavior"
            name="expectedBehavior"
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="actualBehavior">Actual behavior</label>
          <textarea
            id="actualBehavior"
            name="actualBehavior"
            value={actualBehavior}
            onChange={(e) => setActualBehavior(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="errorMessage">Error message / stack trace (optional)</label>
          <textarea
            id="errorMessage"
            name="errorMessage"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
          />
        </div>
        {bug && (
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BugStatus)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="severity">Severity</label>
          <select
            id="severity"
            name="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : bug ? 'Save changes' : 'Log bug'}
        </button>
        <button type="button" onClick={onClose} disabled={loading}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default BugModal;
