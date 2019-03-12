const vandium = require('vandium');
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
            studentID: vandium.types.number().min(0).max(999999).required(),
            firstName: vandium.types.string().min(0).max(50).required(),
            lastName: vandium.types.string().min(0).max(50).required(),
            birthDate: vandium.types.date().required(),
            foodAllergies: vandium.types.string().allow('').min(0).max(50),
            medical: vandium.types.string().allow('').min(0).max(150),
            teacherID: vandium.types.number().min(0).max(999999).required().required(),
            nickName: vandium.types.string().allow('').min(0).max(50),
        }
    }, (event, context, callback) => {
        switch (event.body.method) {
            case "new":
                var jsonBirthDate = new Date(event.body.birthDate);
                var insertQuery = `INSERT INTO nextdoormilwaukeedb.Students(studentID,firstName,lastName,fullName,birthDate,foodAllergies,medical,teacherID,nickName) VALUES`
                insertQuery += `(${event.body.studentID},'${event.body.firstName}','${event.body.lastName}','${event.body.firstName} ${event.body.lastName}','${jsonBirthDate.getFullYear()}-${jsonBirthDate.getMonth()}-${jsonBirthDate.getDate()}',${event.body.foodAllergies ? "'" + event.body.foodAllergies+ "'" : 'NULL'},${event.body.medical ? "'" + event.body.medical+ "'" : 'NULL'},${event.body.teacherID},${event.body.nickName ? "'" + event.body.nickName+ "'" : 'NULL'});`
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
                break;
            case "update":
                callback(null, "Not implemented yet");
                break;
            case "delete":
                callback(null, "Not implemented yet");
                break;
        }

    });