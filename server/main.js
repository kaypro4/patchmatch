  Meteor.publish("photos", function(){ return Photos.find(); });
	Meteor.publish("images", function(){ return Images.find(); });
	Meteor.publish("listings", function(){ return Listings.find(); });

  Meteor.publish("favorites", function(){ 
    var currentUserId = this.userId;
    if (this.userId) {
      return Favorites.find({userId:currentUserId}); 
    }
  });

  Meteor.publish("contacts", function(){ 
    var currentUserId = this.userId;
    if (this.userId) {
      //if admin, publish all the contacts
      if (Roles.userIsInRole(this.userId, ['admin'])) {
        return Contacts.find(); 
      }else{
        //otherwise, show just the contacts related to this user
        return Contacts.find({
          $or: [
            { userId: this.userId },
            { userIdTo: this.userId }
          ]
        });
      }
    }
  });

	Meteor.publish("userData", function () { 
    //only publish other profile information if an admin is logged in.
    if (Roles.userIsInRole(this.userId, ['admin'])) {
	    return Meteor.users.find({}, { fields: { profile: 1 } }); 
    }
	});

	Meteor.publish("roles", function (){
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.roles.find({})
    }
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
      if (Roles.userIsInRole(Meteor.user(), ['admin'])){
  			Listings.remove({});
  			Contacts.remove({});
  			Images.remove({});
  			Photos.remove({});
  			//Meteor.users.remove({});
      }
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

         message = "Stripe payment activated: " + Meteor.user()._id + "\r\n\r\nView here: " + Meteor.settings.public.general.base_url + "/listing/" + listingId;

         Meteor.call('sendEmail',
                Meteor.settings.public.general.admin_email,
                'matt@tinyacre.com',
                'Admin alert from Tiny Acre: Payment Activated',
                message);

      } catch(error) {
        //console.log("error: " + error);

        message = "Stripe customer create attempted by: " + Meteor.user()._id + "\r\n\r\nlistingId:" + listingId + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.general.admin_email,
                'matt@tinyacre.com',
                'Error message alert from Tiny Acre',
                message);
      }
    },
    'deleteListing': function(listingId){
      try {
        //grab the stripe customer ID from the listing
        ownerData = Listings.findOne({'_id': listingId},{ fields: { 'stripeCustomerId': 1,'userId': 1 } });
        customerIdOnly = ownerData.stripeCustomerId;
        userIdOnly = ownerData.userId;

         if ((userIdOnly._id === Meteor.user()._id) || (Roles.userIsInRole(Meteor.user(), ['admin']))){

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

          message = "Listing deleted by: " + Meteor.user()._id + "\r\n\r\nListing: " + listingId;

          Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Admin alert from Tiny Acre: Listing Deleted',
              message);
        }



      } catch(error) {
        message = "Listing delete attempted by: " + Meteor.user()._id + "\r\n\r\nlistingId:" + listingId + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.general.admin_email,
                'matt@tinyacre.com',
                'Error message alert from Tiny Acre',
                message);
      }
    },
    'deletePhoto': function(photoId, listingId){
      try {
        //grab the stripe customer ID from the listing
        ownerData = Listings.findOne({'_id': listingId},{ fields: { 'userId': 1 } });
        userIdOnly = ownerData.userId;

         if ((userIdOnly._id === Meteor.user()._id) || (Roles.userIsInRole(Meteor.user(), ['admin']))){

          Photos.remove(photoId);

          console.log("photo deleted");

          message = "Photo deleted by: " + Meteor.user()._id + "\r\n\r\nListing: " + listingId;

          Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Admin alert from Tiny Acre: Photo Deleted',
              message);
        }



      } catch(error) {
        message = "Photo delete attempted by: " + Meteor.user()._id + "\r\n\r\nlistingId:" + listingId + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.general.admin_email,
                'matt@tinyacre.com',
                'Error message alert from Tiny Acre',
                message);
      }
    },
    'deleteContact': function(contactid){
      try {
        //grab the userid from the contact
        contactData = Contacts.findOne({'_id': contactid},{ fields: { 'userId': 1, 'userIdTo': 1 } });
        userIdTo = contactData.userIdTo;
        userIdFrom = contactData.userId;

         if ((userIdFrom === Meteor.user()._id) || (Roles.userIsInRole(Meteor.user(), ['admin']))){

          Contacts.remove(contactid);

          message = "Contact deleted by: " + Meteor.user()._id + "\r\n\r\nContact: " + contactid;

          Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Admin alert from Tiny Acre: Contact Deleted',
              message);
        }



      } catch(error) {
        message = "Comment delete attempted by: " + Meteor.user()._id + "\r\n\r\ncontactid:" + contactid + "\r\n\r\nError:" + error;

        Meteor.call('sendEmail',
                Meteor.settings.public.general.admin_email,
                'matt@tinyacre.com',
                'Error message alert from Tiny Acre',
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

     message = "Listing added: " + Meteor.user()._id + "\r\n\r\nView here: " + Meteor.settings.public.general.base_url + "/listing/" + doc._id;

     Meteor.call('sendEmail',
            Meteor.settings.public.general.admin_email,
            'matt@tinyacre.com',
            'Admin alert from Tiny Acre: New Listing',
            message);

	});

	Listings.before.update(function (userId, doc, fieldNames, modifier, options) {
     //TODO - restrict updates to listings to listing owner or admin.
     //if (doc.userId._id !== Meteor.user()._id && Roles.userIsInRole(Meteor.user(), ['admin'])){

      if (Roles.userIsInRole(Meteor.user(), ['admin'])){
        if ( fieldNames.indexOf( "approved" ) > -1 ) {
          if (doc.approved === false && modifier.$set.approved === true) {

            message = "Your listing is approved! Next step is to activate it by entering your payment details. \r\n\r\nHead over here and take care of it: " + Meteor.settings.public.general.base_url + "/listing/" + doc._id;

            //Send a message to the listing owner.
            listingid = doc._id;
            userfromlisting = Listings.findOne({_id: listingid},{ fields: { 'userId': 1 } });
            toUserId = userfromlisting.userId._id;

            Meteor.call('sendEmailWithUserid',
                  toUserId,
                  'matt@tinyacre.com',
                  'Your Tiny Acre listing is approved!',
                  message);
          }
        }
      }


      if ((doc.userId._id === Meteor.user()._id) || (Roles.userIsInRole(Meteor.user(), ['admin']))){
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

        message = "Listing updated by: " + Meteor.user()._id + "\r\n\r\nView here: " + Meteor.settings.public.general.base_url + "/listing/" + doc._id;

        Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Admin alert from Tiny Acre: Updated Listing',
              message);

     }else{
      console.log("Update not allowed by this user.");
      message = "Listing update attempted but user not allowed: " + Meteor.user()._id + "\r\n\r\nlistingId:" + doc._id;

      Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Error message alert from Tiny Acre',
              message);

      return false;
     }

	});

  Listings.before.remove(function (userId, doc) {
    //make sure they own the listing or are in the admin role
    if ((doc.userId._id !== Meteor.user()._id) && (!Roles.userIsInRole(Meteor.user(), ['admin']))){
      console.log("Delete not allowed by this user.");
      message = "Listing delete attempted but user not allowed: " + Meteor.user()._id + "\r\n\r\nlistingId:" + doc._id;

      Meteor.call('sendEmail',
              Meteor.settings.public.general.admin_email,
              'matt@tinyacre.com',
              'Error message alert from Tiny Acre',
              message);
      return false;
    }
  });

	Contacts.before.insert(function (userId, doc) {
	   doc.userId = userId;
	   doc.createdAt = new Date();

     message = "Contact added: " + Meteor.user()._id + "\r\n\r\nlistingId:" + doc.listingId + "\r\n\r\nComment:" + doc.comment;

     Meteor.call('sendEmail',
            Meteor.settings.public.general.admin_email,
            'matt@tinyacre.com',
            'Admin alert from Tiny Acre: New Contact',
            message);
	});

  Photos.after.insert(function (userId, doc) {
    
     message = "Photo added by: " + Meteor.user()._id + "\r\n\r\nView here: " + Meteor.settings.public.general.base_url + "/listing/" + doc.listingId + "\r\n\r\nTitle:" + doc.title;

     Meteor.call('sendEmail',
            Meteor.settings.public.general.admin_email,
            'matt@tinyacre.com',
            'Admin alert from Tiny Acre: New Photo',
            message);
  });

  Contacts.before.remove(function (userId, doc) {
     if (doc.userId !== Meteor.user()._id && doc.userIdTo !== Meteor.user()._id && !Roles.userIsInRole(Meteor.user(), ['admin'])){
        return false;
     }else{
        console.log("contact deleted");
     }
  });

	Meteor.startup(function () {
	  //set in config.js
	  process.env.MAIL_URL = Meteor.settings.private.general.mail_url;  
	  Accounts.emailTemplates.from = 'Tiny Acre <matt@tinyacre.com>';
	  Accounts.emailTemplates.siteName = 'Tiny Acre';
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

  Photos.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();

  Images.files.permit(['insert', 'update']).ifHasRole('admin').apply();
  Images.files.permit(['insert','remove']).ifLoggedIn().apply();
 
  Meteor.users.permit(['insert']).apply();
  Meteor.users.permit(['update']).ifLoggedIn().apply();
  Meteor.users.permit(['insert', 'update', 'remove']).ifHasRole('admin').apply();

  Contacts.permit(['insert', 'remove']).ifLoggedIn().apply();
  Contacts.permit(['insert','update', 'remove']).ifHasRole('admin').apply();

  Photos.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();
  Photos.permit(['insert', 'update', 'remove']).ifHasRole('admin').apply();

  Favorites.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();

  Listings.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();
  Listings.permit(['insert', 'update', 'remove']).ifHasRole('admin').apply();
  Listings.permit('update').ifLoggedIn().exceptProps(['verified', 'approved', 'verifiedComments']).apply();

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