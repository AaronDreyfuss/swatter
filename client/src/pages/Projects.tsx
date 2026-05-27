import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';

function Projects() {
  const { data, loading, error, createProject, joinProject } = useProjects();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await createProject(projectName);
      setProjectName('');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setCreateError(message ?? 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinLoading(true);
    try {
      await joinProject(inviteCode);
      setInviteCode('');
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { err?: string } } }).response?.data?.err
          : undefined;
      setJoinError(message ?? 'Failed to join project.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Projects</h1>

      {loading && <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">You have no projects yet.</p>
      )}
      {!loading && !error && data.length > 0 && (
        <ul className="space-y-2 mb-8">
          {data.map((project) => (
            <li key={project.id}>
              <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-900 dark:text-gray-100 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
              >
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Create a project
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="form-label">Project name</label>
              <input
                id="projectName"
                type="text"
                name="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="input"
              />
            </div>
            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
            )}
            <button type="submit" disabled={createLoading} className="btn-primary w-full">
              {createLoading ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Join a project
          </h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="form-label">Invite code</label>
              <input
                id="inviteCode"
                type="text"
                name="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="input"
              />
            </div>
            {joinError && (
              <p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>
            )}
            <button type="submit" disabled={joinLoading} className="btn-primary w-full">
              {joinLoading ? 'Joining...' : 'Join project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Projects;
