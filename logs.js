const vandium = require( 'vandium' );
const mysql= require('mysql');
const config = require('./config/config.js');
   
     module.exports.handler = vandium.api()
        .GET( (event, context, callback) => {
          let index = event.queryStringParameters.index;
          var selectQuery='SELECT * FROM  nextdoormilwaukeedb.logs l';
        var queryStringParams=Object.keys(event.queryStringParameters);
        var firstParam=true;
        if (queryStringParams.length!=0){
            selectQuery+=` where`;
            queryStringParams.map(query => {
                if(query !='index')
                    if(firstParam){
                         firstParam=false
                    }
                    else{
                         selectQuery+=` and`;  
                    }
                    selectQuery+=` l.${query}='${event.queryStringParameters[query]}'`
                })
                    
        }
        if(index!=null){
            selectQuery+=` limit ${index},25;`
        }
        var connection = mysql.createConnection(config.databaseoptions);
	      connection.query(selectQuery, function (error, results, fields) { 
                
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
        