import type { Player } from "../types/player";
import type { DrawResult, Team } from "../types/team";

const randomItem = <T,>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

export const balanceTeams = (
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): DrawResult => {
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
  const teams: Team[] = Array.from({ length: teamCount }, (_, index) => ({
    id: index + 1,
    name: `Time ${index + 1}`,
    players: [],
    totalStars: 0,
    averageStars: 0,
  }));

  const maxPlayers = teamCount * playersPerTeam;
  const selectedPlayers = sortedPlayers.slice(0, maxPlayers);
  const reserves = sortedPlayers.slice(maxPlayers);

  selectedPlayers.forEach((player) => {
    const candidates = teams.filter((team) => team.players.length < playersPerTeam);
    const minStars = Math.min(...candidates.map((team) => team.totalStars));
    const byStars = candidates.filter((team) => team.totalStars === minStars);
    const minPlayers = Math.min(...byStars.map((team) => team.players.length));
    const byPlayers = byStars.filter((team) => team.players.length === minPlayers);
    const chosen = randomItem(byPlayers);

    chosen.players.push(player);
    chosen.totalStars += player.rating;
    chosen.averageStars = Number((chosen.totalStars / chosen.players.length).toFixed(2));
  });

  const totals = teams.map((team) => team.totalStars);
  const balanceSpread = Math.max(...totals) - Math.min(...totals);

  return { teams, reserves, balanceSpread };
};
