import * as io from "socket.io-client";
import type { IMapbanSessionData } from "../Types.ts";
import { clearData } from "./netrock.ts";

export class Spectra {
	private matchSocket!: io.Socket;
	private matchFunctions: Function[] = [];

	private mapbanSocket!: io.Socket;
	private mapbanFunctions: Function[] = [];

	public connectMatch(socketEndpoint: string, groupCode: string) {
		this.matchSocket = io.connect(socketEndpoint, {
			autoConnect: true,
			reconnection: true,
		});

		this.matchSocket.once("logon_success", () => {
			console.log(
				`Logged on successfully to "${socketEndpoint}" with groupCode "${groupCode}"`,
			);
			clearData();
		});

		this.matchSocket.on("match_data", (data: string) => {
			this.matchFunctions.forEach((e) => {
				e(JSON.parse(data));
			});
		});

		this.matchSocket.io.on("reconnect_attempt", (attempt: number) => {
			console.log(
				`Connection lost, attempting to reconnect to server (Attempt: ${attempt})`,
			);
		});

		this.matchSocket.io.on("reconnect", () => {
			this.matchSocket.emit("logon", JSON.stringify({ groupCode: groupCode }));
			console.log("Reconnected to server");
		});

		this.matchSocket.emit("logon", JSON.stringify({ groupCode: groupCode }));
	}

	public connectMapban(
		socketEndpoint: string,
		logonData: { sessionId: string },
	) {
		if (this.mapbanSocket?.connected) {
			console.warn(
				"SocketService Mapban is already connected. Reusing existing connection.",
			);
			return this;
		}

		this.mapbanSocket = io.connect(socketEndpoint, {
			autoConnect: true,
			reconnection: true,
		});

		this.mapbanSocket.once("session_data", (data: IMapbanSessionData) => {
			console.log("Logged on successfully");
			this.mapbanFunctions.forEach((subscriber) => {
				subscriber({ event: "session_data", data });
			});
			this.mapbanSocket.onAny((event: string, ...args: any[]) => {
				if (Array.isArray(args) && args.length > 0) {
					this.mapbanFunctions.forEach((subscriber) => {
						subscriber({ event, data: args[0] });
					});
				} else {
					this.mapbanFunctions.forEach((subscriber) => {
						subscriber({ event, data: args });
					});
				}
			});
		});

		this.mapbanSocket.once("logon_fail", (data: any) => {
			this.mapbanFunctions.forEach((subscriber) => {
				subscriber({ event: "logon_fail", data });
			});
		});

		//setting up reconnection attempt handler
		this.mapbanSocket.io.on("reconnect_attempt", (attempt: number) => {
			console.log(
				`Connection lost, attempting to reconnect to server (Attempt: ${attempt})`,
			);
		});

		//setting up reconnection handler
		this.mapbanSocket.io.on("reconnect", () => {
			this.mapbanSocket.emit("logon", logonData);
			console.log("Reconnected to server");
		});

		this.mapbanSocket.emit("logon", logonData);

		return this;
	}

	subscribeMatch(handler: Function) {
		this.matchFunctions.push(handler);
	}

	subscribeMapban(handler: Function) {
		this.mapbanFunctions.push(handler);
	}
}
