var countriesData = [];
var filteredData = [];
var selectedOption;
var selectedPlotOption;
window.onload = function () {
  d3.json("../data/countries.json", function (error, countries) {
    countriesData = countries;
  });
};

function updateForm(selectedOption) {
  var form = d3.select("#form-options");
  form.selectAll("*").remove();

  if (selectedOption === "country") {
    form.append("label").html(" <h4>Plot Options:</h4>");
    form
      .append("label")
      .html(
        ' <input type="radio" name="plotOption" value="population"> population<br>'
      );
    form
      .append("label")
      .html(
        '<input type="radio" name="plotOption" value="borders"> Number of borders<br>'
      );
    form
      .append("label")
      .html(
        '<input type="radio" name="plotOption" value="timezones"> Number of timezones<br>'
      );
  } else if (selectedOption === "region") {
    form
      .append("label")
      .html(
        '<input type="radio" name="plotOption" value="regionCountries"> Number of countries in the region<br>'
      );
    form
      .append("label")
      .html(
        '<input type="radio" name="plotOption" value="regionTimezones"> Number of unique timezones in the region<br>'
      );
  }

  form.selectAll('input[name="plotOption"]').on("change", function () {
    selectedPlotOption = d3
      .select('input[name="plotOption"]:checked')
      .node().value;
    filteredData = filtere_data(selectedPlotOption);
    drawBubbleChart(filteredData);
    drawTable(filteredData);
  });
}

d3.selectAll('input[name="grouping-option"]').on("change", function () {
  selectedOption = d3
    .select('input[name="grouping-option"]:checked')
    .node().value;

  updateForm(selectedOption);
});

function uniqueTimezonesByRegion(data) {
  var uniqueTimezonesByRegion = {};
  data.forEach(function (country) {
    var region = country.region;
    var timezones = country.timezones;

    if (!uniqueTimezonesByRegion[region]) {
      uniqueTimezonesByRegion[region] = [];
    }

    timezones.forEach(function (timezone) {
      if (!uniqueTimezonesByRegion[region].includes(timezone)) {
        uniqueTimezonesByRegion[region].push(timezone);
      }
    });
  });

  var result = [];
  for (var region in uniqueTimezonesByRegion) {
    result.push({
      name: region,
      value: uniqueTimezonesByRegion[region].length,
    });
  }

  return result;
}

function countriesCount(data) {
  var countriesByRegion = {};

  // Group the data by region
  data.forEach(function (country) {
    if (!countriesByRegion[country.region]) {
      countriesByRegion[country.region] = 1;
    } else {
      countriesByRegion[country.region]++;
    }
  });

  var result = [];
  for (var region in countriesByRegion) {
    result.push({ name: region, value: countriesByRegion[region] });
  }
  return result;
}

function filtere_data(selectedOption) {
  var filteredData;
  if (selectedOption === "population") {
    filteredData = countriesData.map(function (country) {
      return { name: country.alpha3Code, value: country.population };
    });
  } else if (selectedOption === "borders") {
    filteredData = countriesData.map(function (country) {
      return { name: country.alpha3Code, value: country.borders.length };
    });
  } else if (selectedOption === "timezones") {
    filteredData = countriesData.map(function (country) {
      return { name: country.alpha3Code, value: country.timezones.length };
    });
  } else if (selectedOption === "regionCountries") {
    filteredData = countriesCount(countriesData);
  } else {
    filteredData = uniqueTimezonesByRegion(countriesData);
  }
  return filteredData;
}

function drawBubbleChart(data) {
  d3.select("svg").remove();

  const width = 1000;
  const height = 800;
  const padding = 50;

  const pack = d3
    .pack()
    .size([width - padding, height - padding])
    .padding(5);

  const hierarchy = d3.hierarchy({ children: data }).sum((d) => d.value);

  const root = pack(hierarchy);

  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const bubbles = svg
    .selectAll(".bubble")
    .data(root.descendants().slice(1))
    .enter()
    .append("g")
    .attr("class", "bubble")
    .attr("transform", (d) => `translate(${d.x + padding}, ${d.y + padding})`);

  bubbles
    .append("circle")
    .attr("r", (d) => d.r)
    .attr("fill", "black");

  bubbles
    .append("text")
    .attr("dy", "-0.4em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => d.r / 7)
    .style("font-weight", "bold")
    .append("tspan")
    .attr("class", "country")
    .text((d) => d.data.name)
    .append("tspan")
    .attr("class", "value")
    .attr("x", 0)
    .attr("dy", "1.2em")
    .text((d) => d.data.value.toLocaleString());

  d3.selectAll("text").style("fill", "white");

  var tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  bubbles
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(getCountryInfo(d.data))
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px")
        .style("background-color", "gray")
        .style("color", "white")
        .style("padding", "6px")
        .style("border-radius", "10px");
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function getCountryInfo(data) {
  if (data.region) {
    return "<strong>Region:</strong> " + data.name;
  } else {
    var countryData = countriesData.find(
      (country) => country.alpha3Code === data.name
    );
    var info = "<strong>Country:</strong> " + countryData.name + "<br>";
    info +=
      "<strong>Population:</strong> " +
      countryData.population.toLocaleString() +
      "<br>";
    info +=
      "<strong>Number of Borders:</strong> " +
      countryData.borders.length +
      "<br>";
    info +=
      "<strong>Number of Timezones:</strong> " +
      countryData.timezones.length +
      "<br>";
    info +=
      "<strong>Top Level Domain(s):</strong> " +
      countryData.topLevelDomain.join(", ") +
      "<br>";
    info += "<strong>Capital:</strong> " + countryData.capital;
    return info;
  }
}

function drawTable(data) {
  d3.select("table").remove();

  var table_container = d3
    .select("body")
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("margin", "10px")
    .style("width", "80%");

  var table = table_container
    .append("table")
    .classed("table", true)
    .style("width", "50%")
    .style("border", "1px solid #ddd");

  var header = table.append("thead").append("tr");
  var tbody = table.append("tbody");

  header
    .selectAll("th")
    .style("border", "1px solid #ddd")
    .data([selectedOption, selectedPlotOption])
    .enter()
    .append("th")
    .text(function (column) {
      return column;
    });

  var rows = tbody.selectAll("tr").data(data).enter().append("tr");

  rows
    .selectAll("td")
    .style("border", "1px solid #ddd")
    .data(function (row) {
      return [row.name, row.value.toLocaleString()];
    })
    .enter()
    .append("td")
    .text(function (d) {
      return d;
    });

  return table;
}
