import { createApp } from "../src/server/app.js";

// Vercel invokes this module as a serverless function. Do not call listen();
// the same application factory remains available to the local Node server.
export default createApp();
