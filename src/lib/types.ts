export type User = {
  id: string;
  name: string;
  vote: string | null;
  isSpectator: boolean;
};

export type Room = {
  id: string;
  name: string;
  users: User[];
  isRevealed: boolean;
  isVotingClosed: boolean;
  createdAt: number;
};
