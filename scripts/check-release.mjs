// Runs before npm publish: the product page must name the version being released.
import { existsSync, readFileSync } from "node:fs";

const metaFile = "mlcprodweb/meta.yaml";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

// A separate private clone, which public checkouts do not have.
if (existsSync(metaFile)) {
  const listed = /^version:\s*"?([^"\s]+)"?/m.exec(readFileSync(metaFile, "utf8"))?.[1];
  if (listed !== version) {
    console.error(`${metaFile} says ${listed}, but package.json says ${version}.`);
    console.error("Update and push mlcprodweb first.");
    process.exit(1);
  }
}
