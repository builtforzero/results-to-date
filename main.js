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
let resultsURL = 'https://docs.google.com/spreadsheets/d/1vr2jahJzoSfdekaPwzNDJ06VueEF1wIqVOcABH6bCdU/edit#gid=0';
let mapURL = 'https://docs.google.com/spreadsheets/d/1lH3o8LHp3a-s2p004jmTTsEjLeHgt-D-E8xAZAC2eow/edit#gid=0';

let a, b;

// Initialize Tabletop.js with URL, then call the data load function
function init() {
  a = Tabletop.init({
    key: resultsURL,
    callback: function (data, tabletop) {
      state.results = data;
      console.log("Step 1: Loaded results!");
      loadMap();
    },
    simpleSheet: true
  });

  function loadMap() {Tabletop.init({
    key: mapURL,
    callback: function (data, tabletop) {
      state.mapData = data;
      console.log("Step 2: Loaded map!");
      setScales(state);
    },
    simpleSheet: true
  })
  }
  
}

init();

// Set map projection and get topline numbers
function setScales(state) {
  Promise.all([
    d3.json("./data/usState.json"),
  ]).then(([usaData]) => {
    console.log("Step 3: Loaded geography!")
    state.geo = usaData;

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

    draw(state);
    
  });
  
}

// Draw topline numbers and map
function draw(state) {
  let format = d3.format(",." + d3.precisionFixed(1) + "f")

  // TOPLINE NUMBERS
  d3.select("#communities-topline")
    .append("div")
    .attr("class", "number")
    .text(state.communities)
    .transition(d3.easeElastic)
    .duration(1000)
    .textTween(function (d) {
      const i = d3.interpolate(0, +state.communities);
      return function (t) {
        return format(i(t))
      }
    })

  d3.select("#vet-topline")
    .append("div")
    .attr("class", "number")
    .text(state.vetEnded)
    .transition(d3.easeElastic)
    .duration(1000)
    .textTween(function (d) {
      const i = d3.interpolate(0, +state.vetEnded);
      return function (t) {
        return format(i(t))
      }
    })

  d3.select("#reduction-topline")
    .append("div")
    .attr("class", "number")
    .text(state.reduction)
    .transition(d3.easeElastic)
    .duration(1000)
    .textTween(function (d) {
      const i = d3.interpolate(0, +state.reduction);
      return function (t) {
        return format(i(t))
      }
    })

  d3.select("#housed-topline")
    .append("div")
    .attr("class", "number")
    .text(format(state.housed))
    .transition(d3.easeElastic)
    .duration(1000)
    .textTween(function (d) {
      const i = d3.interpolate(0, +state.housed);
      return function (t) {
        return format(i(t))
      }
    })

  d3.select("#quality-topline")
    .append("div")
    .attr("class", "number")
    .text(state.qualityData)
    .transition(d3.easeElastic)
    .duration(1000)
    .textTween(function (d) {
      const i = d3.interpolate(0, +state.qualityData);
      return function (t) {
        return format(i(t))
      }
    })



  // MAP
  let colorScale = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#a50a51", "white"]);

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
    .data(state.mapData, d => d.community)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", "8")
    .attr("style", "stroke: #a50a51; stroke-width: 3px")
    .attr("fill", d => colorScale(d['fz_category']))
    .attr("transform", d => {
      const [x, y] = projection([+d.longitude, +d.latitude]);
      return `translate(${x}, ${y})`;
    })
    // Mouseover event listener
    .on('mouseover', function (d) {
      // change dot
      d3.select(this)
        .attr("r", "14")
        .attr("cursor", "pointer");
      // show tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'map-tooltip')
        .attr('style', 'position: absolute;')
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', d3.event.pageY + 'px')
        .html("<b>" + d.community + "</b>, " + d.state + " <br><b style='font-size: 12px; font-weight:400;'>" + d.organization + "</b>")
        .style("opacity", 0)
        .transition(d3.easeElastic)
        .duration(200)
        .style("opacity", 0.9);
    })
    // Mouseout event listener
    .on('mouseout', function (d) {
      // reset dot
      d3.select(this)
        .attr("r", "8")
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
      .delay(d => 10 * d.latitude)
      .attr("opacity", 1)
    );

}