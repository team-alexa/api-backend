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
			logID: vandium.types.number().min(0).max(999999),
			studentID: vandium.types.number().min(0).max(999999),
			studentNickName: vandium.types.string().min(0).max(50),
			studentFullName: vandium.types.string().min(0).max(50),
			teacherID: vandium.types.number().min(0).max(999999),
			teacherNickName: vandium.types.string().min(0).max(50),
			teacherFullName: vandium.types.string().min(0).max(50),
			date: vandium.types.date(),
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
			if(typeof event.queryStringParameters.index != "undefined"){
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
								selectQuery += ` DATE_FORMAT(l.date,'%m-%d-%Y') like '${formatDate(event.queryStringParameters.date)}'`
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
			if (index!=null)
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
			logID: vandium.types.number().min(0).max(999999),
			studentID: vandium.types.number().min(0).max(999999),
			updatedstudentID: vandium.types.number().min(0).max(999999),
			studentNickName: vandium.types.string().min(0).max(50),
			teacherID: vandium.types.number().min(0).max(999999),
			updatedteacherID: vandium.types.number().min(0).max(999999),
			date:vandium.types.date(),
			teacherNickName: vandium.types.string().min(0).max(50),
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
					insertQuery += `(${event.body.teacherID},${event.body.studentID},${event.body.activityDetails ? "'" + event.body.activityDetails+ "'" : 'NULL'},'${event.body.activityType}',${event.body.date ? "'" + formatDateTime(event.body.date)+ "'" : 'Now()'});`;
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
										"statusCode": 400,
										"body": "Teacher nickname not found"
									});
								}
							else if(results[1].length==0){
								callback(null,
									{
										"statusCode": 410,
										"body": "Student nickname not found"
									});
							}
							insertQuery2 += `(${results[0][0].teacherID},${studentID=results[1][0].studentID},${event.body.activityDetails ? "'" + event.body.activityDetails+ "'" : 'NULL'},'${event.body.activityType}',${event.body.date ? "'" + formatDateTime(event.body.date)+ "'" : 'Now()'});`;
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
					if (param != 'method'&& param!='updatedstudentID'&&param!='updatedteacherID')
					{
						if (firstParam)
						{
							firstParam = false
						}
						else
						{
							updateQuery += `,`;
						}
						switch (param)
						{
							case "updatedstudentID":
								updateQuery += ` l.studentID=${event.body.updatedstudentID}`
								break;
							case "updatedteacherID":
								updateQuery += ` l.teacherID=${event.body.updatedteacherID}`
								break;
							case "date":
								updateQuery += ` l.date='${formatDateTime(event.body.date)}'`
								break;
							default:
								updateQuery += ` l.${param}='${event.body[param]}'`
								break;
						}
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
	 var day = formattedDate.getDate();
    var month = formattedDate.getMonth() + 1; //Month from 0 to 11
    var year = formattedDate.getFullYear();
	return `${(month<=9 ? '0' + month : month)}-${(day <= 9 ? '0' + day : day)}-${year}`;
}
function formatDateTime(date){
	var formattedDateTime = new Date(date);
	return formattedDateTime.toISOString().slice(0, 19).replace('T', ' ');
}