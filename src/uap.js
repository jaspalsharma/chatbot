const config = require('./config')
const scpUtils = require('./scpUtils')
const agent = require('superagent')
require('superagent-proxy')(agent)

function formatDateString(oDate){
	let iDay = oDate.getDate();
	let iMonth = oDate.getMonth() + 1;
	let iYear = oDate.getFullYear();

	return iYear + (iMonth > 9 ? '' : '0') + iMonth + (iDay > 9 ? '' : '0') + iDay;
}


function requestRoles(sSystemId, sClient, aRoles, sComments = '', sJwt = null){
	return new Promise((resolve, reject) => {
		var oBody = {
			 "RequestNumber" : "",
			 "GetSimpleItems" : []
		};
		var oBody2 = {"GetRequestedItems":[{"Connector":"RBD","ItemDesc":"0000_BC_AGS_RFC_MAINTENANCE","ProvItemType":"ROL","ProvItemTypeDesc":"Role","ValidFrom":"20190718","ValidTo":"20240718","Comments":"testing"}],"GetUserInfo":[{"Userid":"C5290811","Emptype":"001"}],"RequestType":"002","RequestorId":"C5290811"}


		var oDate = new Date();
		oDate.setDate(oDate.getDate() + 3650);
		const sValidTo = formatDateString(oDate);

		/* Request body JSON format:
		{
		"ValidTo" : "20180528",
		"Connector" : "ISD",
		"ItemDesc" : "01:FI_GEN:DP",
		"Comments" : "Simple request for 01:FI_GEN:DP"
		}
		*/



		for(var j = 0; j < aRoles.length; ++j){
			oBody.GetSimpleItems.push({
				"ValidTo" : sValidTo,
				"Connector" : sSystemId + "_" + sClient,
				"ItemDesc" : aRoles[j],
				"Comments" : sComments


			});
		}


		// Call OData service via destination
		return scpUtils.getDestination(config.PG_DESTINATION)
			.then(oDestination => {
				const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
				const connectivity = vcap_services.connectivity[0].credentials;

				return scpUtils.getConnectivityToken()
					.then(sToken => {
						if(oDestination.Authentication === "BasicAuthentication"){
							// Basic Authentication
							return agent.get(oDestination.URL + "/")
								.set("Proxy-Authorization", "Bearer " + sToken)
								.proxy("http://" + connectivity.onpremise_proxy_host + ":" + connectivity.onpremise_proxy_port)
								.set("Authorization", "Basic " + scpUtils.btoa(oDestination.User + ":" + oDestination.Password))
								.set("accept", "application/json")
								.set("accept-language", "en-US,en;q=0.8")
								.set("Content-Type", "application/json; charset=utf-8")
								.set("X-CSRF-Token", "Fetch")
								.timeout(config.REQUEST_TIMEOUT)
								.then(response => {
									const xcsrf_token =  response.header["x-csrf-token"];
							    const cookies =  response.header["set-cookie"];

									return agent.post(oDestination.URL + "/SimpleRequestSet")
										.set("Proxy-Authorization", "Bearer " + sToken)
										.proxy("http://" + connectivity.onpremise_proxy_host + ":" + connectivity.onpremise_proxy_port)
										.set("Authorization", "Basic " + scpUtils.btoa(oDestination.User + ":" + oDestination.Password))
										.set("accept", "application/json")
										.set("accept-language", "en-US,en;q=0.8")
										.set("Content-Type", "application/json; charset=utf-8")
										.set("X-CSRF-Token", xcsrf_token)
										.set("Cookie", cookies)
										.timeout(config.REQUEST_TIMEOUT)
										.send(oBody2)
										.then(res => {
											return resolve(res);
										})
										.catch(err => {
											return reject(err);
										})

									})
									.catch(err => {
										return reject(err);
									})

						}else{
							// Principal propagation
							return agent.get(oDestination.URL + "/sap/ZFIO_ARM_REQUEST_SRV/")
								.set("Proxy-Authorization", "Bearer " + sToken)
								.proxy("http://" + connectivity.onpremise_proxy_host + ":" + connectivity.onpremise_proxy_port)
								.set("SAP-Connectivity-Authentication", sJwt)
								.set("accept", "application/json")
								.set("accept-language", "en-US,en;q=0.8")
								.set("Content-Type", "application/json; charset=utf-8")
								.set("X-CSRF-Token", "Fetch")
								.timeout(config.REQUEST_TIMEOUT)
								.then(response => {
									const xcsrf_token =  response.header["x-csrf-token"];
				          const cookies =  response.header["set-cookie"];

									return agent.post(oDestination.URL + "/sap/ZFIO_ARM_REQUEST_SRV/SimpleRequestSet")
										.set("Proxy-Authorization", "Bearer " + sToken)
										.proxy("http://" + connectivity.onpremise_proxy_host + ":" + connectivity.onpremise_proxy_port)
										.set("SAP-Connectivity-Authentication", sJwt)
										.set("accept", "application/json")
										.set("accept-language", "en-US,en;q=0.8")
										.set("Content-Type", "application/json; charset=utf-8")
										.set("X-CSRF-Token", xcsrf_token)
										.set("Cookie", cookies)
										.timeout(config.REQUEST_TIMEOUT)
										.send(oBody)
										.then(res => {
											return resolve(res);
										})
										.catch(err => {
											return reject(err);
										})
								})
								.catch(err => {
									return reject(err);
								})
						}
					})
					.catch(err => {
						return reject(err);
					})
			})
			.catch(err => {
				return reject(err);
			});
	});
}

module.exports = {
  requestRoles
}
