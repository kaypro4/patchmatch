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
    return [ Meteor.subscribe("roles"), Meteor.subscribe("contacts") ];
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
