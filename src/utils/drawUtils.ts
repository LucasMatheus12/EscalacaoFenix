import type { Player } from "../types/player";
import type { DrawResult, Team } from "../types/team";

export const sortPlayersByName = (players: Player[]): Player[] =>
  [...players].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

export const isGoalkeeper = (player: Player): boolean =>
  player.position.trim().toLowerCase() === "goleiro";

export const isReserve = (player: Player): boolean =>
  player.position.trim().toLowerCase() === "reserva";

export const sitsOutOfDraw = (player: Player): boolean =>
  isGoalkeeper(player) || isReserve(player);

export const fieldPlayersOf = (players: Player[]): Player[] =>
  players.filter((player) => !sitsOutOfDraw(player));

export const goalkeepersOf = (players: Player[]): Player[] =>
  players.filter(isGoalkeeper);

export const listedReservesOf = (players: Player[]): Player[] =>
  players.filter(isReserve);

export const recalculateTeam = (team: Team): Team => {
  const totalStars = team.players.reduce((sum, player) => sum + player.rating, 0);

  return {
    ...team,
    totalStars,
    averageStars: team.players.length
      ? Number((totalStars / team.players.length).toFixed(2))
      : 0,
  };
};

export interface BalanceScore {
  averageSpread: number;
  totalSpread: number;
  gkSpread: number;
  averageVariance: number;
}

const teamAverages = (teams: Team[]): number[] =>
  teams.map((team) => (team.players.length ? team.totalStars / team.players.length : 0));

export const scoreTeams = (teams: Team[]): BalanceScore => {
  const averages = teamAverages(teams);
  const totals = teams.map((team) => team.totalStars);
  const gkCounts = teams.map((team) => team.players.filter(isGoalkeeper).length);
  const mean = averages.reduce((sum, value) => sum + value, 0) / Math.max(averages.length, 1);
  const averageVariance =
    averages.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(averages.length, 1);

  return {
    averageSpread: Math.max(...averages) - Math.min(...averages),
    totalSpread: Math.max(...totals) - Math.min(...totals),
    gkSpread: Math.max(...gkCounts) - Math.min(...gkCounts),
    averageVariance,
  };
};

export const isBetterScore = (next: BalanceScore, current: BalanceScore): boolean => {
  if (Math.abs(next.averageSpread - current.averageSpread) > 1e-9) {
    return next.averageSpread < current.averageSpread;
  }

  if (Math.abs(next.totalSpread - current.totalSpread) > 1e-9) {
    return next.totalSpread < current.totalSpread;
  }

  if (next.gkSpread !== current.gkSpread) {
    return next.gkSpread < current.gkSpread;
  }

  return next.averageVariance < current.averageVariance - 1e-12;
};

export const averageSpreadOf = (teams: Team[]): number => {
  const averages = teamAverages(teams);
  return Number((Math.max(...averages) - Math.min(...averages)).toFixed(2));
};

export type PlayerSlot =
  | { kind: "team"; teamId: number; playerId: string }
  | { kind: "reserve"; playerId: string }
  | { kind: "goalkeeper"; playerId: string };

const findPlayer = (result: DrawResult, slot: PlayerSlot): Player | undefined => {
  if (slot.kind === "reserve") {
    return result.reserves.find((player) => player.id === slot.playerId);
  }

  if (slot.kind === "goalkeeper") {
    return result.goalkeepers?.find((player) => player.id === slot.playerId);
  }

  const team = result.teams.find((item) => item.id === slot.teamId);
  return team?.players.find((player) => player.id === slot.playerId);
};

export const swapPlayersInDraw = (
  result: DrawResult,
  slotA: PlayerSlot,
  slotB: PlayerSlot,
): DrawResult => {
  if (slotA.playerId === slotB.playerId) {
    return result;
  }

  const playerA = findPlayer(result, slotA);
  const playerB = findPlayer(result, slotB);

  if (!playerA || !playerB) {
    return result;
  }

  const teams = result.teams.map((team) => ({
    ...team,
    players: [...team.players],
  }));
  let reserves = [...result.reserves];
  let goalkeepers = [...(result.goalkeepers ?? [])];

  const removeFromSlot = (slot: PlayerSlot) => {
    if (slot.kind === "reserve") {
      reserves = reserves.filter((player) => player.id !== slot.playerId);
      return;
    }

    if (slot.kind === "goalkeeper") {
      goalkeepers = goalkeepers.filter((player) => player.id !== slot.playerId);
      return;
    }

    const team = teams.find((item) => item.id === slot.teamId);
    if (team) {
      team.players = team.players.filter((player) => player.id !== slot.playerId);
    }
  };

  const addToSlot = (slot: PlayerSlot, player: Player) => {
    if (slot.kind === "reserve") {
      reserves = sortPlayersByName([...reserves, player]);
      return;
    }

    if (slot.kind === "goalkeeper") {
      goalkeepers = sortPlayersByName([...goalkeepers, player]);
      return;
    }

    const team = teams.find((item) => item.id === slot.teamId);
    if (team) {
      team.players = sortPlayersByName([...team.players, player]);
    }
  };

  removeFromSlot(slotA);
  removeFromSlot(slotB);
  addToSlot(slotA, playerB);
  addToSlot(slotB, playerA);

  const updatedTeams = teams.map(recalculateTeam);

  return {
    teams: updatedTeams,
    reserves: sortPlayersByName(reserves),
    goalkeepers: sortPlayersByName(goalkeepers),
    balanceSpread: averageSpreadOf(updatedTeams),
  };
};
