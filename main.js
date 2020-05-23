// Set global state
let state = {
  geo: null,
  results: [],
  mapData: [],
  communities: 0,
  vetEnded: 0,
  reduction: 0,
  housed: 0,
  qualityData: 0
}

let svg, path, projection;

// Format numbers with commas (syntax: formatNumber(1000) = 1,000)
let formatNumber = d3.format(",")

// Read in data
Promise.all([
  d3.json("./data/usState.json"),
  d3.csv("./data/test.csv", d3.autoType),
  d3.csv("./data/map.csv", d3.autoType),
]).then(([usaData, results, mapData]) => {
  state.geo = usaData;
  state.results = results.flat();
  state.mapData = mapData.flat();
  setScales(state);
  init(state);
});

function setScales(state) {
  projection = d3.geoAlbersUsa().fitSize([1059, 625], state.geo);
  path = d3.geoPath().projection(projection);

  state.communities = state.results.filter(d => {return d.Category === "communities"})[0].Value;
  state.vetEnded = state.results.filter(d => {return d.Category === "vetEnded"})[0].Value;
  state.reduction = state.results.filter(d => {return d.Category === "reduction"})[0].Value;
  state.housed = state.results.filter(d => {return d.Category === "housed"})[0].Value;
  state.qualityData = state.results.filter(d => {return d.Category === "qualityData"})[0].Value;
}

function init(state) {
  let margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  svg = d3
    .select("#communities-map")
    .append("svg")
    .attr("viewBox", "0 0 1059 625")
    .append("g")
    .attr("transform", "translate(-45,0)");

  draw(state);
}

function draw(state) {

  d3.select("#communities-topline")
    .append("div")
    .text(state.communities)

  d3.select("#vet-topline")
    .append("div")
    .text(state.vetEnded)

  d3.select("#reduction-topline")
    .append("div")
    .text(state.reduction)

  d3.select("#housed-topline")
    .append("div")
    .text(formatNumber(state.housed))

  d3.select("#quality-topline")
    .append("div")
    .text(state.qualityData)

  console.log(state)

  svg
    .selectAll(".land")
    .append("g")
    .data(state.geo.features)
    .join("path")
    .attr("d", path)
    .attr("class", "land")
    .attr("fill", "#FF9520")
    .style("stroke", "#ff6f0c")
    .style("stroke-width", 2)
    .style("opacity", "0")
    .transition(d3.easeElastic)
    .duration(900)
    .style("opacity", "1");

  const dot = svg
    .selectAll(".circle")
    .data(state.mapData, d => d.Community)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("opacity", 0)
    .attr("r", "8")
    .attr("style", "stroke: white; stroke-width: 3px")
    .attr("fill", "#ff6f0c")
    .attr("transform", d => {
      const [x, y] = projection([+d.Longitude, +d.Latitude]);
      return `translate(${x}, ${y})`;
    })
    .on('mouseover', function (d) {
      // dot
      d3.select(this)
        .attr("style", "stroke: #a50a51; stroke-width: 3px")
        .attr("opacity", 0.7)
        .attr("cursor", "pointer");
      // tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'map-tooltip')
        .attr('style', 'position: absolute;')
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', d3.event.pageY + 'px')
        .html("<b>" + d.Community + "</b>, " + d.State + " <br><b style='font-size: 12px; font-weight:400;'>Started with BFZ on " + d.startDate + "</b>")
        .style("opacity", 0)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
    })
    .on('mouseout', function (d) {
      // dot
      d3.select(this)
        .attr("style", "stroke: white; stroke-width: 3px")
        .attr("opacity", 1)
        .attr("cursor", "default")
      // tooltip
      d3.selectAll(".map-tooltip")
        .remove();
    })
    .call(selection =>
      selection
      .attr("opacity", 0)
      .transition(d3.easeElastic)
      .delay(d => 10 * d.Latitude)
      .attr("opacity", 1)
  );

}


function setGlobalState(nextState) {
  state = {
    ...state,
    ...nextState,
  };
}