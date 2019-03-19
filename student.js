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
		var selectQuery = 'SELECT * FROM  nextdoormilwaukeedb.Students s';
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
						selectQuery += ` s.${query}='${event.queryStringParameters[query]}'`
					} else {
						selectQuery += ` s.${query} like '%${event.queryStringParameters[query]}%'`
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
			studentID: vandium.types.number().min(0).max(999999).required(),
			updatedstudentID: vandium.types.number().min(0).max(999999),
			firstName: vandium.types.string().min(0).max(50),
			lastName: vandium.types.string().min(0).max(50),
			birthDate: vandium.types.date(),
			foodAllergies: vandium.types.string().allow('').min(0).max(50),
			medical: vandium.types.string().allow('').min(0).max(150),
			teacherID: vandium.types.number().min(0).max(999999),
			nickName: vandium.types.string().allow('').min(0).max(50),
		}
	}, (event, context, callback) => {
		switch (event.body.method) {
			case "new":
				var jsonBirthDate = new Date(event.body.birthDate);
				var insertQuery = `INSERT INTO nextdoormilwaukeedb.Students(studentID,firstName,lastName,fullName,birthDate,foodAllergies,medical,teacherID,nickName) VALUES`
				insertQuery += `(${event.body.studentID},'${event.body.firstName}','${event.body.lastName}','${event.body.firstName} ${event.body.lastName}','${jsonBirthDate.getFullYear()}-${jsonBirthDate.getMonth()}-${jsonBirthDate.getDate()}',${event.body.foodAllergies ? "'" + event.body.foodAllergies+ "'" : 'NULL'},${event.body.medical ? "'" + event.body.medical+ "'" : 'NULL'},${event.body.teacherID},${event.body.nickName ? "'" + event.body.nickName+ "'" : 'NULL'});`
				var database = new Database();
				database.query(insertQuery, callback);
				database.end();
				break;
			case "update":
				var updateQuery = 'UPDATE nextdoormilwaukeedb.Students s SET'
				if (event.body.updatedstudentID != null) {
					var postParams = Object.keys(event.body);
					var firstParam = true;
					var connection = mysql.createConnection(config.databaseoptions);
					postParams.map(param => {
						if (param != 'method' && param != 'studentID' && param != 'updatedstudentID' && param != 'birthDate') {
							if (firstParam) {
								firstParam = false
							} else {
								updateQuery += `,`;
							}
							updateQuery += ` s.${param}='${event.body[param]}'`
						}
					})
					if (event.body.birthDate != null) {
						var jsonBirthDate = new Date(event.body.birthDate);
						updateQuery += `s.birthDate='${jsonBirthDate.getFullYear()}-${jsonBirthDate.getMonth()}-${jsonBirthDate.getDate()},`
					}
					updateQuery += `, s.studentID=${event.body.updatedstudentID},`
					if (event.body.firstName == null || event.body.lastName == null) {
						var NameQuery = `SELECT firstName, lastName FROM  nextdoormilwaukeedb.Students s where s.studentID=${event.body.studentID}`
						connection.query(NameQuery, function(error, results, fields) {
							if (error) {
								callback(null, {
									"statusCode": 400,
									"body": error
								});
							}
							if (event.body.firstName == null) {
								updateQuery += `s.fullName=${results[0].firstName} ${event.body.lastName},`
							} else {
								updateQuery += `s.fullName='${event.body.firstName} ${results[0].lastName} $',`
							}
						});
						connection.end();
					} else {
						updateQuery += `, s.fullName='${event.body.firstName} ${event.body.lastName}',`
					}
					updateQuery += ` WHERE s.studentID='${event.body.studentID};`
					callback(null, updateQuery);
					connection.query(updateQuery, function(error, results, fields) {
						if (error) {
							callback(null, {
								"statusCode": 400,
								"body": error
							});
						}
						callback(null, {
							"statusCode": 200,
							"body": results
						});
					});
					connection.end();
				}
				break;
			case "delete":
				callback(null, "Not implemented yet");
				break;
		}

	});