const mysql = require('mysql');
const config = require('./config/config.js');
var Promise = require('bluebird');
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
	querypromise(sql,callback) {
		return new Promise(function(resolve,reject) {
			this.connection = mysql.createConnection(config.databaseoptions);
			this.connection.query(sql, function(error, results, fields) {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			});
		})
	}
	end() {
		this.connection.end();
	}

}
module.exports = Database;