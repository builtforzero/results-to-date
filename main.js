// Set global state
let state = {
  geo: null,
  results: [],
  mapData: [],
  communities: 0,
  vetEnded: 0,
  reduction: 0,
  housed: 0,
  qualityData: 0,
}

let svg, path, projection;

// URL of public Google Sheet with data
let url = 'https://docs.google.com/spreadsheets/d/1vr2jahJzoSfdekaPwzNDJ06VueEF1wIqVOcABH6bCdU/edit#gid=0';

// Initialize Tabletop.js with URL, then call the data load function
function init() {
  Tabletop.init({
    key: url,
    callback: loadData,
    simpleSheet: true
  })
}

// Assign Tabletop data to state and load data files
function loadData(data, tabletop) {
  state.results = data;

  // Load data files and assign to state, then draw
  Promise.all([
    d3.json("./data/usState.json"),
    d3.csv("./data/map.csv", d3.autoType),
  ]).then(([usaData, mapData]) => {
    state.geo = usaData;
    state.mapData = mapData.flat();
    setScales(state);
    draw(state);
  });

}

init();

// Set map projection and get topline numbers
function setScales(state) {
  
  // Use AlbersUSA projection, scale to canvas and geography
  projection = d3.geoAlbersUsa().fitSize([1059, 625], state.geo);
  path = d3.geoPath().projection(projection);

  // Filter Google Sheets data for topline numbers
  state.communities = state.results.filter(d => {
    return d.Category === "communities"
  })[0].Value;
  state.vetEnded = state.results.filter(d => {
    return d.Category === "vetEnded"
  })[0].Value;
  state.reduction = state.results.filter(d => {
    return d.Category === "reduction"
  })[0].Value;
  state.housed = state.results.filter(d => {
    return d.Category === "housed"
  })[0].Value;
  state.qualityData = state.results.filter(d => {
    return d.Category === "qualityData"
  })[0].Value;

}

// Draw topline numbers and map
function draw(state) {
  let formatNumber = d3.format(",")

  // TOPLINE NUMBERS
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


  // MAP

  // Assign SVG, make responsive with viewbox
  svg = d3
    .select("#communities-map")
    .append("svg")
    .attr("viewBox", "0 0 1059 625")
    .append("g")
    .attr("transform", "translate(-45,0)");

  // Add the map projection to the SVG, fade in
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
    .duration(200)
    .style("opacity", "1");

  // Add dots to SVG and tooltip event
  const dot = svg
    // Create a dot for each community, and move to lat/long position on map
    .selectAll(".circle")
    .data(state.mapData, d => d.Community)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", "8")
    .attr("style", "stroke: white; stroke-width: 3px")
    .attr("fill", "#ff6f0c")
    .attr("transform", d => {
      const [x, y] = projection([+d.Longitude, +d.Latitude]);
      return `translate(${x}, ${y})`;
    })
    // Mouseover event listener
    .on('mouseover', function (d) {
      // change dot
      d3.select(this)
        .attr("style", "stroke: #a50a51; stroke-width: 3px")
        .attr("opacity", 0.7)
        .attr("cursor", "pointer");
      // show tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'map-tooltip')
        .attr('style', 'position: absolute;')
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', d3.event.pageY + 'px')
        .html("<b>" + d.Community + "</b>, " + d.State + " <br><b style='font-size: 12px; font-weight:400;'>Started with BFZ on " + d.startDate + "</b>")
        .style("opacity", 0)
        .transition(d3.easeElastic)
        .duration(200)
        .style("opacity", 0.9);
    })
    // Mouseout event listener
    .on('mouseout', function (d) {
      // reset dot
      d3.select(this)
        .attr("style", "stroke: white; stroke-width: 3px")
        .attr("opacity", 1)
        .attr("cursor", "default")
      // remove tooltip
      d3.selectAll(".map-tooltip")
        .style("opacity", 0.9)
        .transition(d3.easeElastic)
        .duration(100)
        .style("opacity", 0)
        .remove();
    })
    // Fade in dots by latitude value
    .call(selection =>
      selection
      .attr("opacity", 0)
      .transition(d3.easeElastic)
      .delay(d => 10 * d.Latitude)
      .attr("opacity", 1)
    );

}