import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, resolve } from "node:path";
import { spawn } from "node:child_process";

const filePath = process.argv[2] ? resolve(process.argv[2]) : "";

if (!filePath || !existsSync(filePath)) {
  console.error("Usage: node xpf-local-viewer.mjs <path-to-file.xpf>");
  process.exit(1);
}

const source = await readFile(filePath, "utf8");
const html = extractHtml(source);

const server = createServer((request, response) => {
  if (request.url === "/source") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(source);
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
  });
  response.end(html);
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;

  openInBrowser(url);
  console.log(`Viewing ${basename(filePath)} at ${url}`);
});

setTimeout(() => {
  server.close();
}, 10 * 60 * 1000);

function extractHtml(text) {
  const doctypeIndex = text.search(/<!doctype html>/i);

  if (doctypeIndex !== -1) {
    return text.slice(doctypeIndex);
  }

  const htmlIndex = text.search(/<html[\s>]/i);

  if (htmlIndex !== -1) {
    return `<!doctype html>\n${text.slice(htmlIndex)}`;
  }

  const data = parseXpfData(text);
  return renderSheetDocument(data);
}

function parseXpfData(text) {
  const trimmed = text.trimStart();

  if (trimmed.startsWith("XPF-SHEET/1.0")) {
    const jsonStart = trimmed.indexOf("{");

    if (jsonStart !== -1) {
      return JSON.parse(trimmed.slice(jsonStart));
    }
  }

  throw new Error("This file is not a supported SheetXPF document.");
}

function renderSheetDocument(data) {
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const headers = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const bodyRows = rows
    .map((row, rowIndex) => {
      const cells = columns
        .map((_, columnIndex) => `<td>${escapeHtml(row?.[columnIndex] || "")}</td>`)
        .join("");

      return `<tr><th>${rowIndex + 1}</th>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en" data-xpf-format="SheetXPF" data-xpf-version="${escapeHtml(
    data.version || "1.0",
  )}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sheet XPF Document</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f7f8fb;
        color: #162033;
        font-family: Arial, Helvetica, sans-serif;
      }
      main {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0;
      }
      header { margin-bottom: 18px; }
      p {
        margin: 0 0 6px;
        color: #647187;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: 34px;
        line-height: 1.1;
      }
      .sheet-wrap {
        overflow: auto;
        border: 1px solid #d9dee8;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 50px rgba(32, 43, 68, 0.08);
      }
      table {
        width: 100%;
        min-width: 860px;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th,
      td {
        min-width: 126px;
        height: 40px;
        padding: 8px 10px;
        border-right: 1px solid #d9dee8;
        border-bottom: 1px solid #d9dee8;
        font-size: 14px;
        line-height: 1.25;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th {
        background: #eef3f9;
        color: #526176;
        font-weight: 700;
        text-align: center;
      }
      thead th:first-child,
      tbody th {
        width: 48px;
        min-width: 48px;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p>SheetXPF ${escapeHtml(data.version || "1.0")}</p>
        <h1>Sheet XPF Document</h1>
      </header>
      <section class="sheet-wrap" aria-label="XPF sheet">
        <table>
          <thead><tr><th></th>${headers}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openInBrowser(url) {
  const candidates = [
    `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean);

  const browserPath = candidates.find((candidate) => existsSync(candidate));

  if (browserPath) {
    spawn(browserPath, [url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return;
  }

  spawn("cmd", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
}
