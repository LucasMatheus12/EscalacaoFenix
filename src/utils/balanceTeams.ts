import type { Player } from "../types/player";
import type { DrawResult, Team } from "../types/team";
import {
  averageSpreadOf,
  fieldPlayersOf,
  isBetterScore,
  isGoalkeeper,
  listedReservesOf,
  recalculateTeam,
  scoreTeams,
  sortPlayersByName,
} from "./drawUtils";

const ATTEMPTS = 80;

const createTeams = (teamCount: number): Team[] =>
  Array.from({ length: teamCount }, (_, index) => ({
    id: index + 1,
    name: `Time ${index + 1}`,
    players: [],
    totalStars: 0,
    averageStars: 0,
  }));

const cloneTeams = (teams: Team[]): Team[] =>
  teams.map((team) => ({
    ...team,
    players: [...team.players],
  }));

const refresh = (teams: Team[]): Team[] => teams.map(recalculateTeam);

const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
  }

  return next;
};

const shuffleRatingTies = (players: Player[]): Player[] => {
  const sorted = [...players].sort((left, right) => right.rating - left.rating);
  const groups: Player[][] = [];

  sorted.forEach((player) => {
    const current = groups[groups.length - 1];
    if (current && current[0].rating === player.rating) {
      current.push(player);
      return;
    }

    groups.push([player]);
  });

  return groups.flatMap((group) => shuffle(group));
};

const teamAverage = (team: Team): number =>
  team.players.length ? team.totalStars / team.players.length : 0;

const addPlayer = (team: Team, player: Player) => {
  team.players.push(player);
  team.totalStars += player.rating;
};

const pickTeamForPlayer = (candidates: Team[]): Team => {
  const ranked = [...candidates].sort((left, right) => {
    const averageDiff = teamAverage(left) - teamAverage(right);
    if (Math.abs(averageDiff) > 1e-9) {
      return averageDiff;
    }

    const totalDiff = left.totalStars - right.totalStars;
    if (Math.abs(totalDiff) > 1e-9) {
      return totalDiff;
    }

    return left.players.length - right.players.length;
  });

  const best = ranked[0];
  const tied = ranked.filter((team) => {
    const sameAverage = Math.abs(teamAverage(team) - teamAverage(best)) < 1e-9;
    const sameTotal = Math.abs(team.totalStars - best.totalStars) < 1e-9;
    const sameSize = team.players.length === best.players.length;
    return sameAverage && sameTotal && sameSize;
  });

  return tied[Math.floor(Math.random() * tied.length)];
};

const assignGreedy = (
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): Team[] => {
  const teams = createTeams(teamCount);
  const ordered = shuffleRatingTies(players);

  ordered.forEach((player) => {
    const candidates = teams.filter((team) => team.players.length < playersPerTeam);
    addPlayer(pickTeamForPlayer(candidates), player);
  });

  return refresh(teams);
};

const assignSnake = (
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): Team[] => {
  const teams = createTeams(teamCount);
  const ordered = shuffleRatingTies(players);
  const order = shuffle(teams.map((_, index) => index));
  let cursor = 0;
  let direction = 1;

  const nextIndex = () => {
    cursor += direction;
    if (cursor >= teamCount) {
      direction = -1;
      cursor = teamCount - 1;
    } else if (cursor < 0) {
      direction = 1;
      cursor = 0;
    }
  };

  ordered.forEach((player) => {
    for (let step = 0; step < teamCount; step += 1) {
      const team = teams[order[cursor]];
      if (team.players.length < playersPerTeam) {
        addPlayer(team, player);
        break;
      }
      nextIndex();
    }
    nextIndex();
  });

  return refresh(teams);
};

const swapIndexedPlayers = (
  teams: Team[],
  leftTeam: number,
  leftPlayer: number,
  rightTeam: number,
  rightPlayer: number,
) => {
  const left = teams[leftTeam].players[leftPlayer];
  const right = teams[rightTeam].players[rightPlayer];
  teams[leftTeam].players[leftPlayer] = right;
  teams[rightTeam].players[rightPlayer] = left;
  teams[leftTeam] = recalculateTeam(teams[leftTeam]);
  teams[rightTeam] = recalculateTeam(teams[rightTeam]);
};

const rotateIndexedPlayers = (
  teams: Team[],
  slots: Array<{ team: number; player: number }>,
  shift: number,
) => {
  const original = slots.map((slot) => teams[slot.team].players[slot.player]);
  slots.forEach((slot, index) => {
    const from = (index - shift + slots.length) % slots.length;
    teams[slot.team].players[slot.player] = original[from];
  });
  slots.forEach((slot) => {
    teams[slot.team] = recalculateTeam(teams[slot.team]);
  });
};

