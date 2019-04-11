const mysql = require('mysql');
const config = require('./config/config.js');
class Database {
	constructor() {
		this.connection = mysql.createConnection(config.databaseoptions);
	}
	query(sql, callback) {
		this.connection.query(sql, function(error, results, fields) {
			if (error) {
				return callback(null, {
					"statusCode": 400,
					"body": error
				});
			}
			return callback(null, {
				"statusCode": 200,
				"body": results
			});
		});
	}
	queryInsert(sql, callback) {
		this.connection.query(sql, function(error, results, fields) {
			if (error) {
				return callback(null, {
					"statusCode": 400,
					"body": error
				});
			}
			return callback(null, {
				"statusCode": 200,
				"body": results.insertId
			});
		});
	}
	end() {
		this.connection.end();
	}

}
module.exports = Database;