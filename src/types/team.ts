import type { Player } from "./player";

export interface Team {
  id: number;
  name: string;
  players: Player[];
  totalStars: number;
  averageStars: number;
}

export interface DrawConfig {
  teamCount: number;
  playersPerTeam: number;
}

export interface DrawResult {
  teams: Team[];
  reserves: Player[];
  balanceSpread: number;
}
