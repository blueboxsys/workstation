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
	*  functions.js contain all the functions required for requests, which will be called in the main file
	**/

	var init = require('./init');
	var mongodb=init.mongodb;
	var nodemailer = require('nodemailer');
	var os = require('os');
	var path = require('path');

var self = module.exports =
{
  	/** returns the list as defined in system_templates table
  	parameters: db, templateStr(code unique value), activeSystemStr (system id), req(request parameters), cb(callback)
  	**/
  	templateSearch : function (db, templateStr, activeSystemsStr, req, cb){
     	var itemsPerPage = 100, pageNum=1, findFieldNameStr="", findFieldValueStr="";
		var outputObj = new Object();

		db.collection('system_templates').findOne({"code": templateStr , "status": { $in: [ 1, "1" ] } }, function(err, templateResponse) {
			if(err){
				outputObj["error"]   = "No such page exists!";
				cb(outputObj);
			}
			if(templateResponse){
				//console.log("In Fn templateSearch, templateResponse: true");

				if(req.query.findFieldName){
					findFieldNameStr=req.query.findFieldName;
				}
				if(req.query.findFieldValue){
					findFieldValueStr=req.query.findFieldValue;
				}
				if(req.query.start){
					pageNum=parseInt(req.query.start);
				}
				if(req.query.limit){
					itemsPerPage=parseInt(req.query.limit);
				}
				if(pageNum==0){
					pageNum=1;
				}

				var definedAdminTablesArr= init.adminTablesArr;

				var query="{";
				var fetchFieldsObj="{}", table_name= templateResponse.table ;

				outputObj["table"]   = table_name;

				if(definedAdminTablesArr.indexOf(table_name)==-1){
					if(table_name=="fs.files"){
						query+=" 'metadata.uuid_system': { $in: ['"+activeSystemsStr+"'] } ";
					}else{
						query+=" $or: [ { 'uuid_system' : { $in: ['"+activeSystemsStr+"'] } }, { 'shared_systems': { $in: ['"+activeSystemsStr+"'] } } ] ";
					}
				}

				if (typeof templateResponse.search_columns !== 'undefined' && templateResponse.search_columns !== null && templateResponse.search_columns !== "")	{
					outputObj["enable_search"]   = true;
				}
				if (typeof templateResponse.enable_editor !== 'undefined' && templateResponse.enable_editor !== null && typeof templateResponse.editor_filename !== 'undefined' && templateResponse.editor_filename !== null && templateResponse.enable_editor==1  && templateResponse.editor_filename!="") {
						outputObj["editor"]   = templateResponse.editor_filename;
				}
				if (typeof templateResponse.page_title !== 'undefined' && templateResponse.page_title !== null && typeof templateResponse.page_title !== 'undefined' && templateResponse.page_title!="") {
						outputObj["page_title"]   = templateResponse.page_title;
				}
				if(templateResponse.listing_columns){
					var listArr= templateResponse.listing_columns.split(',');
					if (typeof templateResponse.enable_editor !== 'undefined' && templateResponse.enable_editor !== null && typeof templateResponse.editor_field !== 'undefined' && templateResponse.editor_field !== null && templateResponse.enable_editor==1  && templateResponse.editor_field!="") {
						outputObj["uniqueField"]   = templateResponse.editor_field;
						listArr.push("Action");
					}
					outputObj["display_columns"]   = listArr;

					for(var l_count=0; l_count< listArr.length; l_count++){
						if(l_count==0){
							fetchFieldsObj="{";
							fetchFieldsObj+="'"+listArr[l_count]+"' : 1";
						}else{
							fetchFieldsObj+=", '"+listArr[l_count]+"' : 1";
						}
					}
					if (typeof templateResponse.enable_editor !== 'undefined' && templateResponse.enable_editor !== null && typeof templateResponse.editor_field !== 'undefined' && templateResponse.editor_field !== null && templateResponse.enable_editor==1  && templateResponse.editor_field!="") {
						fetchFieldsObj+=", '"+templateResponse.editor_field+"' : 1";
					}
					fetchFieldsObj+="}";
				}

				if(req.query.s){
					var searchStr = req.query.s;
					//console.log("In Fn templateSearch, searchStr: " + searchStr);

					if(templateResponse.search_columns){
						if(typeof(templateResponse.search_columns)==="array" || typeof(templateResponse.search_columns)==="object"){
							var searchColumnArr=templateResponse.search_columns;
						}else{
							var searchColumnArr=JSON.parse(templateResponse.search_columns);
						}
						if(searchColumnArr.length>=1){

							var subQueryStr="";
							for(var s_count=0; s_count< searchColumnArr.length; s_count++){
								var subObj=  searchColumnArr[s_count];
								if(subQueryStr!=""){
     					 			subQueryStr+=",";
     					 		}
								for (var key in subObj) {
									if( subObj.hasOwnProperty(key) ) {
										var regex = new RegExp(searchStr, "i");
										var tempSeacrhStr=searchStr;

     					 				if(isNaN(searchStr)){
											tempSeacrhStr="'"+searchStr+"'";
										}

    									if(subObj[key]=="contains"){
     					 					subQueryStr+="{'"+key+"' : "+regex+" }";
     					 				}else if(subObj[key]=="="){
     					 					subQueryStr+="{'"+key+"' : "+tempSeacrhStr+"}";
     					 				}else if(subObj[key]=="!="){
     					 					subQueryStr+="{'"+key+"' : { $ne: "+tempSeacrhStr+" } }";
     					 				}else if(subObj[key]=="starts_with"){
     					 					subQueryStr+="{'"+key+"' : '/^"+regex+"/' }";
     					 				}else if(subObj[key]=="ends_with"){
     					 					subQueryStr+="{'"+key+"' : '/"+regex+"$/' }";
     					 				}
     					 			}
    							}
							}
							if(subQueryStr!=""){
								var tempQueryStr='{';
								if(query!="{") {
									tempQueryStr= '{ $and: ['+query+'}, {';
								}
								if(templateResponse.search_condition=="and" || templateResponse.search_condition=="AND" ){
									tempQueryStr+= '$and:[';
								}else{
									tempQueryStr+= '$or:[';
								}
								tempQueryStr+=subQueryStr;
								tempQueryStr+=']';
								if(query!="{") {
									tempQueryStr+=' }]';
								}
								query=tempQueryStr;
							}
						}
					}

				}
				//search by criteria passed
				if(findFieldValueStr!="" && findFieldNameStr!=""){
					if(query!="{"){
     					query+=",";
     				}

     				if(parseInt(findFieldValueStr)!=="NaN"){
						query+=" '"+findFieldNameStr+"': { $in: ["+parseInt(findFieldValueStr)+", '"+findFieldValueStr+"'] } ";
					}else{
						query+=" '"+findFieldNameStr+"': { $in: ['"+findFieldValueStr+"'] } ";
					}
				}
				query+="}";

				if(templateResponse.listing_columns){
					eval('var obj='+query);
					//console.log("In Fn templateSearch, query: " + query);
					if(table_name=="systems" && parseInt(req.authenticatedUser.access_right)<=10){
						obj['_id'] = new mongodb.ObjectID(activeSystemsStr);
					}
					eval('var fetchFieldsobj='+fetchFieldsObj);
					var total_records=0;
					var coll= db.collection(table_name);

					if(req.query.s){
						coll.createIndex({ "$**": "text" },{ name: "TextIndex" });
					}
					coll.find(obj).count(function (e, count) {
      					total_records= count;
      				});
					//console.log("In Fn templateSearch, coll.find: true");
					console.log("obj",obj)
					console.log("fetchFieldsobj",fetchFieldsobj)
					coll.find(obj, fetchFieldsobj).sort({modified: -1}).skip(pageNum-1).limit(itemsPerPage).toArray(function(err, items) {
						if (err) {
							console.log("functions.js Error, please inform developer to fix this!");
							outputObj["total"]   = 0;
							outputObj["iTotalRecordsReturned"]   = 0;
      						outputObj["error"]   = 'Error, please inform developer to fix this!';
							cb(outputObj);
      					} else if (items) {
      						outputObj["total"]   = total_records;
      						outputObj["iTotalRecordsReturned"]   = items.length;
      						outputObj["aaData"]   = items;
							cb(outputObj);
     					}
					});
				}else{
					outputObj["total"]   = 0;
					outputObj["iTotalRecordsReturned"]   = 0;
      				outputObj["error"]   = 'No columns to display!';
					cb(outputObj);
				}
      		}else{
				outputObj["total"]   = 0;
				outputObj["iTotalRecordsReturned"]   = 0;
      			outputObj["error"]   = "No such page exists!";
				cb(outputObj);
			}
      	});
	},

	/** to fetch one record depending upon table/collection name, search_id(mongo id) **/
	returnFindOneByMongoID : function (db, collectionName, search_id, cb){
		var outputObj = new Object();
		if(search_id!="" && search_id!="undefined" && search_id!=null){
			db.collection(collectionName).findOne({_id: new mongodb.ObjectID(search_id)}, function(err, document_details) {
				if (err) {
					outputObj["error"]   = err;
					cb(outputObj);
      			} else if (document_details) {
      				outputObj["aaData"]   = document_details;
      				cb(outputObj);
     			}	else	{
     				outputObj["error"]   = "Sorry, no record found!";
					cb(outputObj);
     			}
     		});
		}else{
			outputObj["error"]   = "Invalid id passed";
			cb(outputObj);
		}
	},

	/**to save the record in history database
	parameters: collectionName(table name), postContent(content of row), createEntryBool, modifiedByUser(user created the history), cb(callback)
	Description : it creates entry in for table history database
	**/
	maintain_table_history : function (collectionName, postContent, createEntryBool, modifiedByUser, cb){
		var outputObj = new Object();
		// to check table name exists in maintainHistoryTablesArr (defined in init.js file), this is create history only for defined tables
		if((createEntryBool==true || createEntryBool=="true") && collectionName!="" && collectionName!="undefined" && collectionName!=null && init.maintainHistoryTablesArr.indexOf(collectionName)>=0){
			if(postContent._id){
				postContent.history_row_id=postContent._id;
				delete postContent._id;
			}
			postContent.history_created_timestamp = self.currentTimestamp();
      		postContent.history_created_uuid = self.guid();
      		postContent.modified_by_user = modifiedByUser;
      		//make connection with history database mentioned in init file
			init.MongoClient.connect(init.historyDatabaseURL, function (connErr, historyDB) {
				if (connErr) {
    				outputObj["error"]  = 'Unable to connect to the mongoDB server.';	cb(outputObj);
  				} else {
   					historyDB.collection(collectionName).save(postContent, (err4, result) => {
      					if (err4) {
      						outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
      					}else{
    					outputObj["success"]  = "Saved successfully!";
    					}
    					historyDB.close();
						cb(outputObj);
  					});
  				}
			});
		}else{
			outputObj["error"]   = "Please pass collection name!";
			cb(outputObj);
		}
	},
	/** create compound index on table name and columns passed
	Parameters : db(database reference passed), collectionName(table name), columnsArr(Column used to create index), cb
	**/
	createIndexes : function (db, collectionName, columnsArr, cb){
		var outputObj = new Object();
		var fetchFieldsObj="";
		if(typeof(columnsArr)!=="object"){
			columnsArr = columnsArr.replace(/'/g, '"');
			columnsArr = JSON.parse(columnsArr);
		}

		if(columnsArr.length>0){
			for(var l_count=0; l_count< columnsArr.length; l_count++){
				if(l_count==0){
					fetchFieldsObj="{";
					fetchFieldsObj+="'"+columnsArr[l_count]+"' : 1";
				}else{
					fetchFieldsObj+=", '"+columnsArr[l_count]+"' : 1";
				}
			}
			if(fetchFieldsObj!=""){
				fetchFieldsObj+="}";

				eval('var fetchFieldsobj='+fetchFieldsObj);
				db.collection(collectionName).createIndex(fetchFieldsobj);
			}
		}
	},

	create_crud_operation:function(db, collectionStr, actionStr,postContent,cb){
		var outputObj = new Object();
		db.collection(collectionStr).findOne(postContent, function(searchErr, document) {
			if (searchErr) {
				outputObj["error"]   = "Error occurred while saving ["+searchErr+"], please try after some time!";
				cb(outputObj);
				}else if(document){
					outputObj["_id"] = document._id
					outputObj["error"] = "This value already exists!"
					cb(outputObj);
				}else{
					postContent.created=self.currentTimestamp();
					postContent.uuid=self.guid();
					db.collection(collectionStr).save(postContent, (err4, result) => {
						if (err4) outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
					outputObj["success"]  = "Saved successfully!";
					if(result && result["ops"][0]["_id"]){
						outputObj["_id"]  = result["ops"][0]["_id"];
					}
					cb(outputObj);
					});
				}
		});
	},
	/**crud function to find one, update, insert and delete records
	parameters : db(database connection), collectionStr(table name), actionStr(action passed), postContent(data to be saved),
	uniqueFieldNameStr (unique field name), uniqueFieldNameStr
	**/
	crudOpertions: function(db, collectionStr, actionStr, postContent, uniqueFieldNameStr, uniqueFieldValueStr, checkForExistenceStr, cb){
		var outputObj = new Object();

		for(var key in postContent) {
			var contentStr=postContent[key];
			if(typeof(contentStr)=="string")	{
				if(contentStr.charAt(0)=="["){
					try{
        				postContent[key]=JSON.parse(contentStr);
        			}
    				catch (error){
       					postContent[key]=contentStr;
    				}
				}
			}else{
				postContent[key]=contentStr;
			}
		}
		if (typeof checkForExistenceStr !== 'undefined' && checkForExistenceStr != "null" && checkForExistenceStr !== null && checkForExistenceStr!=""){
			var checkForExistenceObj=checkForExistenceStr;
		}else if((uniqueFieldNameStr!="" && uniqueFieldValueStr!="") || (uniqueFieldNameStr!=null && uniqueFieldValueStr!=null)){
			var checkForExistenceObj= {};
			checkForExistenceObj[uniqueFieldNameStr]= uniqueFieldValueStr;
			if(postContent && (postContent!=="" || postContent!==null) && (postContent['uuid_system'] && postContent['uuid_system']!= "")){
				var checkForExistenceObj = {};
				checkForExistenceObj[uniqueFieldNameStr]=uniqueFieldValueStr;
				checkForExistenceObj["uuid_system"]=postContent['uuid_system'];
			}
		}

		if(checkForExistenceObj!="" && checkForExistenceObj!=null){
			if(postContent!="" && postContent!=null){
				postContent.modified=self.currentTimestamp();
			}
			if(typeof(checkForExistenceObj)=="array" || typeof(checkForExistenceObj)=="object"){
				var findStr=checkForExistenceObj;
			}else{
				eval('var findStr='+checkForExistenceObj);
			}
			switch (actionStr) {
    			case 'findOne':
        			db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if (searchErr) {
							outputObj["error"]   = searchErr;
							cb(outputObj);
      					} else if(document){
      						outputObj["success"] = "OK";
      						outputObj["aaData"] = document;
      						cb(outputObj);
      					}else{
      						outputObj["error"]   = "No results found!";
							cb(outputObj);
      					}
					});
        			break;
        		case 'create':
        			console.log('findStr',findStr)
        			db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if (searchErr) {
        					outputObj["error"]   = "Error occurred while saving ["+searchErr+"], please try after some time!";
							cb(outputObj);
      					}else if(document){
      						outputObj["error"] = "This "+uniqueFieldValueStr+" already exists!"
      						cb(outputObj);
      					}else{
      						postContent.created=self.currentTimestamp();
      						postContent.uuid=self.guid();
      						db.collection(collectionStr).save(postContent, (err4, result) => {
      							if (err4) outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
    							outputObj["success"]  = "Saved successfully!";
    							if(result && result["ops"][0]["_id"]){
    								outputObj["_id"]  = result["ops"][0]["_id"];
    							}
    							cb(outputObj);
  							});
      					}
					});
        			break;
    			case 'update':
    				db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if(document){
        					if(document.created){
								postContent["created"]=document.Created;
							}else{
								postContent['created']=self.currentTimestamp();
							}
							if(document.uuid){
								postContent["uuid"]=document.uuid;
							}else{
								postContent['uuid']=self.guid();
							}
      						db.collection(collectionStr).update(findStr, postContent, (err1	, result) => {
    							if (err1) outputObj["error"]="Error occurred while updating ["+err1+"], please try after some time!";
    							outputObj["success"]= "Updated successfully!";
    							cb(outputObj);
  							});
						}else{
							outputObj["error"]   = "Error occurred while updating ["+searchErr+"], please try after some time!";
							cb(outputObj);
						}
					});
       				break;
       			case 'delete':
       				db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
       					if(document){
							db.collection(collectionStr).remove(findStr, function(err, result){
    							if (err) outputObj["error"]="Error occurred while deleting ["+err+"], please try after some time!";
    							outputObj["success"]="Deleted successfully!";
    							cb(outputObj);
  							});
						}else {
							outputObj["error"]   = "Error occurred while deleting, please try after some time!";
							cb(outputObj);
						}
					});
       				break;
    			default:
        			outputObj["error"]   = "Please specify the action!";
					cb(outputObj);
			}
		}else if(actionStr=='create'){
			postContent.created=self.currentTimestamp();
			postContent.uuid=self.guid();
      		db.collection(collectionStr).save(postContent, (err4, result) => {
      			if (err4) outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
    			outputObj["success"]  = "Saved successfully!";
    			outputObj["_id"]  = result["ops"][0]["_id"];
    			cb(outputObj);
  			});
      	}else{
			outputObj["error"]   = "Please specify unique field name and its value!";
			cb(outputObj);
		}
	},
	/**	save_activity_log : to maintain user's click/log in db
	parameters : db, labelStr(Label used while displaying log), linkStr(link to the page), loggedInUserID(current logged in user id), system_id(current system id), cb(callback)
	**/
	save_activity_log : function (db, labelStr, linkStr, loggedInUserID, system_id, cb) {
		var table_name_str='activity_log', outputObj = new Object();
		db.collection(table_name_str).findOne({last_clicked_link : linkStr, user_mongo_id: loggedInUserID.toString(), uuid_system : system_id }, function(err, existingDocument) {
			if(existingDocument){
				//update modified timestamp
				db.collection(table_name_str).update({_id : existingDocument._id}, {'$set' : {label: labelStr, modified : self.currentTimestamp()}}, (updateErr, updateResult) => {
    				if (updateErr) outputObj["error"]="Error occurred while updating ["+updateErr+"], please try after some time!";
    				outputObj["success"]= "Updated successfully!";
    				cb(outputObj);
  				});
			} else {
				//create entry
				db.collection(table_name_str).save({ last_clicked_link : linkStr, user_mongo_id: loggedInUserID.toString(), label: labelStr, created : self.currentTimestamp(), modified : self.currentTimestamp(), uuid_system : system_id }, (saveError, saveResult) => {
      				if (saveError) outputObj["error"]  = "Error occurred while saving ["+saveError+"], please try after some time!";
    				outputObj["success"]  = "Saved successfully!";
    				cb(outputObj);
  				});
			}
		});
	},

	//to save the sidebar click action to open/close categories
	save_sidebar_activity_log : function (db, table_name_str,moduleIdStr, loggedInUserID, system_id, cb) {
		var outputObj = new Object();
		db.collection(table_name_str).findOne({module_id: moduleIdStr, user_mongo_id: loggedInUserID.toString(), uuid_system : system_id }, function(err, existingDocument) {
			if(existingDocument){
				var changeStateStr = existingDocument.state == "open" ? "close" : "open"
 				//update modified timestamp and state
				db.collection(table_name_str).update({_id : existingDocument._id}, {'$set' : {module_id: moduleIdStr,state:changeStateStr,modified : self.currentTimestamp()}}, (updateErr, updateResult) => {
    				if (updateErr) outputObj["error"]="Error occurred while updating ["+updateErr+"], please try after some time!";
    				outputObj["success"]= "Updated successfully!";
    				cb(outputObj);
  				});
			} else {
				// create entry
				db.collection(table_name_str).save({ module_id: moduleIdStr, state:"open",user_mongo_id: loggedInUserID.toString(), created : self.currentTimestamp(), modified : self.currentTimestamp(), uuid_system : system_id }, (saveError, saveResult) => {
      				if (saveError) outputObj["error"]  = "Error occurred while saving ["+saveError+"], please try after some time!";
    				outputObj["success"]  = "Saved successfully!";
    				cb(outputObj);
  				});
			}
		});
	},

	//to fetch the sidebar click action to open/close categories
	fetch_sidebar_activity_log : function (db, table_name_str,labelStr, loggedInUserID, system_id, cb) {
		var outputObj = new Object();
		db.collection(table_name_str).find({user_mongo_id: loggedInUserID.toString()}).toArray(function(err, existingDocument) {
    		cb(existingDocument);
		});
	},

	/**	saveEntry : used by common save script to save the details in database
	parameters : db(database), table_nameStr(table name), checkForExistence(used to check if record already exists in table), postContent(Data to save), parameterStr( to display error message), findmongoID(to check by unique mongo id), unique_fieldStr(unique field name), unique_fieldVal(field value), modifiedByUser(created by user), cb(callback)
	**/
	saveEntry : function(db, table_nameStr, checkForExistence, postContent, parameterStr, findmongoID, unique_fieldStr, unique_fieldVal, modifiedByUser, cb){
		for(var key in postContent) {
			var contentStr=postContent[key];
			var tempStr=contentStr.toString();
			if(tempStr.charAt(0)=="["){
				try{
        			postContent[key]=JSON.parse(tempStr);
        		}
    			catch (error){
       				postContent[key]=contentStr;
    			}
			}	else {
				postContent[key]=contentStr;
			}
		}

		var link="";
		postContent['modified']=self.currentTimestamp();

		//check by mongo id
		db.collection(table_nameStr).findOne({_id : findmongoID}, function(err, existingDocument) {
			var checkForExistenceObj=checkForExistence;
			if (existingDocument) {
				if (typeof checkForExistenceObj === 'undefined' || checkForExistenceObj === null || checkForExistenceObj==""){
					checkForExistenceObj= '{'+unique_fieldStr +': \''+unique_fieldVal+'\'}';
					if(postContent['uuid_system'] && postContent['uuid_system']!= ""){
						checkForExistenceObj= '{'+unique_fieldStr +': \''+unique_fieldVal+'\', "uuid_system" : \''+postContent['uuid_system']+'\'}';
					}
				}

				eval('var findObj='+checkForExistenceObj);
				//check for existence
				db.collection(table_nameStr).find(findObj, {"_id" : 1}).toArray(function(err, items) {
					var alreadyBool=false;
					for(var i=0; i < items.length; i++) {
						var subObject=items[i];
						if(subObject._id.toHexString() != existingDocument._id.toHexString()){
							alreadyBool=true;
						}
					}

					if(alreadyBool){
						link+="error_msg=This "+parameterStr+" already exists!"
      					cb(link);
					}else{
						var addHistoryBool=false;
						if(postContent.maintain_history){
							addHistoryBool = postContent.maintain_history;
							delete postContent.maintain_history;
						}
						//save details in database
						self.maintain_table_history(table_nameStr, existingDocument, addHistoryBool, modifiedByUser, function(result) {
							if(existingDocument.created){
								postContent["created"]=existingDocument.created;
							}else{
								postContent['created']=self.currentTimestamp();
							}
							if(existingDocument.uuid){
								postContent["uuid"]=existingDocument.uuid;
							}else{
								postContent['uuid']=self.guid();
							}
      						db.collection(table_nameStr).update({_id:findmongoID}, postContent, (err1	, result) => {
    							if (err1){
    								link+="error_msg=Error occurred while saving ["+err1+"], please try after some time!";
    							}else{
    								link+="success_msg=Updated successfully!";
    							}
    							cb(link);
  							});
  						});
					}
				});
			} else{
				if (typeof checkForExistenceObj === 'undefined' || checkForExistenceObj === null || checkForExistenceObj==""){
					checkForExistenceObj= '{'+unique_fieldStr +': \''+unique_fieldVal+'\'}';
					if(postContent['uuid_system'] && postContent['uuid_system']!= ""){
						checkForExistenceObj= '{'+unique_fieldStr +': \''+unique_fieldVal+'\', "uuid_system" : \''+postContent['uuid_system']+'\'}';
					}
				}
				//create entry in db
				self.crudOpertions(db, table_nameStr, 'create', postContent, unique_fieldStr, unique_fieldVal, checkForExistenceObj,function(result) {
					if(result.error){
						link+="error_msg="+result.error;
      					cb(link);
					}else if(result.success){
						link+="_id="+result._id+"&success_msg="+result.success;
						if(table_nameStr=="tasks" && postContent.assigned_to_user_id && postContent.assigned_to_user_id!=""){	// to send notification if new task is created to assigned user
							self.send_notification(db, result._id, postContent.assigned_to_user_id, '', 'Task has been reported', 0, table_nameStr, result._id, function(notificationResult) {
    							cb(link);
							});
	    				}	else	{
    						cb(link);
    					}
      				}
				});
			}
		});

	},
	/**	saveSessionBeforeLogin : to save the details when logged in (in sessions table)
	parameters : db, user_id(user unique mongo id), systems_access(system access to user), cb(Callback)
	**/
	saveSessionBeforeLogin : function(db, user_id, systems_access, cb){
		var outputObj = new Object();
		db.collection('sessions').save({"user_id": new mongodb.ObjectID(user_id), "status" : true, "active_system_uuid" : new mongodb.ObjectID(systems_access)}, (err, result) => {
			if (result){
				db.collection('systems').find({}).count(function (e, count) {
					outputObj["cookie"]   = result["ops"][0]["_id"];	// set the cokkie
      				outputObj["success"]   = 'OK';
      				if(count==0){
      					outputObj["link"]   = '/default_system';
      				}else{
						outputObj["link"]   = '/index';
      				}
      				cb(outputObj);
     			});
      		}else{
      			outputObj["error"]   = 'no';
      			cb(outputObj);
    		}
  		});
	},
	// return the current timestamp
	currentTimestamp : function (){
		var timeStampStr=Math.round(new Date().getTime()/1000)
		return timeStampStr;
	},
	//convert miles into radian
	milesToRadian : function(miles){
    	var earthRadiusInMiles = 3959;
    	return miles / earthRadiusInMiles;
	},
	//return all the active tokens, table name : tokens
	returnActivetokens : function (db, cb){
		db.collection('tokens').find({"status": { $in: [ 1, "1" ] } }, {"name" : 1, "code" : 1}).toArray(function(err, tokens_result) {
			if(err) return cb(null)
			cb(tokens_result);
		});
	},
	//return all the active categories
	returnActiveCategories : function (db, cb){
		db.collection('categories').find({"status": { $in: [ 1, "1" ] } }, {"name" : 1, "code" : 1}).toArray(function(err, tokens_result) {
			if(err) return cb(null)
			cb(tokens_result);
		});
	},
	//return all the collection names exists in database
	returnAllCollections : function (db, cb){
		console.log(db.listCollections())
		db.listCollections().toArray(function(err, coll) {
			if(err) return cb(null)
			var allCollections=new Array();
			console.log("err",err)
			for(var i=0; i < coll.length; i++) {
				if(coll[i].name!="system.users"){
					allCollections.push(coll[i].name);
				}
			}
			console.log("coll",coll)
			return cb(allCollections);
		});
	},
	//generate a 36 character unique id
	guid : function () {
  		function s4() {
    		return Math.floor((1 + Math.random()) * 0x10000)
      		.toString(16)
      		.substring(1);
  		}
  		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	},

	//extract postcode from string(passed as parameter0
	extract_uk_postcode : function (contentStr){
		var returnedPostcodeStr='';
		var reg="/((GIR 0AA)|((([A-PR-UWYZ][0-9][0-9]?)|(([A-PR-UWYZ][A-HK-Y][0-9][0-9]?)|(([A-PR-UWYZ][0-9][A-HJKSTUW])|([A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY])))) [0-9][ABD-HJLNP-UW-Z]{2}))/i";
		var foundResults= contentStr.match(/((GIR 0AA)|((([A-PR-UWYZ][0-9][0-9]?)|(([A-PR-UWYZ][A-HK-Y][0-9][0-9]?)|(([A-PR-UWYZ][0-9][A-HJKSTUW])|([A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY])))) [0-9][ABD-HJLNP-UW-Z]{2}))/i);
		if(foundResults){
			returnedPostcodeStr= foundResults[1];
		}
		return returnedPostcodeStr;
	},

	// every time add a entry page for a table please create a entry here, mention the page name as "filename" and its related collection name
	// (This is hard coded right now, will make this option dynamic from system_templates)
	fetchTableName : function (filename){
		var table_name="";
		if(filename=="document" || filename=="blog" || filename=="page"){
			table_name="documents";
		}else if(filename=="job"){
			table_name="vacancies";
		}else if(filename=="emails" || filename=="email"){
			table_name="email_queue";
		}else if(filename=="task" || filename=="calendar"){
			table_name="tasks";
		}else if(filename=="venue"){
			table_name="venue";
		}else if(filename=="category"){
			table_name="categories";
		}else if(filename=="image" || filename=="image_gallery"){
			table_name="fs.files";
		}else{
			table_name=filename+"s";
		}
		return table_name;
	},
	/**	fetchTableColumns : to fetch the table's all columns
	Parameters : db(database), table(table name), cb(callback)
	**/
	fetchTableColumns : function (db, table, cb) {
		var allKeys=new Array();
		//to check if table structure is defined in system_tables
  		db.collection('system_tables').findOne({name: table}, function(err, listDetails) {
  			var nofieldsExistBool=true;
  			if(listDetails && listDetails.fields && listDetails.fields.length>0){
  				nofieldsExistBool=false;
  				return cb(listDetails.fields);
  			}

  			if(nofieldsExistBool){
  				//or fetch all table fields
  				db.collection(table).findOne({}, (err, result) => {
   					if(result){
   						for (key in result){
   							allKeys.push(key);
   						}
   					}
					return cb(allKeys);
				});
  			}
  		});
	},
	/**	send_email : function used to send emails, mailer secure details are saved in system_lists table with code "aws-email-details"
	parameters : db(database), from_email(email by), sender_name(Sender name), to_email(email to), subject(Subject of email), plaintext(email as plain text), htmlContent(Email as html), cb(Callback)
	**/
	send_email : function (db, from_email, sender_name, to_email, subject, plaintext, htmlContent, cb){
  		var outputObj = new Object();
  		db.collection('system_lists').findOne({code: "aws-email-details"}, function(err, listDetails) {
  			var emailApiUsername = process.env.emailApiUsername;	//to check if mailer details are saved in environment variables
  			var emailApiHost = process.env.emailApiHost;

  			if(listDetails && listDetails.list && listDetails.list.length>0){
				var listArr = listDetails.list;
				for(var i=0; i<listArr.length; i++){
					if(listArr[i].label=="Username")	{
						emailApiUsername = listArr[i].value;
					} else if(listArr[i].label=="Host"){
						emailApiHost = listArr[i].value;
					}
				}
			}

			var emailLinkStr= 'smtps://'+emailApiUsername+':'+emailApiHost;

			// create reusable transporter object using the default SMTP transport
			var transporter = nodemailer.createTransport(emailLinkStr);

			// setup e-mail data with unicode symbols
			var mailOptions = {
    			from: from_email, // sender address
    			to: to_email, // list of receivers
    			subject: subject, // Subject line
   				text: plaintext, // plaintext body
    			html: htmlContent // html body
			};

			console.log(mailOptions)
			// send mail with defined transport object
			transporter.sendMail(mailOptions, function(error, info){
				var insertEmail=new Object();
				insertEmail["sender_name"]=sender_name;
				insertEmail["sender_email"]=to_email;
				insertEmail["subject"]=subject;
				insertEmail["body"]=plaintext;
				insertEmail["created"]=self.currentTimestamp();
				insertEmail["modified"]=self.currentTimestamp();
				insertEmail["recipient"]=from_email;

  				if(error){
        			outputObj["error"]   = error;
        			insertEmail["status"]=0;
    			}	else	{
    				outputObj["success"]   = info.response;
    				insertEmail["status"]=-1;
    			}
    			//also create entry in email_queue table to check the email status
    			self.crudOpertions(db, 'email_queue', 'create', insertEmail, null, null, null,function(email_response) {
					cb(outputObj);
				});
			});
		});
	},

	// this function is used to add/update entry in notifications table
	// notify_to means user mongo _id
	// read_status 0 means unread, 1 means read
	// link_id will be used to redirect to that page
	send_notification : function (db, uniqueId, notify_to, message_type, message, read_status, table_name, table_id, cb){
  		var outputObj = new Object();

  		var tablenameStr='notifications';
  		var postContentArr={};
  		postContentArr["notify_to"]= new mongodb.ObjectID(notify_to);
  		postContentArr["message_type"]= message_type;
  		postContentArr["read_status"]= read_status;
  		postContentArr["message"]= message;
  		postContentArr["collection_link_id"]= table_id;
  		postContentArr["collection_linked"]= table_name;

  		self.returnFindOneByMongoID(db, tablenameStr, uniqueId, function(result) {
  			if(result.error){
  				//add new entry
  				postContentArr["created"]= self.currentTimestamp();
  				self.crudOpertions(db, tablenameStr, 'create', postContentArr, null, null, null, function(email_response) {
					cb(email_response);
				});
  			}	else if(result.aaData){
  				//update entry
  				db.collection(tablenameStr).update({_id:new mongodb.ObjectID(uniqueId)}, postContentArr, (err, response) => {
    				if (response){
    					outputObj["success"]   = "Updated notification";
					}else{
    					outputObj["error"]   = "Sorry, some error occurred, please try after sometime!";
    				}
    				cb(outputObj);
  				});
  			}
		});
	},

	form_fixtures_history_obj : function (db, eventDetails, cb){
		var outputObj = new Object();
		if(eventDetails)	{
			db.collection('fixtures_history').findOne({uuid : eventDetails.uuid}, function(searchErr, historyResult) {
				if(historyResult)	{
					outputObj["error"]   = "Fixture history exists";
					cb(outputObj);
				}else{
					var fixtureDetails= eventDetails;
					var teamsArr=new Array();
					if(eventDetails.home_team_uuid && eventDetails.home_team_uuid!="")	{
						teamsArr.push(new mongodb.ObjectID(eventDetails.home_team_uuid));
					}
					if(eventDetails.away_team_uuid && eventDetails.away_team_uuid!="")	{
						teamsArr.push(new mongodb.ObjectID(eventDetails.away_team_uuid));
					}
					if(teamsArr.length>0)	{
						db.collection('teams').find({_id : { '$in': teamsArr } }).sort({'events.date_time': 1}).toArray(function(err, teams_arr) {
							if(teams_arr && teams_arr.length>0) {
								for(var i=0; i<teams_arr.length; i++){
									if(eventDetails.home_team_uuid && eventDetails.home_team_uuid!="" && eventDetails.home_team_uuid==teams_arr[i]._id)	{
										delete teams_arr[i]['_id'];
										fixtureDetails['home_team_details'] = teams_arr[i];
									}
									if(eventDetails.away_team_uuid && eventDetails.away_team_uuid!="" && eventDetails.away_team_uuid==teams_arr[i]._id)	{
										delete teams_arr[i]['_id'];
										fixtureDetails['away_team_details'] = teams_arr[i];
									}
								}
							}
							self.create_fixtures_history(db, fixtureDetails, teamsArr, function(result) {
								cb(result);
							});
						});
					}	else {
						self.create_fixtures_history(db, fixtureDetails, teamsArr, function(result) {
							cb(result);
						});
					}
				}
			});
		}
	},

	/** this function is used to fetch content of job applications & extract the content from it
	parameters : db, req(request parameters), cb(callback)
	**/
	create_file_on_disk_to_extract_content : function (db, req, cb){
		var outputObj = new Object();
		if(req){
			var formidable = require('formidable');
			var path = require('path'), fs = require('fs');
			var tempUploadPath = '/tmp/';
			var form = new formidable.IncomingForm(), savedFilePathStr='';

			if (fs.existsSync(tempUploadPath)) {
			// store all uploads in the /temp directory
  			form.uploadDir = tempUploadPath;
			  form.keepExtensions = true;
			  form.on('file', function(field, file) {
				savedFilePathStr= path.join(form.uploadDir, Date.now()+'_'+file.name);
				fs.rename(file.path, savedFilePathStr, function (err) {
				  if (err) throw err;
				  console.log('renamed complete');
				});
  			});
			form.parse(req, function (diskUploadErr, fields, files) {	//create file temporarily on disk
				var files_parameters=files['file'];

				outputObj["path"]   = savedFilePathStr;
      			outputObj["fields"]   = fields;

				if(files_parameters['type']=='application/pdf'){
					var PDFParser = require("pdf2json");
 					let pdfParser = new PDFParser(this,1);

    				pdfParser.on("pdfParser_dataError", errData => {
    					outputObj["extracted_data"]   = errData.parserError;
        				cb(outputObj);
    				});
   					pdfParser.on("pdfParser_dataReady", pdfData => {
        				outputObj["extracted_data"]   = pdfParser.getRawTextContent();
        				cb(outputObj);
    				});
    				pdfParser.loadPDF(savedFilePathStr);
				} else	{
					//to extract content from the file
					var textract = require('textract');
					textract.fromFileWithPath(savedFilePathStr, function( textract_error, textract_text ) {
						outputObj["extracted_data"]   = textract_text;
						cb(outputObj);
					})
				}
			});
			}else{
				outputObj["error"]   = "Error, no upload directory found!";
      			cb(outputObj);
			}
      	} else	{
      		outputObj["error"]   = "Error, while saving this in history!";
      		cb(outputObj);
      	}
	},
