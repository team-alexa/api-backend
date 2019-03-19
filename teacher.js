const vandium = require('vandium');
const Database = require('./database.js');
const mysql = require('mysql');
const config = require('./config/config.js');

module.exports.handler = vandium.api()
	.headers({
		"Access-Control-Allow-Origin": "*"
	})
	.GET((event, context, callback) => {
		let index = event.queryStringParameters.index;
		var selectQuery = 'SELECT * FROM  nextdoormilwaukeedb.Teachers t';
		var queryStringParams = Object.keys(event.queryStringParameters);
		var firstParam = true;
		if (queryStringParams.length != 0) {
			selectQuery += ` where`;
			queryStringParams.map(query => {
				if (query != 'index') {
					if (firstParam) {
						firstParam = false
					} else {
						selectQuery += ` and`;
					}
					if (query != 'fullName') {
						selectQuery += ` t.${query}='${event.queryStringParameters[query]}'`
					} else {
						selectQuery += ` t.${query} like '%${event.queryStringParameters[query]}%'`
					}
				}
			})
		}

		if (index != null) {
			selectQuery += ` limit ${index},25;`
		}
		var database = new Database();
		database.query(selectQuery, callback);
		database.end();

	})
	.POST({
		body: {
			method: vandium.types.string().valid('new', 'update', 'delete').required(),
			teacherID: vandium.types.number().min(0).max(999999).required(),
			firstName: vandium.types.string().min(0).max(50).required(),
			lastName: vandium.types.string().min(0).max(50).required(),
			nickName: vandium.types.string().allow('').min(0).max(50),
		}
	}, (event, context, callback) => {
		switch (event.body.method) {
			case "new":
				var insertQuery = `INSERT INTO nextdoormilwaukeedb.Teachers(teacherID,firstName,lastName,fullName,nickName) VALUES`
				insertQuery += `(${event.body.teacherID},'${event.body.firstName}','${event.body.lastName}','${event.body.firstName} ${event.body.lastName}',${event.body.nickName ? "'" + event.body.nickName+ "'" : 'NULL'});`
				var database = new Database();
				database.query(insertQuery, callback);
				database.end();

				break;
			case "update":
				callback(null, "Not implemented yet");
				break;
			case "delete":
				callback(null, "Not implemented yet");
				break;
		}

	});