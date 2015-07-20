Images = new FS.Collection("images", {
  stores: [
  new FS.Store.GridFS("thumbs", { transformWrite: createThumb }),
  new FS.Store.GridFS("images", {})

  ]
});

var createThumb = function(fileObj, readStream, writeStream) {
  // Transform the image into a 10x10px thumbnail
  gm(readStream, fileObj.name()).resize('840', '450').stream().pipe(writeStream);
};

Images.allow({
  download: function () {
    return true;
  },
  fetch: null
});

Listings = new Mongo.Collection("listings");
Photos = new Mongo.Collection("photos");
Contacts = new Mongo.Collection("contacts");
MapBounds = new Mongo.Collection(null);

Photos.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  photo: {
    type: [String],
    label: "Photos",
    autoform: {
      afFieldInput: {
        type: "cfs-file",
        collection: "images"
      }
    },
    optional: true
  },
  listingId: {
    type: String,
    label: "",
    max: 200,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
	    label: false
	  }
    }
  },
}));


Listings.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  photo: {
    type: String,
    label: "Primary Photo",
    autoform: {
      afFieldInput: {
        type: "cfs-file",
        collection: "images"
      }
    }
  },
  price: {
    type: Number,
    label: "Price per month",
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
    max: 200
  },
  userId: {
    type: String,
    label: "UserId",
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


Contacts.attachSchema(new SimpleSchema({
  comment: {
    type: String,
    label: "Your message",
    max: 500
  },
  listingId: {
    type: String,
    label: "",
    max: 200,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
	    label: false
	  }
    }
  },
  userId: {
    type: String,
    label: "UserId",
    max: 200,
    optional: true
  },
  createdAt: {
    type: Date,
    label: "Date created",
    defaultValue: new Date()
  }
}));

Router.configure({
    layoutTemplate: 'main'
});

Router.route('about'); 
Router.route('new');  
Router.route('clear'); 

Router.route('home', {
	path: '/'
});

Router.route('listing', {
	path: '/listing/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'listing'
});

Router.route('update', {
	path: '/update/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'update'
});


Router.route('mylistings', {
	path: '/mylistings',
	template: 'mylistings'
});

var map = null;

if(Meteor.isClient){

	Meteor.subscribe('images');
	Meteor.subscribe('contacts');
	Meteor.subscribe('listings');

    // on startup run resizing event
	Meteor.startup(function() {
	  toastr.options.positionClass = "toast-bottom-right";
	});
	
	Template.map.rendered = function() {
	  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

	  map = L.map('map', {
	    doubleClickZoom: true
	  }).setView([37.7833, -122.4167], 13);

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

	  lc.start();


	  map.on('moveend', function() { 
	     console.log(map.getBounds());

	     box = map.getBounds();

	     //http://stackoverflow.com/questions/15487551/meteor-mongodb-geospatial-bounds-within

		 var bounds = map.getBounds()
		    , boundObject = { 
		        southWest: [bounds._southWest.lat, bounds._southWest.lng],
		        northEast: [bounds._northEast.lat, bounds._northEast.lng] 
		      };

		  if (MapBounds.find().count() < 1) MapBounds.insert(boundObject);
		  else MapBounds.update({}, boundObject);
	  });


	  var query = Listings.find();
	  query.observe({
	    added: function (listing) {
	    	if (listing.lat != null) {
		    	var popOptions = {'minWidth': '200','className' : 'custom'};
		    	var popupContents = '<a href="listing/' + listing._id + '" target="_blank"><!--<img src="' + listing.photo + '" class="img-responsive" style="width:100%;"/>--><div class="details"><h3 class="listing-title">' + listing.title + '</h3></div></a>';

		     	var marker = L.marker([listing.lat, listing.lng]).bindPopup(popupContents,popOptions).addTo(map)
		        .on('click', function(event) {
		          //Markers.remove({_id: document._id});
		        });

	    	}  
	    }
	  });
	};

	Listings.helpers({
	  'photourl': function() {
	    return Images.findOne(this.photo);
	  }
	});

	Contacts.helpers({
	  'listing': function() {
	    return Listings.findOne(this.listingId);
	  },
	  'contactor': function() {
	    return Meteor.users.findOne(this.userId);
	  }
	});


	Template.clear.helpers({
	'clear': function(){
        Meteor.call('deleteAll');
    }
	});

	Template.listing.isOwner = function() {
	    //return this.userId === Meteor.userId();
	};


	Template.listing.helpers({
    'contacts': function(){
        return Contacts.find({'listingId': this._id}, {sort: {createdAt: -1}});
    },
    'isOwner': function(thisUserId) {

    	if (thisUserId && (thisUserId._id === Meteor.userId())) {
    		return true
    	}else{
    		return false
    	}
	}
	});


	Template.mylistings.helpers({
    'results': function(){
        return Listings.find({'userId._id': Meteor.userId()}, {sort: {createdAt: -1}});
    },
    'contacts': function(){
        return Contacts.find({'listing.userId': Meteor.userId()}, {sort: {createdAt: -1}});
    }
	});

	Template.home.helpers({
		
	    results: function(){
		bounds = MapBounds.findOne();
	        return Listings.find({
				 "lng" : {
			        "$gt" : bounds.southWest[1],
			        "$lt":  bounds.northEast[1]  
			      },
			      "lat": {
			        "$gt" : bounds.southWest[0],
			        "$lt": bounds.northEast[0]
			      }
	        }, {sort: {createdAt: -1}});
	    }
	});

	Template.listing.events({
		'click #comment': function(){
		    Modal.show('commentModal');
		    Session.set("listingid", this._id);
		}
	});

	Contacts.after.insert(function (userId, doc) {
		if (doc._id !== undefined) {
		 	toastr.success("Comment sent.");
		 	Modal.hide('commentModal');
		}
	});

	Listings.after.insert(function (userId, doc) {
		if (doc._id !== undefined) {
			toastr.success("Listing added.");
		}
	});

	Listings.after.update(function (userId, doc) {
		toastr.success("Listing updated.");
	});

	Template.update.events({
		'click #uploadimages': function(){
		    Modal.show('fileUploader');
		    Session.set("listingid", this._id);
		}
	});

	Template.listing.events({
		'click #viewprofile': function(){
		    Modal.show('viewProfile');
		    Session.set("listingid", this._id);
		}
	});

	Template.commentModal.helpers({
	    listingid: function() {
	        return Session.get("listingid");
	    }
	});


	Template.home.events({
    "submit .locate-search": function (event) {
      event.preventDefault();
      var text = event.target.text.value;

	  Meteor.call('getGeocodedResults',text,function(err, response) {
		
		lat = response[0].latitude;
		lng = response[0].longitude;

		map.panTo(new L.LatLng(lat, lng));
	  });

      event.target.text.value = "";
    },
	'click #comment': function(){
	    Modal.show('commentModal');
	    Session.set("listingid", this._id);
	},
  	});

	
}

