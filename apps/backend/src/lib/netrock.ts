import type {
	IMatchData,
	INetRocKDataPlayer,
	INetRockData,
	INetRockDataTeam,
	IPlayer,
	IPlayerData,
	IRoundCeremony,
} from "../Types.ts";
import { redis } from "./redis.ts";

const initialConfig = await redis.getConfig();

export const initialNetRock: INetRockData = {
	inMatch:
		initialConfig.inMatchStatusOverride !== ""
			? initialConfig.inMatchStatusOverride
			: false,
	roundWin: {
		wonTeam: false,
		roundCeremony: {
			normal: false,
			ace: false,
			clutch: false,
			teamAce: false,
			flawless: false,
		},
	},
	timeout: {
		techTimeout: false,
		teamTimeout: false,
	},
	teams: [],
	players: [],
};

let netRock: INetRockData = initialNetRock;

let lastMatchData: IMatchData | undefined;

let clutchWasnScheis: number[] = [-1, -1];

export async function clearData() {
	await redis.storeNetrock(initialNetRock);
	netRock = initialNetRock;
	lastMatchData = undefined;
}

export async function updateDbData() {
	if (lastMatchData !== undefined) {
		await updateData(lastMatchData);
	} else {
		const config = await redis.getConfig();
		netRock.inMatch =
			config.inMatchStatusOverride !== ""
				? config.inMatchStatusOverride
				: false;
		sendNetRockUpdate();
	}
}

export async function updateData(data: IMatchData) {
	if (data.roundPhase === "shopping") clutchWasnScheis = [-1, -1];
	if (
		data.roundPhase === "end" &&
		(data.teams[0]?.roundsWon === 13 || data.teams[1]?.roundsWon === 13)
	)
		setTimeout(() => clearData(), 7000);

	calculateClutch(data);
	const roundCeremony = calculateRoundCeremony(data);

	const players: INetRocKDataPlayer[] = [];
	let redisPlayers: IPlayer[] | null = await redis.getPlayers();
	if (redisPlayers == null) {
		redisPlayers = [];
	}

	for (const [teamIndex, team] of data.teams.entries()) {
		for (const player of team.players) {
			const redisPlayer = redisPlayers.find((p) => p.riotId === player.riotId);
			players.push({
				id: redisPlayer?.id ?? 1,
				teamId: teamIndex,
				name: await getName(player),
				kills: player.kills,
				deaths: player.deaths,
				assists: player.assists,
				isAlive: player.isAlive,
				killsThisRound: player.killsThisRound,
			});
		}
	}

	const teams: INetRockDataTeam[] = [];

	for (const [teamIndex, team] of data.teams.entries()) {
		let teamWonMatch = false;
		if (team.roundsWon >= 13) {
			if (team.roundsWon - (data.teams[teamIndex - 1]?.roundsWon || 0) >= 2) {
				teamWonMatch = true;
			}
		}
		teams.push({
			name: team.teamName,
			tricode: team.teamTricode,
			logoUrl: team.teamUrl,
			isAttacker: team.isAttacking,
			roundsWon: team.roundsWon,
			teamWonMatch: teamWonMatch,
		});
	}

	const config = await redis.getConfig();

	const newNetRock: INetRockData = {
		inMatch:
			config.inMatchStatusOverride === ""
				? data.roundPhase !== "LOBBY" && data.roundPhase !== "game_end"
				: config.inMatchStatusOverride,
		roundWin: {
			wonTeam:
				data.roundPhase === "end"
					? data.attackersWon
						? data.teams[0]?.isAttacking
							? "left"
							: "right"
						: data.teams[0]?.isAttacking
							? "right"
							: "left"
					: false,
			roundCeremony,
		},
		timeout: {
			techTimeout: data.timeoutState.techPause,
			teamTimeout: data.timeoutState.leftTeam
				? "left"
				: data.timeoutState.rightTeam
					? "right"
					: false,
		},
		teams,
		players,
	};
	if (newNetRock !== netRock) {
		netRock = newNetRock;
		sendNetRockUpdate();
	}
	lastMatchData = data;
}

function calculateRoundCeremony(data: IMatchData): IRoundCeremony {
	const defaultRoundCeremony: IRoundCeremony = {
		normal: false,
		ace: false,
		clutch: false,
		teamAce: false,
		flawless: false,
	};

	if (data.roundPhase !== "end") return defaultRoundCeremony;

	const teamWon = data.attackersWon
		? data.teams[0]?.isAttacking
			? 0
			: 1
		: data.teams[0]?.isAttacking
			? 1
			: 0;

	const wonTeam = data.teams[teamWon];
	const lostTeam = data.teams[teamWon === 0 ? 1 : 0];

	if (!wonTeam || !lostTeam) {
		return defaultRoundCeremony;
	}

	let ace = false;
	let clutch: boolean;
	let flawless = true;
	let teamAce = true;

	const lostTeamPlayerNames = new Set(
		lostTeam.players.map((player) => player.name),
	);

	lostTeam.players.forEach((player) => {
		if (player.isAlive) flawless = false;
	});

	for (const player of wonTeam.players) {
		if (player.killedPlayerNames) {
			const killsFromLostTeam = player.killedPlayerNames.filter((playerName) =>
				lostTeamPlayerNames.has(playerName),
			);

			if (new Set(killsFromLostTeam).size >= 5) {
				ace = true;
				break;
			}
		}
		if (player.deathsThisRound >= 1) flawless = false;
		if (!(player.killsThisRound >= 1)) teamAce = false;
	}

	clutch = clutchWasnScheis[teamWon] === 1;

	if (ace) {
		clutch = false;
		teamAce = false;
		flawless = false;
	}
	if (clutch) {
		teamAce = false;
		flawless = false;
	}
	if (teamAce) {
		flawless = false;
	}

	return {
		normal: !ace && !clutch && !flawless && !teamAce,
		ace,
		clutch,
		teamAce,
		flawless,
	};
}

function calculateClutch(data: IMatchData) {
	const teamOne = data.teams[0];
	const teamTwo = data.teams[1];

	if (!teamOne || !teamTwo) return;

	const aliveCountTeamOne = teamOne.players.filter(
		(player: IPlayerData) => player.isAlive,
	).length;
	const aliveCountTeamTwo = teamTwo.players.filter(
		(player: IPlayerData) => player.isAlive,
	).length;

	if (aliveCountTeamOne < 1 || aliveCountTeamOne >= 2) clutchWasnScheis[0] = 0;
	if (aliveCountTeamTwo < 1 || aliveCountTeamTwo >= 2) clutchWasnScheis[1] = 0;

	if (
		(aliveCountTeamOne === 1 && aliveCountTeamTwo >= 2) ||
		clutchWasnScheis[0] === 1
	)
		clutchWasnScheis[0] = 1;
	if (
		(aliveCountTeamTwo === 1 && aliveCountTeamOne >= 2) ||
		clutchWasnScheis[1] === 1
	)
		clutchWasnScheis[1] = 1;
}

async function getName(player: IPlayerData): Promise<string> {
	const players = await redis.getPlayers();
	if (players) {
		const playerExtra = players.find((entry) => entry.riotId === player.riotId);
		if (playerExtra && playerExtra.name !== "") {
			return playerExtra.name;
		}
	}

	return player.name;
}

async function sendNetRockUpdate() {
	const config = await redis.getConfig();
	redis.storeNetrock(netRock);
}
