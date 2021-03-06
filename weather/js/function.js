
'use strict';
// Global Variables t be used
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

var pageNav = $('#navbar');
var statusContainer = $('#status');
var contentContainer = $('#mainContent');
var hideMain = $(".hideMain");
var nwokolo = $(".backGround");
// local and session storage selectors
var locStore = window.localStorage;
var sessStore = window.sessionStorage;

/* *****************************************************************
* WEATHER SITE JAVASCRIPT INSTRUCTIONS THAT CALLS VARIOUS FUNCTIONS *
****************************************************************** */
// Listen for the DOM to finish building
document.addEventListener("DOMContentLoaded", function(){
  buildModDate();
  const menuButton = document.querySelector("#menu-button");
  menuButton.addEventListener('click', burgerMenu);
  //call current date
  buildCurDate();
//Get weather json data
let weatherURL = "/weather/js/idahoweather.json";
fetchWeatherData(weatherURL);
})

/* *************************************
* WEATHER SITE JAVASCRIPT FUNCTIONS *
************************************* */
 //Js to get the Current Date
 function buildCurDate(){
const options = {weekday: "long", day: "numeric", month:"short", year: "numeric"};
document.getElementById("currentdate").textContent = new Date().toLocaleDateString("en-US", options);
 }
/* ##################################################
               Fetch Weather Data
###################################################### */
function fetchWeatherData(weatherURL){
  let cityName = $("body").getAttribute("data-city"); //The data we want from the weather.json file
  fetch(weatherURL)
  .then(function(response) {
    if(response.ok){
      return response.json();
    }
    throw new Error("Network resonse was not OK.");
  })
  .then(function(data){
    //check the data object that was retrieved
    // console.log(data);
    //data is the full javaScript object, but we only want the preston part
    //shorten the variable and focus only on the data we want to reduce typing
    let p = data[cityName];
    // console.log(p);

    //************ Get the location information *********
    let locName = p.properties.relativeLocation.properties.city;
    let locState = p.properties.relativeLocation.properties.state;
    let lowTemp = p.properties.relativeLocation.properties.lowTemp;
    let temperature = p.properties.relativeLocation.properties.temperature;
    let windSpeed = p.properties.relativeLocation.properties.windSpeed;
    let windGust = p.properties.relativeLocation.properties.windGust;
    let highTemp = p.properties.relativeLocation.properties.highTemp;

    //put them together
    let fullName = locName+', '+locState;

    //see if it worked, using ticks around the content in th log
    // console.log(`Full name is: ${fullName}`); //This combines and outputs a string and a predefined variable

    //Get the longitude and latitude and combine them to
    //a comma seperated single string
    const latLong = p.properties.relativeLocation.geometry.coordinates[1] + ", "+ p.properties.relativeLocation.geometry.coordinates[0];
    // console.log(latLong);

     // Create a JSON object containing the full name, latitude and longitude
    // and store it into local storage.
    const prestonData = JSON.stringify({fullName,latLong});
    // console.log(prestonData);
    locStore.setItem("PrestonID", prestonData);


    //************ Get the current condition information *********
    //As the data is extracted from the JSON, store it into session storage
    //Get the temperature data
    sessStore.setItem("FullName", fullName);
    sessStore.setItem("latLong", latLong);
    sessStore.setItem("lowTemp", lowTemp);
    sessStore.setItem("temperature", temperature);
    

    // Get the wind data 
    sessStore.setItem("windSpeed", windSpeed);
    sessStore.setItem("windGust", windGust);
    sessStore.setItem("highTemp", highTemp);

    // Get the hourly data using another function - should include the forecast temp, condition icons and wind speeds. 
    //The data will be stored into session storage.
    getHourly(p.properties.forecastHourly);
  })
  .catch(function(error){
    console.log("There was a fetch problem: ", error.message);
    hideMain.innerHTML = "Sorry, the destination for your requested data could not be established!";
  })

}

