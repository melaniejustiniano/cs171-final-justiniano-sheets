var p = {}; // primary visualization
var s = {}; // slider visualization
var g = {}; // genre detail visualization

function initVis(vis, id, width, height, mTop, mRight, mBottom, mLeft) {
    vis.margin = { top: 15, right: 50, bottom: 5, left: 10 };

    vis.width = 840 - vis.margin.left - vis.margin.right;
    vis.height = 520 - vis.margin.bottom - vis.margin.top;

    vis.svg = d3.select("#vis").append("svg").attr({
        width: vis.width + vis.margin.left + vis.margin.right,
        height: vis.height + vis.margin.top + vis.margin.bottom
    })

    vis.vis = vis.svg.append("g").attr({
        transform: "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    });  
}

function initPrimary() {
    p.margin = { top: 15, right: 50, bottom: 5, left: 10 };

    p.width = 840 - p.margin.left - p.margin.right;
    p.height = 520 - p.margin.bottom - p.margin.top;

    p.svg = d3.select("#vis").append("svg").attr({
        width: p.width + p.margin.left + p.margin.right,
        height: p.height + p.margin.top + p.margin.bottom
    })

    p.vis = p.svg.append("g").attr({
        transform: "translate(" + p.margin.left + "," + p.margin.top + ")"
    });    
}

function initSlider() {
    s.margin = { top: 30, right: 30, bottom: 20, left: 30 };
    
    s.width = 900 - s.margin.left - s.margin.right;
    s.height = 200 - s.margin.bottom - s.margin.top;

    s.svg = d3.select("#slider").append("svg").attr({
        width: s.width + s.margin.left + s.margin.right,
        height: s.height + s.margin.top + s.margin.bottom
    });

    s.vis = sliderSvg.append("g").attr({
        transform: "translate(" + s.margin.left + "," + s.margin.top + ")"
    });

    s.innerMargin = { top: 80 - s.margin.top, right: 0, bottom: 80 - s.margin.bottom, left: 0 };

    s.innerWidth = s.width - s.innerMargin.left - s.innerMargin.right;
    s.innerHeight = s.height - .innerMargin.bottom - .innerMargin.top;
}

function initGenreDetail() {
    g.margin = { top: 15, right: 50, bottom: 5, left: 10 };

    g.width = 840 - p.margin.left - p.margin.right;
    p.height = 520 - p.margin.bottom - p.margin.top;

    p.svg = d3.select("#vis").append("svg").attr({
        width: p.width + p.margin.left + p.margin.right,
        height: p.height + p.margin.top + p.margin.bottom
    })

    p.vis = p.svg.append("g").attr({
        transform: "translate(" + p.margin.left + "," + p.margin.top + ")"
    });  
}






// Load brush outside for extent access - load all variables into this function for outside access
var slider = {};
var controls = {};

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection);
var centered;

var updateDuration = 1000;

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

        loadData();
    });

};

var dataSet = [];