const improveBySwaps = (input: Team[]): Team[] => {
  let teams = refresh(cloneTeams(input));

  while (true) {
    let bestScore = scoreTeams(teams);
    let bestTeams: Team[] | null = null;

    const consider = (candidate: Team[]) => {
      const nextScore = scoreTeams(candidate);
      if (isBetterScore(nextScore, bestScore)) {
        bestScore = nextScore;
        bestTeams = candidate;
      }
    };

    for (let leftTeam = 0; leftTeam < teams.length; leftTeam += 1) {
      for (let rightTeam = leftTeam + 1; rightTeam < teams.length; rightTeam += 1) {
        for (let leftPlayer = 0; leftPlayer < teams[leftTeam].players.length; leftPlayer += 1) {
          for (let rightPlayer = 0; rightPlayer < teams[rightTeam].players.length; rightPlayer += 1) {
            const trial = cloneTeams(teams);
            swapIndexedPlayers(trial, leftTeam, leftPlayer, rightTeam, rightPlayer);
            consider(trial);
          }
        }
      }
    }

    if (teams.length >= 3) {
      for (let first = 0; first < teams.length; first += 1) {
        for (let second = first + 1; second < teams.length; second += 1) {
          for (let third = second + 1; third < teams.length; third += 1) {
            for (let firstPlayer = 0; firstPlayer < teams[first].players.length; firstPlayer += 1) {
              for (let secondPlayer = 0; secondPlayer < teams[second].players.length; secondPlayer += 1) {
                for (let thirdPlayer = 0; thirdPlayer < teams[third].players.length; thirdPlayer += 1) {
                  const slots = [
                    { team: first, player: firstPlayer },
                    { team: second, player: secondPlayer },
                    { team: third, player: thirdPlayer },
                  ];

                  [1, 2].forEach((shift) => {
                    const trial = cloneTeams(teams);
                    rotateIndexedPlayers(trial, slots, shift);
                    consider(trial);
                  });
                }
              }
            }
          }
        }
      }
    }

    if (!bestTeams) {
      break;
    }

    teams = bestTeams;
  }

  return teams;
};

const improveWithReserves = (teamsInput: Team[], reservesInput: Player[]): {
  teams: Team[];
  reserves: Player[];
} => {
  const teams = refresh(cloneTeams(teamsInput));
  let reserves = [...reservesInput];

  const applyBestReserveSwap = (): boolean => {
    let bestScore = scoreTeams(teams);
    let best:
      | { teamIndex: number; playerIndex: number; reserveIndex: number }
      | undefined;

    teams.forEach((team, teamIndex) => {
      team.players.forEach((player, playerIndex) => {
        reserves.forEach((reserve, reserveIndex) => {
          if (player.rating - reserve.rating > 1) {
            return;
          }

          const nextTeams = refresh(cloneTeams(teams));
          nextTeams[teamIndex].players[playerIndex] = reserve;
          nextTeams[teamIndex] = recalculateTeam(nextTeams[teamIndex]);
          const nextScore = scoreTeams(nextTeams);

          if (isBetterScore(nextScore, bestScore)) {
            bestScore = nextScore;
            best = { teamIndex, playerIndex, reserveIndex };
          }
        });
      });
    });

    if (!best) {
      return false;
    }

    const sitting = teams[best.teamIndex].players[best.playerIndex];
    const coming = reserves[best.reserveIndex];
    teams[best.teamIndex].players[best.playerIndex] = coming;
    teams[best.teamIndex] = recalculateTeam(teams[best.teamIndex]);
    reserves = [...reserves.slice(0, best.reserveIndex), sitting, ...reserves.slice(best.reserveIndex + 1)];
    return true;
  };

  while (applyBestReserveSwap()) {
    // Pull a reserve only when it clearly levels the averages.
  }

  return { teams, reserves };
};

const finalizeTeams = (teams: Team[]): Team[] =>
  refresh(teams).map((team) => ({
    ...team,
    players: sortPlayersByName(team.players),
  }));

export const balanceTeams = (
  players: Player[],
  teamCount: number,
  playersPerTeam: number,
): DrawResult => {
  const goalkeepers = sortPlayersByName(players.filter(isGoalkeeper));
  const listedReserves = sortPlayersByName(listedReservesOf(players));
  const ranked = [...fieldPlayersOf(players)].sort((left, right) => right.rating - left.rating);
  const maxPlayers = teamCount * playersPerTeam;
  const selectedPlayers = ranked.slice(0, maxPlayers);
  const initialReserves = ranked.slice(maxPlayers);

  let bestTeams = assignGreedy(selectedPlayers, teamCount, playersPerTeam);
  let bestScore = scoreTeams(bestTeams);

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const seed =
      attempt % 2 === 0
        ? assignGreedy(selectedPlayers, teamCount, playersPerTeam)
        : assignSnake(selectedPlayers, teamCount, playersPerTeam);
    const candidate = improveBySwaps(seed);
    const score = scoreTeams(candidate);

    if (isBetterScore(score, bestScore)) {
      bestTeams = candidate;
      bestScore = score;
    }
  }

  const leveled = improveWithReserves(bestTeams, initialReserves);
  const teams = finalizeTeams(leveled.teams);

  return {
    teams,
    reserves: sortPlayersByName([...listedReserves, ...leveled.reserves]),
    goalkeepers,
    balanceSpread: averageSpreadOf(teams),
  };
};
