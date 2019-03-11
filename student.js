const vandium = require( 'vandium' );
const mysql= require('mysql');
const config = require('./config/config.js');
   
     module.exports.handler = vandium.api()
        .GET( (event, context, callback) => {
          let index = event.queryStringParameters.index;
          var selectQuery='SELECT * FROM  nextdoormilwaukeedb.Students s';
        var queryStringParams=Object.keys(event.queryStringParameters);
        var firstParam=true;
        if (queryStringParams.length!=0){
            selectQuery+=` where`;
            queryStringParams.map(query => {
                if(query !='index'){
                    if(firstParam){
                         firstParam=false
                    }
                    else{
                         selectQuery+=` and`;
                    }
                    if (query !='fullName'){
                    selectQuery+=` s.${query}='${event.queryStringParameters[query]}'`
                    }
                    else{
                         selectQuery+=` s.${query} like '%${event.queryStringParameters[query]}%'` 
                    }
                }
                })
                    
        }
        if(index!=null){
            selectQuery+=` limit ${index},25;`
        }
 
        var connection = mysql.createConnection(config.databaseoptions);
        connection.query(selectQuery, function (error, results, fields) { 
         if (error) { callback(null,error) }
         callback( null,
            {
                 "statusCode": 200,
                 "headers": { 
                     "Access-Control-Allow-Origin": "*"
                 },
                 "body":results
            });
        });
        connection.end();
            
        })
        