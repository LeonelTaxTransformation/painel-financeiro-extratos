const DATA = window.APP_DATA;

const COLORS = [
  "#12d6ff",
  "#d7a648",
  "#39e8a7",
  "#ff5f7a",
  "#9f7aea",
  "#ff9f1a",
  "#00c2a8",
  "#7dd3fc"
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  });
}

function formatMonthLabel(label) {
  const [year, month] = String(label).split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const idx = Number(month) - 1;
  if (idx >= 0 && idx < 12) return `${meses[idx]}/${String(year).slice(-2)}`;
  return label;
}

function buildColorMap(series) {
  const map = {};
  series.forEach((item, idx) => {
    map[item.company] = COLORS[idx % COLORS.length];
  });
  return map;
}

const colorMap = buildColorMap(DATA.series);
let selectedCompanies = DATA.series.map(s => s.company);

function getSeriesByCompany(company) {
  return DATA.series.find(s => s.company === company);
}

function computeStats() {
  const companies = DATA.series.length;
  const labels = DATA.labels || [];
  const first = labels[0] || "-";
  const last = labels[labels.length - 1] || "-";

  document.getElementById("metric-empresas").textContent = companies;
  document.getElementById("metric-janela").textContent =
    labels.length ? `${formatMonthLabel(first)} até ${formatMonthLabel(last)}` : "-";

  if (labels.length) {
    const lastIndex = labels.length - 1;
    const totalLast = DATA.series.reduce((sum, s) => sum + (Number(s.data[lastIndex]) || 0), 0);
    document.getElementById("metric-ultimo-periodo").textContent = formatMonthLabel(last);
    document.getElementById("metric-ultimo-total").textContent = formatCurrency(totalLast);
  }

  let maxValue = -Infinity;
  let maxCompany = "-";
  let maxLabel = "-";

  DATA.series.forEach(series => {
    series.data.forEach((value, idx) => {
      const num = Number(value);
      if (!Number.isNaN(num) && num > maxValue) {
        maxValue = num;
        maxCompany = series.company;
        maxLabel = DATA.labels[idx];
      }
    });
  });

  if (maxValue > -Infinity) {
    document.getElementById("metric-maior").textContent = formatCurrency(maxValue);
    document.getElementById("metric-maior-sub").textContent = `${maxCompany} • ${formatMonthLabel(maxLabel)}`;
  }
}

function createFilters() {
  const container = document.getElementById("company-filters");
  container.innerHTML = "";

  DATA.series.forEach(series => {
    const item = document.createElement("label");
    item.className = "company-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = series.company;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!selectedCompanies.includes(series.company)) {
          selectedCompanies.push(series.company);
        }
      } else {
        selectedCompanies = selectedCompanies.filter(c => c !== series.company);
      }
      renderChart();
    });

    const swatch = document.createElement("span");
    swatch.className = "company-swatch";
    swatch.style.color = colorMap[series.company];
    swatch.style.background = colorMap[series.company];

    const name = document.createElement("span");
    name.className = "company-name";
    name.textContent = series.company;

    item.appendChild(checkbox);
    item.appendChild(swatch);
    item.appendChild(name);
    container.appendChild(item);
  });

  document.getElementById("select-all").addEventListener("click", () => {
    selectedCompanies = DATA.series.map(s => s.company);
    container.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = true);
    renderChart();
  });

  document.getElementById("clear-all").addEventListener("click", () => {
    selectedCompanies = [];
    container.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
    renderChart();
  });
}

function buildTraces() {
  return DATA.series
    .filter(series => selectedCompanies.includes(series.company))
    .map(series => ({
      x: DATA.labels,
      y: series.data,
      mode: "lines+markers+text",
      type: "scatter",
      name: series.company,
      line: {
        color: colorMap[series.company],
        width: 4,
        shape: "linear"
      },
      marker: {
        color: colorMap[series.company],
        size: 9,
        line: {
          color: "#071019",
          width: 2
        }
      },
      text: series.data.map(v => formatCurrency(v)),
      textposition: "top center",
      textfont: {
        color: colorMap[series.company],
        size: 11
      },
      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Período: %{x}<br>" +
        "Saldo final: %{text}<extra></extra>"
    }));
}

function renderChart() {
  const traces = buildTraces();

  const layout = {
    paper_bgcolor: "#0a0d10",
    plot_bgcolor: "#0a0d10",
    font: {
      family: "Inter, sans-serif",
      color: "#eef7fb"
    },
    margin: {
      l: 70,
      r: 30,
      t: 30,
      b: 70
    },
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0,
      y: 1.18,
      font: { size: 12, color: "#cfe2ec" }
    },
    xaxis: {
      title: {
        text: "Período",
        font: { color: "#9cb1bd", size: 12 }
      },
      tickmode: "array",
      tickvals: DATA.labels,
      ticktext: DATA.labels.map(formatMonthLabel),
      showgrid: true,
      gridcolor: "rgba(18,214,255,.10)",
      zeroline: false,
      linecolor: "rgba(18,214,255,.16)",
      tickfont: { color: "#cfe2ec", size: 12 }
    },
    yaxis: {
      title: {
        text: "Saldo final",
        font: { color: "#9cb1bd", size: 12 }
      },
      tickprefix: "R$ ",
      separatethousands: true,
      showgrid: true,
      gridcolor: "rgba(18,214,255,.10)",
      zeroline: false,
      tickfont: { color: "#cfe2ec", size: 12 }
    },
    hovermode: "closest"
  };

  const config = {
    responsive: true,
    displayModeBar: true
  };

  Plotly.newPlot("chart", traces, layout, config);

  const chartEl = document.getElementById("chart");
  chartEl.on("plotly_click", onPointClick);
}

function aggregateDetails(items) {
  const map = new Map();

  items.forEach(item => {
    const key = item.description || "Sem descrição";
    if (!map.has(key)) {
      map.set(key, {
        description: key,
        qty: 0,
        value: 0
      });
    }
    const current = map.get(key);
    current.qty += 1;
    current.value += Number(item.value || 0);
  });

  return Array.from(map.values()).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function renderAggTable(items) {
  const tbody = document.getElementById("agg-body");
  tbody.innerHTML = "";

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty">Sem composição disponível para este ponto.</td></tr>`;
    return;
  }

  const aggregated = aggregateDetails(items);

  aggregated.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.description}</td>
      <td class="num">${row.qty}</td>
      <td class="num">${formatCurrency(row.value)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRawTable(items) {
  const tbody = document.getElementById("raw-body");
  tbody.innerHTML = "";

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Sem lançamentos disponíveis para este ponto.</td></tr>`;
    return;
  }

  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.date || "-"}</td>
      <td>${item.description || "-"}</td>
      <td>${item.section || "-"}</td>
      <td class="num">${formatCurrency(item.value)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function onPointClick(eventData) {
  const point = eventData.points[0];
  const company = point.data.name;
  const period = point.x;

  const details =
    (DATA.details &&
      DATA.details[company] &&
      DATA.details[company][period]) || [];

  document.getElementById("detail-title").textContent =
    `${company} • ${formatMonthLabel(period)}`;

  const total = details.reduce((sum, item) => sum + Number(item.value || 0), 0);

  document.getElementById("detail-meta").innerHTML =
    `Saldo do ponto: <strong>${formatCurrency(point.y)}</strong><br>` +
    `Qtd. de lançamentos: <strong>${details.length}</strong><br>` +
    `Soma dos detalhes: <strong>${formatCurrency(total)}</strong>`;

  renderAggTable(details);
  renderRawTable(details);
}

computeStats();
createFilters();
renderChart();
