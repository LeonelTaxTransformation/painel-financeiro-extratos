const DATA = window.APP_DATA;

const chart = document.getElementById("chart");

const traces = DATA.series.map((s, i) => ({
  x: DATA.labels,
  y: s.data,
  mode: "lines+markers",
  type: "scatter",
  name: s.company
}));

Plotly.newPlot(chart, traces);

chart.on("plotly_click", function(d){
  const point = d.points[0];
  const empresa = point.data.name;
  const periodo = point.x;

  const detalhes = DATA.details?.[empresa]?.[periodo] || [];

  const div = document.getElementById("detail-content");
  div.innerHTML = `<h3>${empresa} - ${periodo}</h3>`;

  detalhes.forEach(d => {
    div.innerHTML += `<p>${d.description} - R$ ${d.value}</p>`;
  });
});
