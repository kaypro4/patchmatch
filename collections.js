Images = new FS.Collection("images", {
  stores: [
  new FS.Store.FileSystem("tiles", {
        transformWrite: function(fileObj, readStream, writeStream) {
          //help here:  http://aheckmann.github.io/gm/docs.html
          // Transform the image into a 840x450px image
          gm(readStream, fileObj.name())
          .gravity('Center')
          .resize('840', '450', '^>')
          .crop('840', '450')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("thumbs", {
        transformWrite: function(fileObj, readStream, writeStream) {
          // Transform the image into a 100x100px thumbnail
          gm(readStream, fileObj.name())
          .gravity('Center')
          .resize('100', '100', '^>')
          .extent('100', '100')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("extras", {
        transformWrite: function(fileObj, readStream, writeStream) {
          // Transform the image into a max 800px image
          gm(readStream, fileObj.name())
          .resize('800', '800')
          .stream()
          .pipe(writeStream);
        }
      }),
  new FS.Store.FileSystem("images", {})

  ],
    filter: {
      maxSize: 3000000, // in bytes
      allow: {
        contentTypes: ['image/*'],
        extensions: ['png', 'jpg', 'jpeg', 'gif']
      },
      onInvalid: function (message) {
        if (Meteor.isClient) {
          alert(message);
        } else {
          console.log(message);
        }
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
    max: 60
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
    max: 40,
    optional: false
  },
  description: {
    type: String,
    label: "Description",
    max: 2000,
    optional: false
  },
  verifiedComments: {
    type: String,
    label: "Comments from the verifier",
    max: 2000,
    optional: true
  },
  photo: {
    type: String,
    label: "Primary Photo (3MB max size - landscape orientation is best)",
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
    max: 4000,
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
    label: "Indicates if the listing has been Tiny Acre verified",
    defaultValue: false
 },
approved: {
    type: Boolean,
    label: "Indicates if the listing has been approved to be published",
    defaultValue: false
 },
 verifyRequested: {
    type: Boolean,
    label: "Would you like this listing to be Tiny Acre Verified?",
    defaultValue: false
 },
 hasWater: {
    type: Boolean,
    label: "Drinking water available - inlude details below",
    defaultValue: false
 },
 hasPower: {
    type: Boolean,
    label: "Power is available - include details below",
    defaultValue: false
 },
 sqFeet: {
    type: Number,
	  decimal: false,
	  label: "Square Feet of the tiny house or parking spot available.",
    optional: false,
    min: 0
},
maxHeight: {
    type: Number,
	  decimal: true,
	  label: "Maximum height of a tiny house the space can accomodate.",
    optional: true,
    min: 0
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