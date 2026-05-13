import { updateData } from "./lib/netrock.ts";
import { Spectra } from "./lib/spectra.ts";
import { runServer } from "./server.ts";

const spectraUrl = process.env.SPECTRA_URL || "";
const spectraGroupCode = process.env.SPECTRA_GROUP_CODE || "";

const spectra = new Spectra();
spectra.connectMatch(spectraUrl, spectraGroupCode);

spectra.subscribeMatch(updateData);

runServer();
