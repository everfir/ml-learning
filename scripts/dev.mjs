import { createServer } from "vite";
import { config } from "../vite.config.mjs";
import { select } from "./experiments.mjs";

const [id] = await select(process.argv[2] || "neuron");
const server = await createServer({ ...config(id), configFile: false });
await server.listen();
server.printUrls();
