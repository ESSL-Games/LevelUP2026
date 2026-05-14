import { RedisClient } from "bun";
import type { IConfig, INetRockData, IPlayer } from "../Types.ts";
import { updateNames } from "./netrock";
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
	async getNetrock(): Promise<INetRockData | null> {
		const data = await redisClient.get("netrock");
		if (data === null) {
			return null;
		}
		return JSON.parse(data) as INetRockData;
	}

	async storeNetrock(netrock: INetRockData) {
		await redisClient.set("netrock", JSON.stringify(netrock));
		await emitNetrockUpdate(netrock);
	}

	async getPlayers(): Promise<IPlayer[] | null> {
		const data = await redisClient.get("players");
		if (data === null) {
			return null;
		}
		return JSON.parse(data) as IPlayer[];
	}

	async storePlayers(players: IPlayer[]) {
		await redisClient.set("players", JSON.stringify(players));
		await emitExtraUpdate(players);
		await updateNames();
	}

	async getConfig(): Promise<IConfig | null> {
		const data = await redisClient.get("config");
		if (data === null) {
			return null;
		}
		return JSON.parse(data) as IConfig;
	}

	async storeConfig(config: IConfig) {
		await redisClient.set("config", JSON.stringify(config));
		const players = await this.getPlayers();
		if (players) await emitExtraUpdate(players);
		await emitConfigUpdate(config);
	}
}

export const redis = new Redis();
