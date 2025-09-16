// src/app/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  PROJECTS,
  CREATE_PROJECT,
  type ProjectsQuery,
  type ProjectsVariables,
  type CreateProjectMutation,
  type CreateProjectVariables,
} from '@/lib/graphql';
import Link from 'next/link';
import { getActiveTeam, setActiveTeam } from '@/lib/team';
import { useTeam } from '@/lib/team-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Dashboard() {
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
  } = useTeam();

  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelectedTeam(getActiveTeam() ?? undefined);
  }, []);

  useEffect(() => {
    if (selectedTeam) setActiveTeam(selectedTeam);
  }, [selectedTeam]);

  // ✅ TypedDocumentNode gives us data/variables types; use skip to guard variables
  const { data: pdata, refetch } = useQuery<ProjectsQuery, ProjectsVariables>(
    PROJECTS,
    {
      variables: { teamId: (selectedTeam as string) },
      skip: !selectedTeam,
      fetchPolicy: 'cache-and-network',
    }
  );

  // ✅ Correct variable shape (no `input` wrapper) for CREATE_PROJECT
  const [createProject, { loading: creatingProject }] = useMutation<
    CreateProjectMutation,
    CreateProjectVariables
  >(CREATE_PROJECT, { onCompleted: () => refetch() });

  const handleCreateProject = async () => {
    if (!selectedTeam) return;
    const name = prompt('Project name?') || 'New Project';
    const key = (name.split(' ')[0] || 'NP').toUpperCase().slice(0, 4);
    try {
      await createProject({
        variables: {input: { teamId: selectedTeam, name, key } },
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading teams..." />
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load teams</div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const projects = pdata?.projects ?? [];

  return (
    <div className="p-6 space-y-8">
    

      {/* Teams */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Teams</h2>
          <div className="flex gap-3 flex-wrap">
            {teams.map((team: any) => (
              <Button
                key={team.id}
                variant={selectedTeam === team.id ? 'primary' : 'secondary'}
                size="md"
                onClick={() => setSelectedTeam(team.id)}
                className="min-w-[120px]"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{team.name}</span>
                </div>
              </Button>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-sm">No teams available</p>
              <p className="text-xs text-gray-400 mt-1">
                Create a team to get started
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Projects */}
      {selectedTeam && (
        <Card variant="elevated" padding="lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
              <Button
                size="md"
                variant="primary"
                onClick={handleCreateProject}
                loading={creatingProject}
              >
                + New Project
              </Button>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    variant="outlined"
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <Link href={`/t/${project.teamId}/p/${project.id}/docs`}>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {project.key}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {project.name}
                            </h3>
                            <p className="text-xs text-gray-500">Key: {project.key}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-sm">No projects yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create your first project to get started
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!selectedTeam && teams.length > 0 && (
        <Card variant="flat" padding="lg" className="text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">👆</div>
            <p className="text-sm">Select a team to view projects</p>
          </div>
        </Card>
      )}
    </div>
  );
}