function loadData () {
    d3.json("data/artistsByGenre.json", function(error, data) {
        console.log(data);
        data.forEach(function (d) {
            var genre = { genre: d.name, locations: d.locations, years: [], 
                yearRange: [], artistCountRange: [] }, years = {};

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
        initControls();
    });
}

// populate drop down menu with genres
function loadMenu () {
    // default to first genre
    sortData(dataSet);
    var d = dataSet[0];
    var dropdownDataSet = dataSet.filter(function(e) { return d != e; });
    
    createSlider(d);
    loadArtists(d);

    // dropdown list
    var genreSelect = d3.select(".genre-select");
    var genreSelected = genreSelect.select(".selected")
        .text(d.genre);
    var dropdown = genreSelect.select(".dropdown");

    dropdown.selectAll("li")
            .data(dropdownDataSet)
        .enter().append("li")
            .text(function(d) { console.log(d); return d.genre; })
            .on("click", function(d) {
                d3.event.stopPropagation();
                
                genreSelected.text(d.genre);

                dropdownDataSet = dataSet.filter(function(e) { return d != e; });
                sortData(dropdownDataSet);

                dropdown.selectAll("li")
                    .data(dropdownDataSet)
                    .text(function(d) { console.log(d); return d.genre; });

                updateSlider(d);
                loadArtists(d);

                d3.select(".genre-select").classed('active', false);
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

    function sortData(dataSet) {
        dataSet.sort(function(a, b) {
             if (a.genre > b.genre)
                return 1;
            else
                return 0;
        });
    }
}

var KEY = { SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };
function initControls() {
    d3.select("body").on("keydown", function() {
        d3.event.preventDefault();

        var min = slider.brush.x().domain()[0],
            max = slider.brush.x().domain()[1],
            val = slider.brush.extent()[0];

        switch (d3.event.keyCode) {
            case KEY.LEFT:
                if (--val >= min && !controls.playing) updateBrush(val);
                break;
            case KEY.RIGHT:
                if (++val <= max && !controls.playing) updateBrush(val);
                break;
            case KEY.UP:
                break;
            case KEY.DOWN:
                break;
            case KEY.SPACE:
                play();
                break
        }
    });

    animateMap();
}
// http://bl.ocks.org/rgdonohue/9280446
function animateMap() {
    controls.transport = d3.select("#transport");
    controls.transport.select("#start").on("click", function() {
        updateBrush(slider.brush.x().domain()[0]);
    });
    controls.transport.select("#end").on("click", function() {
        updateBrush(slider.brush.x().domain()[1]);
    });
    controls.transport.select("#prev").on("click", function() {
        var min = slider.brush.x().domain()[0],
            val = slider.brush.extent()[0];
 
        if (--val >= min && !controls.playing) updateBrush(val);
    });
    controls.transport.select("#next").on("click", function() {
        var max = slider.brush.x().domain()[1],
            val = slider.brush.extent()[0];

        if (++val <= max && !controls.playing) updateBrush(val);
    });

    controls.timer;  // create timer object
    controls.playing = false;

    d3.select('#play').on('click', play);
}

function play() {
    var max = slider.brush.x().domain()[1],
        min = slider.brush.x().domain()[0],
        val = slider.brush.extent()[0];

    console.log(controls.playing);
    if (!controls.playing) {  // if the map is currently playing

        if (val >= max) updateBrush(min);

        d3.select("#play").text('Pause');  // change the button label to stop
        controls.playing = true;   // change the status of the animation

        controls.timer = setInterval(function() {   // set a JS interval
            val = slider.brush.extent()[0];
            if (++val <= max) {
                updateBrush(val);  // increment the current attribute counter
            }
            else {
                clearInterval(controls.timer);   // stop the animation by clearing the interval
                d3.select("#play").text('Play');   // change the button label to play
                controls.playing = false;   // change the status again
            }
        }, 100);
    } 
    else {    // else if is currently playing
        clearInterval(controls.timer);   // stop the animation by clearing the interval
        d3.select("#play").text('Play');   // change the button label to play
        controls.playing = false;   // change the status again
    } 
}

// on hover city name
// on click detail panel
function initDetailPanel(city) {
    var detailPanel = d3.select("#detail-panel"),
        detailPanelInner = detailPanel.select("#city-detail"),
        cityName = detailPanel.select("#city-name"),
        artistCount = detailPanel.select("#artist-count #count"),
        artistsTable = detailPanel.select(".artists");


    var transition = d3.transition()
        .duration(00);

    transition.each(function() {

    }).each("end", function() {
        cityName.text(city.key);
        artistCount.text(city.artists.length);

        city.artists.sort(function(a, b) {
            if (a.years_active[0].start < b.years_active[0].start) return -1;
            else if (a.years_active[0].start > b.years_active[0].start) return 1;
            else return 0;
        })

        var artists = artistsTable.selectAll(".artist")
            .data(city.artists, function(d) { return d.name; });

        artists.exit()
            .remove();

        var artistRows = artists.enter().append("tr")
            .attr("class", "artist");
        artistRows.append("td")
            .attr("class", "name")
            .text(function(d) { return d.name; });
        artistRows.append("td")
            .attr("class", "year")
            .text(function(d) { return d.years_active[0].start; });

    });
}

function loadArtists(genre) {
    // initialize artists with first genre
    if (!genre) genre = dataSet[0];

    // create circles on the maps representing artists
    var cities = vis.selectAll(".city")
        .data(genre.locations);

    console.log(cities);

    cities
        .transition()
        .duration(updateDuration / 2)
        .style("opacity", 0);

    cities.exit()
        .remove();

    cities.enter()
        .append("svg:circle")
        .attr("class", "city");

    cities
        .style("opacity", 0)
        .attr("cx", function (d) { 
            var location = d.details.geometry.location; 
            return projection([location.lng, location.lat])[0]})
        .attr("cy", function (d) { 
            var location = d.details.geometry.location; 
            return projection([location.lng, location.lat])[1]})
        // place all cities but hide those that aren't in first year
        .classed("hidden", function (d) {
            var first = genre.yearRange[0];
            // if any artist from city started in first year, show city
            var ifFromFirst = d.artists.some(function(artist) {
                var start = artist.years_active[0].start;
                return (start <= first); 
            })

            return !(ifFromFirst);
        })
        .attr("r", function (d) {
            var first = genre.yearRange[0];

            // count artists from area in first year and scale radius
            var count = 0;
            d.artists.forEach( function (artist) {
                var start = artist.years_active[0].start;
                if (start <= first) count++;
            })
            return 7 * Math.sqrt(count)})
        .transition()
        .duration(updateDuration / 2)
        .style("opacity", 1);

    cities.on("click", function(d) {
        initDetailPanel(d);
    });
}


function updateYear(year) {

    vis.selectAll(".city")
        // show city if any artist originated before current year
        .classed("hidden", function (d) {
            var ifOriginated = d.artists.some(function (artist) {
                var start = artist.years_active[0].start;
                return (start <= year); 
            })

            return !(ifOriginated);  
        })
        // mark cities with no artists from that year as in the past
        .classed("past", function (d) {
            var isCurrentYear = d.artists.some(function (artist) {
                var start = artist.years_active[0].start;
                return (start == year); })

            return !(isCurrentYear)
            })
        .attr("r", function (d) {

            // count number of artists in city until that year and scale radius
            var count = 0;
            d.artists.forEach( function (artist) {
                var start = artist.years_active[0].start;
                if (start <= year) count++;
            })
            return 7 * Math.sqrt(count)});

}

function updateSlider(genre) {
    // tools
    slider.xScale = d3.scale.linear()
        .domain(genre.yearRange)
        .rangeRound([0, innerWidth])
        .clamp(true);

    slider.yScale = d3.scale.linear()
        .domain(genre.artistCountRange)
        .range([innerHeight, 0]);

    slider.xAxis = d3.svg.axis()
        .scale(slider.xScale)
        .orient("bottom")
        .tickFormat(d3.format("d"));

    slider.line = d3.svg.line()
        .interpolate("cardinal")
        .x( function (d) { return slider.xScale(d.year); } )
        .y( function (d) { return slider.yScale(d.artists.length); } );   

    slider.brush = d3.svg.brush()
        .x(slider.xScale)
        .extent([slider.xScale.domain()[0], slider.xScale.domain()[0]])
        .on("brush", brushed);     

    slider.innerVis = sliderVis.select(".inner-vis");
    slider.circles = slider.innerVis.selectAll("circle").data(genre.years),
    slider.innerVisOverlay = sliderVis.select(".inner-vis.overlay"),
    slider.overlayCircles = slider.innerVisOverlay.selectAll("circle").data(genre.years),
    slider.innerVisClipPathRect = sliderVis.select("#inner-vis-clip-path rect"),
    slider.innerVisOverlayClipPathRect = sliderVis.select("#inner-vis-overlay-clip-path rect"),
    slider.slide = sliderVis.select(".brush"),
    slider.handle = sliderVis.select(".brush .handle"),
    slider.handleLabel = slider.handle.select(".handle-label");
        
    var transition = d3.transition()
        .duration(updateDuration);

    transition.each(function() {
        // move handle
        slider.handle.transition()
            .attr("transform", "translate(0,0)");

        slider.innerVisClipPathRect.transition()
            .attr("width", sliderWidth)
            .attr("x", 0);

        slider.innerVisOverlayClipPathRect.transition()
            .attr("width", 0);

        // fade out date
      /*  handleLabel.transition()
            .style("opacity", 0);

        sliderVis.selectAll(".x.axis .tick").transition()
            .style("opacity", 0);

        // fade out data
        sliderVis.selectAll("circle").transition()
            .style("opacity", 0);

        sliderVis.selectAll(".line").transition()
            .style("opacity", 0);*/
    })
    .each("end", function() {
        // Axis
        slider.innerVis.select(".x.axis")
                .attr("transform", "translate(0," + innerHeight + ")" )
                .call(slider.xAxis);

        // Circles
        slider.circles.enter()
            .append("circle");

        slider.circles
            .attr("r", 2)
            .attr("cx", function (d) {return slider.xScale(d.year)})
            .attr("cy", function (d) { return slider.yScale(d.artists.length)});

        slider.circles.exit()
            .remove();

        // Line
        slider.innerVis.select(".line")
            .datum(genre.years)
            .attr("d", slider.line);

        // InnerVis Overlay
        // Axis
        slider.innerVisOverlay.select(".x.axis")
            .attr("transform", "translate(0," + innerHeight + ")" )
            .call(slider.xAxis);

        // Circles
        slider.overlayCircles.enter()
            .append("circle");

        slider.overlayCircles
            .attr("r", 2)
            .attr("cx", function (d) {return slider.xScale(d.year)})
            .attr("cy", function (d) { return slider.yScale(d.artists.length)});

        slider.overlayCircles.exit()
            .remove();

        // Line
        slider.innerVisOverlay.select(".line")
            .datum(genre.years)
            .attr("d", slider.line);

        slider.slide.call(slider.brush);
        slider.slide.selectAll(".extent,.resize").remove();
        slider.slide.select(".background")
            .attr("height", sliderHeight);

        slider.handleLabel.text(genre.years[0].year);

        // Ensure 0 opacity new case new element added
        // fade out date
      /*  handleLabel.style("opacity", 0);

        sliderVis.selectAll(".x.axis .tick").style("opacity", 0);

        // fade out data
        sliderVis.selectAll("circle").style("opacity", 0);

        sliderVis.selectAll(".line").style("opacity", 0);       */ 
    });

    transition.transition().each(function() {
        // fade in date
        slider.handleLabel.transition()
            .style("opacity", 1);

        sliderVis.selectAll(".x.axis .tick").transition()
            .style("opacity", 1);

        // fade in data
        sliderVis.selectAll("circle").transition()
            .style("opacity", 1);

        sliderVis.selectAll(".line").transition()
            .style("opacity", 1);
    });

    // http://bl.ocks.org/mbostock/6452972
    function brushed() {
        var value = Math.round(slider.xScale.invert(d3.mouse(this)[0]));
        updateBrush(value);
    }
}

// can't be called until initSlider
function updateBrush(value) {
    slider.brush.extent([value, value]);

    // update slider
    slider.handle.attr("transform", "translate(" + slider.xScale(value) + ",0)");
    slider.handleLabel.text(value);

    slider.innerVisClipPathRect
        .attr("width", sliderWidth - slider.xScale(value))
        .attr("x", slider.xScale(value));

    slider.innerVisOverlayClipPathRect
        .attr("width", slider.xScale(value));

    updateYear(value);
}

function createSlider(genre) {
    // create line graph of artists per year to use as slider
    if (!genre) genre = dataSet[0];

    // innerVis
    var innerVis = sliderVis.append("g").attr({
        transform: "translate(" + innerMargin.left + "," + innerMargin.top + ")"
    }).attr("class", "inner-vis");

    innerVis.append("g")
        .attr("class", "x axis");

    innerVis.append("path")
        .attr("class", "line");

    // innerVisOverlay
    var innerVisOverlay = sliderVis.append("g").attr({
        transform: "translate(" + innerMargin.left + "," + innerMargin.top + ")"
    }).attr("class", "inner-vis overlay");

    innerVisOverlay.append("g")
        .attr("class", "x axis");

    innerVisOverlay.append("path")
        .attr("class", "line");

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

    var slide = sliderVis.append("g")
        .attr("class", "brush");

    var handle = slide.append("g")
        .attr("class", "handle")
        .attr("transform", "translate(0,0)");

    var handleBar = handle.append("line")
        .attr("class", "handle-bar")
        .attr({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: (sliderHeight - 20)
        });

    var handleLabel = handle.append("text")
        .attr("class", "handle-label")
        .attr("transform", "translate(0," + (sliderHeight - 10) + ")");

    updateSlider(genre);
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
            "translate(" + (width / 2 + margin.left) 
            + "," + (height / 2 + margin.top)
            + ")scale(" + scale  
            + ")translate(" + -x + "," + -y + ")" )
};

loadStates();
