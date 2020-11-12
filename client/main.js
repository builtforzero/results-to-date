require('dotenv').config();
const d3 = require("d3");
const Papa = require("papaparse");
const geoData = require("../assets/usState.json");
import 'regenerator-runtime/runtime'

// Set global state
let state = {
  geo: null,
  communities: 0,
  vetEnded: 0,
  reduction: 0,
  housed: 0,
  qualityData: 0,
  listActive: false,
  apiKey: process.env.API_KEY,
  results: null,
  map: null,
}

let results = {
  spreadsheetId: process.env.RESULTS_SPREADSHEET_ID,
  range: process.env.RESULTS_RANGE,
  data: null
}

let map = {
  spreadsheetId: process.env.MAP_SPREADSHEET_ID,
  range: process.env.MAP_RANGE,
  data: null
}

let svg, path, projection;

function getResultsData(apiKey, spreadsheetId, range) {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const isUndefined = (element) => element === undefined;
  const config = [spreadsheetId, range, apiKey]

  if (config.some(isUndefined)) {
    console.log("Config Values Undefined!", config)
  } else {
    fetch(getUrl).then(function(response) {
       return response.json();
    }).then(function (data) {
      const csv = Papa.unparse(data.values, {
        header: true,
        quotes: true
      })
      const json = Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
      })
      getMapData(state.apiKey, map.spreadsheetId, map.range, json.data)
    })
    .catch(error => console.error('Error!', error));
  }
}

function getMapData(apiKey, spreadsheetId, range, resultData) {
  results.data = resultData;
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const isUndefined = (element) => element === undefined;
  const config = [spreadsheetId, range, apiKey]

  if (config.some(isUndefined)) {
    console.log("Config Values Undefined!", config)
  } else {
    fetch(getUrl).then(function(response) {
       return response.json();
    }).then(function (data) {
      const csv = Papa.unparse(data.values, {
        header: true,
        quotes: true
      })
      const json = Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
      })
      setMapAndScales(state, results, json.data);
    })
    .catch(error => console.error('Error!', error));
  }
}


function init() {
  getResultsData(state.apiKey, results.spreadsheetId, results.range)
}

init();

function setMapAndScales(state, results, mapData) {
  map.data = mapData;
  state.geo = geoData;
  projection = d3.geoAlbersUsa().fitSize([1059, 625], state.geo);
  path = d3.geoPath().projection(projection);

  state.communities = results.data.filter(d => {
    return d.Category === "communities"
  })[0].Value;
  state.vetEnded = results.data.filter(d => {
    return d.Category === "vetEnded"
  })[0].Value;
  state.reduction = results.data.filter(d => {
    return d.Category === "reduction"
  })[0].Value;
  state.housed = results.data.filter(d => {
    return d.Category === "housed"
  })[0].Value;
  state.qualityData = results.data.filter(d => {
    return d.Category === "qualityData"
  })[0].Value;

  draw(state, map, results);
}

// Set subtitle in tooltip if chronic / vet functional zero date exists
function setSubtitle(vetDate, chronicDate) {
  if (vetDate == undefined && chronicDate == undefined) {
    return "";
  } else if (vetDate != undefined && chronicDate == undefined) {
    return `&nbspEnded <b>veteran</b> homelessness in <b>${vetDate}</b>&nbsp`;
  } else if (chronicDate != undefined && vetDate == undefined) {
    return `&nbspEnded <b>chronic</b> homelessness in <b>${chronicDate}</b>&nbsp`;
  } else if (vetDate != undefined && chronicDate != undefined) {
    return `&nbspEnded <b>veteran</b> homelessness in <b>${vetDate}</b>&nbsp<br>&nbspEnded <b>chronic</b> homelessness in <b>${chronicDate}</b>&nbsp`;
  }
}

function setTooltip(community, state, vetDate, chronicDate) {
  const cleanCommunity = community.replace(" CoC", "").replace(" Regional", "").replace("Countys", "County");
  return `<b>${cleanCommunity}</b>, <b style='font-weight:400;'> ${state}</b> <br><b style='font-size: 12px; font-weight:400;'> ${setSubtitle(vetDate, chronicDate)} </b>`
}