if(Meteor.isServer){

	Meteor.publish("images", function(){ return Images.find(); });
	Meteor.publish("contacts", function(){ return Contacts.find(); });
	Meteor.publish("listings", function(){ return Listings.find(); });


	Meteor.methods({
	  getGeocodedResults: function (address) {
	  	var geo = new GeoCoder();
	    var result = geo.geocode(address);
		return result;
	  },
	  deleteAll: function() {
			Listings.remove({});
			Contacts.remove({});
			Images.remove({});
		}
	});


	Listings.before.insert(function (userId, doc) {
	   var geo = new GeoCoder();
	   var result = geo.geocode(doc.address);

	   doc.lat = result[0].latitude;
	   doc.lng = result[0].longitude;

	   doc.coordinates[0].lon = result[0].longitude;
	   doc.coordinates[0].lat = result[0].latitude;

	   doc.userId = Meteor.user();

	});

	Listings.before.update(function (userId, doc) {
	   var geo = new GeoCoder();
	   var result = geo.geocode(doc.address);

	   doc.lat = result[0].latitude;
	   doc.lng = result[0].longitude;

	   doc.coordinates[0].lon = result[0].longitude;
	   doc.coordinates[0].lat = result[0].latitude;

	   doc.userId = Meteor.user();

	});


	Listings.after.insert(function (userId, doc) {
		//Router.go('home');
	});


	Contacts.before.insert(function (userId, doc) {
	   doc.userId = userId;
	});

	Meteor.startup(function () {
	  process.env.MAIL_URL = 'smtp://i8flan@gmail.com:RsakIVK-pIx6SGAqS6pW5w@smtp.mandrillapp.com:587/';
	  Accounts.emailTemplates.from = 'Patch Match <matt@clineranch.net>';
	  Accounts.emailTemplates.siteName = 'Patch Match';
	  Accounts.emailTemplates.verifyEmail.subject = function(user) {
	    return 'Confirm Your Email Address';
	  };
	  Accounts.emailTemplates.verifyEmail.text = function(user, url) {
	    return 'Click on the following link to verify your email address: ' + url;
	  };
	});

	// Listen to incoming HTTP requests, can only be used on the server
	WebApp.connectHandlers.use(function(req, res, next) {
	  res.setHeader("Access-Control-Allow-Origin", "*");
	  return next();
	});



	// Publish those listings within the bounds of the map view.
	// Meteor.publish('listings', function(bounds){

	//  if (bounds && bounds.southWest && bounds.northEast) {

	//   return Listings.find({'coordinates': {'$within' : 
	//     { '$box' : [bounds.southWest, bounds.northEast] }
	//   }}, {
	//     limit: 100
	//   });

	//  }

	// });


}