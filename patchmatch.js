Images = new FS.Collection("images", {
  stores: [new FS.Store.GridFS("images", {})]
});

Images.allow({
  download: function () {
    return true;
  },
  fetch: null
});

Listings = new Mongo.Collection("listings");

MapBounds = new Mongo.Collection(null);

Listings.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  photo: {
    type: String,
    autoform: {
      afFieldInput: {
        type: "cfs-file",
        collection: "Images"
      }
    },
    optional: true,
    defaultValue: "https://a0.muscache.com/ac/pictures/47037822/0069da19_original.jpg?interpolation=lanczos-none&size=x_medium&output-format=jpg&output-quality=70"
  },
  price: {
    type: Number,
    label: "Price",
    min: 0
  },
  lat: {
    type: String,
    label: "Latitude",
    max: 200,
    optional: true
  },
  lng: {
    type: String,
    label: "Longitude",
    max: 200,
    optional: true
  },
  address: {
    type: String,
    label: "Address",
    max: 200,
    optional: true
  },
  createdAt: {
    type: Date,
    label: "Date created",
    defaultValue: new Date()
  },
  summary: {
    type: String,
    label: "Brief summary",
    optional: true,
    max: 1000
  },
coordinates: {
    type: [Object],
    optional: true
},
"coordinates.$.lat": {
    type: Number,
	decimal: true,
    optional: true,
    defaultValue: 1
},
"coordinates.$.lon": {
    type: Number,
	decimal: true,
    optional: true,
    defaultValue: 1
}
}));

Router.configure({
    layoutTemplate: 'main'
});

Router.route('about'); 
Router.route('new');  
Router.route('home', {
	path: '/',
	data: function () {return Listings.find({}, {sort: {createdAt: -1}})}
});

Router.route('listing', {
	path: '/listing/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'listing'
});

var map = null;
var bounds = null;

var listingInBounds = function(bounds) {

	if (bounds && bounds.southWest && bounds.northEast) {
	  return Listings.find({'coordinates': {'$within' : 
	    { '$box' : [bounds.southWest, bounds.northEast] }
	  }}, {
	    limit: 100
	  });
	 }else{
	 	return Listings.find();
	 }
};


