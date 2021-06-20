	/**********************************************************************
	*  Author: Balinder WALIA (bwalia@tenthmatrix.co.uk)
	*  Project Lead: Balinder WALIA (bwalia@tenthmatrix.co.uk)
	*  Project Lead Web...: https://twitter.com/balinderwalia
	*  Name..: Workstation CRM and Business Management Solutions
	*  Desc..: Workstation (part of Tenthmatrix Ltd)
	*  Web: http://workstation.co.uk
	*  License: http://workstation.co.uk/LICENSE.txt
	**/

	/**********************************************************************
	*  create_indexes.js handles the whole app
	**/
	
'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init');
var initFunctions = require('./config/functions');	

//db connection
var db;
init.MongoClient.connect(init.mongoConnUrl, function (err, database) {
	db=database;
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err);
  	} else {
   		console.log('Connection established to', init.mongoConnUrl);
   		
   		// compound index on session's table
   		db.collection('session').createIndex(  { "user_id": 1, "status" : 1, "allow_web_access" : 1 } );
   		
   		// index on users's table
   		db.collection('users').createIndex(  { "access_right": 1, "status" : 1 } );
   		db.collection('users').createIndex(  { "email": 1 } );
   		db.collection('users').createIndex(  { "username" : 1 } );
   		//db.collection('users').createIndex(  { "user_type" : 1 } );
   		db.collection('users').createIndex(  { "username": 1, "allow_web_access" : 1 } );
   		db.collection('users').createIndex(  { "players.user_mongo_id": 1, "status" : 1, "players.roles" : 1 } );
   		
   		// index on session's table
   		/**db.collection('availability').createIndex(  { "user_mongo_id": 1, "start_timestamp" : 1 } );
   		db.collection('availability').createIndex(  { "available": 1 } );
   		db.collection('availability').createIndex(  { "user_mongo_id": 1, "fixture_event_uuid" : 1 } );
   		
   		// compound index on teams's table
   		db.collection('teams').createIndex(  {"players.user_mongo_id": 1, "status": 1} );  		
   		*/
   		// index on notifications's table
   		db.collection('notifications').createIndex(  { "notify_to" : 1 } );
   		
   		// index on fixtures's table
   		db.collection('fixtures').createIndex(  { "uuid_system" : 1 } );
   	  	
   	  	db.collection('bookmarks').createIndex({"tags":"text"});
   	  	
   	  	db.collection('tokens').createIndex({ "$**": "text" },{ name: "TextIndex" });
   	  	db.collection('tokens').createIndex(  { "code": 1, "status" : 1 } );
   	  	
   	  	db.collection('templates').createIndex({ "$**": "text" },{ name: "TextIndex" });
   	  	db.collection('templates').createIndex(  { "code": 1, "uuid_system" : 1, "status" : 1 } );
   	  	
   	  	//documents table
   	  	db.collection('documents').createIndex(  { "Code": 1, "uuid_system" : 1 } );
   	  	db.collection('documents').createIndex({ "$**": "text" },{ name: "TextIndex" });
   	  	
   	  	db.collection('mailing_preferences').createIndex(  { "email_address": 1, "uuid_system" : 1, "uuid" : 1 } );
   	  	db.collection('system_lists').createIndex(  { "code": 1 } );
   	  	
   	  	db.collection('fs.files').createIndex(  { "metadata.uuid": 1 } );
   	  	
		db.collection('uk_towns_cities').ensureIndex({
    		loc : "2dsphere"
		});
		db.collection('uk_towns_cities').createIndex({"tags":"text"});

		db.collection('contacts').createIndex(  { "uuid_system" : 1 } );
		db.collection('contacts').createIndex(  { "created" : 1 } );
		db.collection('contacts').createIndex(  { "modified" : 1 } );
		
		db.collection('customers').createIndex(  { "created" : -1 } );
		db.collection('customers').createIndex(  { "modified" : -1 } );
		db.collection('customers').createIndex(  { "uuid_system" : 1 } );
//db.customers.createIndex( { name: "text", address_line_1: "text", comments: "text", city_or_town: "text" )
//db.customers.createIndex( { website: "text", contact_name: "text", contact_email: "text" )
		db.collection('invoices').createIndex(  { "uuid_system" : 1 } );
		db.collection('invoices').createIndex(  { "modified" : -1 } );
		
   	  	console.log('created indexes and now terminating this process');
   	  	
   	  	process.exit();	
  	}
});