/* ************************************
*  Get Hourly Forecast data
************************************* */
function getHourly(URL){
  fetch(URL)
  .then(function(response){
    if(response.ok){
      return response.json();
    }
    throw new Error("Response not OK.");
  })
  .then(function(data){
    // console.log("Data from getHourly function:");
    // console.log(data); //Let's see what we got back

    //Store 12 hours of data to session storage
    var hourData = [];
    let todayDate = new Date();
    var nowHour = todayDate.getHours();
    // console.log(`nowHour is ${nowHour}`);
    for (let i = 0, x = 11; i <= x; i++){
      if (nowHour < 24) {
        hourData[nowHour] = data.properties.periods[i].temperature + "," + data.properties.periods[i].windSpeed + "," + data.properties.periods[i].icon;
        sessStore.setItem(`hour${nowHour}`, hourData[nowHour]);
        nowHour++;
      } else {
        nowHour = nowHour - 12;
        hourData[nowHour] = data.properties.periods[i].temperature + "," + data.properties.periods[i].windSpeed + "," + data.properties.periods[i].icon;
        sessStore.setItem(`hour${nowHour}`, hourData[nowHour]);
        nowHour = 1;
      }
    }

    // Get the shortForecast value from the first hour (the current hour)
    // This will be the condition keyword for setting the background image
    sessStore.setItem(`shortForecast`, data.properties.periods[0].shortForecast);
    
    //Call the buildPage function
    buildPage();
  })
  .catch(error => console.log("There was a getHourly error: ", error))
}

/* ************************************
*  Build the Weather page
************************************* */
function buildPage(){
  //set the title with the location name at the first
  //Gets the title element so it can be worked with
  let pageTitle = $("#page-title");
  //Create a text node containing the full name
  let fullNameNode = document.createTextNode(sessStore.getItem("FullName"));
  // console.log("FullName");
  //Inserts the fullName value before any other content that might exist
  pageTitle.insertBefore(fullNameNode, pageTitle.childNodes[0]);
  //Get the h1 to display the city location
  let contentHeading = $(".town");
  contentHeading.innerHTML = sessStore.getItem("FullName");
//Get the coordinates container for the location
let latlon = $(".gps");
latlon.innerHTML = sessStore.getItem("latLong");
// console.log(latlon);



//Get the condition keyword and set Background picture
changeSummaryImage(sessStore.getItem('shortForecast'));

/* Keep in mind that the value may be different than 
what you need for your CSS to replace the image. You 
may need to make some adaptations for it to work.*/

// **********  Set the current conditions information  **********
// Set the temperature information
let hiTemp = $("#feelhigh");
let loTemp = $("#feelow");
let currentTemp = $("#feelmode");
hiTemp.innerHTML = sessStore.getItem("highTemp") + "°F";
loTemp.innerHTML = sessStore.getItem("lowTemp") + "°F";
currentTemp.innerHTML = sessStore.getItem("temperature") + "°F";
//Set the wind information
let speed = $("#windspeed");
let gust = $('#gusting');
speed.innerHTML = sessStore.getItem('windSpeed');
gust.innerHTML = sessStore.getItem('windGust');
// Calculate feel like temp
let feelTemp = $("#feelTemp");
feelTemp.innerHTML = buildWC(sessStore.getItem('windSpeed'), sessStore.getItem('temperature')) + "°F";


/* ######################################################################
// Change the status of the containers
###################################################################### */
contentContainer.setAttribute('class', ''); // removes the hide class from main
statusContainer.setAttribute('class', 'hideMain'); // hides the status container


/* TIME INDICATORS */
// **********  Set the Time Indicators  **********
let thisDate = new Date();
var currentHour = thisDate.getHours();
let indicatorHour;
// If hour is greater than 12, subtract 12
if (currentHour > 12) {
 indicatorHour = currentHour - 12;
} else {
 indicatorHour = currentHour;
};
// console.log(`Current hour in time indicator is: ${currentHour}`);

timeBall(indicatorHour);
// console.log(indicatorHour);
// 
/* ############################################################
// ********** Hourly Temperature Component  **********
############################################################## */
// Get the hourly data from storage as an array
let currentData = [];
let tempHour = currentHour;
//Adjust counter based on current time
for(let i = 0, x = 12; i < x; i++){
  if(tempHour <= 23){
    currentData[i] = sessStore.getItem("hour" + tempHour).split(",");
    tempHour++;
  } else {
    tempHour = tempHour - 12;
    currentData[i] = sessStore.getItem("hour" + tempHour).split(",");
    // console.log(`CurrentData[i][0] is: ${currentData[i][0]}`);
    tempHour = 1;
  }
}
// console.log(currentData[1][0]);

//Loop through array inserting data
//Start with the outer container that matchs the current time
tempHour = currentHour;
for (let i = 0, x = 12; i < x; i++){
  if (tempHour >= 13){
    tempHour  = tempHour -12;
  }
  // console.log(`Start container is: ${tempHour[i]}`);
  $(".icon" + tempHour).innerHTML = currentData[i][0];
  tempHour++;
}
/* ############################################################
// ********** Hourly Wind Component  **********
############################################################## */
// Get the hourly data from storage
let windArray = [];
let windHour = currentHour;
// Adjust counter based on current time
for (let i = 0, x = 12; i < x; i++) {
 if (windHour <= 23) {
  windArray[i] = currentData[i][1].split(" ");
  // console.log(`windArray[i] is: ${windArray[i]}`);
  windHour++;
 } else {
  windHour = windHour - 12;
  windArray[i] = currentData[i][1].split(" ");
  windHour = 1;
 }
}
// console.log(windArray);

// Insert Wind data
// Start with the outer container that matchs the time indicator
windHour = currentHour;
for (let i = 0, x = 12; i < x; i++) {
 if (windHour >= 13) {
  windHour = windHour - 12;
 }
 $('.iconW' + windHour).innerHTML = windArray[i][0];
 windHour++;
}

/* ############################################################
// **********  Condition Component Icons  **********
############################################################## */
let conditionHour = currentHour;
// Adjust counter based on current time
for (let i = 0, x = 12; i < x; i++) {
 if (conditionHour >= 13) {
  conditionHour = conditionHour - 12;
 }
 $('.img' + conditionHour).innerHTML = '<img src="' + currentData[i][2] + '" alt="hourly weather condition image">';
 conditionHour++;
}
// console.log(currentData);
}