if(Meteor.isClient){

	// Get listings that are located within our map bounds. 
	Meteor.autorun(function () {
	 Session.set('loading', true);
	  Meteor.subscribe('BoundsListing', MapBounds.findOne(), function(){
	   Session.set('loading', false);
	  }); 
	});

    // on startup run resizing event
	Meteor.startup(function() {
	  $(window).resize(function() {
	    $('#map').css('height', window.innerHeight - 50);
	    $('#listings').css('height', window.innerHeight - 50);
	  });
	  $(window).resize(); // trigger resize event 
	});
	
	Template.map.rendered = function() {
	  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

	  map = L.map('map', {
	    doubleClickZoom: true
	  }).setView([37.7833, -122.4167], 13);

	  L.tileLayer.provider('MapBox', {id: 'i8flan.jo1h0k21', accessToken: 'pk.eyJ1IjoiaThmbGFuIiwiYSI6ImZPbHhKYncifQ.qXeCay-TLmRzkMGsWCoyQg'}).addTo(map);

	  // var lc = L.control.locate({
	  //   position: 'topleft',  // set the location of the control
	  //   drawCircle: true,  // controls whether a circle is drawn that shows the uncertainty about the location
	  //   follow: false,  // follow the user's location
	  //   setView: true, // automatically sets the map view to the user's location, enabled if `follow` is true
	  //   keepCurrentZoomLevel: true, // keep the current map zoom level when displaying the user's location. (if `false`, use maxZoom)
	  //   stopFollowingOnDrag: false, // stop following when the map is dragged if `follow` is true (deprecated, see below)
	  //   remainActive: false, // if true locate control remains active on click even if the user's location is in view.
	  //   markerClass: L.circleMarker, // L.circleMarker or L.marker
	  //   circleStyle: {},  // change the style of the circle around the user's location
	  //   markerStyle: {},
	  //   followCircleStyle: {},  // set difference for the style of the circle around the user's location while following
	  //   followMarkerStyle: {},
	  //   icon: 'fa fa-map-marker',  // class for icon, fa-location-arrow or fa-map-marker
	  //   iconLoading: 'fa fa-spinner fa-spin',  // class for loading icon
	  //   circlePadding: [0, 0], // padding around accuracy circle, value is passed to setBounds
	  //   metric: true,  // use metric or imperial units
	  //   onLocationError: function(err) {alert(err.message)},  // define an error callback function
	  //   onLocationOutsideMapBounds:  function(context) { // called when outside map boundaries
	  //           alert(context.options.strings.outsideMapBoundsMsg);
	  //   },
	  //   showPopup: true, // display a popup when the user click on the inner marker
	  //   strings: {
	  //       title: "Locate me",  // title of the locate control
	  //       metersUnit: "meters", // string for metric units
	  //       feetUnit: "feet", // string for imperial units
	  //       popup: "You are within {distance} {unit} from this point",  // text to appear if user clicks on circle
	  //       outsideMapBoundsMsg: "You seem located outside the boundaries of the map" // default message for onLocationOutsideMapBounds
	  //   },
	  //   locateOptions: {}  // define location options e.g enableHighAccuracy: true or maxZoom: 10
	  // }).addTo(map);

	  // lc.start();

	  map.on('moveend', function() { 
	     console.log(map.getBounds());

	     box = map.getBounds();

	     //http://stackoverflow.com/questions/15487551/meteor-mongodb-geospatial-bounds-within

		 bounds = map.getBounds()
		    , boundObject = { 
		        southWest: [bounds._southWest.lat, bounds._southWest.lng],
		        northEast: [bounds._northEast.lat, bounds._northEast.lng] 
		      };

		  if (MapBounds.find().count() < 1) MapBounds.insert(boundObject);
		  else MapBounds.update({}, boundObject);
	  });


	  // var query = listingInBounds();
	  // query.observe({
	  //   added: function (listing) {
	  //   	if (listing.lat != null) {
		 //    	var popOptions = {'minWidth': '200','className' : 'custom'};
		 //    	var popupContents = '<a href="listing/' + listing._id + '" target="_blank"><img src="' + listing.photo + '" class="img-responsive" style="width:100%;"/><div class="details"><h3 class="listing-title">' + listing.title + '</h3></div></a>';

		 //     	var marker = L.marker([listing.lat, listing.lng]).bindPopup(popupContents,popOptions).addTo(map)
		 //        .on('click', function(event) {
		 //          //Markers.remove({_id: document._id});
		 //        });

	  //   	}
	       
	  //   }
	  // });
	};

	Template.main.rendered = function() {
		$(window).resize(); // trigger resize event 
	}

	Template.home.helpers({
	    results: function(){
	        //return Listings.find({}, {sort: {createdAt: -1}});
	        return listingInBounds(bounds);
	    }
	});

	Template.home.events({
    "submit .locate-search": function (event) {

      event.preventDefault();
      var text = event.target.text.value;

      //call the geocoder function on the server
	  Meteor.call('getGeocodedResults',text,function(err, response) {
		
		lat = response[0].latitude;
		lng = response[0].longitude;

		map.panTo(new L.LatLng(lat, lng));
	  });

      event.target.text.value = "";
    }
  	});

	
}

if(Meteor.isServer){

	Meteor.methods({
	  getGeocodedResults: function (address) {
	  	var geo = new GeoCoder();
	    var result = geo.geocode(address);
		return result;
	  }

	});


	//Listings.remove({});


	// Listen to incoming HTTP requests, can only be used on the server
	WebApp.connectHandlers.use(function(req, res, next) {
	  res.setHeader("Access-Control-Allow-Origin", "*");
	  return next();
	});


	Meteor.publish('BoundsListing', function () {
	    return listingInBounds(bounds);
	});


	Listings.before.insert(function (userId, doc) {
	   var geo = new GeoCoder();
	   var result = geo.geocode(doc.address);

	   doc.lat = result[0].latitude;
	   doc.lng = result[0].longitude;

	   doc.coordinates[0].lon = result[0].longitude;
	   doc.coordinates[0].lat = result[0].latitude;

	});





}