export type User = {
  id: string;
  name: string;
  vote: string | null;
  isSpectator: boolean;
  avatar: string;
};

export type Room = {
  id: string;
  name: string;
  taskName: string;
  users: User[];
  isRevealed: boolean;
  isVotingClosed: boolean;
  cardSet?: string[];
  createdAt: number;
};
