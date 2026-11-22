import "../css/sponsor.css";

interface SponsorEntry {
  name: string;
  amount: string;
  date: string;
  message: string;
  numericAmount: number | null;
  originalIndex: number;
}

interface SponsorTotal {
  name: string;
  amount: number;
  count: number;
  originalIndex: number;
}

const dashboard = document.querySelector<HTMLElement>("[data-sponsor-dashboard]");
const data = document.querySelector<HTMLElement>(".sponsor-data");

if (dashboard && data) {
  const legacyEntries = Array.from(data.querySelectorAll<HTMLElement>("[data-sponsor-entry]"))
    .map((element, originalIndex): SponsorEntry => {
      const amount = element.dataset.amount?.trim() ?? "";
      const numericAmount = Number(amount.replace(/[￥¥,，\s]/g, ""));

      return {
        name: element.dataset.name?.trim() ?? "",
        amount,
        date: element.dataset.date?.trim() ?? "",
        message: element.dataset.message?.trim() ?? "",
        numericAmount: amount && Number.isFinite(numericAmount) ? numericAmount : null,
        originalIndex,
      };
    })
    .filter((entry) => entry.name);
  const bulkEntries = (data.querySelector<HTMLElement>("[data-sponsor-bulk]")?.textContent ?? "")
    .split(/\r?\n/)
    .map((line, originalIndex): SponsorEntry => {
      const [name = "", amount = "", date = "", ...messageParts] = line.split("|");
      const normalizedAmount = amount.trim();
      const numericAmount = Number(normalizedAmount.replace(/[￥¥,，\s]/g, ""));

      return {
        name: name.trim(),
        amount: normalizedAmount,
        date: date.trim(),
        message: messageParts.join("|").trim(),
        numericAmount: normalizedAmount && Number.isFinite(numericAmount) ? numericAmount : null,
        originalIndex: legacyEntries.length + originalIndex,
      };
    })
    .filter((entry) => entry.name);
  const entries = [...legacyEntries, ...bulkEntries];

  const showRank = Array.from(
    entries
      .reduce((totals, entry) => {
        if (entry.numericAmount === null) {
          return totals;
        }

        const existing = totals.get(entry.name);
        if (existing) {
          existing.amount += entry.numericAmount;
          existing.count += 1;
        } else {
          totals.set(entry.name, {
            name: entry.name,
            amount: entry.numericAmount,
            count: 1,
            originalIndex: entry.originalIndex,
          });
        }

        return totals;
      }, new Map<string, SponsorTotal>())
      .values(),
  ).sort((left, right) => right.amount - left.amount || left.originalIndex - right.originalIndex);
  const entriesNewestFirst = entries
    .map((entry) => {
      const parsedDate = Date.parse(entry.date);
      return { entry, timestamp: Number.isNaN(parsedDate) ? -Infinity : parsedDate };
    })
    .sort(
      (left, right) =>
        right.timestamp - left.timestamp || right.entry.originalIndex - left.entry.originalIndex,
    )
    .map(({ entry }) => entry);
  const supporterCount = new Set(entries.map((entry) => entry.name)).size;
  const totalAmount = entries.reduce((total, entry) => total + (entry.numericAmount ?? 0), 0);
  const amountFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
  const formatAmount = (amount: number) => `¥${amountFormatter.format(amount)}`;
  const topEntries = showRank.slice(0, 4);
  const latestEntries = entriesNewestFirst.slice(0, 5);

  const appendHeading = (parent: HTMLElement, eyebrow: string, title: string, count?: string) => {
    const heading = document.createElement("div");
    heading.className = "sponsor-section-heading";

    const copy = document.createElement("div");
    const label = document.createElement("span");
    label.className = "sponsor-section-eyebrow";
    label.textContent = eyebrow;
    const headingTitle = document.createElement("h2");
    headingTitle.textContent = title;
    copy.append(label, headingTitle);
    heading.append(copy);

    if (count) {
      const badge = document.createElement("span");
      badge.className = "sponsor-section-count";
      badge.textContent = count;
      heading.append(badge);
    }

    parent.append(heading);
  };

  const createAmount = (amount: number | null, originalAmount?: string) => {
    const value = document.createElement("strong");
    value.className = "sponsor-amount";
    value.textContent = amount === null ? originalAmount || "金额未填写" : formatAmount(amount);
    return value;
  };

  const summary = document.createElement("section");
  summary.className = "sponsor-summary";
  summary.setAttribute("aria-label", "赞助统计");

  const summaryItems = [
    {
      icon: "solar:donut-chart-linear",
      watermark: "solar:hand-money-linear",
      label: "累计赞助",
      value: formatAmount(totalAmount),
    },
    {
      icon: "solar:users-group-rounded-linear",
      watermark: "solar:users-group-rounded-linear",
      label: "支持者",
      value: `${supporterCount} 位`,
    },
    {
      icon: "solar:heart-linear",
      watermark: "solar:heart-linear",
      label: "赞助记录",
      value: `${entries.length} 笔`,
    },
  ];

  summaryItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = `sponsor-stat${index === 0 ? " sponsor-stat--featured" : ""}`;

    const watermark = document.createElement("iconify-icon");
    watermark.className = "sponsor-stat-watermark";
    watermark.setAttribute("icon", item.watermark ?? item.icon);
    watermark.setAttribute("aria-hidden", "true");

    const icon = document.createElement("iconify-icon");
    icon.setAttribute("icon", item.icon);
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = item.label;
    const value = document.createElement("strong");
    value.textContent = item.value;
    card.append(watermark, icon, label, value);
    summary.append(card);
  });

  dashboard.append(summary);

  const showcase = document.createElement("div");
  showcase.className = "sponsor-showcase";

  const latestSection = document.createElement("section");
  latestSection.className = "sponsor-panel sponsor-latest";
  appendHeading(latestSection, "JUST IN", "最新赞助", `最近 ${latestEntries.length} 笔`);

  if (latestEntries.length) {
    const list = document.createElement("div");
    list.className = "sponsor-latest-list";
    const track = document.createElement("div");
    track.className = "sponsor-latest-track";
    const sequence = document.createElement("div");
    sequence.className = "sponsor-latest-sequence";

    latestEntries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "sponsor-latest-row";

      const copy = document.createElement("div");
      copy.className = "sponsor-latest-copy";
      const name = document.createElement("strong");
      name.textContent = entry.name;
      const note = document.createElement("span");
      note.textContent = entry.message || "感谢支持本站";
      copy.append(name, note);
      row.append(copy, createAmount(entry.numericAmount, entry.amount));

      if (entry.date) {
        const date = document.createElement("time");
        date.className = "sponsor-date";
        date.textContent = entry.date;
        row.append(date);
      }

      sequence.append(row);
    });

    track.append(sequence);
    if (latestEntries.length === 5) {
      const duplicate = sequence.cloneNode(true) as HTMLElement;
      duplicate.setAttribute("aria-hidden", "true");
      track.append(duplicate);
      track.classList.add("sponsor-latest-track--scrolling");
    }

    list.append(track);
    latestSection.append(list);
  } else {
    const empty = document.createElement("p");
    empty.className = "sponsor-panel-empty";
    empty.textContent = "添加赞助日期后，这里会优先显示最近记录。";
    latestSection.append(empty);
  }

  const rankSection = document.createElement("section");
  rankSection.className = "sponsor-panel sponsor-ranking";
  appendHeading(rankSection, "TOP SUPPORTERS", "累计赞助排行", `前 ${topEntries.length} 名`);

  if (topEntries.length) {
    const list = document.createElement("ol");
    list.className = "sponsor-ranking-list";

    topEntries.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = `sponsor-rank-card${index < 4 ? ` sponsor-rank-card--${index + 1}` : ""}`;
      if (index < 3) {
        const watermark = document.createElement("iconify-icon");
        watermark.className = "sponsor-rank-watermark";
        watermark.setAttribute("icon", "mdi:medal");
        watermark.setAttribute("aria-hidden", "true");
        item.append(watermark);
      }
      const medal = document.createElement("span");
      medal.className = "sponsor-medal";
      medal.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("strong");
      name.textContent = entry.name;
      const count = document.createElement("span");
      count.className = "sponsor-rank-count";
      count.textContent = `${entry.count} 笔赞助`;
      item.append(medal, name, count, createAmount(entry.amount));
      list.append(item);
    });

    rankSection.append(list);
  } else {
    const empty = document.createElement("p");
    empty.className = "sponsor-panel-empty";
    empty.textContent = "填写赞助金额后即可生成累计排行。";
    rankSection.append(empty);
  }

  showcase.append(latestSection, rankSection);
  dashboard.append(showcase);

  const details = document.createElement("section");
  details.className = "sponsor-panel sponsor-details";
  appendHeading(details, "FULL HISTORY", "赞助明细", `${entries.length} 笔记录`);

  const table = document.createElement("div");
  table.className = "sponsor-table";
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", "全部赞助明细");

  const tableHeader = document.createElement("div");
  tableHeader.className = "sponsor-table-header";
  tableHeader.setAttribute("role", "row");
  ["序号", "赞助者", "留言", "日期", "金额"].forEach((label) => {
    const cell = document.createElement("span");
    cell.setAttribute("role", "columnheader");
    cell.textContent = label;
    tableHeader.append(cell);
  });
  table.append(tableHeader);

  entriesNewestFirst.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "sponsor-table-row";
    row.setAttribute("role", "row");

    const values = [
      String(index + 1).padStart(2, "0"),
      entry.name,
      entry.message || "—",
      entry.date || "—",
    ];
    values.forEach((text) => {
      const cell = document.createElement("span");
      cell.setAttribute("role", "cell");
      cell.textContent = text;
      row.append(cell);
    });

    const amount = createAmount(entry.numericAmount, entry.amount);
    amount.setAttribute("role", "cell");
    row.append(amount);
    table.append(row);
  });

  details.append(table);
  dashboard.append(details);
}
