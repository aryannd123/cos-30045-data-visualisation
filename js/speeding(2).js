document.addEventListener("DOMContentLoaded", function () {
  d3.csv("data/speed_fines.csv").then(data => {
    // Convert fines to numbers
    data.forEach(d => d['Sum(FINES)'] = +d['Sum(FINES)']);

    // Filter out unknown age groups
    const filteredData = data.filter(d => d.AGE_GROUP !== "Unknown");

    // Sum fines by age group across all jurisdictions
    const finesByAgeGroup = d3.rollups(
      filteredData,
      v => d3.sum(v, d => d['Sum(FINES)']),
      d => d.AGE_GROUP
    );

    // Sort by age group or total fines if needed
    finesByAgeGroup.sort((a, b) => d3.ascending(a[0], b[0]));

    // Set up SVG
    const svg = d3.select("#bar-chart").html("")
      .append("svg")
      .attr("width", 700)
      .attr("height", 400);

    const margin = {top: 50, right: 30, bottom: 50, left: 60};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(finesByAgeGroup.map(d => d[0]))
      .range([margin.left, margin.left + width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(finesByAgeGroup, d => d[1])])
      .nice()
      .range([margin.top + height, margin.top]);

    // Create tooltip div (hidden by default)
    const tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("z-index", 100);

    // Axis
    svg.append("g")
      .attr("transform", `translate(0,${margin.top + height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Bars with tooltip events
    svg.selectAll(".bar")
      .data(finesByAgeGroup)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", d => margin.top + height - y(d[1]))
      .attr("fill", "#4285F4")
      .on("mousemove", (event, d) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 30) + "px")
               .style("display", "block")
               .html(`<strong>Age Group:</strong> ${d[0]}<br/><strong>Total Fines:</strong> $${d[1].toLocaleString()}`);
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    // Labels
    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .text("Speeding Fines by Age Group (All Jurisdictions)");

    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", margin.top + height + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Age Group");

    svg.append("text")
      .attr("x", - (margin.top + height / 2))
      .attr("y", margin.left - 40)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Total Fines ($)");
  });
});
