const config = require('./config')
const oLogger = require('./logger')
const scpUtils = require('./scpUtils')
const hdb = require('@sap/hana-client')

const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
const oDBCredentials = scpUtils.getUserProvidedService(config.DB_CREDENTIALS_SERVICE_NAME);
let oDBConnectionInfo;
try{
	oDBConnectionInfo = vcap_services['hana-db'][0].credentials;
}catch(ex){
	oLogger.log("error", "ERROR connecting to database, could not retrieve hana-db service credentials");
	oLogger.log("error", ex);
	return;
}

const connOptions = {
  host: oDBConnectionInfo.host,
	port: oDBConnectionInfo.port,
  uid: oDBCredentials.User,
  pwd: oDBCredentials.Password,
	sslCryptoProvider: "openssl",
	sslTrustStore: oDBConnectionInfo.certificate,
	encrypt: true
};

function selectRoles(oConn, sDescription, sSystemId = null, iClient = null, fFuzzyThreshold = 0.4) {
	return new Promise((resolve, reject) => {
		var sBaseSql;
		var aPlaceholders = [sDescription, fFuzzyThreshold];
		if(sSystemId && iClient){
			sBaseSql = `SELECT * FROM AMSBOT.ROLES
									WHERE CONTAINS(description, ?, FUZZY(?))
									AND SYSID = ? || '_' || ?
									ORDER BY SCORE() DESC;`;

			aPlaceholders.push(sSystemId);
			aPlaceholders.push(iClient);
		}else{
			sBaseSql = `SELECT * FROM AMSBOT.ROLES
									WHERE CONTAINS(description, ?, FUZZY(?))
									ORDER BY SCORE() DESC;`;
		}

		oConn.prepare(sBaseSql, (err, stmt) => {
			if(err){
	      oLogger.log("error", err);
				return reject(err);
	    }else{
	      stmt.exec(aPlaceholders, (err, rows) => {
					if(err){
		        oLogger.log("error", err);
		      	return reject(err);
		      }else{
		        return resolve(rows);
		      }
				});
	    }
		});
	});
}

function getRolesByDescription(sDescription, sSystemId = null, iClient = null, fFuzzyThreshold = 0.4) {
	return new Promise((resolve, reject) => {
		var conn = hdb.createConnection();

		conn.connect(connOptions, (err) => {
			if(err){
				oLogger.log("error", err);
				return reject(err);
			}else{
				oLogger.log("info", "HANA database connection successfully established.");

				selectRoles(conn, sDescription, sSystemId, iClient, fFuzzyThreshold)
					.then(aRows => {
						conn.disconnect();
						conn = null;
						return resolve(aRows);
					})
					.catch(err => {
						oLogger.log("error", err);
						return reject(err);
					});
			}
		});
	});
}

function saveFeedback(iRating, sFeedback) {
	return new Promise((resolve, reject) => {
		var conn = hdb.createConnection();

		conn.connect(connOptions, (err) => {
			if(err){
				oLogger.log("error", err);
				return reject(err);
			}else{
				const sSql = "INSERT INTO AMSBOT.FEEDBACK(RATING, COMMENT) VALUES(?, ?)";
				const aPlaceholders = [iRating, sFeedback];

				conn.prepare(sSql, (err, stmt) => {
					if(err){
						oLogger.log("error", err);
						return reject(err);
					}else{
						stmt.exec(aPlaceholders, (err, rows) => {
							if(err){
				        oLogger.log("error", err);
				      	return reject(err);
				      }else{
				        return resolve(true);
				      }
						});
					}
				});
			}
		});
	});
}

process.on('exit', () => {
	conn.disconnect();
});

module.exports = {
  getRolesByDescription,
	saveFeedback
};