function setAsterisk(vetDate, chronicDate) {
  if (vetDate == undefined && chronicDate == undefined) {
    return "";
  } else if (vetDate != undefined && chronicDate == undefined) {
    return `&nbsp &#x2605;
    &nbsp`;
  } else if (chronicDate != undefined && vetDate == undefined) {
    return `&nbsp &#x2605;
    &nbsp`;
  } else if (vetDate != undefined && chronicDate != undefined) {
    return `&nbsp &#x2605;
    &nbsp`;
  }
}

function setSubtitleColor(vetDate, chronicDate) {
  if (vetDate == undefined && chronicDate == undefined) {
    return "rgb(22, 22, 22)";
  } else if (vetDate != undefined && chronicDate == undefined) {
    return "#a50a51";
  } else if (chronicDate != undefined && vetDate == undefined) {
    return "#a50a51";
  } else if (vetDate != undefined && chronicDate != undefined) {
    return "#a50a51";
  }
}

function setBackgroundColor(vetDate, chronicDate) {
  if (vetDate == undefined && chronicDate == undefined) {
    return "rgb(22, 22, 22)";
  } else if (vetDate != undefined && chronicDate == undefined) {
    return "#a50a51";
  } else if (chronicDate != undefined && vetDate == undefined) {
    return "#a50a51";
  } else if (vetDate != undefined && chronicDate != undefined) {
    return "#a50a51";
  }
}


// Draw topline numbers and map
function draw(state, map, results) {
  // format large numbers with commas
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

  // Set colorscales
  let colorScale = d3.scaleOrdinal().domain(["Yes", undefined]).range(["#a50a51", "white"]);
  let textScale = d3.scaleOrdinal().domain(["Yes", undefined]).range(["#a50a51", "#ff6f0c"]);
  let fontWeight = d3.scaleOrdinal().domain(["Yes", undefined]).range(["600", "300"]);

  // Assign SVG, make responsive with viewbox
  svg = d3
    .select("#communities-map")
    .append("svg")
    .attr("viewBox", "0 0 1035 610")
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

  const radius = 11

  // Add dots to SVG and tooltip event
  const dot = svg
    // Create a dot for each community, and move to lat/long position on map
    .selectAll(".circle")
    .data(map.data, d => d.community)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", radius)
    .attr("style", "stroke:#a50a51; stroke-width: 3px;")
    .attr("fill", d => colorScale(d['fz_category']))
    .attr("id", function (d, i) {
      const id = d.community.replace(/[^A-Z0-9]/ig, "")
      return id;
    })
    .attr("transform", d => {
      const [x, y] = projection([+d.longitude, +d.latitude]);
      return `translate(${x}, ${y})`;
    })

    .on('mouseover', function (event, d) {
      d3.select(this).raise()
      // change dot
      d3.selectAll(`#${this.id}`)
        .style("background-color", d => setBackgroundColor(d.vet_fz_date, d.chronic_fz_date))
        .style("color", "white")
        .attr("r", radius * 1.5)
        .style("cursor", "pointer")
        .attr("opacity", 1);

      // show tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'map-tooltip')
        .attr('style', 'position: absolute;')
        .style('background-color', textScale(d['fz_category']))
        .style('left', (event.x + 10) + 'px')
        .style('top', event.y + 'px')
        .html(setTooltip(d.community, d.state, d.vet_fz_date, d.chronic_fz_date))
        .style("opacity", 0)
        .transition(d3.easeElastic)
        .duration(200)
        .style("opacity", 0.9);
    })

    // Map mouseout event listener
    .on('mouseout', function (event, d) {
      // reset dot
      d3.selectAll("#" + this.id)
        .style("background-color", "transparent")
        .style("color", d => setSubtitleColor(d.vet_fz_date, d.chronic_fz_date))
        .attr("r", radius)
        .attr("cursor", "default")
        .attr("opacity", 0.8)
      // remove tooltip
      d3.selectAll(".map-tooltip")
        .style("opacity", 0.7)
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
      .attr("opacity", 0.8)
    );



  let button = d3.select('.communities-list-btn')

  button
    .on('click', function () {
      state.listActive = !state.listActive;
      toggleList(state);
    })

  d3.select(".communities-list")
    .classed("hide", true)
    .selectAll("text")
    .attr("class", "list-item")
    .attr("opacity", 0.8)
    .data(map.data, d => d.community)
    .join("text")
    .style("color", d => setSubtitleColor(d.vet_fz_date, d.chronic_fz_date))
    .style("font-weight", d => fontWeight(d['fz_category']))
    .attr("id", function (d, i) {
      return d.community.replace(/[^A-Z0-9]/ig, "")
    })
    .html(d => `${d.community} ,&nbsp <b style='font-weight:400;'> ${d.state} </b> ${setAsterisk(d.vet_fz_date, d.chronic_fz_date)} <br>`)
    .on("mouseover", function (event, d) {
      d3.selectAll("#" + this.id)
        .style("background-color", d => setBackgroundColor(d.vet_fz_date, d.chronic_fz_date))
        .style("color", "white")
        .attr("r", "18")
        .style("cursor", "pointer")
        .attr("opacity", 1)
        

      // show tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'list-tooltip')
        .attr('style', 'position: absolute;')
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY + 15) + 'px')
        .html(setSubtitle(d.vet_fz_date, d.chronic_fz_date))
        .style("opacity", 0)
        .transition(d3.easeElastic)
        .duration(200)
        .style("opacity", 1);

    })
    .on("mouseout", function (d) {
      d3.selectAll("#" + this.id)
        .style("background-color", "transparent")
        .style("color", d => setSubtitleColor(d.vet_fz_date, d.chronic_fz_date))
        .attr("r", "12")
        .attr("opacity", 0.8)

      // remove tooltip
      d3.selectAll(".list-tooltip")
        .style("opacity", 1)
        .transition(d3.easeElastic)
        .duration(100)
        .style("opacity", 0)
        .remove();

    })



  let elem = document.getElementById('communities');
  let rect = elem.getBoundingClientRect();

  d3.select(".communities-list")
    .style("height", Math.floor(rect.height) * 0.96 + "px")
    
  

}


