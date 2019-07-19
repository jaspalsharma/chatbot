const config = require('./config')
const xsenv = require('@sap/xsenv')
const agent = require('superagent')

// Base64 encoding
function btoa(str) {
	return new Buffer(str).toString('base64');
};

// Base64 decoding
function atob(str){
	return new Buffer(str, 'base64').toString();
}

// Parsing JWT
function parseJwtToken(sToken) {
  var base64Url = sToken.split('.')[1];
  var base64userdata = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64userdata));
}

function getUserProvidedService(sServiceName) {
	let oCredentials = null;
	const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
	const ups = vcap_services['user-provided'];

	if(!ups){
		return null;
	}

	for(let i = 0; i < ups.length; i++){
		if(ups[i].name === sServiceName){
			oCredentials = ups[i].credentials;
		}
	}

	return oCredentials;
}

function getConnectivityToken() {
	return new Promise((resolve, reject) => {
		var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
		var connectivity = vcap_services.connectivity[0].credentials;

		agent.post(connectivity.url + '/oauth/token')
			.set('Authorization', 'Basic ' + btoa(connectivity.clientid + ":" + connectivity.clientsecret))
			.send('client_id=' + connectivity.clientid)
      .send('grant_type=client_credentials')
			.then(res => {
				var token = res.body.access_token;

				return resolve(token);
			})
			.catch(err => {
				return reject(err);
			})
	})
}

// Get destination details
function getDestination(destinationName) {
  return new Promise((resolve, reject) => {
    var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
    var destination = vcap_services.destination[0].credentials;

    agent.post(destination.url + '/oauth/token')
      .set('Authorization', 'Basic ' + btoa(destination.clientid + ":" + destination.clientsecret))
      .send('client_id=' + destination.clientid)
      .send('grant_type=client_credentials')
      .then(res => {
        var token = res.body.access_token;

        agent.get(destination.uri + '/destination-configuration/v1/destinations/' + destinationName)
          .set('Authorization', 'Bearer ' + token)
          .send()
          .then(response => {
            return resolve(response.body.destinationConfiguration);
          })
          .catch(err => {
            return reject(err);
          })

      })
      .catch(err => {
        return reject(err);
      })

  })
}

module.exports = {
	atob,
	btoa,
  parseJwtToken,
	getConnectivityToken,
  getDestination,
	getUserProvidedService,
}
