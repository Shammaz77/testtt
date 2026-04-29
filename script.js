const rows = 18;
const columns = 8;
const columnNames = Array.from({ length: columns }, (_, index) =>
  String.fromCharCode(65 + index),
);

const headersRow = document.getElementById("columnHeaders");
const sheetBody = document.getElementById("sheetBody");
const openButton = document.getElementById("openXpf");
const downloadButton = document.getElementById("downloadXpf");
const importButton = document.getElementById("importXpf");
const fileInput = document.getElementById("xpfFileInput");
const sheetStatus = document.getElementById("sheetStatus");

const sampleData = {
  "0-0": "Project",
  "0-1": "Owner",
  "0-2": "Status",
  "0-3": "Notes",
  "1-0": "Website copy",
  "1-1": "Asha",
  "1-2": "Draft",
  "1-3": "Add homepage text here",
  "2-0": "Invoice",
  "2-1": "Rahul",
  "2-2": "Ready",
  "2-3": "Open as XPF when finished",
};

function buildSheet() {
  columnNames.forEach((name) => {
    const th = document.createElement("th");
    th.textContent = name;
    headersRow.appendChild(th);
  });

  for (let row = 0; row < rows; row += 1) {
    const tr = document.createElement("tr");
    const rowHead = document.createElement("th");
    rowHead.className = "row-head";
    rowHead.scope = "row";
    rowHead.textContent = row + 1;
    tr.appendChild(rowHead);

    for (let column = 0; column < columns; column += 1) {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.dataset.row = String(row);
      td.dataset.column = String(column);
      td.textContent = sampleData[`${row}-${column}`] || "";
      tr.appendChild(td);
    }

    sheetBody.appendChild(tr);
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function collectRows() {
  const tableRows = [];

  for (let row = 0; row < rows; row += 1) {
    const values = [];

    for (let column = 0; column < columns; column += 1) {
      const cell = document.querySelector(
        `[data-row="${row}"][data-column="${column}"]`,
      );
      values.push((cell?.innerText || "").trim());
    }

    tableRows.push(values);
  }

  return tableRows;
}

function createXpfData() {
  return {
    format: "SheetXPF",
    version: "1.0",
    mimeType: "application/xpf",
    application: "Sheet XPF Editor",
    createdAt: new Date().toISOString(),
    columns: columnNames,
    rows: collectRows(),
  };
}

function createXpfFile(xpfData) {
  return [
    "XPF-SHEET/1.0",
    "MIME: application/xpf",
    "Application: Sheet XPF Editor",
    "",
    JSON.stringify(xpfData, null, 2),
  ].join("\n");
}

function parseXpfFile(text) {
  const trimmed = text.trimStart();

  if (trimmed.startsWith("XPF-SHEET/1.0")) {
    const jsonStart = trimmed.indexOf("{");

    if (jsonStart === -1) {
      throw new Error("XPF data is missing.");
    }

    return JSON.parse(trimmed.slice(jsonStart));
  }

  const legacyHtmlData = trimmed.match(
    /<script[^>]*id=["']xpf-data["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (legacyHtmlData) {
    return JSON.parse(legacyHtmlData[1].trim());
  }

  throw new Error("This is not a SheetXPF file.");
}

function loadXpfData(xpfData) {
  if (xpfData?.format !== "SheetXPF" || !Array.isArray(xpfData.rows)) {
    throw new Error("Unsupported XPF file.");
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cell = document.querySelector(
        `[data-row="${row}"][data-column="${column}"]`,
      );

      if (cell) {
        cell.textContent = xpfData.rows[row]?.[column] || "";
      }
    }
  }

  sheetStatus.textContent = `Opened ${xpfData.application || "SheetXPF"} file`;
}

function createXpfWebDocument(xpfData) {
  const xpfJson = JSON.stringify(xpfData, null, 2).replace(/</g, "\\u003c");
  const headers = xpfData.columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");
  const bodyRows = xpfData.rows
    .map((row, rowIndex) => {
      const cells = xpfData.columns
        .map((_, columnIndex) => {
          const value = row[columnIndex] || "";
          return `<td>${escapeHtml(value)}</td>`;
        })
        .join("");

      return `<tr><th>${rowIndex + 1}</th>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html>
<!-- XPF-DOCUMENT: SheetXPF/1.0; MIME: application/xpf; not a PDF file. -->
<html lang="en" data-xpf-format="SheetXPF" data-xpf-version="1.0">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="xpf-format" content="SheetXPF 1.0" />
    <meta name="xpf-mime-type" content="application/xpf" />
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
      header {
        margin-bottom: 18px;
      }
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
        <p>SheetXPF 1.0</p>
        <h1>Sheet XPF Document</h1>
      </header>
      <section class="sheet-wrap" aria-label="XPF sheet">
        <table>
          <thead>
            <tr><th></th>${headers}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>
    </main>
    <script id="xpf-data" type="application/xpf+json">${xpfJson}</script>
  </body>
</html>`;
}

function openXpfInBrowser() {
  const xpfBlob = new Blob([createXpfWebDocument(createXpfData())], {
    type: "text/html",
  });
  const url = URL.createObjectURL(xpfBlob);
  window.location.href = url;
}

function downloadXpf() {
  const xpfBlob = new Blob([createXpfWebDocument(createXpfData())], {
    type: "application/xpf",
  });
  const url = URL.createObjectURL(xpfBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "sheet-editor.xpf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openExistingXpf() {
  fileInput.click();
}

function handleXpfFileSelection() {
  const [file] = fileInput.files;

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      loadXpfData(parseXpfFile(String(reader.result || "")));
    } catch (error) {
      sheetStatus.textContent = error.message;
    } finally {
      fileInput.value = "";
    }
  });

  reader.readAsText(file);
}

buildSheet();
openButton.addEventListener("click", openXpfInBrowser);
downloadButton.addEventListener("click", downloadXpf);
importButton.addEventListener("click", openExistingXpf);
fileInput.addEventListener("change", handleXpfFileSelection);
