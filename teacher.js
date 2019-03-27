const vandium = require('vandium');
const Database = require('./database.js');
const mysql = require('mysql');
const config = require('./config/config.js');
var mysqlpromise = require('promise-mysql');
module.exports.handler = vandium.api()
	.headers({
		"Access-Control-Allow-Origin": "*"
	})
	.protection( {

		// "fail" mode will prevent execution of the method handler
		mode: 'fail'
	})
	.GET((event, context, callback) => {
		let index = event.queryStringParameters.index;
		var selectQuery = 'SELECT * FROM  nextdoormilwaukeedb.Teachers t';
		var queryStringParams = Object.keys(event.queryStringParameters);
		var firstParam = true;
		if (queryStringParams.length != 0) {
			queryStringParams.map(query => {
				if (query != 'index') {
					if (firstParam) {
						selectQuery += ` where`;
						firstParam = false
					} else {
						selectQuery += ` and`;
					}
					if (query == 'fullName') {
						selectQuery += ` t.${query} like '%${event.queryStringParameters[query]}%'`
					} else {
						selectQuery += ` t.${query}='${event.queryStringParameters[query]}'`	
					}
				}
			})
		}
		selectQuery+=' ORDER BY t.lastName ASC'
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
			updatedteacherID: vandium.types.number().min(0).max(999999),
			firstName: vandium.types.string().min(0).max(50),
			lastName: vandium.types.string().min(0).max(50),
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
			var updateQuery = 'UPDATE nextdoormilwaukeedb.Teachers t SET'
			var postParams = Object.keys(event.body);
			var firstParam = true;
			postParams.map(param =>
			{
				if (param != 'method' && param != 'teacherID' && param != 'updatedteacherID')
				{
					if (firstParam)
					{
						firstParam = false
					}
					else
					{
						updateQuery += `,`;
					}
						updateQuery += ` t.${param}='${event.body[param]}'`
				}
			})
			if (event.body.updatedteacherID != null)
			{
			updateQuery += `, t.teacherID=${event.body.updatedteacherID},`
			}
			else{
			updateQuery += `, t.teacherID=${event.body.teacherID},`
			}
			if (event.body.firstName == null || event.body.lastName == null)
			{
				var connection;
				var NameQuery = `SELECT firstName, lastName FROM  nextdoormilwaukeedb.Teachers t where t.teacherID=${event.body.teacherID}`
				mysqlpromise.createConnection(config.databaseoptions)
					.then(function (conn)
					{
						connection = conn;
						return connection.query(NameQuery);
					}).then(function (results)
					{
						if (event.body.firstName == null)
						{
							updateQuery += `t.fullName=${results[0].firstName} ${event.body.lastName}`
						}
						else
						{
							updateQuery += `t.fullName='${event.body.firstName} ${results[0].lastName}'`
						}
						updateQuery += ` WHERE t.teacherID=${event.body.teacherID};`
						var result = connection.query(updateQuery);
						return result;
					}).then(function (results)
					{
						callback(null,
						{
							"statusCode": 200,
							"body": results
						});
						connection.end();
					})
					.catch(function (error)
					{
						if (connection && connection.end) connection.end();
						callback(null,
						{
							"statusCode": 400,
							"body": error
						});
					});

			}
			else
			{
				updateQuery += `t.fullName='${event.body.firstName} ${event.body.lastName}'`
				updateQuery += ` WHERE t.teacherID=${event.body.teacherID};`
				var database = new Database();
				database.query(updateQuery, callback);
				database.end();
			}
				break;
			case "delete":
				var deleteQuery = `DELETE FROM nextdoormilwaukeedb.Teachers WHERE teacherID=${event.body.teacherID};`
				var database = new Database();
				database.query(deleteQuery, callback);
				database.end();
				break;
		}

	});