/** create_fixtures_history : to create history of team with all matches details and also set the [team]players= empty array
parameters :db, fixtureHistoryObj(content to be saved), clearTeamPlayersArr(team unique mongo id), cb(callback)
**/
	create_fixtures_history : function (db, fixtureHistoryObj, clearTeamPlayersArr, cb){
		var outputObj = new Object();
		if(fixtureHistoryObj){
			fixtureHistoryObj.created=self.currentTimestamp();
			fixtureHistoryObj.modified=self.currentTimestamp();
			//save history
			db.collection('fixtures_history').save(fixtureHistoryObj, (err, result) => {
      			if (result){
      				//empty the players array of team, so user can assign new members to a team
      				db.collection("teams").updateMany({_id : { '$in': clearTeamPlayersArr } }, {'$set' : {"players" : new Array()}}, (err1, response1) => {
      					outputObj["success"]   = "Pushed to history successfully!";
      					cb(outputObj);
      				});
      			} else	{
      				outputObj["error"]   = "Error, while saving this in history!";
      				cb(outputObj);
      			}
			});
      	} else	{
      		outputObj["error"]   = "Error, while saving this in history!";
      		cb(outputObj);
      	}
	},

/**	save_scores, parameters : db, fixtureHistoryObj(match details passed), cb(Callback)
description : to save and update results table
**/
	save_scores : function (db, fixtureHistoryObj, cb){
		var outputObj = new Object(), tablenameStr='results';
		if(fixtureHistoryObj){
			fixtureHistoryObj.created=self.currentTimestamp();
			fixtureHistoryObj.modified=self.currentTimestamp();

			db.collection(tablenameStr).findOne({event_uuid: fixtureHistoryObj.event_uuid}, function(err, document_details) {
				if (document_details) {
      				//update
      				db.collection(tablenameStr).update({event_uuid: fixtureHistoryObj.event_uuid}, fixtureHistoryObj, (err, response) => {
    					if (response){
    						outputObj["success"]   = "Updated results";
						}else{
    						outputObj["error"]   = "Sorry, some error occurred, please try after sometime!";
    					}
    					cb(outputObj);
  					});
     			}else{
     				//insert
     				self.crudOpertions(db, tablenameStr, 'create', fixtureHistoryObj, null, null, null, function(save_response) {
						cb(save_response);
					});
     			}
     		});
      	} else	{
      		outputObj["error"]   = "Error, while saving this in history!";
      		cb(outputObj);
      	}
	},
