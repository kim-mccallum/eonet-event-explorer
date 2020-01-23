// Global variables for map features
let data = [];
let map = [];
let eventCategories = [];
let allEventFeatures = [];
let filteredFeatures = [];

// API 
const eonetURL = 'https://eonet.sci.gsfc.nasa.gov/api/v3-beta'

// Global variable for map style - Marker icons for events
const defaultIcon = new L.Icon.Default();
const bigDefaultIcon = new L.Icon.Default();
bigDefaultIcon.options.iconSize = [30,46];

//////////// Functions //////////////////

// Create the Leaflet map
function initializeMap() {
  map = L.map('mapid')
  //Add satellite mosaic basemap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  }).addTo(map);
  //Fit the map to the world
  map.fitWorld( { animate: false } );

  //Constrain the map so you can't pan off the map
  //Code from stack overflow question https://stackoverflow.com/questions/22155017/can-i-prevent-panning-leaflet-map-out-of-the-worlds-edge
  const southWest = L.latLng(-89.98155760646617, -180),
  northEast = L.latLng(89.99346179538875, 180);
  const bounds = L.latLngBounds(southWest, northEast);

  map.setMaxBounds(bounds);
  map.on('drag', function() {
      map.panInsideBounds(bounds, { animate: false });
  });
  //Prevent zooming out beyond map - code below from here: https://gis.stackexchange.com/questions/224383/leaflet-maxbounds-doesnt-prevent-zooming-out
  map.setMinZoom(map.getBoundsZoom(map.options.maxBounds));
}

function formatEventRequest() {
  // get date - Today
  const td = new Date();
  const endDate = `${td.getFullYear()}-${td.getMonth()+1}-${td.getDate()}`

  // get date - 30 days ago
  const sd = new Date();
  sd.setDate(sd.getDate() - 30);
  const startDate = `${sd.getFullYear()}-${sd.getMonth()+1}-${sd.getDate()}`

  // formatted request
  return `${eonetURL}/events/geojson?start=${startDate}&end=${endDate}`
}

function getDefaultEventData() {
  const eventRequest = formatEventRequest()
  // In theory the request below should work but it was acting strange so I made the formatEventRequest()
  // fetch('https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events/geojson?days=30',{
  fetch(eventRequest,{
    method:'GET'
  })
    .then(response => response.json())
    .then(json => {
      //assign the response to the global data object - filter this later
      data = json
      // call render function that houses the below
      allEventFeatures = L.geoJSON(json, {
        pointToLayer: function(geoJsonPoint,latlng){
            return L.marker(latlng,{
                icon: defaultIcon,
                riseOnHover: true
            });
        },
        onEachFeature: function(feature,layer){
          layer.on('mouseover',function(e) {
              e.target.setIcon(bigDefaultIcon).rise
          })
          layer.on('mouseout',function(e) {
              e.target.setIcon(defaultIcon)
          })  
      }
      }).bindPopup(function(layer){
        let description = ''
        for(i=0;i<eventCategories.categories.length;i++){
          if (eventCategories.categories[i].title === layer.feature.properties.categories[0].title){
            console.log('match');
            description = eventCategories.categories[i].description
          }
        }
        return `<strong>Event title</strong>:  ${layer.feature.properties.title}<br><strong>Date:  ${layer.feature.properties.date}</strong><br><strong>Source:</strong>  ${layer.feature.properties.sources[0].url}<br><strong>Category description:</strong>  ${description}`
      }).addTo(map);
    })
    .catch(error => console.log(error.message));
}

// Add countries and some interactivity 
function setCountryFeatures() {
  const countryFeatures = L.geoJSON(COUNTRIES, {
    style:function(feature){
        return {
            color: '#1e0f24',
            fillOpacity:0, 
            opacity: 0.8,
            weight: 0.5
        }
      },
      onEachFeature: function(feature,layer){
        layer.on('mouseover',function(e) {
            e.target.setStyle({color: '#cc00cc', weight: 1})
        })
        layer.on('mouseout',function(e) {
            e.target.setStyle({color: '#1e0f24', weight: 0.5})
        })  
    }
    })
    .bindPopup(function(layer){
        return `<strong>${layer.feature.properties.name}</strong>`
    })
      .addTo(map);

  map.fitBounds(countryFeatures.getBounds(), {
    padding: [-40,-250]
  });
}

// Make the category filter menu slide in and out
function slideInCategories(){
  $('.filter-slide').on('click', function(e) {
    e.preventDefault();

    if($('#slide-in').hasClass('in')) {
      $('#slide-in').removeClass('in');
      $('#left').show();
      $('#right').hide();
    } else {
      $('#slide-in').addClass('in');
      $('#left').hide();
      $('#right').show();
  }
  })
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
  fetch(`${eonetURL}/categories`,{
    method:'GET'
  })
    .then(response => response.json())
    .then(json => {
      // console.log(json)
      eventCategories = json
    })
    .catch(error => console.log(error.message));
}

// Get and render the categories when the user wants to filter
function handleCategorySearch(){
  $('.filter-slide').on('click', function(e) {
    e.preventDefault();

    renderCategories(eventCategories)
  })
}

// Remove feature from the map to make way for the filtered features
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
    const optionsList = $(e.currentTarget).find("input[name=option]:checked").toArray().map(input => input.value)
    
    console.log(`Selected categories: ${optionsList}`);
    // Remove events on the map to make room
    clearMapEvents();

    // Rerender with only those categories selected - Add some interactivity
    filteredFeatures = L.geoJSON(data, {
      filter: function(feature, layer) {
          return optionsList.includes(feature.properties.categories[0].id);
      },
      pointToLayer: function(geoJsonPoint,latlng){
        return L.marker(latlng,{
            icon: defaultIcon,
            riseOnHover: true
        });
    },
    onEachFeature: function(feature,layer){
      layer.on('mouseover',function(e) {
          e.target.setIcon(bigDefaultIcon).rise
      })
      layer.on('mouseout',function(e) {
          e.target.setIcon(defaultIcon)
      })  
  }
    })
    .bindPopup(function(layer){
      let description = ''
      for(i=0;i<eventCategories.categories.length;i++){
        if (eventCategories.categories[i].title === layer.feature.properties.categories[0].title){
          description = eventCategories.categories[i].description
        }
      }
      return `<strong>Event title</strong>:  ${layer.feature.properties.title}<br><strong>Date:  ${layer.feature.properties.date}</strong><br><strong>Source:</strong>  ${layer.feature.properties.sources[0].url}<br><strong>Category description:</strong>  ${description}`
    }).addTo(map);

    var totalEvents = filteredFeatures.getLayers().length;
    // console.log(totalEvents)

    if(filteredFeatures.getLayers().length > 0){
        // reset map bounds to fit filtered features - Add logic so this doesn't error if there are no events in thw category
        map.fitBounds(filteredFeatures.getBounds(), {
          padding: [50,50]
      });
    }
    else {
      alert(`No recent events found in selected category: ${optionsList}. \nTry another category.`)
    }
  })

}

////////////////////////////////////// Call all the functions to 'run' the map //////////////////////////////////////////////

function start() {
  initializeMap()
  setCountryFeatures()
  slideInCategories()
  getCategories()
  getDefaultEventData()
  handleCategorySearch()
  handleCategoryFilter()
}

$(start);



