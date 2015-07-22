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
    max: 200,
    optional: false
  },
  description: {
    type: String,
    label: "Description",
    max: 2000,
    optional: false
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
    min: 0,
    optional: false
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
    optional: false
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
},
verified: {
    type: Boolean,
    label: "Indicates if the listing has been verified by an admin",
    defaultValue: false
 },
 verifyRequested: {
    type: Boolean,
    label: "Would you like this listing to be 209 Verified?",
    defaultValue: false
 },
 hasWater: {
    type: Boolean,
    label: "Does the parking spot or tiny have drinking water?",
    defaultValue: false
 },
 hasPower: {
    type: Boolean,
    label: "Does the parking spot or tiny have power available?",
    defaultValue: false
 },
 sqFeet: {
    type: Number,
	decimal: true,
	label: "Square Feet of the tiny house or parking spot available.",
    optional: false
},
maxHeight: {
    type: Number,
	decimal: true,
	label: "Maximum height of a tiny house the space can accomodate.",
    optional: true
},
 listingType: {
    type: String,
    optional: false,
    allowedValues: ['spot', 'house'],
    autoform: {
      options: [
        {label: "Tiny Parking Spot", value: "spot"},
        {label: "Tiny House", value: "house"}
      ]
    }
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
	path: '/',
	waitOn: function() {Meteor.subscribe('listings')}
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

	Meteor.startup(function() {
	  toastr.options.positionClass = "toast-bottom-right";
	  //default the map center and bounds, then track them in local storage as the map moves.
	  Session.setDefaultPersistent("mapCenter", [37.7833, -122.4167]);
	  //todo - make this real based on actual map bounds
	  boundObject = { 
	        southWest: [37.74995081712854, -122.46580123901367],
	        northEast: [37.78618210598413, -122.36812591552733] 
		}
	  Session.setDefaultPersistent("mapBounds", boundObject);
	});
	
	Template.map.rendered = function() {
	  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

	  center = Session.get("mapCenter");
	  map = L.map('map', {
	    doubleClickZoom: true
	  }).setView(center, 13);

	  L.tileLayer.provider('MapBox', {id: 'i8flan.jo1h0k21', accessToken: 'pk.eyJ1IjoiaThmbGFuIiwiYSI6ImZPbHhKYncifQ.qXeCay-TLmRzkMGsWCoyQg'}).addTo(map);

	  var lc = L.control.locate({
	    position: 'topleft',  // set the location of the control
	    drawCircle: true,  // controls whether a circle is drawn that shows the uncertainty about the location
	    follow: false,  // follow the user's location
	    setView: false, // automatically sets the map view to the user's location, enabled if `follow` is true
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

	     center = map.getCenter();
	     Session.setPersistent("mapCenter", center);

		 var bounds = map.getBounds()
		    , boundObject = { 
		        southWest: [bounds._southWest.lat, bounds._southWest.lng],
		        northEast: [bounds._northEast.lat, bounds._northEast.lng] 
		      };

		  Session.setPersistent("mapBounds", boundObject);

	  });


	  var query = Listings.find();
	  query.observe({
	    added: function (listing) {
	    	if (listing.lat != null) {
		    	var popOptions = {'minWidth': '200','className' : 'custom'};
		    	var popupContents = '<a href="listing/' + listing._id + '" target="_blank"><!--<img src="' + listing.photo + '" class="img-responsive" style="width:100%;"/>--><div class="details"><h3 class="listing-title">' + listing.title + '</h3></div></a>';

		     	var marker = L.marker([listing.lat, listing.lng]).bindPopup(popupContents,popOptions).addTo(map)
		        .on('click', function(event) {
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
	},
    'contacted': function(){
        return Contacts.find({'userId': Meteor.userId(),'listingId': this._id}, {sort: {createdAt: -1}});
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
		//bounds = MapBounds.findOne();
		bounds = Session.get("mapBounds");

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
	    },
	    'isOwner': function(thisUserId) {
	    	//move to helpers.js?
	    	if (thisUserId && (thisUserId._id === Meteor.userId())) {
	    		return true
	    	}else{
	    		return false
	    	}
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

	Accounts.ui.config({
	    requestPermissions: {},
	    extraSignupFields: [{
	        fieldName: 'first-name',
	        fieldLabel: 'First name',
	        inputType: 'text',
	        visible: true,
	        validate: function(value, errorFunction) {
	          if (!value) {
	            errorFunction("Please write your first name");
	            return false;
	          } else {
	            return true;
	          }
	        }
	    }, {
	        fieldName: 'last-name',
	        fieldLabel: 'Last name',
	        inputType: 'text',
	        visible: true,
	        validate: function(value, errorFunction) {
	          if (!value) {
	            errorFunction("Please write your last name");
	            return false;
	          } else {
	            return true;
	          }
	        }
	    }, {
	        fieldName: 'terms',
	        fieldLabel: 'I accept the terms and conditions',
	        inputType: 'checkbox',
	        visible: true,
	        saveToProfile: false,
	        validate: function(value, errorFunction) {
	            if (value) {
	                return true;
	            } else {
	                errorFunction('You must accept the terms and conditions.');
	                return false;
	            }
	        }
	    }]
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
			Meteor.users.remove({});
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
	  process.env.MAIL_URL = mail_url;
	  Accounts.emailTemplates.from = 'no 209 <matt@clineranch.net>';
	  Accounts.emailTemplates.siteName = 'no 209';
	  Accounts.emailTemplates.verifyEmail.subject = function(user) {
	    return 'Confirm Your Email Address';
	  };
	  Accounts.emailTemplates.verifyEmail.text = function(user, url) {
	    return 'Click on the following link to verify your email address and create your account: ' + url;
	  };
	});

	// Listen to incoming HTTP requests, can only be used on the server
	WebApp.connectHandlers.use(function(req, res, next) {
	  res.setHeader("Access-Control-Allow-Origin", "*");
	  return next();
	});

	Accounts.config({sendVerificationEmail: true, forbidClientAccountCreation: false});

	// (server-side) called whenever a login is attempted
	// Accounts.validateLoginAttempt(function(attempt){
	//   if (attempt.user && attempt.user.emails && !attempt.user.emails[0].verified ) {
	//     console.log('email not verified');

	//     return false; // the login is aborted
	//   }
	//   return true;
	// }); 

	
}
