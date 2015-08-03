Images = new FS.Collection("images", {
  stores: [
  new FS.Store.FileSystem("tiles", {
        transformWrite: function(fileObj, readStream, writeStream) {
          //help here:  http://aheckmann.github.io/gm/docs.html
          // Transform the image into a 10x10px thumbnail
          gm(readStream, fileObj.name())
          .resize('840', '450', '!')
          .gravity('Center')
          .crop('840', '450')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("thumbs", {
        transformWrite: function(fileObj, readStream, writeStream) {
          // Transform the image into a 10x10px thumbnail
          gm(readStream, fileObj.name())
          .resize('100', '100', '!')
          .gravity('Center')
          .crop('100', '100')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("extras", {
        transformWrite: function(fileObj, readStream, writeStream) {
          // Transform the image into a 10x10px thumbnail
          gm(readStream, fileObj.name())
          .resize('800', '800')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("images", {})

  ],
    filter: {
      allow: {
        contentTypes: ['image/*'],
        extensions: ['png', 'jpg', 'jpeg', 'gif']
      }
    }
});



Listings = new Mongo.Collection("listings");
Photos = new Mongo.Collection("photos");
Contacts = new Mongo.Collection("contacts");
Favorites = new Mongo.Collection("favorites");



//COLLECTION SCHEMAS
//********************************************************************************************************

Photos.attachSchema(new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  photo: {
    type: String,
    label: "Photo",
    autoform: {
      afFieldInput: {
        type: "cfs-file",
        collection: "images"
      }
    },
    optional: false
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
    label: "Primary Photo (landscape orientation is best)",
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
    optional: true
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
approved: {
    type: Boolean,
    label: "Indicates if the listing has been approved to be published",
    defaultValue: false
 },
 verifyRequested: {
    type: Boolean,
    label: "Would you like this listing to be 209 Verified?",
    defaultValue: false
 },
 hasWater: {
    type: Boolean,
    label: "Drinking water available",
    defaultValue: false
 },
 hasPower: {
    type: Boolean,
    label: "Power is available",
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
  },
  stripeCustomerId: {
    type: String,
    label: "Stripe Customer ID",
    max: 200,
    optional: true
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
  userIdTo: {
    type: String,
    label: "UserId to",
    defaultValue: "NA",
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
  createdAt: {
    type: Date,
    label: "Date created",
    optional: true
  }
}));


Favorites.attachSchema(new SimpleSchema({
  listingId: {
    type: String,
    label: "",
    max: 200,
    optional: true
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
    optional: true
  }
}));

//ROUTES
//********************************************************************************************************

//good role guide:  https://gentlenode.com/journal/meteor-13-managing-user-roles/24

Router.configure({
    layoutTemplate: 'main'
});

Router.route('about'); 

Router.route('home', {
  path: '/'
});

Router.route('clear', {
  waitOn: function () {
    return [ Meteor.subscribe("roles") ];
  },
  onBeforeAction: function() {
    user = Meteor.user();
    if(!Roles.userIsInRole(user, ['admin'])) {
      this.redirect('home');
    }
    this.next();
  }
});

Router.route('admin', {
  waitOn: function () {
    return [ Meteor.subscribe("roles") ];
  },
  onBeforeAction: function() {
    user = Meteor.user();
    if(!Roles.userIsInRole(user, ['admin'])) {
      this.redirect('home');
    }
    this.next();
  }
});

Router.route('new', {
  onBeforeAction: function (pause) {
    if (!Meteor.user()) {
      this.redirect('home');
    }else{
      this.next();
    }
  }
});

Router.route('favorites', {
  waitOn: function () {
    return [ Meteor.subscribe("favorites") ];
  },
  onBeforeAction: function (pause) {
    if (!Meteor.user()) {
      this.redirect('home');
    }else{
      this.next();
    }
  }
}); 

Router.route('listing', {
	path: '/listing/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'listing',
	onBeforeAction: function () {                                                                             
       Session.set('listingid', this.params._id); 
       this.next();                                                                
    },
  waitOn: function () {
    if (Meteor.user()) {
      return [ Meteor.subscribe("favorites"),Meteor.subscribe("contacts") ];
    }
  }
});

Router.route('update', {
	path: '/update/:_id',
	data: function () {return Listings.findOne({_id: this.params._id})},
	template: 'update',
  onBeforeAction: function (pause) {
    if (!Meteor.user()) {
      this.redirect('home');
    }else{
      this.next();
    }
  }
});

Router.route('mylistings', {
	path: '/mylistings',
	template: 'mylistings',
  onBeforeAction: function (pause) {
    if (!Meteor.user()) {
      this.redirect('home');
    }else{
      this.next();
    }
  }
});

Router.route('mymessages', {
	path: '/mymessages',
	template: 'mymessages',
  onBeforeAction: function (pause) {
    if (!Meteor.user()) {
      this.redirect('home');
    }else{
      this.next();
    }
  },
  waitOn: function () {
    if (Meteor.user()) {
      return [ Meteor.subscribe('contacts') ];
    }
  }
});



var map = null, markers = null;

if(Meteor.isClient){

	Meteor.subscribe('images');
  Meteor.subscribe("photos");
  Meteor.subscribe("listings");
  Meteor.subscribe("userData");

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
	  Session.setDefaultPersistent("listingtype", ["spot","house"]);
	  Session.setDefaultPersistent("verified", false);

	   // slider starts at 20 and 80
  	  Session.setDefaultPersistent("slider", [500, 2000]);


	});
	
	Template.map.rendered = function() {
	  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

    var southWest = L.latLng(37.0606, -122.8808),
        northEast = L.latLng(38.6154, -121.5746),
    maxBounds = L.latLngBounds(southWest, northEast);

	  center = Session.get("mapCenter");
	  map = L.map('map', {
	    doubleClickZoom: true,
      maxBounds: maxBounds,
      maxZoom: 15,
      minZoom: 9
	  }).setView(center, 11);

	  L.tileLayer.provider('MapBox', {id: 'i8flan.jo1h0k21', accessToken: Meteor.settings.public.general.map_box_key}).addTo(map);

	  map.on('moveend', function() { 

	     center = map.getCenter();
	     Session.setPersistent("mapCenter", center);

		 var bounds = map.getBounds()
		    , boundObject = { 
		        southWest: [bounds._southWest.lat, bounds._southWest.lng],
		        northEast: [bounds._northEast.lat, bounds._northEast.lng] 
		      };

		  Session.setPersistent("mapBounds", boundObject);

	  });

    //put them in a marker group so we can remove them all easily
    markers = new L.LayerGroup().addTo(map);

    // If the collection of listings changes
    Tracker.autorun(function() {

      bounds = Session.get("mapBounds");

      listingtype = Session.get("listingtype");
      verified = Session.get("verified");

      localslider = Session.get("slider");
      lowEnd = Math.round(localslider[0]);
      highEnd = Math.round(localslider[1]);

      //build the query dynamically so we can use conditionals to append criteria or not
      var query = {"lng" : {
                "$gt" : bounds.southWest[1],
                "$lt":  bounds.northEast[1]  
              },
              "lat": {
                "$gt" : bounds.southWest[0],
                "$lt": bounds.northEast[0]
              }
              , 'listingType': {$in : listingtype}
              , 'price' : { $gt :  lowEnd, $lt : highEnd}
            }

        if (verified === true) {
          query.verifyRequested = true;
        }

        var listingList = Listings.find(query).fetch();
        markers.clearLayers();

        listingList.forEach(function(listings) {
          var popOptions = {'minWidth': '100','className' : 'custom'};
          var popupContents = '<a href="listing/' + listings._id + '"><!--<img src="' + listings.photourl + '" class="img-responsive" style="width:100%;"/>--><div class="details"><h3 class="listing-title">' + listings.title + '</h3></div></a>';

          var marker = L.marker([listings.lat, listings.lng], {_id:listings._id}).bindPopup(popupContents,popOptions).addTo(markers)
            .on('click', function(event) {
          });
        });
    });

    //get map center
    center = map.getCenter();
    //move to map center
    map.panTo(center);

	};


	//COLLECTION HELPERS
	//********************************************************************************************************

	Listings.helpers({
	  'photourl': function() {
	    return Images.findOne(this.photo);
	  },
    'favorited': function() {
      return Favorites.findOne({listingId: this._id, userId: Meteor.userId()});
    }
	});

	Photos.helpers({
	  'photosurl': function() {
	    return Images.findOne(this.photo);
	  }
	});

  Favorites.helpers({
    'listing': function() {
      return Listings.findOne(this.listingId);
    }
  });

	Contacts.helpers({
	  'listing': function() {
	    return Listings.findOne(this.listingId);
	  },
	  'contactor': function() {
	    return Meteor.users.findOne({_id: this.userId});
	  },
	  'contactTo': function() {
	    return Meteor.users.findOne({_id: this.userIdTo});
	  }
	});



	//TEMPLATE RENDERED
	//********************************************************************************************************

	Template.listing.rendered = function() {
      $('.popup-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          preload: [0,1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
          tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
          titleSrc: function(item) {
            return item.el.attr('title');
          }
        }
      });

	};

	Template.home.rendered = function() {
		//find the selected listing type from the session variable and set it to that
		var aTypeSelected = Session.get("listingtype");
		var sTypeSelected = aTypeSelected.join(" ");
		$("#listingtype").val(sTypeSelected);

		var bVerified = Session.get("verified");
		$("#verified").attr('checked', bVerified);

		localslider = Session.get("slider");
		$('#slider-low').html("$" + Math.round(localslider[0]));
	    $('#slider-high').html("$" + Math.round(localslider[1]));

		//set up the price slider. 
		//TODO set the max amount from the max listing price dynamically.
		this.$("#slider").noUiSlider({
	      start: Session.get("slider"),
	      connect: true,
	      range: {
	        'min': 0,
	        'max': 4000
	      }
	    }).on('slide', function (ev, val) {
	      // set real values on 'slide' event
	      Session.setPersistent('slider', val);
	      $('#slider-low').html("$" + Math.round(val[0]));
	      $('#slider-high').html("$" + Math.round(val[1]));
	    }).on('change', function (ev, val) {
	      // round off values on 'change' event
	      Session.setPersistent('slider', [Math.round(val[0]), Math.round(val[1])]);
	      $('#slider-low').html("$" + Math.round(val[0]));
	      $('#slider-high').html("$" + Math.round(val[1]));
	    });

	};


	//TEMPLATE EVENTS
	//********************************************************************************************************

	Template.listing.events({
		'click #comment': function(){
		    Modal.show('commentModal');
		    Session.set("listingid", this._id);
		},
		'click #contactreply': function(event, template){
		    Modal.show('contactReply');
		    Session.set("contactid", this._id);
		    Session.set("contactorid", this.userId);
		},
    'click #faveme': function(event, template){
        event.preventDefault();
        Meteor.call( 'faveMe', this._id, Meteor.userId() );
    }
	});


	Template.update.events({
		'click #uploadimages': function(){
		    Modal.show('fileUploader');
		    Session.set("listingid", this._id);
		}
	});

  Template.mylistings.events({
    'click #delete': function(){
        Modal.show('deleteConfirm');
        Session.set("listingid", this._id);
    }
  });


  Template.commentModal.events({
    'click #sendverifyemail': function(){
        Meteor.call('sendVerificationEmail');
        Modal.hide('commentModal');
        toastr.success("Verification sent.");
    }
  });

	Template.main.events({
		'click #sendverifyemail': function(){
		    Meteor.call('sendVerificationEmail');
		    toastr.success("Verification sent.");
		},
    'click #pay': function(e) {
      e.preventDefault();
      Session.set("listingid", this._id);

      StripeCheckout.open({
        key: Meteor.settings.public.stripe.testPublishableKey,
        amount: 800, // this is equivalent to $8
        name: 'Activate Listing',
       //email: '', //TODO - default this to the users email
        description: '$8/month until cancelled',
        panelLabel: 'Subscribe',
        token: function(res) {
          stripeToken = res;
          listingId = Session.get("listingid");
          Meteor.call('chargeCard', stripeToken, listingId);
        }
      });
    }
	});

  Template.deleteConfirm.events({
    'click #deleteit': function(e){
        e.preventDefault();

        listingId = Session.get("listingid");
        Meteor.call('deleteListing', listingId);
        Modal.hide('deleteConfirm');
        toastr.success("Listing deleted.");
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
  	"change #listingtype": function(evt) {
  		var newValue = $(evt.target).val();
  		//convert to an array
  		var newArray = newValue.split(" ");
  		//store in the session variable so we can check when the template renders
  		Session.setPersistent("listingtype", newArray);
  	 },
  	"change #verified": function(evt) {
  		var setValue = $(evt.target).is(':checked');
  		//store in the session variable so we can check when the template renders
  		Session.setPersistent("verified", setValue);
  	 },
    'click #togglefilters': function(){
      //nothing yet, but may want to change the text to say show/hide depending upon state
    }

  	});


	//TEMPLATE HELPERS
	//********************************************************************************************************


	Template.listing.helpers({
   	'contacts': function(){
        return Contacts.find({'listingId': this._id,'userId': {$ne: Meteor.userId()}}, {sort: {createdAt: -1}});
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
    },
    'responses': function(){
        return Contacts.find({'userIdTo': Meteor.userId(),'listingId': this._id}, {sort: {createdAt: -1}});
    },
    'photos': function() {
    	return Photos.find({'listingId': this._id});
  	}
	});

	Template.mylistings.helpers({
    'results': function(){
        return Listings.find({'userId._id': Meteor.userId()}, {sort: {createdAt: -1}});
    },
    'contacts': function(){
        return Contacts.find({'listing.userId': Meteor.userId()}, {sort: {createdAt: -1}});
    },
    'isVerified': function() {
		userId = Meteor.userId();
		var user = Meteor.users.findOne({_id: userId, 'emails.0.verified': false});
   		if (user) {
		    return false;
		  }
		  return true;
	}
	});

  Template.admin.helpers({
    'results': function(){
        return Listings.find({}, {sort: {createdAt: -1}});
    },
    'contacts': function(){
        return Contacts.find({}, {sort: {createdAt: -1}});
    },
    'users': function(){
        return Meteor.Users.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.favorites.helpers({
    'results': function(){
        return Favorites.find({'userId': Meteor.userId()}, {sort: {createdAt: -1}});
    }
  });

  Template.new.helpers({
    'listings': function(){
        return Listings.find({'userId': Meteor.userId()}, {sort: {createdAt: -1}});
    }
  });

	Template.mymessages.helpers({
    'sentmessages': function(){
        return Contacts.find({'userId': Meteor.userId()}, {sort: {createdAt: -1}});
    },
    'receivedmessages': function(){
        return Contacts.find({'userIdTo': Meteor.userId()}, {sort: {createdAt: -1}});
    }
	});

	Template.fileUploader.helpers({
    'maxImages': function(){
        imageCount = Photos.find({'listingId': Session.get("listingid")}).count();
        if (imageCount > 9) {
        	return true;
        }else{
        	return false;
        }
    },
    'listingid': function() {
        return Session.get("listingid");
    },
    'photos': function() {
    	return Photos.find({'listingId': Session.get("listingid")});
  	}
	});

	Template.home.helpers({
	 results: function(){
		bounds = Session.get("mapBounds");

		listingtype = Session.get("listingtype");
		verified = Session.get("verified");

		localslider = Session.get("slider");
		lowEnd = Math.round(localslider[0]);
	  highEnd = Math.round(localslider[1]);

		//build the query dynamically so we can use conditionals to append criteria or not
		var query = {"lng" : {
				        "$gt" : bounds.southWest[1],
				        "$lt":  bounds.northEast[1]  
				      },
				      "lat": {
				        "$gt" : bounds.southWest[0],
				        "$lt": bounds.northEast[0]
				      }
			        , 'listingType': {$in : listingtype}
			        , 'price' : { $gt :  lowEnd, $lt : highEnd}
		    		}

				if (verified === true) {
					query.verifyRequested = true;
				}

      //console.log(query);
		  return Listings.find(query, {sort: {createdAt: -1}});

	    },
	    'isOwner': function(thisUserId) {
	    	//move to helpers.js?
	    	if (thisUserId && (thisUserId._id === Meteor.userId())) {
	    		return true
	    	}else{
	    		return false
	    	}
		},
		'highestListing': function() {
			//TODO - make this work and pass the value to the high end of the price slider
	    	//var getHighest = Listings.findOne({}, {sort: {'price': -1}},{ fields: { 'price': 1 } });
	    	//console.log(getHighest.price);
		}
	});


	Template.contactReply.helpers({
	    contactid: function() {
	        return Session.get("contactid");
	    },
	    contactorid: function() {
	        return Session.get("contactorid");
	    },
	    'contacts': function(){
        return Meteor.users.findOne(Session.get("contactorid"));
    	},
    	'listingid': function() {
	        return Session.get("listingid");
	    },
	    'isVerified': function() {
  		userId = Meteor.userId();
  		var user = Meteor.users.findOne({_id: userId, 'emails.0.verified': false});
     		if (user) {
  		    return false;
  		  }
  		  return true;
  		}
	});

	Template.commentModal.helpers({
	    listingid: function() {
	        return Session.get("listingid");
	    },
	    'isVerified': function() {
		userId = Meteor.userId();
		var user = Meteor.users.findOne({_id: userId, 'emails.0.verified': false});
   		if (user) {
		    return false;
		  }
		  return true;
		}
	});

	//REMOVE for prod
	Template.clear.helpers({
	'clear': function(){
        Meteor.call('deleteAll');
    }
	});


	//COLLECTION ACTIONS
	//********************************************************************************************************

	Contacts.after.insert(function (userId, doc) {
		if (doc._id !== undefined) {
		 	toastr.success("Comment sent.");
		 	Modal.hide('commentModal');
		}
	});

	Listings.after.insert(function (userId, doc) {
		if (doc._id !== undefined) {
			toastr.success("Listing added.");
			Router.go('listing', {_id: doc._id});
		}
	});

	Listings.after.update(function (userId, doc) {
		Router.go('listing', {_id: doc._id});
		toastr.success("Listing updated.");
	});

	Contacts.before.insert(function (userId, doc) {
    //make sure there is some text first.
    if (doc.comment){
  		//send an email to alert contacted of new message.
  	   if (doc.userIdTo) {
  	   		//get the "to" user id from the form since it's a reply
  	   		toUserId = doc.userIdTo;
  	   	}else{
  	   		//get the "to" from the listing since this isn't a reply
  	   		listingid = doc.listingId;
  	   		userfromlisting = Listings.findOne({_id: listingid},{ fields: { 'userId': 1 } });
  	   		toUserId = userfromlisting.userId._id;
  	   }
  	   
  		  doc.userIdTo = toUserId;

  			message = "You have received a message on a listing."
  					+ "\r\n\r\nMessage: " + doc.comment
  					+  "\r\n\r\nReply here: " + Meteor.settings.public.general.base_url + "/listing/" + doc.listingId; 

  		  Meteor.call('sendEmailWithUserid',
  		            toUserId,
  		            'matt@clineranch.net',
  		            'New message alert from no 209',
  		            message);
    }
	});


	//account signup configuration
	Accounts.ui.config({
	    requestPermissions: {},
	    extraSignupFields: [{
	        fieldName: 'firstname',
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
	        fieldName: 'lastname',
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

	Meteor.publish("photos", function(){ return Photos.find(); });
	Meteor.publish("images", function(){ return Images.find(); });
	Meteor.publish("listings", function(){ return Listings.find(); });

  Meteor.publish("favorites", function(){ return Favorites.find(); });
  Meteor.publish("contacts", function(){ return Contacts.find(); });

	Meteor.publish("userData", function () { 
    //TODO - insecure to publish emails to client.  Stop doing it!
		return Meteor.users.find({}, { fields: { profile: 1 } }); 
	});

	Meteor.publish("roles", function (){ 
    return Meteor.roles.find({})
  })


  ///http://stackoverflow.com/questions/31035175/wrapping-stripe-create-customer-callbacks-in-fibers-in-meteor
  var Future = Npm.require('fibers/future');

  var Stripe = StripeAPI(Meteor.settings.private.stripe.testSecretKey);

  function createCustomer(token){
    var future = new Future;
    //console.log(token);

    Stripe.customers.create({
      source: token.id,
      email: token.email,
      plan: '209-8-Monthly',
      description: token.email
    }, function(error, result){
      if (error){
        future.return(error);
      } else {
        future.return(result);
      }
    });
    return future.wait();
  }

  function deleteCustomer(customerId){
    console.log(customerId);
    var future = new Future;
    Stripe.customers.del(customerId, function(error, result){
      if (error){
        future.return(error);
      } else {
        future.return(result);
      }
    });
    return future.wait();
  }


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
			Photos.remove({});
			Meteor.users.remove({});
		},
    sendEmailWithUserid: function (toUserId, from, subject, text) {
      check([toUserId, from, subject, text], [String]);

      //don't wait for the email send to complete
      this.unblock();

      var to = Meteor.users.findOne({'_id': toUserId},{ fields: { 'emails': 1 } });
      to = to.emails[0].address;

      Email.send({
        to: to,
        from: from,
        subject: subject,
        text: text
      });
    },
		sendEmail: function (to, from, subject, text) {
			check([to, from, subject, text], [String]);

			//don't wait for the email send to complete
			this.unblock();

			Email.send({
			  to: to,
			  from: from,
			  subject: subject,
			  text: text
			});
		},
		'sendVerificationEmail': function () {
			var userId = this.userId;
			if (!userId)
			  throw new Meteor.Error(402, 'no user login');

			var user = Meteor.users.findOne({_id: userId, 'emails.0.verified': false});
			if (user)
			  Accounts.sendVerificationEmail(userId, user.emails[0].address);
		},
    'getEmail': function (userId) {
        console.log(userId);
        var toEmail = Meteor.users.findOne({'_id': userId},{ fields: { 'emails': 1 } });
        toEmail = toEmail.emails[0].address;
        console.log(toEmail);
        return toEmail;
    },
    faveMe: function (listingId, userId) {
      //get the fave
      var fave = Favorites.findOne({userId: userId, listingId: listingId});
      if (fave) {
         //if exists, delete
         Favorites.remove(fave._id);
      }else{
        //else, then add
        Favorites.insert({
          listingId: listingId,
          userId: userId
        });
      }
    },
    'chargeCard': function(token, listingId){
      try {
        //console.log(token);
        //console.log(listingId);

        var customer = createCustomer(token);

        //console.log("customer" + customer.id);

        var customerid = customer.id;

        Listings.update({_id: listingId}, {$set: {stripeCustomerId:customerid}});

      } catch(error) {
        //console.log("error: " + error);

        message = "listingId:" + listingId + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.admin_email,
                'matt@clineranch.net',
                'Error message alert from no 209',
                message);
      }
    },
    'deleteListing': function(listingId){
      try {
        //grab the stripe customer ID from the listing
        customerId = Listings.findOne({'_id': listingId},{ fields: { 'stripeCustomerId': 1 } });
        customerIdOnly = customerId.stripeCustomerId;

        //delete the customer and related plans in stripe
        if (customerIdOnly) {
          var customerDel = deleteCustomer(customerIdOnly);
        }

        // //delete all the listing data and artifacts
        Listings.remove(listingId);
        Contacts.remove({listingId: listingId});
        //Images.remove({listingId: listingId});
        Photos.remove({listingId: listingId});
        Favorites.remove({listingId: listingId});

        console.log("listing deleted");

        //TODO - delete all associated images

      } catch(error) {
        message = "listingId:" + listingId + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.admin_email,
                'matt@clineranch.net',
                'Error message alert from no 209',
                message);
      }
    }

	});

	Listings.before.insert(function (userId, doc) {
    //TODO -check if outside of bounding box

	   var geo = new GeoCoder();
	   var result = geo.geocode(doc.address);

	   doc.lat = result[0].latitude;
	   doc.lng = result[0].longitude;

	   doc.coordinates[0].lon = result[0].longitude;
	   doc.coordinates[0].lat = result[0].latitude;

	   doc.userId = Meteor.user();

	   doc.createdAt = new Date();

	});

	Listings.before.update(function (userId, doc, fieldNames, modifier, options) {
     //TODO - restrict updates to listings to listing owner or admin.
     //if (doc.userId._id !== Meteor.user()._id && Roles.userIsInRole(Meteor.user(), ['admin'])){

      //console.log(Meteor.user()._id);
      //console.log(doc.userId._id);
      if ((doc.userId._id !== Meteor.user()._id) || (Roles.userIsInRole(Meteor.user(), ['admin']))){
        //did this so that we only run the geocoder if the address field is available in the fieldNames array
        if ( fieldNames.indexOf( "address" ) > -1 ) {

         //console.log("Updated lat and long")

         geo = new GeoCoder();
         result = geo.geocode(modifier.$set.address);

         modifier.$set.lat = result[0].latitude;
         modifier.$set.lng = result[0].longitude;

         modifier.$set.coordinates[0].lon = result[0].longitude;
         modifier.$set.coordinates[0].lat = result[0].latitude;

       }
     }

	});

	Contacts.before.insert(function (userId, doc) {
	   doc.userId = userId;
	   doc.createdAt = new Date();
	});

  Contacts.before.remove(function (userId, doc) {
     if (doc.userId._id !== Meteor.user()._id && Roles.userIsInRole(Meteor.user(), ['admin'])){
        return false;
     }
  });

	Meteor.startup(function () {
	  //set in config.js
	  process.env.MAIL_URL = Meteor.settings.private.general.mail_url;  
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

  //PERMISSIONS
  //********************************************************************************************************
  //help here: https://github.com/ongoworks/meteor-security

  Photos.permit(['insert', ,'update', 'remove']).ifLoggedIn().apply();

  Images.files.permit(['insert', 'update']).ifHasRole('admin').apply();
  Images.files.permit(['insert','remove']).ifLoggedIn().apply();
 
  Meteor.users.permit(['insert']).apply();
  Meteor.users.permit(['update']).ifLoggedIn().apply();
  Meteor.users.permit(['insert', 'update', 'remove']).ifHasRole('admin').apply();

  Contacts.permit(['insert']).ifLoggedIn().apply();
  Contacts.permit(['insert', ,'update', 'remove']).ifHasRole('admin').apply();

  Photos.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();
  Photos.permit(['insert', ,'update', 'remove']).ifHasRole('admin').apply();

  Favorites.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();

  Listings.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();
  Listings.permit(['insert', ,'update', 'remove']).ifHasRole('admin').apply();
  //Listings.permit('update').ifLoggedIn().exceptProps(['verified', 'approved']).apply();

  Meteor.users.deny({
    update: function() {
      return true;
    }
  });

  Images.allow({
    download: function () {
      return true;
    },
    fetch: null
  });


  Meteor.startup(function() {
    //make sure admin user is in admin role
    Roles.addUsersToRoles('dbY6PWkLrhzP2kwv2', ['admin']);
    Roles.addUsersToRoles('T7WG2WpkKcZdNgatb', ['admin']);
  });
  

}


