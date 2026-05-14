import { RedisClient } from "bun";
import type { IConfig, INetRockData, IPlayer } from "../Types.ts";
import { initialNetRock, updateDbData } from "./netrock";
import {
	emitConfigUpdate,
	emitExtraUpdate,
	emitNetrockUpdate,
} from "./socket.ts";

const redisClient = new RedisClient();

redisClient.onconnect = () => {
	console.log("Connected to Redis server");
};

process.on("beforeExit", (_code) => {
	redisClient.close();
});

class Redis {
	async getNetrock(): Promise<INetRockData> {
		const data = await redisClient.get("netrock");
		if (data === null) {
			await this.storeNetrock(initialNetRock);
			return initialNetRock;
		}
		return JSON.parse(data) as INetRockData;
	}

	async storeNetrock(netrock: INetRockData) {
		await redisClient.set("netrock", JSON.stringify(netrock));
		await emitNetrockUpdate(netrock);
	}

	async getPlayers(): Promise<IPlayer[]> {
		const data = await redisClient.get("players");
		if (data === null) {
			await this.storePlayers(defaultPlayers);
			return defaultPlayers;
		}
		return JSON.parse(data) as IPlayer[];
	}

	async storePlayers(players: IPlayer[]) {
		await redisClient.set("players", JSON.stringify(players));
		await emitExtraUpdate(players);
		await updateDbData();
	}

	async getConfig(): Promise<IConfig> {
		const data = await redisClient.get("config");
		if (data === null) {
			await this.storeConfig(defaultConfig);
			return defaultConfig;
		}
		return JSON.parse(data) as IConfig;
	}

	async storeConfig(config: IConfig) {
		await redisClient.set("config", JSON.stringify(config));
		const players = await this.getPlayers();
		await emitExtraUpdate(players);
		await emitConfigUpdate(config);
		await updateDbData();
	}
}

export const redis = new Redis();

const defaultPlayers: IPlayer[] = [];

const defaultConfig: IConfig = {
	netrockUrl: "",
	netrockStreamUrlPrefix: "",
	netrockStreamUrlSuffix: "",
	inGameStatusOverride: "",
};
