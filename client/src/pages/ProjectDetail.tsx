import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';
import useBugs from '../hooks/useBugs';
import BugModal from '../components/BugModal';
import BugCard from '../components/BugCard';
import { Project, Bug, BugStatus, Severity } from '../types';

function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProject } = useProjects();
  const { data: bugs, loading: bugsLoading, error: bugsError, createBug, updateBug } = useBugs(projectId!);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  const [statusFilter, setStatusFilter] = useState<BugStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then(setProject)
      .catch(() => setProjectError('Failed to load project.'))
      .finally(() => setProjectLoading(false));
  }, [projectId]);

  const filteredBugs = bugs.filter((bug) => {
    if (statusFilter !== 'ALL' && bug.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && bug.severity !== severityFilter) return false;
    return true;
  });

  if (projectLoading) return <p>Loading project...</p>;
  if (projectError) return <p>{projectError}</p>;
  if (!project) return null;

  return (
    <div>
      <h1>{project.name}</h1>
      {project.inviteCode && (
        <p>
          Invite code: <strong>{project.inviteCode}</strong>
        </p>
      )}

      <h2>Bugs</h2>

      <div>
        <label htmlFor="statusFilter">Status</label>
        <select
          id="statusFilter"
          name="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <label htmlFor="severityFilter">Severity</label>
        <select
          id="severityFilter"
          name="severityFilter"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
        >
          <option value="ALL">All severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <button onClick={() => setModalOpen(true)}>Log a bug</button>

      {bugsLoading && <p>Loading bugs...</p>}
      {bugsError && <p>{bugsError}</p>}
      {!bugsLoading && !bugsError && filteredBugs.length === 0 && <p>No bugs found.</p>}
      {!bugsLoading && !bugsError && filteredBugs.length > 0 && (
        <ul>
          {filteredBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              onNavigate={() => navigate(`/projects/${projectId}/bugs/${bug.id}`)}
              onEdit={() => { setEditingBug(bug); setModalOpen(true); }}
            />
          ))}
        </ul>
      )}

      {modalOpen && (
        <BugModal
          bug={editingBug}
          onClose={() => { setModalOpen(false); setEditingBug(undefined); }}
          onSubmit={editingBug
            ? (payload) => updateBug(editingBug.id, payload)
            : (payload) => createBug(payload)
          }
        />
      )}
    </div>
  );
}

export default ProjectDetail;
