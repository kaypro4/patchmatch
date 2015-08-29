SimpleSchema.debug = true;

Meteor.subscribe('images');
Meteor.subscribe("photos");
Meteor.subscribe("listings");
Meteor.subscribe("userData");

Meteor.startup(function() {
  toastr.options.positionClass = "toast-bottom-right";
  //default the map center and bounds, then track them in local storage as the map moves.
  Session.setDefaultPersistent("mapCenter", [37.7833, -122.4167]);
  Session.setDefaultPersistent("mapZoom", 11);
  //todo - make this real based on actual map bounds
  boundObject = { 
        southWest: [37.74995081712854, -122.46580123901367],
        northEast: [37.78618210598413, -122.36812591552733] 
	}
  Session.setDefaultPersistent("mapBounds", boundObject);
  Session.setDefaultPersistent("listingtype", ["spot","house"]);
  Session.setDefaultPersistent("verified", false);
  Session.setDefaultPersistent("showFilters", true);

 // slider starts at 20 and 80
	Session.setDefaultPersistent("slider", [500, 2000]);


});


function isLatinBounds(inLat){
    var minLat = 36.241;
    var maxLat = 39.2633;
    if ((inLat > minLat) && (inLat < maxLat)) {
        return true;
    }else{
        return false;
    }
}

function isLonginBounds(inLong){
    var minLong = -120.5899;
    var maxLong = -123.6682;
    if ((inLong < minLong) && (inLong > maxLong)) {
        return true;
    }else{
        return false;
    }
}

Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

  var southWest = L.latLng(36.241, -123.6682),
      northEast = L.latLng(39.2633, -120.5899),
  maxBounds = L.latLngBounds(southWest, northEast);

  zoom = Session.get("mapZoom");
  center = Session.get("mapCenter");

  map = L.map('map', {
    doubleClickZoom: true,
    maxBounds: maxBounds,
    maxZoom: 15,
    minZoom: 9,
    worldCopyJump: true,
    closePopupOnClick: false
  }).setView(center, zoom);

  L.tileLayer.provider('MapBox', {id: 'i8flan.jo1h0k21', accessToken: Meteor.settings.public.general.map_box_key}).addTo(map);

  map.on('moveend', function() { 

     center = map.getCenter();
     Session.setPersistent("mapCenter", center);

     zoom = map.getZoom();
     Session.setPersistent("mapZoom", zoom);

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
            , 'stripeCustomerId' : { $exists: true }
          }

      if (verified === true) {
        query.verified = true;
      }

      //only show listings that have been approved by an admin
      query.approved = true;

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

Template.main.rendered = function() {
  $('.nav.navbar-left a').on('click', function(){
    $(".navbar-toggle").click() 
  });
};

Template.home.rendered = function() {
	//find the selected listing type from the session variable and set it to that
	var aTypeSelected = Session.get("listingtype");
	var sTypeSelected = aTypeSelected.join(" ");
	$("#listingtype").val(sTypeSelected);

  var bShowFilters = Session.get("showFilters");

  if (bShowFilters == true) {
    $('#filters').collapse('show');
  }else{
    $('#filters').collapse('hide');
  }

  $('#filters').on('hidden.bs.collapse', function () {
    Session.set("showFilters",false);
  })
  $('#filters').on('shown.bs.collapse', function () {
    Session.set("showFilters",true);
  })

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
  },
  'click #uploadimages': function(){
      Modal.show('fileUploader');
      Session.set("listingid", this._id);
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

Template.fileUploader.events({
  'click #delete': function(){
      event.preventDefault();
      Meteor.call( 'deletePhoto', this._id, this.listingId );
  }
});

Template.admin.events({
  'click #deletelisting': function(){
      Modal.show('deleteConfirm');
      Session.set("listingid", this._id);
  },
  'click #deletecontact': function(){
      Modal.show('deleteConfirmContact');
      Session.set("contactid", this._id);
  },
  'click #deleteuser': function(){
      Modal.show('deleteConfirmUser');
      Session.set("userid", this._id);
  }
});

Template.mymessages.events({
  'click #deletecontact': function(){
      Modal.show('deleteConfirmContact');
      Session.set("contactid", this._id);
  }
});

Template.commentModal.events({
  'click #sendverifyemail': function(){
      Meteor.call('sendVerificationEmail');
      Modal.hide('commentModal');
      toastr.success("Verification sent.");
  }
});

Template.about.events({
  'click #openterms': function(){
      Modal.show('termsModal');
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

  Template.deleteConfirmContact.events({
  'click #deleteit': function(e){
      e.preventDefault();

      contactid = Session.get("contactid");
      Meteor.call('deleteContact', contactid);
      Modal.hide('deleteConfirmContact');
      toastr.success("Contact deleted.");
  }
});

Template.deleteConfirmUser.events({
  'click #deleteit': function(e){
      e.preventDefault();

      userid = Session.get("userid");
      Meteor.call('deleteUser', userid);
      Modal.hide('deleteConfirmUser');
      toastr.success("User deleted.");
  }
});



Template.home.events({
  "submit .locate-search": function (event) {
    event.preventDefault();
    var text = event.target.text.value;

  Meteor.call('getGeocodedResults',text,function(err, response) {
	
  console.log(response);

  if ((isLonginBounds(response[0].longitude)) && (isLatinBounds(response[0].latitude))) { 
    lat = response[0].latitude;
    lng = response[0].longitude;
    map.panTo(new L.LatLng(lat, lng));
  }else{
    //alert("Sorry, we're only in the bay area right now.");
    Modal.show('outOfBoundsModal');
  }



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
      return Contacts.find({'listingId': this._id,'userId': {$ne: Meteor.userId()}}, {sort: {createdAt: -1}, limit: 5});
  },
  'isOwner': function(thisUserId) {
  	if (thisUserId && (thisUserId._id === Meteor.userId())) {
  		return true
  	}else{
  		return false
  	}
   },
  'contacted': function(){
      return Contacts.find({'userId': Meteor.userId(),'listingId': this._id}, {sort: {createdAt: -1}, limit: 5});
  },
  'responses': function(){
      return Contacts.find({'userIdTo': Meteor.userId(),'listingId': this._id}, {sort: {createdAt: -1}});
  },
  'photos': function() {
  	return Photos.find({'listingId': this._id});
	},
  'showToNonOwner': function(thisUserId,approved,stripeCustomerId) {
    if ((thisUserId && (thisUserId._id === Meteor.userId())) || (Roles.userIsInRole(Meteor.user(), ['admin']))) {
      //owner or admin
      return true;
    }else{
      //non-owner
      if (approved === true && stripeCustomerId) {
        //but approved
        return true;
      }else{
        //not approved, so hide
        return false;
      }
    }
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
      return Meteor.users.find();
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
            , 'stripeCustomerId' : { $exists: true }
	    		}

			if (verified === true) {
				query.verified = true;
			}

      //only show listings that have been approved by an admin
      query.approved = true;

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


//not sure if this does anything.....
AutoForm.hooks({
  insertForm: {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
       NProgress.start();
    }
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
  NProgress.done();
});

Listings.before.insert(function (userId, doc) {
  NProgress.start();
});

Listings.before.update(function (userId, doc) {
  NProgress.start();
});

Listings.after.update(function (userId, doc) {
	Router.go('listing', {_id: doc._id});
  NProgress.done();
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
		            'matt@tinyacre.com',
		            'New message alert from Tiny Acre',
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
        fieldLabel: 'I accept the <a href="/about" id="openterms">terms and conditions</a>',
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
	