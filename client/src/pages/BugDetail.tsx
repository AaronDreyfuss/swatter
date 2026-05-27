import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useBugs from '../hooks/useBugs';
import BugModal from '../components/BugModal';
import CommentThread from '../components/CommentThread';
import { Bug, Severity, BugStatus } from '../types';

const severityClasses: Record<Severity, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusClasses: Record<BugStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function BugDetail() {
  const { projectId, bugId } = useParams<{ projectId: string; bugId: string }>();
  const { getBug, updateBug } = useBugs(projectId!);

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId || !bugId) return;
    getBug(bugId)
      .then(setBug)
      .catch(() => setError('Failed to load bug.'))
      .finally(() => setLoading(false));
  }, [projectId, bugId]);

  const handleUpdate = async (payload: Parameters<typeof updateBug>[1]) => {
    const updated = await updateBug(bugId!, payload);
    setBug(updated);
    return updated;
  };

  if (loading) return <p className="text-center py-12 text-gray-500 dark:text-gray-400">Loading bug...</p>;
  if (error) return <p className="text-center py-12 text-red-600 dark:text-red-400">{error}</p>;
  if (!bug) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bug.title}</h1>
        <button onClick={() => setModalOpen(true)} className="btn-secondary shrink-0">
          Edit bug
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[bug.status]}`}>
          {bug.status.replace('_', ' ')}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${severityClasses[bug.severity]}`}>
          {bug.severity}
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {bug.assignedToId ? 'Assigned' : 'Unassigned'}
        </span>
      </div>

      <div className="space-y-6 mb-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Description
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.description}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Expected behavior
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.expectedBehavior}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Actual behavior
          </h2>
          <p className="text-gray-800 dark:text-gray-200">{bug.actualBehavior}</p>
        </section>

        {bug.errorMessage && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Error message / stack trace
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
              {bug.errorMessage}
            </pre>
          </section>
        )}
      </div>

      {modalOpen && (
        <BugModal
          bug={bug}
          onClose={() => setModalOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      <CommentThread projectId={projectId!} bugId={bugId!} />
    </div>
  );
}

export default BugDetail;
