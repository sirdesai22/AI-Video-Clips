import { main } from "./index";

process.once("SIGINT", () => process.exit(0));
process.once("SIGTERM", () => process.exit(0));
process.once("SIGHUP", () => process.exit(0));

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
