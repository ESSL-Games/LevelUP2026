import * as io from "socket.io-client";
import { clearData } from "./netrock.ts";

export class Spectra {
	private matchSocket!: io.Socket;
	private matchFunctions: Function[] = [];

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

	subscribeMatch(handler: Function) {
		this.matchFunctions.push(handler);
	}
}
