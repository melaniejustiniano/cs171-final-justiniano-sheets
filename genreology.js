var margin = {
    top: 15,
    right: 50,
    bottom: 5,
    left: 10
};

var width = 820 - margin.left - margin.right;
var height = 500 - margin.bottom - margin.top;

var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
})

var vis = svg.append("g").attr({
    transform: "translate(" + margin.left + "," + margin.top + ")"
});

var sliderMargin = {
    top: 30,
    right: 30,
    bottom: 20,
    left: 30
};

var sliderWidth = 900 - sliderMargin.left - sliderMargin.right;
var sliderHeight = 200 - sliderMargin.bottom - sliderMargin.top;

var sliderSvg = d3.select("#slider").append("svg").attr({
    width: sliderWidth + sliderMargin.left + sliderMargin.right,
    height: sliderHeight + sliderMargin.top + sliderMargin.bottom
});

var sliderVis = sliderSvg.append("g").attr({
    transform: "translate(" + sliderMargin.left + "," + sliderMargin.top + ")"
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

var dataSet = [];

function loadData () {
    d3.json("data/artistsByGenre.json", function(error, data) {
        console.log(data);
        data.forEach(function (d) {
            var genre = { genre: d.name, years: [], yearRange: [], artistCountRange: [] },
                years = {};

            // TODO: sorted by year already? expedite this? // duplicate data
            d.locations.forEach(function(location) {
                location.artists.forEach(function(artist) {
                    var year = artist.years_active[0].start;
                    if (years[year])
                        years[year].push(artist);
                    else 
                        years[year] = [artist];                    
                });
            });
            for (var year in years)
                genre.years.push({ year: +year, artists: years[year] })

            // precompute ranges for domains
            genre.yearRange = d3.extent(genre.years, function(y) {
                return y.year
            });
            genre.artistCountRange = [0, d3.max(genre.years, function(y) {
                return y.artists.length;
            })];

            // add 0 data for no artists - if wasn't in years, add to genre.years - kind of confusing
            for (var y = genre.yearRange[0]; y <= genre.yearRange[1]; y++) {
                if (!years[y]) genre.years.push({ year: y, artists: [] });
            }

            genre.years.sort(function(a, b) {
                if (a.year < b.year) return -1;
                else if (a.year > b.year) return 1;
                else return 0;
            });
            dataSet.push(genre);
        });

        loadMenu();
        createSlider();
        loadArtists();
    });
}

// populate drop down menu with genres
function loadMenu (){

    d3.select("select")
        .on("change", loadArtists)
    .selectAll("option")
        .data(dataSet)
        .enter()
        .append("option")
        .text( function (d) { return d.genre; })

}

function loadArtists(genre) {
    // initialize artists with first genre
    // if (!genre) genre = dataSet[0];

    // create circles on the maps representing artists

    // enlarge circles depending on how many artists originated in a city
}


function updateYear(year) {
    // add artists from that year
    
    // change the color of the artists from the previous year
}


function createSlider(genre) {
    // create line graph of artists per year to use as slider
    if (!genre) genre = dataSet[0];

    var innerMargin = {
        top: 80 - sliderMargin.top,
        right: 0,
        bottom: 80 - sliderMargin.bottom,
        left: 0
    };

    var innerWidth = sliderWidth - innerMargin.left - innerMargin.right;
    var innerHeight = sliderHeight - innerMargin.bottom - innerMargin.top;

    var xScale = d3.scale.linear()
        .domain(genre.yearRange)
        .rangeRound([0, innerWidth])
        .clamp(true);

    var yScale = d3.scale.linear()
        .domain(genre.artistCountRange)
        .range([innerHeight, 0]);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat(d3.format("d"));

    var line = d3.svg.line()
        .interpolate("cardinal")
        .x( function (d) { return xScale(d.year); } )
        .y( function (d) { return yScale(d.artists.length); } );

    // innerVis
    var innerVis = sliderVis.append("g").attr({
        transform: "translate(" + innerMargin.left + "," + innerMargin.top + ")"
    }).attr("class", "inner-vis");

    innerVis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")" )
        .call(xAxis);

    innerVis.selectAll("circle")
        .data(genre.years)
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("cx", function (d) {return xScale(d.year)})
        .attr("cy", function (d) { return yScale(d.artists.length)})
        .on("click", updateYear);

    innerVis.append("path")
        .datum(genre.years)
        .attr("class", "line")
        .attr("d", line);

    // innerVisOverlay
    var innerVisOverlay = sliderVis.append("g").attr({
        transform: "translate(" + innerMargin.left + "," + innerMargin.top + ")"
    }).attr("class", "inner-vis overlay");

    innerVisOverlay.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")" )
        .call(xAxis);

    innerVisOverlay.selectAll("circle")
        .data(genre.years)
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("cx", function (d) {return xScale(d.year)})
        .attr("cy", function (d) { return yScale(d.artists.length)})
        .on("click", updateYear);

    innerVisOverlay.append("path")
        .datum(genre.years)
        .attr("class", "line")
        .attr("d", line);

    // mask both to avoid duplicate and consequences on anti-aliasing
    var innerVisClipPath = sliderVis.append("clipPath")                  //Make a new clipPath
            .attr("id", "inner-vis-clip-path")           //Assign an ID
        .append("rect")                     //Within the clipPath, create a new rect
            .attr("x", 0)                 //Set rect's position and size…
            .attr("y", -innerMargin.top)
            .attr("width", sliderWidth)
            .attr("height", sliderHeight);
    innerVis.attr("clip-path", "url(#inner-vis-clip-path)") ;

    // mask both to avoid duplicate and consequences on anti-aliasing
    var innerVisOverlayClipPath = sliderVis.append("clipPath")                  //Make a new clipPath
            .attr("id", "inner-vis-overlay-clip-path")           //Assign an ID
        .append("rect")                     //Within the clipPath, create a new rect
            .attr("x", 0)                 //Set rect's position and size…
            .attr("y", -innerMargin.top)
            .attr("width", 0)
            .attr("height", sliderHeight);
    innerVisOverlay.attr("clip-path", "url(#inner-vis-overlay-clip-path)") ;

    var brush = d3.svg.brush()
        .x(xScale)
        .extent([0, 0])
        .on("brush", brushed);

    var slide = sliderVis.append("g")
        .attr("class", "brush")
        .call(brush);

    slide.selectAll(".extent,.resize")
        .remove();

    slide.select(".background")
        .attr("height", sliderHeight);

    var handle = slide.append("g")
        .attr("class", "handle");

    var handleBar = handle.append("line")
        .attr("class", "handleBar")
        .attr({
            x1: 0,
            y1: 0,
            x1: 0,
            y2: (sliderHeight - 20)
        });

    var handleLabel = handle.append("text")
        .text(genre.years[0].year)
        .attr("transform", "translate(0," + (sliderHeight - 10) + ")");

    // http://bl.ocks.org/mbostock/6452972
    function brushed() {
        var value = Math.round(xScale.invert(d3.mouse(this)[0]));
        brush.extent([value, value]);

        // update slider
        handle.attr("transform", "translate(" + xScale(value) + ",0)");
        handleLabel.text(value);

        innerVisClipPath
            .attr("width", sliderWidth - xScale(value))
            .attr("x", xScale(value));

        innerVisOverlayClipPath
            .attr("width", xScale(value));

        // do action
    }

}

function zoom (d) {
    var x, y, scale;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];

        var defaultScale = 3,
            widthScale = width / this.getBBox().width,
            heightScale = height / this.getBBox().height;

        scale = d3.min([defaultScale, widthScale, heightScale]);

        centered = d;
    }

    else {
        x = width / 2 ;
        y = height / 2;
        scale = 1;
        centered = null;
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