//Js to get the last modified date
function buildModDate(){
    const dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let lastMod = new Date(document.lastModified);
    const dayName = dayArray[lastMod.getDay()];
    const monthName = monthArray[lastMod.getMonth()];
    const formattedDate = dayName+", "+lastMod.getDate() +" "+monthName+", "+lastMod.getFullYear();
    document.querySelector('#lastmodify').innerText = formattedDate;
   }

   //variables for responsive menu
var mobileMenuClicks = 0;
//Handles Small Screen Menu
function burgerMenu(){
  //how many times responive menu used
  if (mobileMenuClicks == 0)
    console.groupCollapsed("Times Mobile Menu Toggled");
    mobileMenuClicks += 1;
    console.log(mobileMenuClicks);
  //declare variables
  const x = document.getElementById("navbar");
  const y = document.getElementById("footer");
  //if the buttun is tapped and the components are hidden, show them
  if (x.className === "hidden") {
    x.className = "shown";
    y.className = "large-footer";
  }
  //if the items are already shown, hide them 
  else {
    x.className = "hidden";
    y.className = "small-footer";
  }
}
/* ##################################################
//This function calculates the WindChill
###################################################### */
function buildWC(speed, temp) {
//This formular Computes the windchill value
  let wc = 35.74 + 0.6215 * temp - 35.75 * Math.pow(speed, 0.16) + 0.4275 * temp * Math.pow(speed, 0.16);
//  console.log(wc);

 //Round the answer down to integer
  wc = Math.floor(wc);

  //IF chill is greater than temp, return the temp
  wc = (wc > temp)?temp:wc;
  return wc;
}

/* ###########################################################################
Function for Time indicator
########################################################################## */
function timeBall(hour){
  //find all "ball" classes and remove them
  let x = document.querySelectorAll(".ball");
  for (let item of x) {
          item.classList.remove("ball");
  }

  //Find all hours that match the parameter and add the "ball"
  let hr = document.querySelectorAll(".p"+hour);
  for (let item of hr){
  item.classList.add("ball");
}}

/* ##################################################################
Function for changing the background image surrounding the weather 
condition boxes
##################################################################### */
function changeSummaryImage(condition){
let selectImage = $("#sectionfix");
//Check if weather conditions include these words
if(condition.includes("rain") || condition.includes("Wet") ||
 condition.includes("Thunder") || condition.includes("Shower") 
 || condition.includes("wet") || condition.includes("Rain")){
  selectImage.classList.add("rain");
}
else if(condition.includes("Cloud") || condition.includes("cloud")){
  selectImage.classList.add("clouds");
}
else if(condition.includes("fog") || condition.includes("Fog")){
  selectImage.classList.add("fog");
}
else if(condition.includes("snow") || condition.includes("Snow")){
  selectImage.classList.add("snow");
}
else if(condition.includes("Clear") || condition.includes("clear")){
  selectImage.classList.add("clear");
}
else{
  selectImage.classList.add("clear");
}
}

