export const setActiveTeam = (id: string) => {
  if (typeof window !== 'undefined') localStorage.setItem('activeTeam', id);
};

export const getActiveTeam = () =>
  typeof window !== 'undefined' ? localStorage.getItem('activeTeam') : null;
