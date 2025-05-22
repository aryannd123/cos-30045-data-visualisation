
const svg = document.getElementById('chart');
const tooltip = document.getElementById('tooltip');
const width = svg.clientWidth;
const height = svg.clientHeight;
const padding = 50;

const colorMap = {
  "NSW": "blue",
  "VIC": "black",
  "ACT": "purple",
  "SA": "lightgreen",
  "QLD": "red",
  "NT": "orange",
  "TAS": "teal",
  "WA": "brown"
};

fetch('Final_output.csv')
  .then(response => response.text())
  .then(text => {
    const rows = text.trim().split('\n').slice(1);
    const data = rows.map(row => {
      const [jurisdiction, age_group, fines] = row.split(',');
      return {
        JURISDICTION: jurisdiction,
        AGE_GROUP: age_group,
        FINES: +fines
      };
    });

    const jurisdictions = [...new Set(data.map(d => d.JURISDICTION))];
    const ageGroups = [...new Set(data.map(d => d.AGE_GROUP))];

    const select = document.getElementById('jurisdiction');
    jurisdictions.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j;
      opt.textContent = j;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => drawChart(data, select.value, ageGroups));
    drawChart(data, jurisdictions[0], ageGroups);
  });

function drawChart(data, selected, ageGroups) {
  const filtered = data.filter(d => d.JURISDICTION === selected);
  const maxFine = Math.max(...filtered.map(d => d.FINES));
  svg.innerHTML = '';

  const barWidth = (width - 2 * padding) / ageGroups.length;

  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", padding);
  xAxisLine.setAttribute("y1", height - padding);
  xAxisLine.setAttribute("x2", width - padding);
  xAxisLine.setAttribute("y2", height - padding);
  xAxisLine.setAttribute("stroke", "black");
  svg.appendChild(xAxisLine);

  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", padding);
  yAxisLine.setAttribute("y1", padding);
  yAxisLine.setAttribute("x2", padding);
  yAxisLine.setAttribute("y2", height - padding);
  yAxisLine.setAttribute("stroke", "black");
  svg.appendChild(yAxisLine);

  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", width / 2);
  xAxisLabel.setAttribute("y", height - 10);
  xAxisLabel.setAttribute("text-anchor", "middle");
  xAxisLabel.setAttribute("font-size", "14");
  xAxisLabel.textContent = "Age Group";
  svg.appendChild(xAxisLabel);

  const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  yAxisLabel.setAttribute("transform", "rotate(-90)");
  yAxisLabel.setAttribute("x", -height / 2);
  yAxisLabel.setAttribute("y", 20);
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("font-size", "14");
  yAxisLabel.textContent = "Fines Numbers";
  svg.appendChild(yAxisLabel);

  filtered.forEach((d, i) => {
    const x = padding + i * barWidth;
    const barHeight = (d.FINES / maxFine) * (height - 2 * padding);
    const y = height - padding - barHeight;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth - 10);
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", colorMap[d.JURISDICTION] || "steelblue");
    rect.addEventListener("mousemove", (e) => {
      tooltip.style.left = e.pageX + "px";
      tooltip.style.top = e.pageY + "px";
      tooltip.style.display = "block";
      tooltip.innerHTML = `Jurisdiction: ${d.JURISDICTION}<br/>Age: ${d.AGE_GROUP}<br/>Fines: ${d.FINES}`;
    });
    rect.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });
    svg.appendChild(rect);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + (barWidth - 10) / 2);
    label.setAttribute("y", height - padding + 15);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "axis-label");
    label.textContent = d.AGE_GROUP;
    svg.appendChild(label);
  });

  for (let i = 0; i <= 5; i++) {
    const val = Math.round(maxFine * i / 5);
    const y = height - padding - (val / maxFine) * (height - 2 * padding);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", padding - 10);
    label.setAttribute("y", y + 5);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "axis-label");
    label.textContent = val;
    svg.appendChild(label);
  }
}
