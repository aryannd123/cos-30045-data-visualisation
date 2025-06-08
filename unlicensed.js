document.addEventListener("DOMContentLoaded", function () {
  const filterArea = document.createElement("div");
  filterArea.innerHTML = `
    <p id="loading" style="padding:20px; font-weight:bold;">Loading data...</p>
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

  const tooltip = d3.select("#tooltip");

  d3.csv("data/police.csv").then(rawData => {
    document.getElementById("loading").remove();

    // Filter out unknown AGE_GROUP rows immediately
    const data = rawData
  .map(d => ({ ...d, 'Sum(FINES)': +d['Sum(FINES)'] }))
  .filter(d => d.AGE_GROUP !== "Unknown" && d.JURISDICTION !== "QLD");


   const states = Array.from(
  new Set(data.map(d => d.JURISDICTION))
)
.filter(state => state !== "QLD")
.sort();


    states.forEach(state => {
      d3.select("#barStateSelect").append("option").attr("value", state).text(state);
      d3.select("#pieStateSelect").append("option").attr("value", state).text(state);
      d3.select("#heatStateSelect").append("option").attr("value", state).text(state);
    });

    function renderBarChart(selectedState) {
      let chartData = selectedState === "ALL" ? data : data.filter(d => d.JURISDICTION === selectedState);
        chartData = chartData.filter(d => d.AGE_GROUP !== "Unknown");
      const svg = d3.select("#bar-chart").html("").append("svg").attr("width", 750).attr("height", 400);

      const ageGroups = [...new Set(chartData.map(d => d.AGE_GROUP))];
      const jurisdictionsFiltered = [...new Set(chartData.map(d => d.JURISDICTION))];

      const x0 = d3.scaleBand().domain(ageGroups).range([50, 650]).padding(0.2);
      const x1 = d3.scaleBand().domain(jurisdictionsFiltered).range([0, x0.bandwidth()]);
      const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d['Sum(FINES)']) || 0]).nice().range([350, 50]);
      const color = d3.scaleOrdinal(d3.schemeSet2).domain(jurisdictionsFiltered);

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
            tooltip.style("left", (event.clientX + 10) + "px")
              .style("top", (event.clientY - 20) + "px")
              .style("display", "block")
              .html(`<strong>${d.JURISDICTION}</strong><br>${d.AGE_GROUP}: ${d['Sum(FINES)']}`);
          })
          .on("mouseout", () => tooltip.style("display", "none"))
          .transition().duration(800)
          .attr("y", d => y(d['Sum(FINES)']))
          .attr("height", d => 350 - y(d['Sum(FINES)']));
      });

      // Bar chart legend
      const legend = svg.append("g").attr("transform", "translate(660, 50)");
      jurisdictionsFiltered.forEach((jurisdiction, i) => {
        const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        legendRow.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(jurisdiction));
        legendRow.append("text").attr("x", 20).attr("y", 12).text(jurisdiction).attr("font-size", "12px").attr("fill", "#333");
      });
    }

    function renderPieChart(selectedState) {
      let filtered = selectedState === "ALL" ? data : data.filter(d => d.JURISDICTION === selectedState);
          filtered = filtered.filter(d => d.AGE_GROUP !== "Unknown");
      const ageSummary = d3.rollups(
        filtered,
        v => d3.sum(v, d => d['Sum(FINES)']),
        d => d.AGE_GROUP
      );

      const pie = d3.pie().value(d => d[1]);
      const arc = d3.arc().innerRadius(0).outerRadius(150);
      const color = d3.scaleOrdinal(d3.schemeTableau10).domain(ageSummary.map(d => d[0]));

      const svg = d3.select("#pie-chart").html("").append("svg").attr("width", 600).attr("height", 400);
      const g = svg.append("g").attr("transform", "translate(200,200)");
      const pieData = pie(ageSummary);

      g.selectAll("path")
        .data(pieData)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data[0]))
        .on("mousemove", (event, d) => {
          tooltip.style("left", (event.clientX + 10) + "px")
            .style("top", (event.clientY - 20) + "px")
            .style("display", "block")
            .html(`<strong>${d.data[0]}</strong><br>Fines: ${d.data[1]}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .transition().duration(800)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return t => arc(i(t));
        });

      // Pie chart legend with colored squares
      const legend = svg.append("g").attr("transform", "translate(420, 40)");
      const legendItems = legend.selectAll("g")
        .data(pieData)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);

      legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d.data[0]));

      legendItems.append("text")
        .attr("x", 24)
        .attr("y", 14)
        .attr("font-size", "12px")
        .text(d => `${d.data[0]}: ${d.data[1]}`);
    }

    function renderHeatmapChart(selectedState) {
      let chartData = selectedState === "ALL" ? data : data.filter(d => d.JURISDICTION === selectedState);

      const svg = d3.select("#heatmap-chart").html("").append("svg").attr("width", 700).attr("height", 400);

      const ageGroups = [...new Set(chartData.map(d => d.AGE_GROUP))];
      const jurisdictionsFiltered = [...new Set(chartData.map(d => d.JURISDICTION))];

      const gridX = d3.scaleBand().domain(jurisdictionsFiltered).range([100, 650]).padding(0.05);
      const gridY = d3.scaleBand().domain(ageGroups).range([50, 350]).padding(0.05);
      const heatColor = d3.scaleSequential().interpolator(d3.interpolateReds)
        .domain([0, d3.max(chartData, d => d['Sum(FINES)']) || 0]);

      svg.selectAll("rect")
        .data(chartData)
        .enter().append("rect")
        .attr("x", d => gridX(d.JURISDICTION))
        .attr("y", d => gridY(d.AGE_GROUP))
        .attr("width", gridX.bandwidth())
        .attr("height", gridY.bandwidth())
        .attr("fill", d => heatColor(d['Sum(FINES)']))
        .style("fill-opacity", 0)
        .on("mousemove", (event, d) => {
          tooltip.style("left", (event.clientX + 10) + "px")
            .style("top", (event.clientY - 20) + "px")
            .style("display", "block")
            .html(`<strong>${d.JURISDICTION}</strong><br>${d.AGE_GROUP}: ${d['Sum(FINES)']}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .transition().duration(800)
        .style("fill-opacity", 1);
      
      // Add axes
      const xAxis = d3.axisBottom(gridX);
      const yAxis = d3.axisLeft(gridY);

      svg.append("g")
        .attr("transform", "translate(0, 350)")
        .call(xAxis);

      svg.append("g")
        .attr("transform", "translate(100, 0)")
        .call(yAxis);
    }

    // Initial render with ALL selected
    renderBarChart("ALL");
    renderPieChart("ALL");
    renderHeatmapChart("ALL");

    // Event listeners for the dropdowns
    d3.select("#barStateSelect").on("change", function () {
      renderBarChart(this.value);
    });

    d3.select("#pieStateSelect").on("change", function () {
      renderPieChart(this.value);
    });

    d3.select("#heatStateSelect").on("change", function () {
      renderHeatmapChart(this.value);
    });

  }).catch(error => {
    console.error("Error loading CSV data:", error);
    document.getElementById("loading").textContent = "Failed to load data.";
  });
});
