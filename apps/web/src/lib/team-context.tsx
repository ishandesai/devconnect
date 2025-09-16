'use client';

import { gql, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getActiveTeam, setActiveTeam } from './team';

type TeamsQueryData = {
  teams: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  }>;
};
type TeamsQueryVars = Record<string, never>;
type Team = TeamsQueryData['teams'][number];

export const TEAMS_QUERY: TypedDocumentNode<TeamsQueryData, TeamsQueryVars> =
  gql`
    query Teams {
      teams {
        id
        name
        slug
        createdAt
      }
    }
  `;

/* ── Context ────────────────────────────────────────────────────────────── */
interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  setCurrentTeam: (team: Team | null) => void;
  loading: boolean;
  error: Error | undefined;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

/* ── Provider ───────────────────────────────────────────────────────────── */
export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const { data, loading, error } = useQuery(TEAMS_QUERY);

  const teams = data?.teams ?? [];

  useEffect(() => {
    if (teams.length === 0) return;

    const activeId = getActiveTeam();
    const found = activeId ? teams.find((t) => t.id === activeId) : null;

    if (found) {
      if (!currentTeam || currentTeam.id !== found.id) setCurrentTeam(found);
    } else if (!currentTeam) {
      setCurrentTeam(teams[0]);
    }
  }, [teams]); // depend only on teams to avoid unnecessary loops

  useEffect(() => {
    if (currentTeam) setActiveTeam(currentTeam.id);
  }, [currentTeam]);

  return (
    <TeamContext.Provider
      value={{ currentTeam, teams, setCurrentTeam, loading, error }}
    >
      {children}
    </TeamContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useTeam() {
  const ctx = useContext(TeamContext);
  if (ctx === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return ctx;
}
