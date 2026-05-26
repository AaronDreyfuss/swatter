import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Bug, Severity, BugStatus } from '../types';

interface CreateBugPayload {
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  errorMessage?: string;
  severity: Severity;
}

interface UpdateBugPayload {
  title?: string;
  description?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorMessage?: string;
  severity?: Severity;
  status?: BugStatus;
}

function useBugs(projectId: string) {
  const [data, setData] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Bug[]>(`/projects/${projectId}/bugs`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load bugs.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const createBug = async (payload: CreateBugPayload): Promise<Bug> => {
    const { data: bug } = await api.post<Bug>(`/projects/${projectId}/bugs`, payload);
    setData((prev) => [...prev, bug]);
    return bug;
  };

  const updateBug = async (bugId: string, payload: UpdateBugPayload): Promise<Bug> => {
    const { data: updated } = await api.patch<Bug>(
      `/projects/${projectId}/bugs/${bugId}`,
      payload
    );
    setData((prev) => prev.map((b) => (b.id === bugId ? updated : b)));
    return updated;
  };

  const deleteBug = async (bugId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/bugs/${bugId}`);
    setData((prev) => prev.filter((b) => b.id !== bugId));
  };

  const assignBug = async (bugId: string, assignedToId: string | null): Promise<Bug> => {
    const { data: updated } = await api.patch<Bug>(
      `/projects/${projectId}/bugs/${bugId}/assign`,
      { assignedToId }
    );
    setData((prev) => prev.map((b) => (b.id === bugId ? updated : b)));
    return updated;
  };

  return { data, loading, error, createBug, updateBug, deleteBug, assignBug };
}

export default useBugs;