function toggleList(state) {

  if (state.listActive) {
    showList();
    d3.select('.communities-list-btn')
      .text("HIDE THE LIST >");

  } else {
    hideList();
    d3.select('.communities-list-btn')
      .text("SHOW THE LIST >");
  }
}

function showList(state) {

  d3.select("#col2")
    .style("grid-template-rows", "1fr 1fr")
    .transition()
    .duration(200)
    .style("grid-template-rows", "0fr 0fr")

  d3.select("#col3")
    .style("grid-template-rows", "1fr 1fr")
    .transition()
    .duration(200)
    .style("grid-template-rows", "0fr 0fr")

  hideCols();
}

function hideList(state) {

  showCols();

  d3.select("#col2")
    .style("grid-template-rows", "0fr")
    .transition()
    .duration(200)
    .style("grid-template-rows", "1fr 1fr")

  d3.select("#col3")
    .style("grid-template-rows", "0fr")
    .transition()
    .duration(200)
    .style("grid-template-rows", "1fr 1fr")

  d3.select("#rows")
    .style("grid-template-columns", "1fr 1fr")

  d3.select(".communities-list")
    .classed("hide", true)

}

function hideCols() {
  setTimeout(() => {
    d3.select("#rows")
    .style("grid-template-columns", "1fr")

    d3.select("#col2")
      .classed("hide", true);

    d3.select("#col3")
      .classed("hide", true)

      d3.select(".communities-list")
      .classed("hide", false)
  }, 300)
}

function showCols() {
  setTimeout(() => {
    d3.select("#col2")
      .classed("hide", false);

    d3.select("#col3")
      .classed("hide", false)
  }, 0)
}