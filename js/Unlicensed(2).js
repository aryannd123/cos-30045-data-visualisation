document.addEventListener("DOMContentLoaded", function () {
  d3.csv("data/Clean_output.csv").then(data => {
    data.forEach(d => d['Sum(FINES)'] = +d['Sum(FINES)'] || 0);

    // ➤ General Pie Chart Drawing Function
    function drawPieChart(containerId, groupKey, chartTitle, filterUnknown = false) {
      let groupData = d3.rollups(
        data,
        v => d3.sum(v, d => d['Sum(FINES)']),
        d => d[groupKey]
      );

      // Optional filtering: Remove null/undefined/empty/"Unknown"
      if (filterUnknown) {
        groupData = groupData.filter(d => d[0] && d[0].toLowerCase() !== "unknown" && d[1] > 0);
      } else {
        groupData = groupData.filter(d => d[0] && d[1] > 0);
      }

      const width = 800, height = 600, margin = 40;
      const radius = Math.min(width, height) / 2 - margin;

      const svg = d3.select(containerId).html("")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${radius + margin}, ${height / 2})`);

      const color = d3.scaleOrdinal()
        .domain(groupData.map(d => d[0]))
        .range(d3.schemeSet2);

      const pie = d3.pie().value(d => d[1]);
      const data_ready = pie(groupData);

      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
        .style("z-index", 100);

      svg.selectAll("path")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data[0]))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .on("mousemove", (event, d) => {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("display", "block")
            .html(`<strong>${groupKey.replace(/_/g, ' ')}:</strong> ${d.data[0]}<br/><strong>Total Fines:</strong> $${d.data[1].toLocaleString()}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

      // ➕ Legend
      const legend = d3.select(containerId + " svg")
        .append("g")
        .attr("transform", `translate(${radius * 2 + 100}, 50)`);

      legend.selectAll("rect")
        .data(groupData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d[0]));

      legend.selectAll("text")
        .data(groupData)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 25 + 14)
        .text(d => d[0])
        .style("font-size", "12px");

      // ➤ Title
      d3.select(containerId + " svg")
        .append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(chartTitle);
    }

    // 🎯 Draw all charts
    drawPieChart("#pie-chart-metric", "METRIC", "Total Fines by Offense Type");
    drawPieChart("#pie-chart-age", "AGE_GROUP", "Total Fines by Age Group", true); // Remove "Unknown"
    drawPieChart("#pie-chart-state", "JURISDICTION", "Total Fines by State");
  });
});
