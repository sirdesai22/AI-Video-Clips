import { main } from "./index";

process.once("SIGINT", () => process.exit(0));
process.once("SIGTERM", () => process.exit(0));

void main();
