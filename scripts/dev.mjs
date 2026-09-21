import { spawn } from "node:child_process";
const children = [
  spawn("npm", ["run", "dev:server"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev:client"], { stdio: "inherit", shell: true }),
];
const stop = () => children.forEach((child) => child.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
