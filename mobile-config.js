// basic info
App.info({
  name: 'no209',
  description: 'no209 Listings',
  author: 'Matt Pope',
  email: 'matt@clineranch.net',
  website: 'http://www.clineranch.net'
});

// CORS for Meteor app
App.accessRule('meteor.local/*');
// allow tiles
App.accessRule('*.openstreetmap.org/*');
App.accessRule('*.tile.thunderforest.com/*');
App.accessRule('*api.tiles.mapbox.com/*');
App.accessRule('*.muscache.com');
App.accessRule('*.googleapis.com');
App.accessRule('*.gstatic.com');