
// $('#mapid').height(window.innerHeight);
$('#slide-in').height(window.innerHeight);


let data = [];
let map = [];

function initializeMap() {
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

function getEventData() {
  fetch('https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events/geojson?limit=20&status=open',{
    method:'GET'
  })
    .then(response => response.json())
    .then(json => {
      data = json
      // call render function that houses the below
      L.geoJSON(json)
      .bindPopup(function(layer){
          return `<strong>Title</strong>: ${layer.feature.properties.title}<br>Date:${layer.feature.properties.date}`
      }).addTo(map);
    })
    .catch(error => console.log(error.message));
}

// build this out later
function handleEventTypeFilter() {
  // filter through all the global data of events by types currently selected then call render again
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

function start() {
  console.log('rendering map')
  initializeMap()
  getEventData()
  handleClickSlideIn()
  setCountryFeatures()
}

$(start);