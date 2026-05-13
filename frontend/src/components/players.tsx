import { Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { socket } from "@/lib/socket.ts";

export interface IPlayer {
	id: number;
	riotId: string;
	name: string;
	fullname: string;
}

type IEditablePlayer = IPlayer & { originalKey: string };

const emptyPlayer: IEditablePlayer = {
	id: 0,
	riotId: "",
	name: "",
	fullname: "",
	originalKey: "",
};

const initialPlayers: IPlayer[] = [];

interface PlayersProps {
	authKey: string;
}

export function Players({ authKey }: PlayersProps) {
	const [players, setPlayers] = useState(initialPlayers);
	const [editing, setEditing] = useState<IEditablePlayer | null>(null);
	const [creating, setCreating] = useState<IEditablePlayer | null>(null);

	useEffect(() => {
		const handler = (data: unknown) => {
			const fData = typeof data === "string" ? JSON.parse(data) : data;
			setPlayers(fData as IPlayer[]);
		};

		socket.on("players", handler);
		return () => {
			socket.off("players", handler);
		};
	}, []);

	function savePlayers(data: IPlayer[]) {
		socket.emit(
			"update_players",
			JSON.stringify({ authkey: authKey, players: data }),
		);
	}

	return (
		<div>
			<h1 className="text-3xl mb-4">
				Players{" "}
				<Button
					className="hover:cursor-pointer"
					onClick={() => setCreating(emptyPlayer)}
				>
					Create
				</Button>
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				{players.map((player, index) => (
					<Card key={index} className="col-span-1">
						<CardHeader>
							<CardTitle>{player.fullname}</CardTitle>
							<CardAction>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="hover:cursor-pointer"
										>
											<Ellipsis />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-60" align="start">
										<DropdownMenuGroup>
											<DropdownMenuLabel>
												{player.fullname !== ""
													? player.fullname
													: player.name !== ""
														? player.name
														: player.riotId}
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<DropdownMenuItem
														className="hover:cursor-pointer"
														onSelect={(e) => {
															e.preventDefault();
															setEditing({
																...player,
																originalKey: player.riotId,
															});
														}}
													>
														Edit
													</DropdownMenuItem>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															<h1 className="flex items-baseline gap-2">
																<span>Edit</span>
																<span className="inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-medium bg-muted text-muted-foreground">
																	{player.fullname !== ""
																		? player.fullname
																		: player.name !== ""
																			? player.name
																			: player.riotId}
																</span>
															</h1>
														</AlertDialogTitle>
														<AlertDialogDescription className="mt-2">
															<div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
																<div className="grid gap-2">
																	<Label>Name</Label>
																	<Input
																		placeholder="Name"
																		value={editing?.name ?? ""}
																		onChange={(e) =>
																			setEditing((prev) =>
																				prev
																					? { ...prev, name: e.target.value }
																					: prev,
																			)
																		}
																		required
																	/>
																</div>
																<div className="grid gap-2">
																	<Label>ID</Label>
																	<Input
																		placeholder="ID"
																		type="number"
																		value={editing?.id ?? 0}
																		onChange={(e) =>
																			setEditing((prev) =>
																				prev
																					? {
																							...prev,
																							id: Number(e.target.value),
																						}
																					: prev,
																			)
																		}
																		required
																	/>
																</div>
																<div className="grid gap-2">
																	<Label>Fullname</Label>
																	<Input
																		placeholder="Name#Name"
																		value={editing?.fullname ?? ""}
																		onChange={(e) =>
																			setEditing((prev) =>
																				prev
																					? {
																							...prev,
																							fullname: e.target.value,
																						}
																					: prev,
																			)
																		}
																		required
																	/>
																</div>
																<div className="grid gap-2">
																	<Label>Riot ID</Label>
																	<Input
																		placeholder="Riot ID"
																		value={editing?.riotId ?? ""}
																		onChange={(e) =>
																			setEditing((prev) =>
																				prev
																					? {
																							...prev,
																							riotId: e.target.value,
																						}
																					: prev,
																			)
																		}
																		required
																	/>
																</div>
															</div>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => {
																if (!editing) return;

																const editedPlayers = players.map((p) =>
																	p.riotId === editing.originalKey
																		? { ...editing }
																		: p,
																);

																savePlayers(editedPlayers);
																setEditing(null);
															}}
														>
															Edit
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<DropdownMenuItem
														className="hover:cursor-pointer"
														onSelect={(e) => {
															e.preventDefault();
															setEditing({
																...player,
																originalKey: player.riotId,
															});
														}}
													>
														Delete
													</DropdownMenuItem>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															<h1 className="flex items-baseline gap-2">
																<span>Delete</span>
																<span className="inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-medium bg-muted text-muted-foreground">
																	{player.fullname !== ""
																		? player.fullname
																		: player.name !== ""
																			? player.name
																			: player.riotId}
																</span>
															</h1>
														</AlertDialogTitle>
														<AlertDialogDescription className="mt-2">
															<h1>This Player will be deleted...</h1>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => {
																if (!editing) return;

																const editedPlayers = players.filter(
																	(p) => p.riotId !== editing.originalKey,
																);

																savePlayers(editedPlayers);
																setEditing(null);
															}}
														>
															Create
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</CardAction>
						</CardHeader>
						<CardContent>
							<p>ID: {player.id !== 0 ? player.id : "Undefined"}</p>
							<p>Name: {player.name ? player.name : "Empty"}</p>
							<p>Riot ID: {player.riotId ? player.riotId : "Undefined"}</p>
						</CardContent>
					</Card>
				))}
			</div>
			<AlertDialog
				open={!!creating}
				onOpenChange={(open) => !open && setCreating(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<h1 className="flex items-baseline gap-2">
								<span>Create Player</span>
							</h1>
						</AlertDialogTitle>
						<AlertDialogDescription className="mt-2">
							<div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
								<div className="grid gap-2">
									<Label>Name</Label>
									<Input
										placeholder="Name"
										value={creating?.name ?? ""}
										onChange={(e) =>
											setCreating((prev) =>
												prev ? { ...prev, name: e.target.value } : prev,
											)
										}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label>ID</Label>
									<Input
										placeholder="ID"
										type="number"
										value={creating?.id ?? 0}
										onChange={(e) =>
											setCreating((prev) =>
												prev
													? {
															...prev,
															id: Number(e.target.value),
														}
													: prev,
											)
										}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label>Fullname</Label>
									<Input
										placeholder="Name#Name"
										value={creating?.fullname ?? ""}
										onChange={(e) =>
											setCreating((prev) =>
												prev
													? {
															...prev,
															fullname: e.target.value,
														}
													: prev,
											)
										}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label>Riot ID</Label>
									<Input
										placeholder="Riot ID"
										value={creating?.riotId ?? ""}
										onChange={(e) =>
											setCreating((prev) =>
												prev ? { ...prev, riotId: e.target.value } : prev,
											)
										}
										required
									/>
								</div>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!creating) return;
								const { originalKey, ...newPlayer } = creating;
								const editedPlayers = [...players, newPlayer];
								savePlayers(editedPlayers);
								setCreating(null);
							}}
						>
							Create
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default Players;
