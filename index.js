$(document).ready(function() { 

    $('#mapid').height(window.innerHeight);
    $('#slide-in').height(window.innerHeight);

    $(document).on('click','#advanced',function() {
        if($('#slide-in').hasClass('in')) {
            $('#slide-in').removeClass('in')
        } else {
            $('#slide-in').addClass('in')
        }
    })

    const map = L.map('mapid',{
        zoomControl: false
    })
    .setView([40.55972134684838,-110.56640625], 3);

    //Function and event to give LatLng
    let popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(map);
    }
    
    map.on('click', onMapClick); 

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);


    fetch('https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events/geojson?limit=20&status=open',{
        method:'GET'
    })
    .then(response => response.json())
    .then(json => {
        var eventsGeoJSON = L.geoJSON(json)
        .bindPopup(function(layer){
            return `<strong>Title</strong>: ${layer.feature.properties.title}<br>Date:${layer.feature.properties.date}`
        }).addTo(map);
    })
    .catch(error => console.log(error.message));

    const countryFeatures = L.geoJSON(COUNTRIES, {
        style:function(feature){
            return {
                color: '#20003f',
                fillOpacity:0, 
                opacity: 0.8,
                weight: 0.5
            }
        },
        onEachFeature: function(feature,layer){
            layer.on('mouseover',function(e) {
                e.target.setStyle({fillOpacity:0.3})
            })
            layer.on('mouseout',function(e) {
                e.target.setStyle({fillOpacity:0})
            })  
        }
    }).bindPopup(function(layer){
        return `<strong>${layer.feature.properties.name}</strong>`
    }).addTo(map);

    map.fitBounds(countryFeatures.getBounds(), {
        padding: [-40,-175]
    });

});