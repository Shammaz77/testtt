import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const host = "127.0.0.1";
const port = 5500;
const root = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xpf": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split("?")[0]))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  const requestedPath = join(root, cleanPath || "index.html");

  if (!requestedPath.startsWith(root)) {
    return null;
  }

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  return join(root, "index.html");
}

const server = createServer((request, response) => {
  const filePath = resolveFile(request.url || "/");

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const contentType =
    contentTypes[extname(filePath).toLowerCase()] ||
    "application/octet-stream";

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Sheet XPF Editor is running at http://${host}:${port}/`);
});
