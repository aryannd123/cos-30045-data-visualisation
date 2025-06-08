
document.addEventListener("DOMContentLoaded", function () {
  const filterArea = document.createElement("div");
  filterArea.innerHTML = `
    <div style="display:flex; gap:30px; padding:20px; flex-wrap: wrap;">
      <div>
        <label><strong>Govt. Policy Makers (Bar Chart)</strong></label><br/>
        <select id="barStateSelect"><option value="ALL">All</option></select>
      </div>
      <div>
        <label><strong>Youth Advocates (Pie Chart)</strong></label><br/>
        <select id="pieStateSelect"><option value="ALL">All</option></select>
      </div>
      <div>
        <label><strong>Researchers (Heatmap)</strong></label><br/>
        <select id="heatStateSelect"><option value="ALL">All</option></select>
      </div>
    </div>
    <div id="tooltip" style="position:absolute; background:white; border:1px solid #ccc; padding:8px; border-radius:4px; display:none; pointer-events:none; box-shadow:0 2px 5px rgba(0,0,0,0.1); font-size:12px; z-index:100;"></div>
  `;
  document.querySelector("header").after(filterArea);

  d3.csv("data/speed_fines.csv").then(data => {
    data.forEach(d => d['Sum(FINES)'] = +d['Sum(FINES)']);
    const states = Array.from(new Set(data.map(d => d.JURISDICTION)))
  .filter(state => state !== "QLD")  // 🔥 Remove QLD
  .sort();

states.forEach(state => {
  d3.select("#barStateSelect").append("option").attr("value", state).text(state);
  d3.select("#pieStateSelect").append("option").attr("value", state).text(state);
  d3.select("#heatStateSelect").append("option").attr("value", state).text(state);
});


    const tooltip = d3.select("#tooltip");

    function renderBarChart(selectedState) {
  const chartData = (selectedState === "ALL" ? data : data.filter(d => d.JURISDICTION === selectedState))
    .filter(d => d.AGE_GROUP !== "Unknown");

  const svg = d3.select("#bar-chart").html("").append("svg").attr("width", 700).attr("height", 400);

  const ageGroups = [...new Set(chartData.map(d => d.AGE_GROUP))];
  const jurisdictionsFiltered = [...new Set(chartData.map(d => d.JURISDICTION))];

  const x0 = d3.scaleBand().domain(ageGroups).range([50, 650]).padding(0.2);
  const x1 = d3.scaleBand().domain(jurisdictionsFiltered).range([0, x0.bandwidth()]);
  const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d['Sum(FINES)'])]).nice().range([350, 50]);
  const color = d3.scaleOrdinal(d3.schemeSet2);

  svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(x0));
  svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));

  ageGroups.forEach(age => {
    const groupData = chartData.filter(d => d.AGE_GROUP === age);
    svg.selectAll(`.bar-${age}`)
      .data(groupData)
      .enter().append("rect")
      .attr("x", d => x0(d.AGE_GROUP) + x1(d.JURISDICTION))
      .attr("width", x1.bandwidth())
      .attr("y", 350)
      .attr("height", 0)
      .attr("fill", d => color(d.JURISDICTION))
      .on("mousemove", (event, d) => {
        tooltip.style("left", event.pageX + 10 + "px")
               .style("top", event.pageY - 20 + "px")
               .style("display", "block")
               .html(`<strong>${d.JURISDICTION}</strong><br>${d.AGE_GROUP}: ${d['Sum(FINES)']}`);
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .transition().duration(800)
      .attr("y", d => y(d['Sum(FINES)']))
      .attr("height", d => 350 - y(d['Sum(FINES)']));
  });

  // ✅ Add legend
  const legend = svg.append("g")
    .attr("transform", "translate(650, 50)");

  jurisdictionsFiltered.forEach((jurisdiction, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(jurisdiction));

    legendRow.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(jurisdiction)
      .attr("font-size", "12px")
      .attr("fill", "#333");
  });
}


   function renderPieChart(selectedState) {
  const filtered = (selectedState === "ALL"
    ? data
    : data.filter(d => d.JURISDICTION === selectedState)
  ).filter(d => d.AGE_GROUP !== "Unknown");

  const ageSummary = d3.rollups(
    filtered,
    v => d3.sum(v, d => d['Sum(FINES)']),
    d => d.AGE_GROUP
  );

  const pie = d3.pie().value(d => d[1]);
  const arc = d3.arc().innerRadius(0).outerRadius(150);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3.select("#pie-chart").html("")
    .append("svg")
    .attr("width", 600)  // Extra width for the legend
    .attr("height", 400);

  const g = svg.append("g").attr("transform", "translate(200,200)");

  const pieData = pie(ageSummary);

  // Draw pie slices
  g.selectAll("path")
    .data(pieData)
    .enter().append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .on("mousemove", (event, d) => {
      tooltip.style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px")
        .style("display", "block")
        .html(`<strong>${d.data[0]}</strong><br>Fines: ${d.data[1]}`);
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .transition().duration(800)
    .attrTween("d", function(d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });

  // Create a legend
  const legend = svg.append("g")
    .attr("transform", "translate(400, 50)");

  const legendItems = legend.selectAll("g")
    .data(pieData)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`);

  // Legend color boxes
  legendItems.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => color(d.data[0]));

  // Legend text
  legendItems.append("text")
    .attr("x", 24)
    .attr("y", 14)
    .text(d => `${d.data[0]}: ${d.data[1]}`);
}

    function renderHeatmapChart(selectedState) {
      const chartData = (selectedState === "ALL" ? data : data.filter(d => d.JURISDICTION === selectedState))
  .filter(d => d.AGE_GROUP !== "Unknown");

      const svg = d3.select("#heatmap-chart").html("").append("svg").attr("width", 700).attr("height", 400);

      const ageGroups = [...new Set(chartData.map(d => d.AGE_GROUP))];
      const jurisdictionsFiltered = [...new Set(chartData.map(d => d.JURISDICTION))];

      const gridX = d3.scaleBand().domain(jurisdictionsFiltered).range([100, 650]).padding(0.05);
      const gridY = d3.scaleBand().domain(ageGroups).range([50, 350]).padding(0.05);
      const heatColor = d3.scaleSequential().interpolator(d3.interpolateReds)
        .domain([0, d3.max(chartData, d => d['Sum(FINES)'])]);

      svg.selectAll("rect")
        .data(chartData)
        .enter().append("rect")
        .attr("x", d => gridX(d.JURISDICTION))
        .attr("y", d => gridY(d.AGE_GROUP))
        .attr("width", gridX.bandwidth())
        .attr("height", gridY.bandwidth())
        .attr("fill", d => heatColor(d['Sum(FINES)']))
        .on("mousemove", (event, d) => {
          tooltip.style("left", event.pageX + 10 + "px")
                 .style("top", event.pageY - 20 + "px")
                 .style("display", "block")
                 .html(`<strong>${d.JURISDICTION}</strong><br>${d.AGE_GROUP}: ${d['Sum(FINES)']}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

      svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(gridX));
      svg.append("g").attr("transform", "translate(100,0)").call(d3.axisLeft(gridY));
    }

    renderBarChart("ALL");
    renderPieChart("ALL");
    renderHeatmapChart("ALL");

    d3.select("#barStateSelect").on("change", function () {
      renderBarChart(this.value);
    });
    d3.select("#pieStateSelect").on("change", function () {
      renderPieChart(this.value);
    });
    d3.select("#heatStateSelect").on("change", function () {
      renderHeatmapChart(this.value);
    });
  });
});
