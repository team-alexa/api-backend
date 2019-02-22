const vandium = require( 'vandium' );
const mysql= require('mysql');
const config = require('./config/config.js');
   
     module.exports.handler = vandium.api()
        .GET( (event, context, callback) => {
            var selectQuery
            let teacherId = event.pathParameters.teacherID;
            var connection = mysql.createConnection(config.databaseoptions);
            if (teacherId == null){
                 selectQuery = `CALL getStudentsbyTeacherID(null)`;
            }
            else{
                 selectQuery = `CALL getStudentsbyTeacherID(${teacherId})`;
            }
	        connection.query(selectQuery, function (error, results, fields) { 
               callback( null, results );
	        });
            connection.end();
            
        })
        