import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ButtonGroup } from "@/components/ui/button-group.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { socket } from "@/lib/socket.ts";

export interface IConfig {
	netrockUrl: string;
	netrockStreamUrlPrefix: string;
	netrockStreamUrlSuffix: string;
	inGameStatusOverride: true | false | "";
}

const initialConfig: IConfig = {
	netrockUrl: "",
	netrockStreamUrlPrefix: "",
	netrockStreamUrlSuffix: "",
	inGameStatusOverride: "",
};

interface ConfigProps {
	authKey: string;
}

export function Config({ authKey }: ConfigProps) {
	const [config, setConfig] = useState(initialConfig);

	useEffect(() => {
		const handler = (data: unknown) => {
			const fData = typeof data === "string" ? JSON.parse(data) : data;
			setConfig(fData as IConfig);
		};

		socket.on("netrock-config", handler);
		return () => {
			socket.off("netrock-config", handler);
		};
	}, []);

	function saveConfig(data: IConfig) {
		socket.emit(
			"update_config",
			JSON.stringify({ authkey: authKey, config: data }),
		);
	}

	return (
		<div>
			<h1 className="text-3xl mt-4 mb-4">Config</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
				<div className="grid gap-2">
					<Label>Netrock URL</Label>
					<Input
						placeholder="Netrock URL"
						value={config.netrockUrl}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								netrockUrl: e.target.value,
							}))
						}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label>Netrock Stream URL Prefix</Label>
					<Input
						placeholder="Netrock Stream URL Prefix"
						value={config.netrockStreamUrlPrefix}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								netrockStreamUrlPrefix: e.target.value,
							}))
						}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label>Netrock Stream URL Suffix</Label>
					<Input
						placeholder="Netrock Stream URL Suffix"
						value={config.netrockStreamUrlSuffix}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								netrockStreamUrlSuffix: e.target.value,
							}))
						}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label>inGame Override</Label>
					<ButtonGroup>
						<Button
							variant={
								config.inGameStatusOverride === true ? "secondary" : "outline"
							}
							onClick={() =>
								setConfig((prev) => ({
									...prev,
									inGameStatusOverride: true,
								}))
							}
						>
							True
						</Button>
						<Button
							variant={
								config.inGameStatusOverride === "" ? "secondary" : "outline"
							}
							onClick={() =>
								setConfig((prev) => ({
									...prev,
									inGameStatusOverride: "",
								}))
							}
						>
							Disabled
						</Button>
						<Button
							variant={
								config.inGameStatusOverride === false ? "secondary" : "outline"
							}
							onClick={() =>
								setConfig((prev) => ({
									...prev,
									inGameStatusOverride: false,
								}))
							}
						>
							False
						</Button>
					</ButtonGroup>
				</div>
				<div className="flex items-center">
					<h1 className="text-xl">
						<span className="font-bold">Note:</span> Stream Url's only update on
						Refresh
					</h1>
				</div>
			</div>
			<Button
				className="hover:cursor-pointer"
				onClick={() => {
					saveConfig(config);
				}}
			>
				Save
			</Button>
		</div>
	);
}

export default Config;
