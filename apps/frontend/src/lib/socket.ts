import * as io from "socket.io-client";

export const socket: io.Socket = io.connect(":3000", {
	autoConnect: true,
	reconnection: true,
});

socket.on("logon_success", (msg) => {
	console.log(JSON.parse(msg).msg);
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
