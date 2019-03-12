const vandium = require('vandium');
const mysql = require('mysql');
const config = require('./config/config.js');

module.exports.handler = vandium.api()
    .headers({
        "Access-Control-Allow-Origin": "*"
    })
    .GET((event, context, callback) => {
        let index = event.queryStringParameters.index;
        var selectQuery = 'SELECT * FROM  nextdoormilwaukeedb.logs l';
        var queryStringParams = Object.keys(event.queryStringParameters);
        var firstParam = true;
        if (queryStringParams.length != 0) {
            selectQuery += ` where`;
            queryStringParams.map(query => {
                if (query != 'index')
                    if (firstParam) {
                        firstParam = false
                    } else {
                        selectQuery += ` and`;
                    }
                selectQuery += ` l.${query}='${event.queryStringParameters[query]}'`
            })

        }
        if (index != null) {
            selectQuery += ` limit ${index},25;`
        }
        var connection = mysql.createConnection(config.databaseoptions);
        connection.query(selectQuery, function(error, results, fields) {
            if (error) {
                callback(null,

                    {
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

    })
    .POST({

        body: {
            method: vandium.types.string().valid('new', 'update', 'delete').required(),
            studentID: vandium.types.number().min(0).max(999999),
            studentNickName: string().min(0).max(50),
            teacherNickName: string().min(0).max(50),
            teacherID: vandium.types.number().min(0).max(999999),
            activityType: vandium.types.string().valid('Food', 'Nap', 'Diaper', 'Injury', 'Accomplishment', 'Activity', 'Needs', 'Anecdotal').required(),
            activityDetails: vandium.types.string().allow('').min(0).max(150)
        }
    }, (event, context, callback) => {
        switch (event.body.method) {
            case "new":
                if (event.body.studentID != null && event.body.teacherID != null) {
                    var insertQuery = `INSERT INTO nextdoormilwaukeedb.logs (teacherID,studentID,activityDetails,activityType,time) VALUES`
                    insertQuery += `(${event.body.teacherID},${event.body.studentID},'${event.body.activityDetails ? "'" + event.body.activityDetails+ "'" : 'NULL'}','${event.body.activityType}',NOW());`
                    var connection = mysql.createConnection(config.databaseoptions);
                    connection.query(insertQuery, function(error, results, fields) {
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
            case "update":
                callback(null, "Not implemented yet");
                break;
            case "delete":
                callback(null, "Not implemented yet");
                break;
        }
    });