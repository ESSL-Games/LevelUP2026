import { useEffect, useState } from "react";
import { CodeBlock } from "react-code-block";
import { socket } from "@/lib/socket.ts";

export interface INetRockData {
	inMatch: boolean;
	roundWin: {
		wonTeam: "left" | "right" | false;
		roundCeremony: {
			normal: boolean;
			ace: boolean;
			clutch: boolean;
			teamAce: boolean;
			flawless: boolean;
		};
	};
	timeout: {
		techTimeout: boolean;
		teamTimeout: "left" | "right" | false;
	};
	teams: {
		name: string;
		tricode: string;
		logoUrl: string;
		isAttacker: boolean;
	}[];
	players: {
		id: number;
		teamId: number;
		name: string;
		kills: number;
		deaths: number;
		assists: number;
		isAlive: boolean;
		killsThisRound: number;
	}[];
}

const initialNetrock: INetRockData = {
	inMatch: false,
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

export function Netrock() {
	const [netrock, setNetrock] = useState(initialNetrock);
	useEffect(() => {
		const handler = (data: unknown) => {
			const fData = typeof data === "string" ? JSON.parse(data) : data;
			setNetrock(fData as INetRockData);
		};

		socket.on("netrock", handler);
		return () => {
			socket.off("netrock", handler);
		};
	}, []);
	const formatted = JSON.stringify(
		JSON.parse(JSON.stringify(netrock)),
		null,
		2,
	);
	return (
		<div className="w-full">
			<CodeBlock code={formatted} language="json">
				<CodeBlock.Code className="bg-black w-full">
					<CodeBlock.LineContent>
						<CodeBlock.Token />
					</CodeBlock.LineContent>
				</CodeBlock.Code>
			</CodeBlock>
		</div>
	);
}
