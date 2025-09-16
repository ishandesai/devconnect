'use client';

import { useState } from 'react';
import { useTeam } from '@/lib/team-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

export function TeamSelector() {
  const { currentTeam, teams, setCurrentTeam, loading, error } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load teams</div>;
  }

  if (teams.length === 0) {
    return <div className="text-sm text-gray-500">No teams available</div>;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">
            {currentTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
          </span>
        </div>
        <span className="font-medium">
          {currentTeam?.name || 'Select Team'}
        </span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen ? 'rotate-180' : ''
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <Card
            variant="elevated"
            className="absolute top-full left-0 mt-2 w-64 z-20 shadow-xl border-0"
            padding="none"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Switch Team</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a team to work with
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setCurrentTeam(team);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                    currentTeam?.id === team.id
                      ? 'bg-blue-50 border-r-2 border-blue-600'
                      : ''
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {team.name}
                      </div>
                      <div className="text-xs text-gray-500">{team.slug}</div>
                    </div>
                    {currentTeam?.id === team.id && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  // TODO: Navigate to team creation
                  console.log('Create new team');
                }}
              >
                + Create New Team
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
