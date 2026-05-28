import { useState } from 'react';
import { Member, Role } from '../types';

interface Props {
  members: Member[];
  currentUserId: string;
  currentUserRole: Role;
  onRemove: (userId: string) => Promise<void>;
  onRoleChange: (userId: string, role: Role) => Promise<void>;
}

const roleBadge = (role: Role) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      role === 'ADMIN'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }`}
  >
    {role === 'ADMIN' ? 'Admin' : 'Member'}
  </span>
);

function MemberPanel({ members, currentUserId, currentUserRole, onRemove, onRoleChange }: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      await onRemove(userId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    setUpdatingRoleId(userId);
    try {
      await onRoleChange(userId, role);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Members{' '}
        <span className="text-gray-400 font-normal">({members.length})</span>
      </h2>
      <ul className="space-y-2">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const canManage = currentUserRole === 'ADMIN' && !isSelf;

          return (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
            >
              <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                {member.email}
                {isSelf && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                {canManage ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                      disabled={updatingRoleId === member.userId}
                      className="input w-auto text-xs py-1"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button
                      onClick={() => handleRemove(member.userId)}
                      disabled={removingId === member.userId}
                      className="btn-ghost text-xs px-2 py-1 text-red-500 hover:text-red-600 dark:text-red-400"
                    >
                      {removingId === member.userId ? 'Removing...' : 'Remove'}
                    </button>
                  </>
                ) : (
                  roleBadge(member.role)
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default MemberPanel;
