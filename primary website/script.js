
const barData = {
  "2021": { breath: 25000, drug: 4000 },
  "2022": { breath: 30000, drug: 4500 },
  "2023": { breath: 35000, drug: 4700 }
};

const lineData = [
  { year: "2021", value: 23000 },
  { year: "2022", value: 28000 },
  { year: "2023", value: 31000 }
];

const detectionData = [
  { method: "Indicator", value: 14000 },
  { method: "Evidentiary", value: 11000 },
  { method: "Mobile Van", value: 8000 }
];

function drawBarChart(year) {
  const svg = document.getElementById("barChart");
  svg.innerHTML = "";
  const margin = 50;
  const height = +svg.getAttribute("height") - margin;
  const width = +svg.getAttribute("width") - margin;
  const data = [barData[year].breath, barData[year].drug];
  const colors = ["#8884d8", "#82ca9d"];

  data.forEach((val, i) => {
    svg.innerHTML += `
      <rect x="${margin + i * 100}" y="${height - val / 200}" width="60" height="${val / 200}" fill="${colors[i]}" />
      <text x="${margin + i * 100 + 10}" y="${height - val / 200 - 10}" font-size="12">${val}</text>
      <text x="${margin + i * 100 + 10}" y="${height + 20}" font-size="12">${i === 0 ? 'Breath' : 'Drug'}</text>
    `;
  });
}

function drawLineChart() {
  const svg = document.getElementById("lineChart");
  svg.innerHTML = "";
  const margin = 50;
  const height = +svg.getAttribute("height") - margin;
  const width = +svg.getAttribute("width") - margin;

  let maxY = Math.max(...lineData.map(d => d.value));
  let points = lineData.map((d, i) => {
    let x = margin + i * 150;
    let y = height - d.value / maxY * height;
    return `${x},${y}`;
  }).join(" ");

  svg.innerHTML += `<polyline points="${points}" fill="none" stroke="#8884d8" stroke-width="2" />`;

  lineData.forEach((d, i) => {
    let x = margin + i * 150;
    let y = height - d.value / maxY * height;
    svg.innerHTML += `<circle cx="${x}" cy="${y}" r="4" fill="#8884d8" />
                      <text x="${x - 10}" y="${y - 10}" font-size="12">${d.value}</text>`;
  });
}

function drawDetectionBar() {
  const svg = document.getElementById("detectionBar");
  svg.innerHTML = "";
  const margin = 50;
  const height = +svg.getAttribute("height") - margin;
  const width = +svg.getAttribute("width") - margin;

  detectionData.forEach((d, i) => {
    let barHeight = d.value / 200;
    svg.innerHTML += `
      <rect x="${margin + i * 120}" y="${height - barHeight}" width="80" height="${barHeight}" fill="#ffc658" />
      <text x="${margin + i * 120 + 10}" y="${height - barHeight - 10}" font-size="12">${d.value}</text>
      <text x="${margin + i * 120 + 10}" y="${height + 20}" font-size="12">${d.method}</text>
    `;
  });
}

document.getElementById("year-select").addEventListener("change", function() {
  drawBarChart(this.value);
});

drawBarChart("2023");
drawLineChart();
drawDetectionBar();
