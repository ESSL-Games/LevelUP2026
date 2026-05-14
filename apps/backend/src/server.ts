import { images } from "./data/images.ts";
import { teams } from "./data/teams.ts";
import { socketHandler } from "./lib/socket.ts";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function runServer() {
	Bun.serve({
		port: 3000,
		...socketHandler,
		routes: {
			"/teams/:id": (req) => {
				if (req.method === "OPTIONS")
					return new Response(null, { status: 204, headers: corsHeaders });

				const teamId = req.params.id;
				const team = teams.find((entry) => entry.teamId === teamId);

				if (!team) {
					return Response.json(
						{ error: "Team not found" },
						{ status: 404, headers: corsHeaders },
					);
				}

				return Response.json(
					{
						teamId,
						teamName: team.teamName,
						tricode: team.tricode,
						imagePath: `/teams/image/${teamId}`,
					},
					{ headers: corsHeaders },
				);
			},

			"/teams/image/:id": (req) => {
				if (req.method === "OPTIONS")
					return new Response(null, { status: 204, headers: corsHeaders });

				const teamId = req.params.id;
				const team = teams.find((entry) => entry.teamId === teamId);

				if (!team) {
					return Response.json(
						{ error: "Team not found" },
						{ status: 404, headers: corsHeaders },
					);
				}

				return new Response(Bun.file(`src/data/teams/${team.teamId}.png`), {
					headers: corsHeaders,
				});
			},

			"/images/:id": async (req) => {
				const imageId = req.params.id;
				const image = images.find((entry) => entry.imageId === imageId);

				if (!image) {
					return Response.json(
						{ error: "Team not found" },
						{ status: 404, headers: corsHeaders },
					);
				}
				return new Response(Bun.file(`src/data/images/${image.imageId}.png`), {
					headers: corsHeaders,
				});
			},

			"/test": async (req) => {
				if (req.method === "OPTIONS")
					return new Response(null, { status: 204, headers: corsHeaders });
				return Response.json({ message: "test" }, { headers: corsHeaders });
			},

			"/test/:id": async (req) => {
				if (req.method === "OPTIONS")
					return new Response(null, { status: 204, headers: corsHeaders });
				return new Response(req.params.id, {
					headers: corsHeaders,
				});
			},
		},
	});
}
