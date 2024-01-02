// Set Up the SVG Canvas
const margin = { top: 20, right: 30, bottom: 20, left: 30 };
const width = 960 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;
// Custom color palette inspired by vivid and playful styles
const warmPalette = ['#402a22','#93fa57','#f5bb2a','#940005']; // Enhanced warm colors
const coolPalette = ['#93fa57','#5956fc','#940005','#402a22']; // Enhanced cool colors



const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Time Scales
const startDate = new Date("2022-05-01");
const endDate = new Date();
const x = d3.scaleTime()
  .domain([startDate, endDate])
  .range([0, width]);

const xAxis = d3.axisBottom(x);
svg.append("g")
   .attr("class", "x axis")
   .attr("transform", `translate(0,${height})`)
   .call(xAxis);

// Draw Weekly Bands
const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
let currentDate = startDate;

while (currentDate < endDate) {
  let weekEnd = new Date(currentDate.getTime() + oneWeek);
  const seasonPalette = getSeason(currentDate.getMonth());
  svg.append("rect")
    .attr("x", x(currentDate))
    .attr("width", x(weekEnd) - x(currentDate))
    .attr("y", 0)
    .attr("height", height)
    .attr("fill", getRandomColorFromPalette(seasonPalette)) // Assign a color based on the season
    .datum(currentDate)
    .style("filter", "url(#blur-filter)"); // Apply the blur filter


  currentDate = weekEnd;
}

// Define the blur filter
svg.append("defs").append("filter")
  .attr("id", "blur-filter")
  .append("feGaussianBlur")
  .attr("stdDeviation", 1); // The standard deviation for the blur. Adjust as needed.

// Load and Plot Events
d3.csv("events.csv").then(data => {
  data.forEach(d => {
    d.date = new Date(d.date);
    d.randomY = Math.random() * height; // Store initial random y-position

  });

  const events = svg.selectAll(".event")
    .data(data)
    .enter().append("g")
    .attr("class", "event")
    .attr("transform", d => `translate(${x(d.date)},${d.randomY})`);
   

  // Draw dots for events
  events.append("circle")
    .attr("r", 10) // Base size of the dots
    .attr("fill", "black")
    .style("filter", "url(#blur-filter)"); // Apply the blur filter
    // Set color of the dots to black

  // Draw spiral path for each event
  events.append("path")
    .attr("id", (d, i) => `spiral-path-${i}`)
    .attr("d", () => createSpiralPath(5, 2, 100)) // Set a fixed size for initial path
    .style("fill", "none")
    .style("stroke", "none");

  // Add text along the spiral path
  events.append("text")
    .append("textPath")
    .attr("href", (d, i) => `#spiral-path-${i}`)
    .attr("fill", "white")
    .style("font-size", "1px")
    .style("filter", "url(#blur-filter)") // Apply the blur filter
    .text(d => d.note);
});






// Zoom Functionality
const zoom = d3.zoom()
  .scaleExtent([1, 10])
  .on("zoom", zoomed);

svg.call(zoom);

function zoomed(event) {
  const transform = event.transform;

  // Update the weekly bands
  svg.selectAll("rect")
    .attr("x", d => transform.applyX(x(d)))
    .attr("width", d => transform.k * (x(new Date(d.getTime() + oneWeek)) - x(d)));

  // Update the event group position
  svg.selectAll(".event")
  .attr("transform", d => {
    const transformedX = transform.applyX(x(d.date));
    const transformedY = transform.applyY(d.randomY);
    return `translate(${transformedX},${transformedY})`;
  });
    svg.selectAll(".event path")
    .attr("d", d => createSpiralPath(4.99 ** transform.k, 4, 100)); // Update spiral path

  // Update the size of the circles (dots) within each event group
  svg.selectAll(".event circle")
    .attr("r", 10*transform.k - 0.9*(transform.k ** 2) ); // Adjust the size based on the zoom level

  // Update the font size of the text along the spiral path
  svg.selectAll(".event text textPath")
  .style("font-size", 1.9 ** transform.k + "px"); // Adjust the font size based on the zoom level

  // Update the x-axis
  svg.select(".x.axis").call(xAxis.scale(transform.rescaleX(x)));
}


// Function to get a random color from the given palette
function getRandomColorFromPalette(palette) {
  const randomIndex = Math.floor(Math.random() * palette.length);
  return palette[randomIndex];
}

// Function to determine the season based on the month
function getSeason(month) {
  if (month >= 5 && month <= 8) { // Summer months (June to August)
    return warmPalette;
  } else { // Winter months (November to February)
    return coolPalette;
  }
}

// Function to generate a spiral path
function createSpiralPath(radius, turns, numPoints) {
  let path = "";
  for (let i = 0; i < numPoints; i++) {
    let angle = i / numPoints * (turns * 2 * Math.PI);
    let r = radius * (i / numPoints);
    let x = r * Math.cos(angle);
    let y = r * Math.sin(angle);
    path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }
  return path;
}