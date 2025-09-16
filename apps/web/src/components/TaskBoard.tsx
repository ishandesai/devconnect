'use client';

import { useMemo, useState } from 'react';
// If your hooks live under /react in your setup, use:
 import { useApolloClient, useMutation, useQuery, useSubscription } from '@apollo/client/react';
import {
  TASKS,
  ADD_TASK,
  UPDATE_TASK_STATUS,
  TASK_ADDED_SUB,
  TASK_UPDATED_SUB,
  // typed ops (from your queries.ts)
  type TasksQuery,
  type TasksVariables,
  type AddTaskMutation,
  type AddTaskVariables,
  type UpdateTaskStatusMutation,
  type UpdateTaskStatusVariables,
  type TaskAddedSubscription,
  type TaskAddedVariables,
  type TaskUpdatedSubscription,
  type TaskUpdatedVariables,
} from '@/lib/graphql';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const COLUMNS = [
  { key: 'TODO' as const,  label: 'To Do',  color: 'text-gray-600',  bgColor: 'bg-gray-50'  },
  { key: 'DOING' as const, label: 'Doing', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { key: 'DONE' as const,  label: 'Done',   color: 'text-green-600', bgColor: 'bg-green-50' },
];

type ID = string;
type Task = TasksQuery['tasks'][number]; // derive from operation

export default function TaskBoard({ projectId }: { projectId: string }) {
  const client = useApolloClient();

  // Query
  const { data, loading, error } = useQuery<TasksQuery, TasksVariables>(TASKS, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });

  // Mutations
  const [addTask, { loading: adding }] = useMutation<AddTaskMutation, AddTaskVariables>(ADD_TASK);
  const [setStatus] = useMutation<UpdateTaskStatusMutation, UpdateTaskStatusVariables>(UPDATE_TASK_STATUS);

  const [addError, setAddError] = useState<string | null>(null);
  const tasks = data?.tasks ?? [];

  // Subscriptions — inserts
  useSubscription<TaskAddedSubscription, TaskAddedVariables>(TASK_ADDED_SUB, {
    variables: { projectId },
    onData: ({ data }) => {
      const task = data.data?.taskAdded;
      if (!task) return;

      client.cache.updateQuery<TasksQuery, TasksVariables>(
        { query: TASKS, variables: { projectId } },
        (prev) => {
          const existing = prev?.tasks ?? [];
          if (existing.some((t) => t.id === task.id)) return prev;
          return { tasks: [...existing, task] };
        }
      );
    },
  });

  // Subscriptions — updates
  useSubscription<TaskUpdatedSubscription, TaskUpdatedVariables>(TASK_UPDATED_SUB, {
    variables: { projectId },
    onData: ({ data }) => {
      const task = data.data?.taskUpdated;
      if (!task) return;

      client.cache.updateQuery<TasksQuery, TasksVariables>(
        { query: TASKS, variables: { projectId } },
        (prev) => {
          const list = prev?.tasks ?? [];
          const idx = list.findIndex((t) => t.id === task.id);
          if (idx === -1) return prev;
          const next = list.slice();
          next[idx] = { ...next[idx], ...task };
          return { tasks: next };
        }
      );
    },
  });

  // Group by column
  type ColumnsMap = Record<Task['status'], Task[]>;
  const byCol = useMemo<ColumnsMap>(() => {
    const acc: ColumnsMap = { TODO: [], DOING: [], DONE: [] };
    for (const t of tasks) acc[t.status].push(t);
    return acc;
  }, [tasks]);

  const handleAddTask = async () => {
    setAddError(null);
    const title = (prompt('Task title?') || 'New Task').trim();
    if (!title) return;

    const tempId = `temp-${Date.now()}`;
    try {
      await addTask({
        variables: { projectId, title },
        optimisticResponse: {
  // keep it matching the mutation result type exactly (no __typename here)
  addTask: {
    id: tempId,
    title,
    status: 'TODO',
  },
},
update: (cache, { data }) => {
  // mutation result might not include `priority`, but your TASKS list expects it
  const newTask = data?.addTask ?? { id: tempId, title, status: 'TODO' as const };

  const vars = { projectId };
  const existing =
    cache.readQuery<TasksQuery, TasksVariables>({ query: TASKS, variables: vars })?.tasks ?? [];

  if (existing.some((t) => t.id === newTask.id)) return;

  // shape it to the TASKS row type (which includes `priority`)
  const newTaskForList: TasksQuery['tasks'][number] = {
    id: newTask.id,
    title: newTask.title,
    status: newTask.status,
    priority: 0, // <-- default (or pick a sensible default per your app)
  };

  cache.writeQuery<TasksQuery, TasksVariables>({
    query: TASKS,
    variables: vars,
    data: { tasks: [...existing, newTaskForList] },
  });
},
      });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add task');
      console.error('Failed to add task:', err);
    }
  };

  const handleStatusChange = async (taskId: ID, newStatus: Task['status']) => {
    const now = new Date().toISOString();
    try {
      await setStatus({
        variables: { id: taskId, status: newStatus },
        optimisticResponse: {
          updateTaskStatus: {
            id: taskId,
            status: newStatus,
            updatedAt: now,  // <-- include because it's in the selection set
            projectId,       // <-- from the component prop
            title: '',       // placeholder; you preserve cached title in update()
          },
        },
        update: (cache, { data }) => {
          const updated = data?.updateTaskStatus;
          const vars = { projectId };
          const existing =
            cache.readQuery<TasksQuery, TasksVariables>({ query: TASKS, variables: vars })?.tasks ?? [];

          const idx = existing.findIndex((t) => t.id === taskId);
          if (idx === -1) return;

          const base = existing[idx];
          const merged: Task = {
            ...base,
            ...updated,
            title: base.title || updated?.title || '', // keep original title if optimistic was empty
          };

          const next = existing.slice();
          next[idx] = merged;

          cache.writeQuery<TasksQuery, TasksVariables>({
            query: TASKS,
            variables: vars,
            data: { tasks: next },
          });
        },
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load tasks</div>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Task Board</h2>
          <p className="text-gray-600 mt-2">Kanban board with live updates</p>
        </div>
        <Button size="lg" variant="primary" onClick={handleAddTask} loading={adding}>
          + Add Task
        </Button>
      </div>

      {addError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {COLUMNS.map((column) => (
          <div key={column.key} className="space-y-4">
            {/* Column Header */}
            <div className={`${column.bgColor} rounded-xl p-4 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-lg ${column.color}`}>{column.label}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${column.bgColor} ${column.color} border border-current`}>
                  {byCol[column.key].length}
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[400px]">
              {byCol[column.key].map((task: any) => (
                <Card
                  key={task.id}
                  variant="elevated"
                  className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group border-0"
                >
                  <div className="space-y-3">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </div>

                    <div className="text-xs text-gray-400 font-mono">#{task.id.slice(0, 8)}</div>

                    {/* If you keep createdAt in TASKS, you can show it here. Otherwise remove. */}

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      {prevStatus(task.status) && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, prevStatus(task.status)!)}
                          className="text-xs"
                        >
                          ← Back
                        </Button>
                      )}
                      {nextStatus(task.status) && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleStatusChange(task.id, nextStatus(task.status)!)}
                          className="text-xs"
                        >
                          Advance →
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Empty Column */}
              {byCol[column.key].length === 0 && (
                <Card variant="flat" className="p-8 text-center min-h-[200px] flex items-center justify-center">
                  <div className="text-gray-400">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-sm">No tasks in {column.label.toLowerCase()}</div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Global Empty State */}
      {tasks.length === 0 && (
        <Card variant="flat" className="p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No tasks yet</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Create your first task to get started with the Kanban board.
            </p>
            <Button size="lg" variant="primary" onClick={handleAddTask}>
              + Create Your First Task
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function nextStatus(s: Task['status']): Task['status'] | null {
  return s === 'TODO' ? 'DOING' : s === 'DOING' ? 'DONE' : null;
}
function prevStatus(s: Task['status']): Task['status'] | null {
  return s === 'DONE' ? 'DOING' : s === 'DOING' ? 'TODO' : null;
}
