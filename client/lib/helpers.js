if (Meteor.isClient) { 

	Template.registerHelper('formatDate', function(date) {
	  return moment(date).format('MM-DD-YYYY');
	});

	Template.registerHelper('breaklines', function(text) {
		//this is terrible...but it was causing an error but seemed to be working.  So just ignoring the error for now.
		try{
			newtext = text.replace(/(?:\r\n|\r|\n)/g, '<br />');
		    return new Handlebars.SafeString(newtext);
		}catch(e){
		}
	});
	
}