var Markers = new Mongo.Collection('markers');
var Listings = new Mongo.Collection("listings");


Router.configure({
    layoutTemplate: 'main'
});


Router.route('about');  // By default, path = '/about', template = 'about'
Router.route('home', {
	path: '/'  //overrides the default '/home'
});


Router.route('listing', {
	path: '/listing/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'listing'
});



if(Meteor.isClient){
    // on startup run resizing event
	Meteor.startup(function() {
	  $(window).resize(function() {
	    $('#map').css('height', window.innerHeight - 50);
	  });
	  $(window).resize(); // trigger resize event 
	});
	

	Template.map.rendered = function() {
	  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

	  var map = L.map('map', {
	    doubleClickZoom: false
	  }).setView([37.7833, -122.4167], 13);

	  //L.tileLayer.provider('Thunderforest.Outdoors').addTo(map);

	  L.tileLayer.provider('MapBox', {id: 'i8flan.jo1h0k21', accessToken: 'pk.eyJ1IjoiaThmbGFuIiwiYSI6ImZPbHhKYncifQ.qXeCay-TLmRzkMGsWCoyQg'}).addTo(map);

	  var lc = L.control.locate({
	    position: 'topleft',  // set the location of the control
	    drawCircle: true,  // controls whether a circle is drawn that shows the uncertainty about the location
	    follow: false,  // follow the user's location
	    setView: true, // automatically sets the map view to the user's location, enabled if `follow` is true
	    keepCurrentZoomLevel: true, // keep the current map zoom level when displaying the user's location. (if `false`, use maxZoom)
	    stopFollowingOnDrag: false, // stop following when the map is dragged if `follow` is true (deprecated, see below)
	    remainActive: false, // if true locate control remains active on click even if the user's location is in view.
	    markerClass: L.circleMarker, // L.circleMarker or L.marker
	    circleStyle: {},  // change the style of the circle around the user's location
	    markerStyle: {},
	    followCircleStyle: {},  // set difference for the style of the circle around the user's location while following
	    followMarkerStyle: {},
	    icon: 'fa fa-map-marker',  // class for icon, fa-location-arrow or fa-map-marker
	    iconLoading: 'fa fa-spinner fa-spin',  // class for loading icon
	    circlePadding: [0, 0], // padding around accuracy circle, value is passed to setBounds
	    metric: true,  // use metric or imperial units
	    onLocationError: function(err) {alert(err.message)},  // define an error callback function
	    onLocationOutsideMapBounds:  function(context) { // called when outside map boundaries
	            alert(context.options.strings.outsideMapBoundsMsg);
	    },
	    showPopup: true, // display a popup when the user click on the inner marker
	    strings: {
	        title: "Locate me",  // title of the locate control
	        metersUnit: "meters", // string for metric units
	        feetUnit: "feet", // string for imperial units
	        popup: "You are within {distance} {unit} from this point",  // text to appear if user clicks on circle
	        outsideMapBoundsMsg: "You seem located outside the boundaries of the map" // default message for onLocationOutsideMapBounds
	    },
	    locateOptions: {}  // define location options e.g enableHighAccuracy: true or maxZoom: 10
	  }).addTo(map);

	  // request location update and set location
	  lc.start();

	  map.on('dblclick', function(event) {
	    Markers.insert({latlng: event.latlng});
	  });

	  var query = Markers.find();
	  query.observe({
	    added: function (document) {
	      var marker = L.marker(document.latlng).addTo(map)
	        .on('click', function(event) {
	          map.removeLayer(marker);
	          Markers.remove({_id: document._id});
	        });
	    },
	    removed: function (oldDocument) {
	      layers = map._layers;
	      var key, val;
	      for (key in layers) {
	        val = layers[key];
	        if (val._latlng) {
	          if (val._latlng.lat === oldDocument.latlng.lat && val._latlng.lng === oldDocument.latlng.lng) {
	            map.removeLayer(val);
	          }
	        }
	      }
	    }
	  });
	};

	Template.main.rendered = function() {
		$(window).resize(); // trigger resize event 
	}

	Template.home.helpers({
	    'results': function(){
	        return Listings.find();
	    }
	});

	Template.listing.helpers({
	    'results': function(){
	        return Listings.find();
	    }
	});

}

if(Meteor.isServer){

	Listings.remove({});

	Listings.insert({
	    title: "House 1", 
	    photo: "https://a2.muscache.com/ac/pictures/66317040/574ba172_original.jpg?interpolation=lanczos-none&size=x_medium&output-format=jpg&output-quality=70",
	    price: "160",
	    createdAt: new Date()
	});

	Listings.insert({
	    title: "Lot 1", 
	    photo: "https://a1.muscache.com/ac/pictures/66051907/3f356ae7_original.jpg?interpolation=lanczos-none&size=x_medium&output-format=jpg&output-quality=70",
	    price: "140",
	    createdAt: new Date()
	});

	Listings.insert({
	    title: "Lot 2", 
	    photo: "https://a0.muscache.com/ac/pictures/47037822/0069da19_original.jpg?interpolation=lanczos-none&size=x_medium&output-format=jpg&output-quality=70",
	    price: "120",
	    createdAt: new Date()
	});


	// Listen to incoming HTTP requests, can only be used on the server
	WebApp.connectHandlers.use(function(req, res, next) {
	  res.setHeader("Access-Control-Allow-Origin", "*");
	  return next();
	});


}