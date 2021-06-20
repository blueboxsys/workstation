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
	 *  init.js handles the basic initial constants
	 **/

	// Init connection env variables

	const dashboardHost = process.env.WORKSTATION_DASHBOARD_HOST || 'localhost'
	const dashboardPort = process.env.WORKSTATION_DASHBOARD_PORT || 3015
	const dashboardDir = process.env.WORKSTATION_DASHBOARD_DIR || 'dashboard'

	const appHost = process.env.WORKSTATION_WEBSITE_HOST || 'localhost'
	const appPort = process.env.WORKSTATION_WEBSITE_PORT || 3005
	const systemSiteID = process.env.WORKSTATION_WEBSITE_GUID || "5947ccfb8b69ec720d5814d4"

	const mongoPort = process.env.MONGO_PORT || 27017
	    // const mongoDB = process.env.MONGO_DB || 'workstation'
	const mongoDB = process.env.MONGO_DB || 'jobshout_live'

	const mongoHistoryDB = process.env.MONGO_HISTORY_DB || mongoDB + '_history'
	const mongoHost = process.env.MONGO_HOST || 'localhost'
	const mongoURL = process.env.MONGO_URL || 'mongodb://' + mongoHost + ':' + mongoPort + '/' + mongoDB
	const mongoHistoryURL = process.env.MONGO_HISTORY_URL || 'mongodb://' + mongoHost + ':' + mongoPort + '/' + mongoHistoryDB

	console.log('mongoHistoryURL: ' + mongoHistoryURL);

	var mongodbRe = require('mongodb')
	var MongoClient = mongodbRe.MongoClient;

	// Connection URL. This is where your mongodb server is running.
	var url = mongoURL; //'mongodb://localhost:27017/webcrm_documentation';

	var _db;
	var definedAdminTablesArr = new Array("systems", "Country", "availability", "authentication_token", "email_queue", "system_lists", "system_tables", "tags", "modules", "uk_towns_cities");
	var definedMaintainHistoryTablesArr = new Array("documents", "tokens", "templates");

	module.exports = {
	    mongodb: mongodbRe,
	    MongoClient: MongoClient,
	    mongoConnUrl: url,
	    mongoPort: mongoPort,
	    mongoHost: mongoHost,
	    dbName: mongoDB,
	    port: dashboardPort,
	    cookieName: "workstation_auth",
	    backendDirectoryPath: '/' + dashboardDir,
	    backendDirectoryName: dashboardDir,
	    adminTablesArr: definedAdminTablesArr,
	    maintainHistoryTablesArr: definedMaintainHistoryTablesArr,
	    historyDatabaseName: mongoHistoryDB,
	    historyDatabaseURL: mongoHistoryURL,
	    system_name: "WORKSTATION_",
	    recipientStr: 'info@WORKSTATION_.org',
	    websiteUrl: 'http://' + appHost + ':' + appPort + '/',
	    appUrl: 'http://' + dashboardHost + ':' + dashboardPort + '/' + dashboardDir
	};