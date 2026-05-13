import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import Config from "@/components/config.tsx";
import Players from "@/components/players.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

export function Data() {
	const [authKey, setAuthKey] = useState("");
	const [showAuthKey, setShowAuthKey] = useState(false);
	useEffect(() => {
		const saved = getCookie("authKey");
		if (saved) setAuthKey(saved);
	}, []);

	useEffect(() => {
		// biome-ignore lint/suspicious/noDocumentCookie: Wouldn't work without
		document.cookie = `authKey=${encodeURIComponent(authKey)}; path=/; max-age=31536000`;
	}, [authKey]);

	function getCookie(name: string): string {
		const match = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${name}=`));
		return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
	}

	return (
		<div className="m-4">
			<h1 className="text-4xl mb-4">Data</h1>
			<div className="grid gap-2 mb-4">
				<Label>Auth Key</Label>
				<div className="flex items-center gap-2">
					<Input
						className="w-80"
						type={showAuthKey ? "text" : "password"}
						value={authKey}
						onChange={(e) => setAuthKey(e.target.value)}
						placeholder="Auth Key"
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => setShowAuthKey((prev) => !prev)}
						aria-label={showAuthKey ? "Hide auth key" : "Show auth key"}
					>
						{showAuthKey ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>
			<Players authKey={authKey} />
			<Config authKey={authKey} />
		</div>
	);
}

export default Data;
