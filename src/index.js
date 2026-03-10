import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, "../public/");

const PORT = process.env.PORT || 8080;
logging.set_level(logging.NONE);
Object.assign(wisp.options, { allow_udp_streams: true });

const fastify = Fastify({
    serverFactory: (handler) => {
        const server = createServer();
        server.on("request", (req, res) => {
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            res.setHeader("X-Content-Type-Options", "nosniff");
            handler(req, res);
        });
        server.on("upgrade", (req, socket, head) => {
            if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
            else socket.end();
        });
        return server;
    },
});

const staticOptions = { setHeaders: (res, filePath) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) res.setHeader("Content-Type", "text/javascript");
    if (filePath.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
}};

fastify.register(fastifyStatic, { root: publicPath, ...staticOptions, decorateReply: true });
fastify.register(fastifyStatic, { root: scramjetPath, prefix: "/scram/", ...staticOptions, decorateReply: false });
fastify.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", ...staticOptions, decorateReply: false });
fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", ...staticOptions, decorateReply: false });

fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (!err) {
        setInterval(async () => {
            try { await fetch(`http://localhost:${PORT}/`, { method: 'HEAD' }); } catch (e) {}
        }, 30000);
    }
});
