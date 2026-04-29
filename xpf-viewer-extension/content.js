(() => {
  const path = decodeURIComponent(window.location.pathname || "").toLowerCase();

  if (!path.endsWith(".xpf")) {
    return;
  }

  const rawText = document.body?.innerText || document.documentElement.textContent || "";
  const xpfData = parseXpf(rawText);

  if (!xpfData) {
    return;
  }

  renderSheet(xpfData);

  function parseXpf(text) {
    const trimmed = text.trimStart();

    if (trimmed.startsWith("XPF-SHEET/1.0")) {
      const jsonStart = trimmed.indexOf("{");

      if (jsonStart === -1) {
        return null;
      }

      return safeParseJson(trimmed.slice(jsonStart));
    }

    const legacyHtmlData = trimmed.match(
      /<script[^>]*id=["']xpf-data["'][^>]*>([\s\S]*?)<\/script>/i,
    );

    if (legacyHtmlData) {
      return safeParseJson(legacyHtmlData[1].trim());
    }

    return null;
  }

  function safeParseJson(jsonText) {
    try {
      const data = JSON.parse(jsonText);

      if (data?.format !== "SheetXPF" || !Array.isArray(data.rows)) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  function renderSheet(data) {
    document.documentElement.innerHTML = "";
    document.title = "Sheet XPF Document";

    const head = document.createElement("head");
    const meta = document.createElement("meta");
    meta.charset = "UTF-8";
    const viewport = document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1.0";
    const title = document.createElement("title");
    title.textContent = "Sheet XPF Document";
    const style = document.createElement("style");
    style.textContent = `
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
    `;

    head.append(meta, viewport, title, style);

    const body = document.createElement("body");
    const main = document.createElement("main");
    const header = document.createElement("header");
    const eyebrow = document.createElement("p");
    eyebrow.textContent = `${data.format} ${data.version || "1.0"}`;
    const heading = document.createElement("h1");
    heading.textContent = "Sheet XPF Document";
    header.append(eyebrow, heading);

    const section = document.createElement("section");
    section.className = "sheet-wrap";
    section.setAttribute("aria-label", "XPF sheet");

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.append(document.createElement("th"));
    const columns = Array.isArray(data.columns) ? data.columns : [];

    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column;
      headerRow.append(th);
    });

    thead.append(headerRow);

    const tbody = document.createElement("tbody");
    data.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const rowHead = document.createElement("th");
      rowHead.textContent = String(rowIndex + 1);
      tr.append(rowHead);

      columns.forEach((_, columnIndex) => {
        const td = document.createElement("td");
        td.textContent = row?.[columnIndex] || "";
        tr.append(td);
      });

      tbody.append(tr);
    });

    table.append(thead, tbody);
    section.append(table);
    main.append(header, section);
    body.append(main);
    document.documentElement.append(head, body);
  }
})();
