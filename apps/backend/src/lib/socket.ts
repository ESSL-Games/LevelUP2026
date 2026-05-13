import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import type { IConfig, INetRockData, IPlayer } from "../Types.ts";
import { redis } from "./redis.ts";

const socketAuthKey = process.env.SOCKET_AUTH_KEY || "";

const socket = new Server();

const engine = new Engine({
	path: "/socket.io/",
	cors: {
		origin: "*",
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	},
});

socket.bind(engine);

const NETROCK_ROOM = "netrock-room";
const NETROCK_CONFIG_ROOM = "netrock-config-room";
const PLAYERS_ROOM = "players-room";

socket.on("connection", async (thisSocket) => {
	const config = await redis.getConfig();
	thisSocket.emit(
		"extra_data",
		JSON.stringify({
			players: await redis.getPlayers(),
			streamUrlPrefix: config?.netrockStreamUrlPrefix,
			streamUrlSuffix: config?.netrockStreamUrlSuffix,
		}),
	);

	thisSocket.once("join_netrock", async () => {
		thisSocket.join(NETROCK_ROOM);
		thisSocket.emit(
			"logon_success",
			JSON.stringify({
				msg: `Logon succeeded for ${NETROCK_ROOM}`,
			}),
		);
		thisSocket.emit("netrock", JSON.stringify(await redis.getNetrock()));
	});

	thisSocket.once("join_netrock_config", async () => {
		thisSocket.join(NETROCK_CONFIG_ROOM);
		thisSocket.emit(
			"logon_success",
			JSON.stringify({
				msg: `Logon succeeded for ${NETROCK_CONFIG_ROOM}`,
			}),
		);
		thisSocket.emit("netrock-config", JSON.stringify(await redis.getConfig()));
	});

	thisSocket.once("join_players", async () => {
		thisSocket.join(PLAYERS_ROOM);
		thisSocket.emit(
			"logon_success",
			JSON.stringify({
				msg: `Logon succeeded for ${PLAYERS_ROOM}`,
			}),
		);
		thisSocket.emit("players", JSON.stringify(await redis.getPlayers()));
	});

	thisSocket.on("update_players", async (data) => {
		const json = JSON.parse(data);
		if (json.authkey === socketAuthKey) {
			const players = json.players as IPlayer[];
			await redis.storePlayers(players);
		}
	});

	thisSocket.on("update_config", async (data) => {
		const json = JSON.parse(data);
		if (json.authkey === socketAuthKey) {
			const config = json.config as IConfig;
			await redis.storeConfig(config);
		}
	});
});

export async function emitExtraUpdate(players: IPlayer[]) {
	const config = await redis.getConfig();
	socket.emit(
		"extra_data",
		JSON.stringify({
			players,
			streamUrlPrefix: config?.netrockStreamUrlPrefix,
			streamUrlSuffix: config?.netrockStreamUrlSuffix,
		}),
	);
	socket
		.to(PLAYERS_ROOM)
		.emit("players", JSON.stringify(await redis.getPlayers()));
}

export async function emitNetrockUpdate(netrock: INetRockData) {
	socket.to(NETROCK_ROOM).emit("netrock", netrock);
}

export async function emitConfigUpdate(config: IConfig) {
	socket.to(NETROCK_CONFIG_ROOM).emit("netrock-config", config);
}

export const socketHandler = engine.handler();
