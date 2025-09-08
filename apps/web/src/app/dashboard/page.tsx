'use client';
import { useMutation, useQuery } from '@apollo/client/react';
import { TEAMS, PROJECTS, CREATE_PROJECT } from '@/lib/graphql';
import Link from 'next/link';
import { useState } from 'react';

export default function Dashboard() {
  const { data: tdata } = useQuery(TEAMS);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { data: pdata, refetch } = useQuery(PROJECTS, {
    variables: { teamId: selectedTeam },
    skip: !selectedTeam,
  });
  const [createProject] = useMutation(CREATE_PROJECT, {
    onCompleted: () => refetch(),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <section>
        <h2 className="font-medium mb-2">Your teams</h2>
        <div className="flex gap-2 flex-wrap">
          {(tdata?.teams ?? []).map((t: any) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeam(t.id)}
              className={`px-3 py-2 border rounded ${selectedTeam === t.id ? 'bg-black text-white' : ''}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>
      {selectedTeam && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-medium">Projects</h2>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                const name = prompt('Project name?') || 'New Project';
                const key = (name.split(' ')[0] || 'NP')
                  .toUpperCase()
                  .slice(0, 4);
                createProject({
                  variables: { teamId: selectedTeam, name, key },
                });
              }}
            >
              + New
            </button>
          </div>
          <ul className="list-disc list-inside">
            {(pdata?.projects ?? []).map((p: any) => (
              <li key={p.id}>
                <Link
                  className="underline"
                  href={`/t/${p.teamId}/p/${p.id}/docs`}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
