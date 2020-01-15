
// Globals
let data = [];
let map = [];
let allEventFeatures = [];
let filteredFeatures = [];

function initializeMap() {
  $('#slide-in').height(window.innerHeight);
  $('#mapid').height(window.innerHeight);
  map = L.map('mapid',{
    zoomControl: false
  })
  .setView([40.55972134684838,-110.56640625], 3);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);
}

function handleClickSlideIn() {
  $('#side-panel-btn').on('click', function() {
    if($('#slide-in').hasClass('in')) {
        $('#slide-in').removeClass('in')
    } else {
        $('#slide-in').addClass('in')
    }
  })
}

function getDefaultEventData() {
  // THIS SHOULD GET ALL EVENTS IN THE LAST 30 DAYS BUT I THINK IT'S MISBHEAVING
  // "https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events?start=2020-01-01&end=2020-01-12"
  fetch('https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events/geojson?days=30',{
    method:'GET'
  })
    .then(response => response.json())
    .then(json => {
      //assign the response to the global data object - filter this
      data = json
      // call render function that houses the below
      allEventFeatures = L.geoJSON(json)
      .bindPopup(function(layer){
          return `<strong>Title</strong>: ${layer.feature.properties.title}<br>Date:${layer.feature.properties.date}`
      }).addTo(map);
    })
    .catch(error => console.log(error.message));
}

function setCountryFeatures() {
  const countryFeatures = L.geoJSON(COUNTRIES, {
    style:function(feature){
        return {
            color: '#20003f',
            fillOpacity:0, 
            opacity: 0.8,
            weight: 0.5
        }
      }
    })
    .bindPopup(function(layer){
        return `<strong>${layer.feature.properties.name}</strong>`
    })
      .addTo(map);

  map.fitBounds(countryFeatures.getBounds(), {
    padding: [-40,-175]
  });
}

//RENDER A LIST OF CATEGORIES WITH VALUES
function renderCategories(jsonResponse){
  categoryOptionsText = ''
  for (i=0; i<jsonResponse.categories.length; i++){
    categoryOptionsText += `<div class="option"><input type="checkbox" name="option" value="${jsonResponse.categories[i].id}">
    <label for="option">${jsonResponse.categories[i].title}</label></div>`
  }

  // console.log(`Here are the options: ${categoryOptionsText}`)
  // Return HTML with category options
  const optionsHTML = `<form class='options-form'>
            <fieldset>
              ${categoryOptionsText}
           </fieldset>
           <button type="submit" class="category-submit-button button">Submit Categories</button>
          </form>` 
  $('.categories-form-container').html(optionsHTML);
}

function getCategories(){
  const apiCategories = 'https://eonet.sci.gsfc.nasa.gov/api/v3-beta/categories';
  fetch(apiCategories,{
    method:'GET'
  })
    .then(response => response.json())
    .then(json => {
      console.log(json)
      // call a render function to render categories onto a form
      renderCategories(json)
    })
    .catch(error => console.log(error.message));
}

function handleCategorySearch(){
  $('.search-by-cat').on('click', function(e) {
    e.preventDefault();
    getCategories();
  })
}

///////////////////////////////

function clearMapEvents() {
  map.removeLayer(allEventFeatures);
  map.removeLayer(filteredFeatures);
}
// display filtered events
function handleCategoryFilter() {
  // filter through all the global data of events by types currently selected then call render again
  $('.categories-form-container').on('submit', '.options-form', function(e) {
    e.preventDefault();
    // Get values in an array
    const optionsList = $(e.currentTarget).find("input[name=option]:checked").toArray().map(input => input.value).map(Number);

    // Remove events
    clearMapEvents();

    // Rerender with only those categories - how to filter based on those categories? 
    filteredFeatures = L.geoJSON(data, {
      filter: function(feature, layer) {
          return optionsList.includes(feature.properties.categories[0].id);
      }
    }).bindPopup(function(layer){
    return `<strong>Title</strong>: ${layer.feature.properties.title}<br>Date:${layer.feature.properties.date}`
    }).addTo(map);

  })

}

function start() {
  initializeMap()
  setCountryFeatures()
  getDefaultEventData()
  handleCategorySearch()
  handleCategoryFilter()
  handleClickSlideIn()
}

$(start);