/**	returnTemplateContent
parameters : db, system_id(current system id), req_params_id(template code for search), cb(callback)
description: Find template and even process its content
**/
returnTemplateContent : function (db, system_id, req_params_id, cb) {
	var outputResponseStr=new Object();
	db.collection('templates').findOne({code: req_params_id, uuid_system : system_id, status: { $in: [ 1, "1" ] } }, function(templateErr, returnTemplateContent) {
		if (returnTemplateContent) {
			var templateContentStr = returnTemplateContent.template_content;
      		self.templateProcessTokens(db, system_id, templateContentStr, new Array() ,function(responseStr) {
      			outputResponseStr["success"] = responseStr;
      			cb(outputResponseStr);
			});
    	} else {
    		outputResponseStr["error"]   = "Sorry, no such template found!";
       		cb(outputResponseStr);
    	}
   	});
},
/** findTokensListInTemplate, parameters : templateContentStr(template content passed)
description: to fetch all the tokens found in content and return the string, tokens can be identified as <*--token-code-here--*>
**/
findTokensListInTemplate : function (templateContentStr) {
	var findTokensStr= '', searchParaCount=4, tempContentStr=templateContentStr;
	var findTokenStartingPos = tempContentStr.indexOf("<*--");

    if(tempContentStr!="" && findTokenStartingPos>=0){
    	var findTokenEndingPos = tempContentStr.indexOf("--*>");
      	var tokenStr=tempContentStr.substring(findTokenStartingPos+searchParaCount, findTokenEndingPos);
		if(findTokensStr!=""){
			findTokensStr+=","+tokenStr.trim();
		}else{
      		findTokensStr+=tokenStr.trim();
      	}
      	tempContentStr=tempContentStr.substring(findTokenEndingPos+searchParaCount);

      	if(tempContentStr!=""){
      		if(findTokensStr!=""){
				findTokensStr+=","+self.findTokensListInTemplate(tempContentStr);
			}else{
      			findTokensStr+=self.findTokensListInTemplate(tempContentStr);
      		}
      	}
    }
    if(findTokensStr.charAt(findTokensStr.length - 1)==","){
    	findTokensStr = findTokensStr.substring(0, findTokensStr.length - 1);
    }
    return findTokensStr;
},

