const vandium = require('vandium');
const Database = require('./database.js');
const config = require('./config/config.js');
const mysqlpromise = require('promise-mysql');
module.exports.handler = vandium.api()
	.headers(
	{
		"Access-Control-Allow-Origin": "*"
	})
	.protection( {

		// "fail" mode will prevent execution of the method handler
		mode: 'fail'
	})
	.GET((event, context, callback) =>
	{
		let index = event.queryStringParameters.index;
		var selectQuery = 'SELECT * FROM  nextdoormilwaukeedb.Students s';
		var queryStringParams = Object.keys(event.queryStringParameters);
		var firstParam = true;
		if (queryStringParams.length != 0)
		{
			queryStringParams.map(query =>
			{
				if (query != 'index')
				{
					if (firstParam)
					{
						selectQuery += ` where`;
						firstParam = false
					}
					else
					{
						selectQuery += ` and`;
					}
					if (query != 'fullName')
					{
						selectQuery += ` s.${query}='${event.queryStringParameters[query]}'`
					}
					else
					{
						selectQuery += ` s.${query} like '%${event.queryStringParameters[query]}%'`
					}
				}
			})

		}
		selectQuery+=' ORDER BY s.lastName ASC'
		if (index != null)
		{
			selectQuery += ` limit ${index},25;`
		}

		var database = new Database();
		database.query(selectQuery, callback);
		database.end();
	})
	.POST(
	{

		body:
		{
			method: vandium.types.string().valid('new', 'update', 'delete').required(),
			studentID: vandium.types.number().min(0).max(999999),
			updatedstudentID: vandium.types.number().min(0).max(999999),
			firstName: vandium.types.string().min(0).max(50),
			lastName: vandium.types.string().min(0).max(50),
			birthDate: vandium.types.date(),
			foodAllergies: vandium.types.string().allow('').min(0).max(50),
			medical: vandium.types.string().allow('').min(0).max(150),
			teacherID: vandium.types.number().min(0).max(999999),
			nickName: vandium.types.string().allow('').min(0).max(50),
		}
	}, (event, context, callback) =>
	{
		switch (event.body.method)
		{
			case "new":
				if(event.body.studentID!=null){
				var insertQuery = `INSERT INTO nextdoormilwaukeedb.Students(studentID,firstName,lastName,fullName,birthDate,foodAllergies,medical,teacherID,nickName) VALUES`
				insertQuery += `(${event.body.studentID},'${event.body.firstName}','${event.body.lastName}','${event.body.firstName} ${event.body.lastName}','${getBirthDate(event.body.birthDate)}',${event.body.foodAllergies ? "'" + event.body.foodAllergies+ "'" : 'NULL'},${event.body.medical ? "'" + event.body.medical+ "'" : 'NULL'},${event.body.teacherID},${event.body.nickName ? "'" + event.body.nickName+ "'" : 'NULL'});`
				}
				else{
					var insertQuery = `INSERT INTO nextdoormilwaukeedb.Students(studentID,firstName,lastName,fullName,birthDate,foodAllergies,medical,teacherID,nickName) VALUES`
				insertQuery += `(UUID(),'${event.body.firstName}','${event.body.lastName}','${event.body.firstName} ${event.body.lastName}','${getBirthDate(event.body.birthDate)}',${event.body.foodAllergies ? "'" + event.body.foodAllergies+ "'" : 'NULL'},${event.body.medical ? "'" + event.body.medical+ "'" : 'NULL'},${event.body.teacherID},${event.body.nickName ? "'" + event.body.nickName+ "'" : 'NULL'});`
				}
				var database = new Database();
				database.query(insertQuery, callback);
				database.end();
				break;
			case "update":
				var updateQuery = 'UPDATE nextdoormilwaukeedb.Students s SET'
					var postParams = Object.keys(event.body);
					var firstParam = true;
					postParams.map(param =>
					{
						if (param != 'method' && param != 'studentID' && param != 'updatedstudentID')
						{
							if (firstParam)
							{
								firstParam = false
							}
							else
							{
								updateQuery += `,`;
							}
							if (param == 'birthDate')
							{
								updateQuery += ` s.birthDate='${getBirthDate(event.body.birthDate)}'`
							}
							else
							{
								updateQuery += ` s.${param}='${event.body[param]}'`
							}
						}
					})
					if (event.body.updatedstudentID != null)
					{
					updateQuery += `, s.studentID=${event.body.updatedstudentID} ,`
					}
					else{
					updateQuery += `, s.studentID=${event.body.studentID} ,`
					}
					if (event.body.firstName == null || event.body.lastName == null)
					{
						var connection;
						var NameQuery = `SELECT firstName, lastName FROM  nextdoormilwaukeedb.Students s where s.studentID=${event.body.studentID}`
						mysqlpromise.createConnection(config.databaseoptions)
							.then(function (conn)
							{
								connection = conn;
								return connection.query(NameQuery);
							}).then(function (results)
							{
								if (event.body.firstName == null)
								{
									updateQuery += `s.fullName='${results[0].firstName} ${event.body.lastName}',`
								}
								else
								{
									updateQuery += `s.fullName='${event.body.firstName} ${results[0].lastName}',`
								}
								updateQuery += ` WHERE s.studentID=${event.body.studentID};`
								var result = connection.query(updateQuery);
								connection.end();
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
						updateQuery += `s.fullName='${event.body.firstName} ${event.body.lastName}'`
						updateQuery += ` WHERE s.studentID=${event.body.studentID};`
						var database = new Database();
						database.query(updateQuery, callback);
						database.end();
					}
				

				break;
			case "delete":
				var deleteQuery = `DELETE FROM nextdoormilwaukeedb.Students WHERE studentID=${event.body.studentID} ;`
				var database = new Database();
				database.query(deleteQuery, callback);
				database.end();
				break;
		}

	});

function getBirthDate(date)
{
	var jsonBirthDate = new Date(date);
	return `${jsonBirthDate.getFullYear()}-${jsonBirthDate.getMonth()}-${jsonBirthDate.getDate()}`;
}