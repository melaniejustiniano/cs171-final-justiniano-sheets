var margin = {
    top: 15,
    right: 50,
    bottom: 5,
    left: 10
};

var width = 900 - margin.left - margin.right;
var height = 500 - margin.bottom - margin.top;

var slider = d3.select("#slider").append("svg").attr({
    width: width + margin.left + margin.right,
    height: 100 + margin.top + margin.bottom
});

var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
})

var vis = svg.append("g").attr({
    transform: "translate(" + margin.left + "," + margin.top + ")"
});

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection);
var centered;


function loadStates () {

    d3.json("data/us-named.json", function(error, data) {

        var usMap = topojson.feature(data,data.objects.states).features

        vis.attr("class", "country")
            .selectAll(".country")
            .data(usMap).enter()
            .append("path")
            .attr("d", path)
            .attr("class", "state")
            .on("click", zoom);
    });

};

var dataSet = [ ];

function loadData () {

    d3.json("data/artistsByGenre.json", function(error, data) {
    
        data.forEach( function (d) {

            var genre = { genre: d.name, years: [] };
            var years = { };

            d.artists.forEach ( function (artist) {

                var year = artist.years_active[0].start;
                var name = artist.name;
                var location = artist.artist_location.location;

                if (years[year]) {
                    years[year].push( {artist : name, location: location} )
                }
                else years[year] = [ {artist : name, location: location} ]
                
            })

            for (var year in years) {
                genre.years.push({year: year, bands: years[year]})
            }

            dataSet.push(genre);

        });

    loadMenu();
    createSlider();
    loadBands();

    });


}

// populate drop down menu with genres
function loadMenu (){

    d3.select("select")
        .on("change", loadBands)
    .selectAll("option")
        .data(dataSet)
        .enter()
        .append("option")
        .text( function (d) { return d.genre; })

}

function loadBands (genre) {
    // initialize bands with first genre
    // if (!genre) genre = dataSet[0];

    // create circles on the maps representing bands

    // enlarge circles depending on how many bands originated in a city
}


function updateYear (year) {
    // add bands from that year
    
    // change the color of the bands from the previous year
}


function createSlider (genre) {
    // create line graph of bands per year to use as slider
    if (!genre) genre = dataSet[0];

    var svg = slider.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

    var x = d3.scale.linear()
        .range([0, width - 100]);

    var y = d3.scale.linear()
        .range([50, 0]);

    // x.domain(d3.extent(genre.years, function (d) { console.log(d.year); d.year }));
    // y.domain(d3.extent(genre.years, function (d) { d.bands.length }));

    x.domain([1979,2009]);
    y.domain([0,8]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var line = d3.svg.line()
        .interpolate("cardinal")
        .x( function (d) { console.log(x(d.year)); return x(+d.year); } )
        .y( function (d) { return y(d.bands.length); } );

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 60 + ")" )
        .call(xAxis);

    svg.selectAll("circle")
        .data(genre.years)
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("cx", function (d) {return x(d.year)})
        .attr("cy", function (d) { return y(d.bands.length)})
        .on("click", updateYear);

    svg.append("path")
        .datum(genre.years)
        .attr("class", "line")
        .attr("d", line);

}

function zoom (d) {
    var x, y, scale;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        scale = 3;

        centered = d;

        svg.attr("mask", "url(#Mask)");
    }

    else {
        x = width / 2 ;
        y = height / 2;
        scale = 1;
        centered = null;

        svg.attr("mask", "null");
    }
 
    vis.selectAll("path")
        .classed("active", centered && function (d) { 
            return d === centered });

    vis.transition()
        .duration(500)
        .attr("transform",
            "translate(" + width / 2 + "," + height / 2 
            + ")scale(" + scale  
            + ")translate(" + -x + "," + -y + ")" )



    // fade edges
    var defs = svg.append("svg:defs");
    var gradient = defs.append("svg:radialGradient")
        .attr("id", "edgeFade");
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);
    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);
    var mask = defs.append("svg:mask")
        .attr("id", "Mask");
    mask.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "url(#edgeFade)");
};

// dropdown list
// TODO update so list is actual list of d3 data bound elements
d3.selectAll(".genre-select .dropdown li")
    .on("click", function() {
        d3.event.stopPropagation();
        
        var newSelectText = d3.select(this).text(),
            oldSelectText = d3.select(".genre-select .selected").text();

        d3.select(".genre-select").classed('active', false); 
        d3.select(".genre-select .selected").text(newSelectText);
        d3.select(this).text(oldSelectText);

        // TODO Sort
        sortList(d3.select(".genre-select .dropdown"));
    });
d3.select(".genre-select")
    .on("click", function() {
        d3.event.stopPropagation();
        d3.select(this).classed('active', !d3.select(this).classed('active'));
    });

d3.select("body")
    .on("click", function() {
        d3.select(".genre-select").classed('active', false);
    });

// Need to update to track actual data...
function sortList(ul) {
    var lis = ul.selectAll("li")[0];
    var liTexts = [];
    for (var i = 0; i < lis.length; i++)
        liTexts.push(d3.select(lis[i]).text());

    liTexts.sort();

    var liElements = ul.selectAll("li")
        .text(function(li, i) {
            return liTexts[i];
        });
}

loadStates();
loadData();