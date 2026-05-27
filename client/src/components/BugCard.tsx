import { Bug, Severity, BugStatus } from '../types';

interface Props {
  bug: Bug;
  onNavigate: () => void;
  onEdit: () => void;
}

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

const severityLabel: Record<Severity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const statusLabel: Record<BugStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};

function BugCard({ bug, onNavigate, onEdit }: Props) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
      <button
        onClick={onNavigate}
        className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {bug.title}
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityClasses[bug.severity]}`}>
          {severityLabel[bug.severity]}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[bug.status]}`}>
          {statusLabel[bug.status]}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right">
          {bug.assignedToId ? 'Assigned' : 'Unassigned'}
        </span>
        <button onClick={onEdit} className="btn-ghost text-xs px-2 py-1">
          Edit
        </button>
      </div>
    </li>
  );
}

export default BugCard;
