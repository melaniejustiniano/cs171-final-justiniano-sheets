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

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection);
var centered;


function loadStates () {

    d3.json("data/us-named.json", function(error, data) {

        var usMap = topojson.feature(data,data.objects.states).features

        svg.attr("class", "country")
            .selectAll(".country")
            .data(usMap).enter()
            .append("path")
            .attr("d", path)
            .attr("class", "state")
            .on("click", zoom);
    });

};

var genres = [ {genre: "name" } ];

function loadData () {


}

// populate drop down menu with genres
function loadMenu (){

    d3.select("select")
        .on("change", loadBands)
    .selectAll("option")
        .data(genres)
        .enter()
        .append("option")
        .text( function (d) { return d.genre; })

}

function loadBands (genre, year) {
    // initialize bands with first genre
    if (!genre) genre = genres[0];

    // create circles on the maps representing bands

    // enlarge circles depending on how many bands originated in a city
}


function updateYear (year) {
    // add bands from that year

    // change the color of the bands from the previous year
}


function createSlider (genre) {
    // create line graph of bands per year to use as slider

}

function zoom (d) {
    var x, y, scale;

    if (d && centered !== d) {

        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        scale = 3;

        centered = d;
    }

    else {

        x = width / 2 ;
        y = height / 2;
        scale = 1;
        centered = null;
    }
 
    svg.selectAll("path")
        .classed("active", centered && function (d) { 
            return d === centered });

    svg.transition()
        .duration(500)
        .attr("transform",
            "translate(" + width / 2 + "," + height / 2 
            + ")scale(" + scale  
            + ")translate(" + -x + "," + -y + ")" )
};


loadMenu();
loadStates();
loadBands();