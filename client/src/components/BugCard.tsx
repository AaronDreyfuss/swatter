import { Bug, Severity, BugStatus } from '../types';

interface Props {
  bug: Bug;
  onNavigate: () => void;
  onEdit: () => void;
}

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
    // add card layout styles (flex row, gap, border, padding, hover state)
    <li>
      <button onClick={onNavigate}>{bug.title}</button>
      {/* severity badge - LOW: green, MEDIUM: yellow, HIGH: orange, CRITICAL: red */}
      <span>{severityLabel[bug.severity]}</span>
      {/* status badge - OPEN: blue, IN_PROGRESS: purple, RESOLVED: green */}
      <span>{statusLabel[bug.status]}</span>
      <span>{bug.assignedToId ? 'Assigned' : 'Unassigned'}</span>
      <button onClick={onEdit}>Edit</button>
    </li>
  );
}

export default BugCard;
