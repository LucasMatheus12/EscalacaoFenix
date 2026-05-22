import type { Player } from "../types/player";
import type { DrawResult, Team } from "../types/team";

export const sortPlayersByName = (players: Player[]): Player[] =>
  [...players].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

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

const recalculateBalanceSpread = (teams: Team[]): number => {
  const totals = teams.map((team) => team.totalStars);
  return Math.max(...totals) - Math.min(...totals);
};

export type PlayerSlot =
  | { kind: "team"; teamId: number; playerId: string }
  | { kind: "reserve"; playerId: string };

const findPlayer = (result: DrawResult, slot: PlayerSlot): Player | undefined => {
  if (slot.kind === "reserve") {
    return result.reserves.find((player) => player.id === slot.playerId);
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

  const removeFromSlot = (slot: PlayerSlot) => {
    if (slot.kind === "reserve") {
      reserves = reserves.filter((player) => player.id !== slot.playerId);
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
    balanceSpread: recalculateBalanceSpread(updatedTeams),
  };
};