escapeRegExp : function (str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
},
/** templateProcessTokens
parameters : db, system_id(current system), templateContentStr(template content), processedTokenList(tokens arrays which are processed/got their value), cb(callback)
Description :  this function will fetch all the tokens from template, get their values and print their values instead of their code i.e. <*--token-code-here--*> and returns the content for template
**/
templateProcessTokens : function (db, system_id, templateContentStr, processedTokenList, cb){
	var outputResponseStr=templateContentStr, recursionOccurredToken='';
	var listOfTokensStr= self.findTokensListInTemplate(outputResponseStr);
    if(listOfTokensStr!=""){
    	var tokensArr = listOfTokensStr.split(',');
    	if(tokensArr.length>0 && processedTokenList.length>0){
    		for(var i=0; i < tokensArr.length; i++){
    			if(processedTokenList.indexOf(tokensArr[i]) > -1){
    				recursionOccurredToken = tokensArr[i];
    				var recursionErrMsg="<b>*** Recursion '"+recursionOccurredToken+"' ***</b>";
    				var foundTokenStr = self.escapeRegExp("<*--"+tokensArr[i]+"--*>");
      				outputResponseStr=outputResponseStr.replace(new RegExp(foundTokenStr, 'g'), recursionErrMsg);
      				tokensArr.splice(i, 1);

    			}
    		}
    	}

      	db.collection('tokens').find({ 'code': { $in: tokensArr }, status: { $in: [ 1, "1" ] }, uuid_system : system_id }, {'code' : 1,'token_content' : 1}).toArray(function(tokensErr, tokensResult) {
    		if (tokensResult && tokensResult.length>0){
      			for(var j=0; j<tokensResult.length; j++){
      				var foundTokenStr = self.escapeRegExp("<*--"+tokensResult[j].code+"--*>");
      				processedTokenList.push(tokensResult[j].code);
      				outputResponseStr=outputResponseStr.replace(new RegExp(foundTokenStr, 'g'), tokensResult[j].token_content);
      			}
      			if(outputResponseStr==templateContentStr){
      				cb(outputResponseStr);
      			}else{
      				self.templateProcessTokens(db, system_id, outputResponseStr, processedTokenList, function(responseStr) {
      					cb(responseStr);
					});
				}
      		} else {
      			db.collection('tokens').find({ 'code': { $in: tokensArr }, status: { $in: [ 1, "1" ] }, shared_systems : { $in: [system_id] } }, {'code' : 1,'token_content' : 1}).toArray(function(tokensErr, tokensResult) {
    				if (tokensResult && tokensResult.length>0){
      					for(var j=0; j<tokensResult.length; j++){
      						processedTokenList.push(tokensResult[j].code);
      						var foundTokenStr = self.escapeRegExp("<*--"+tokensResult[j].code+"--*>");
      						outputResponseStr=outputResponseStr.replace(new RegExp(foundTokenStr, 'g'), tokensResult[j].token_content);
      					}
      				}
      				if(outputResponseStr==templateContentStr){
      					cb(outputResponseStr);
      				}else{
      					self.templateProcessTokens(db, system_id, outputResponseStr, processedTokenList, function(responseStr) {
      						cb(responseStr);
						});
					}
				});
      		}
      	});
    } else {
    	cb(outputResponseStr);
    }
},
/** generate_invoice_order_pdf
parameters : db(database connection reference), table_name (table name), unique_id(mongo id), active_system_id(active system unique id)
Description:  1. this will generate pdf depending upon template design,
2. template content is process if it contain any token, and also to display sub objects like invoice/order items, place "__loop_through_items__" in template content where required
3. So this function will automatically replace "__loop_through_items__" with invoice/order items
4. if pdf does not work just try command "npm rebuild phantomjs-prebuilt" (one solution on EPIPE error)
**/
generate_invoice_order_pdf : function (db, table_name, unique_id, active_system_id, cb){
	var outputObj=new Object();
	if(table_name!="" && unique_id!=""){
		var fs = require('fs');
		//search for invoice/order
		self.returnFindOneByMongoID(db, table_name, unique_id, function(resultObject) {
			if(resultObject.aaData && resultObject.aaData != ""){
				var invoice_content_obj = resultObject.aaData;
				var templateStr= "gbp-invoice-template";
				if(table_name=="orders"){
					templateStr= "gbp-order-template";
				}
				if(invoice_content_obj.template && invoice_content_obj.template!=""){
					templateStr = invoice_content_obj.template; 		//get from database
				}
				// fetch template from details
				self.returnTemplateContent(db, active_system_id, templateStr, function(templateResultObject) {
					if(templateResultObject.success && templateResultObject.success!="") {
						var templateContentStr= templateResultObject.success;
						for(var key in invoice_content_obj) {
							var tempKey = "__"+key+"__";
							if(tempKey.indexOf("timestamp")>=0){	// if field name contain timestamp replace with it date format
								if(invoice_content_obj[key]!="" && invoice_content_obj[key]!==null){
									templateContentStr = templateContentStr.replace(new RegExp(tempKey, 'g'), self.dateFromTimestamp(invoice_content_obj[key]));
								}else{
									templateContentStr = templateContentStr.replace(new RegExp(tempKey, 'g'), "");
								}
							}else{
								templateContentStr = templateContentStr.replace(new RegExp(tempKey, 'g'), invoice_content_obj[key]);
							}

							if(key=="invoice_items" && invoice_content_obj[key]!="" && invoice_content_obj[key].length>0){
								var itemsObj = invoice_content_obj[key];
								var subItemscontent = "";
								for(var i=0; i < itemsObj.length; i++){
									var itemDetails = itemsObj[i];
									subItemscontent += '<tr><td></td><td align="center">'+itemDetails.description+'</td><td align="center">'+itemDetails.hours+'</td><td align="right">'+itemDetails.rate+'</td><td align="right">__currency_symbol__'+itemsObj[i].amount+'</td></tr>';
								}
								templateContentStr = templateContentStr.replace("__loop_through_items__", subItemscontent);		//replace '__loop_through_items__' with desired data
							}else if(key=="order_items" && invoice_content_obj[key]!="" && invoice_content_obj[key].length>0){
								var itemsObj = invoice_content_obj[key];
								var subItemscontent = "";
								for(var i=0; i < itemsObj.length; i++){
									var itemDetails = itemsObj[i];
									subItemscontent += '<tr><td>'+itemDetails.description+'</td><td align="center">'+itemDetails.hours+'</td><td align="right">'+itemDetails.rate+'</td><td align="right">'+itemDetails.discount+'</td><td align="right">'+itemsObj[i].amount+'</td></tr>';
								}
								templateContentStr = templateContentStr.replace("__loop_through_items__", subItemscontent);
							}

						
						}

						var currency_symbol = "&pound;"
						if(invoice_content_obj['tax_code'] == 'US'){
							currency_symbol = "&dollar;"
						}
						else if(invoice_content_obj[key] == 'EU'){
							currency_symbol = "&euro;"
						}
						templateContentStr = templateContentStr.replace(new RegExp("__currency_symbol__", 'g'), currency_symbol);
						templateContentStr = templateContentStr.replace("__currency_date__", new Date().toLocaleDateString());
						templateContentStr = templateContentStr.replace("__currency_time__", new Date().toLocaleTimeString());


						const tmp = require('tmp');
						const tmpobj = tmp.dirSync();
						// console.log('Dir: ', tmpobj.name);
						
						// var tempHTMLFilePathStr = "/tmp/"+invoice_content_obj._id+".html";
						var tempHTMLFilePathStr = path.join(tmpobj.name,invoice_content_obj._id+".html");
						console.log("html",templateContentStr)

						fs.writeFile(tempHTMLFilePathStr, templateContentStr, function(err) {	//create first html file in temp directory
    						if(err) {
        						outputObj["error"]   = "Sorry, error while generating file, please inform the webmaster to setup temporary upload folder!";
        						cb(outputObj);
    						}
    						var pdf = require('html-pdf');	//initialise html-pdf
							var html = fs.readFileSync(tempHTMLFilePathStr, 'utf8');
							var options = {
  								"format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
  								"orientation": "portrait", // portrait or landscape
								"border": "25px",             // default is 0, units: mm, cm, in, px
  								"zoomFactor": "1", // default is 1
  								"footer": {
   									"height": "10mm",
    								"contents": {
      									default: '<div style="border-top: 1px solid #333333; font-size: 9px; text-align: center; padding-top: 1mm;margin-top:10px;">Page {{page}} of {{pages}}</div>', // fallback value
    								}
  								}
							};
							// var tempPDfFilePathStr = "/tmp/"+invoice_content_obj._id+".pdf";
							var tempPDfFilePathStr = path.join(tmpobj.name,invoice_content_obj._id+".pdf");
							
							pdf.create(html, options).toFile(tempPDfFilePathStr, function(pdferr, res) {	//create pdf file from html file generated above
  								if (pdferr){
  									outputObj["error"]   = "Sorry, error occurred while generating pdf!";
           							cb(outputObj);
  								}else{
  									fs.unlinkSync(tempHTMLFilePathStr);	//removed the html file
  									outputObj["success"]   = tempPDfFilePathStr;
           							cb(outputObj);
       							}
							});
						});
					}else{
						outputObj["error"]   = "Sorry, no template found to generate pdf!";
      					cb(outputObj);
					}
				});
			} else{
				outputObj["error"]   = "Sorry, no such record found!";
      			cb(outputObj);
			}
		});
	} else {
		outputObj["error"]   = "Please pass all the required parameters to download pdf!";
      	cb(outputObj);
	}
},
//return the static files on disk
returnStaticDiskFiles : function(cb){
	var fs = require('fs'), filesArr= new Array(), i=0;
	fs.readdirSync('views/'+init.backendDirectoryName).forEach(file => {
 		filesArr[i]=file;
 		i++;
 	});
 	cb(filesArr);
},
//return "mm/dd/yyyy" from timestamp passed
dateFromTimestamp : function(timestamp){
	var a = new Date(timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var dateNum = a.getDate();

	var time = month + ' ' + dateNum + ', ' + year;
	return time;
}
};
