const vandium = require('vandium');
const config = require('./config/config.js');
const Database = require('./database.js');
const mysqlpromise = require('promise-mysql');
module.exports.handler = vandium.api()
	.headers(
	{
		"Access-Control-Allow-Origin": "*"
	})
	.protection(
	{

		// "fail" mode will prevent execution of the method handler
		mode: 'fail'
	})
	.GET(
		{
			queryStringParameters: {
			index: vandium.types.number().min(0).max(999999),
			studentID: vandium.types.number().min(0).max(999999),
			logID: vandium.types.number().min(0).max(999999),
			studentNickName: vandium.types.string().min(0).max(50),
			studentFullName: vandium.types.string().min(0).max(50),
			teacherNickName: vandium.types.string().min(0).max(50),
			teacherFullName: vandium.types.string().min(0).max(50),
			teacherID: vandium.types.number().min(0).max(999999),
			date: vandium.types.string().min(1).max(10),
			activityType: vandium.types.string().valid('Food', 'Nap', 'Diaper', 'Injury', 'Accomplishment', 'Activity', 'Needs', 'Anecdotal'),
			activityDetails: vandium.types.string().allow('').min(0).max(1000),
			}
		},
		(event, context, callback) =>
		{
			var index=null;
			var selectQuery = 'SELECT l.logID,l.teacherID,l.studentID,l.activityDetails,l.activityType,l.date,s.fullName AS studentFullName, t.fullName AS teacherFullName FROM nextdoormilwaukeedb.logs l ';
			selectQuery += 'LEFT JOIN nextdoormilwaukeedb.Students s '
			selectQuery += `ON l.studentID=s.studentID `
			selectQuery += 'LEFT JOIN  nextdoormilwaukeedb.Teachers t '
			selectQuery += 'ON l.teacherID = t.teacherID '
			if(event.queryStringParameters.index){
				index=event.queryStringParameters.index
				delete event.queryStringParameters.index;
			}
			var queryStringParams = Object.keys(event.queryStringParameters);
			var firstParam = true;
			if (queryStringParams.length != 0)
			{
				queryStringParams.map((query,i) =>
				{
					if (query != 'index')
					{
						if (firstParam)
						{
							selectQuery += ` where`;
							firstParam = false
						}
						switch (query)
						{
							case "date":
								selectQuery += ` DATE_FORMAT(l.date,'%m-%d-%Y') like '%${event.queryStringParameters[query]}%' or DATE_FORMAT(l.date,'%m-%d-%y') like '%$${event.queryStringParameters[query]}%'`
								break;
							case "studentFullName":
								selectQuery += ` s.fullName like '%${event.queryStringParameters.studentFullName}%'`
								break;
							case "teacherFullName":
								selectQuery += ` t.fullName like '%${event.queryStringParameters.teacherFullName}%'`
								break;
							default:
								selectQuery += ` l.${query}='${event.queryStringParameters[query]}'`
								break;
						}
						if (i!=queryStringParams.length-1){
							selectQuery += ` and`;
						}
					}
				})
			}
			selectQuery += ' ORDER BY l.date DESC'
			if (index)
			{
				selectQuery += ` limit ${index},25`
			}
			selectQuery += ';'
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
			logID: vandium.types.number().min(0).max(999999),
			studentNickName: vandium.types.string().min(0).max(50),
			teacherNickName: vandium.types.string().min(0).max(50),
			teacherID: vandium.types.number().min(0).max(999999),
			activityType: vandium.types.string().valid('Food', 'Nap', 'Diaper', 'Injury', 'Accomplishment', 'Activity', 'Needs', 'Anecdotal'),
			activityDetails: vandium.types.string().allow('').min(0).max(1000),
		}
	}, (event, context, callback) =>
	{
		switch (event.body.method)
		{
			case "new":
				if (event.body.studentID != null && event.body.teacherID != null)
				{
					var insertQuery = `INSERT INTO nextdoormilwaukeedb.logs (teacherID,studentID,activityDetails,activityType,date) VALUES`;
					insertQuery += `(${event.body.teacherID},${event.body.studentID},'${event.body.activityDetails ? "'" + event.body.activityDetails+ "'" : 'NULL'}','${event.body.activityType}',NOW());`;
					var database = new Database();
					database.query(insertQuery, callback);
					database.end();
				}
				else if (event.body.studentNickName != null && event.body.teacherNickName != null)
				{
					var teacherID;
					var studentID;
					var connection;
					var selectQueryteacherID = `SELECT  teacherID FROM  nextdoormilwaukeedb.Teachers t where t.nickName SOUNDS LIKE '${event.body.teacherNickName}';`;
					var selectQuerystudentID = `SELECT  studentID FROM  nextdoormilwaukeedb.Students s where s.nickName SOUNDS LIKE ' ${event.body.studentNickName}';`;
					var insertQuery2 = `INSERT INTO nextdoormilwaukeedb.logs (teacherID,studentID,activityDetails,activityType,date) VALUES`;
					mysqlpromise.createConnection(config.databaseoptions)
						.then(function (conn)
						{
							connection = conn;
							return connection.query(selectQueryteacherID + selectQuerystudentID);
						}).then(function (results)
						{
							if(results[0].length==0){
								callback(null,
									{
										"statusCode": 200,
										"body": "Teacher nickname not found"
									});
								}
							else if(results[1].length==0){
								callback(null,
									{
										"statusCode": 200,
										"body": "Student nickname not found"
									});
							}
							insertQuery2 += `(${results[0][0].teacherID},${studentID=results[1][0].studentID},${event.body.activityDetails ? "'" + event.body.activityDetails+ "'" : 'NULL'},'${event.body.activityType}',NOW());`;
							var result = connection.query(insertQuery2);
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
					callback(null, "invalid combination");
				}
				break;
			case "update":
				var updateQuery = `UPDATE nextdoormilwaukeedb.logs l SET`
				var postParams = Object.keys(event.body);
				var firstParam = true;
				postParams.map(param =>
				{
					if (param != 'method')
					{
						if (firstParam)
						{
							firstParam = false
						}
						else
						{
							updateQuery += `,`;
						}
						updateQuery += ` l.${param}='${event.body[param]}'`
					}
				})
				updateQuery += ` WHERE l.logID = ${event.body.logID};`
				var database = new Database();
				database.query(updateQuery, callback);
				database.end();

				break;
			case "delete":
				var deleteQuery = `DELETE FROM nextdoormilwaukeedb.logs WHERE logID=${event.body.logID} ;`
				var database = new Database();
				database.query(deleteQuery, callback);
				database.end();
				break;
		}
	});
	function formatDate(date)
{
	var formattedDate = new Date(date);
	return `${formattedDate.getMonth()}-${formattedDate.getDate()}-${formattedDate.getFullYear()}`;
}