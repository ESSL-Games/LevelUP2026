import * as io from "socket.io-client";

export const socket: io.Socket = io.connect(":3000", {
	autoConnect: true,
	reconnection: true,
});

socket.once("logon_success", () => {
	console.log("Logged on successfully to Server");
});

socket.io.on("reconnect_attempt", (attempt: number) => {
	console.log(
		`Connection lost, attempting to reconnect to server (Attempt: ${attempt})`,
	);
});

socket.io.on("reconnect", () => {
	console.log("Reconnected to server");
});

socket.on("connect", () => {
	socket.emit("join_netrock");
	socket.emit("join_netrock_config");
	socket.emit("join_players");
});
