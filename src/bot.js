const config = require('./config')
const oLogger = require('./logger')
const strings = require('./strings')
const db = require('./db')
const scpUtils = require('./scpUtils')
const uap = require('./uap')
const sapcai = require('sapcai').default;
const agent = require('superagent')

const oCaiService = scpUtils.getUserProvidedService(config.CAI_SERVICE_NAME);

const client = new sapcai.build(oCaiService.REQUEST_TOKEN);

/*
* Get the memory for one specific conversation ID
*/
var getMemory = (convid) => {
  return new Promise((resolve, reject) => {
		return agent.get("https://api.cai.tools.sap/build/v1/users/" + oCaiService.USERNAME + "/bots/" + oCaiService.BOTNAME + "/versions/" + oCaiService.BOTVERSION + "/builder/conversation_states/" + convid)
	    .set('Authorization', "Token " + oCaiService.DEVELOPER_TOKEN)
	    .send()
	    .then(res => {
			console.log("getMemory");
	      return resolve(res)
	    })
	    .catch(err => {
	      return reject(err)
	    })
  });
}

/*
* Update the memory for one specific conversation ID
*/
var updateMemory = (memory, merge_memory, convid) => {
  return new Promise((resolve, reject) => {
    return agent.put("https://api.cai.tools.sap/build/v1/users/" + oCaiService.USERNAME + "/bots/" + oCaiService.BOTNAME + "/versions/" + oCaiService.BOTVERSION + "/builder/conversation_states/" + convid)
      .set('Content-Type', "application/json")
      .set('Authorization', "Token " + oCaiService.DEVELOPER_TOKEN)
      .send(JSON.stringify({
              merge_memory: merge_memory, // Attention: this is a string
              memory: memory
            })
      )
      .then(res => {
        return resolve(res);
      })
      .catch(err => {
        return reject(err);
      });
  });
}

var isIntentPresent = (aIntents, sIntent) => {
  for(var i = 0; i < aIntents.length; i++){
    if(aIntents[i].slug === sIntent){
      return true;
    }
  }

  return false;
}

var getMostLikelyIntentByConfidence = (aIntents) => {
  var oIntent = aIntents[0];
  for(var i = 1; i < aIntents.length; i++){
    if(aIntents[i].confidence > oIntent.confidence){
      oIntent = aIntents[i];
    }
  }

  return oIntent.slug;
}

var getChoiceYesNo = (aIntents) => {
  var bChoice = null;

  for (var i = 0; i < aIntents.length; i++) {
    if (aIntents[i].slug === "yes") {
      bChoice = true;
      break;
    } else if (aIntents[i].slug === "no") {
      bChoice = false;
      break;
    }
  }

  return bChoice;
}

var getUserEntity = (aEntities) => {
	if(aEntities.user){
		return aEntities.user[0];
	}

	if(aEntities.number){
		for(var oNumber of aEntities.number){
			if(/\w\d{6}/.test(oNumber.raw)){
				return oNumber;
			}
		}
	}

	return null;
}

/*
* The following functions implement the skills of the bot
*/
const getFallbackMessage = (data) => {
  if(data.conversation.skill_occurences > 2){
    return {
			type: 'text',
			content: strings.get({ phrase: "fallbackfallback", locale: data.conversation.language })
		}
  }else{
    return {
			type: 'text',
			content: strings.getRandom({ phrase: "fallback", locale: data.conversation.language })
		}
  }
}

const getPotentialClientValues = (aEntities) => {
	let aNumericValues = [];
	for(var oVal of aEntities){
		if(/\d\d\d/.test(oVal.raw)){
			aNumericValues.push(oVal);
		}
	}

	return aNumericValues;
}

const isRoleName = (s) => {
	s = s.trim();
	if(!s.includes(" ") && s.includes("_")){
		return true;
	}

	return false;
}

var buildFioriArmLink = (oMemory) => {
	let sLink = config.LAUNCHPAD_APP_URL
							+ "?system=" + encodeURIComponent(oMemory.system.raw)
							+ "&mandant=" + encodeURIComponent(oMemory.client ? oMemory.client.raw : config.DEFAULT_CLIENT)
							+ (oMemory.user ? ("&user=" + encodeURIComponent(oMemory.user.raw)) : "")
							+ (oMemory.roles ? ("&role=" + encodeURIComponent(oMemory.roles[0].raw)) : "");

	return sLink;
}

var roleRequestSummary = (oMemory, sLang) => {
	let sResponseStringId;
	let sRoles = oMemory.roles[0].raw;

	if(oMemory.roles.length > 1){
		sResponseStringId = "rolerequestssummary";
		for(let i = 1; i < oMemory.roles.length; ++i){
			sRoles += ", " + oMemory.roles[i].raw;
		}

	}else{
		sResponseStringId = "rolerequestsummary";
	}

	const aMessages = [{
		type: 'quickReplies',
		content: {
			title: strings.getRandom({ phrase: "rolerequestsummary", locale: sLang }, sRoles, oMemory.system.raw, oMemory.client.raw, oMemory.reason),
			buttons: [
				{
					title: strings.get({ phrase: "yes", locale: sLang }),
					value: strings.get({ phrase: "yes", locale: sLang })
				},
				{
					title: strings.get({ phrase: "no", locale: sLang }),
					value: strings.get({ phrase: "no", locale: sLang })
				}
			]
		}
	}];

	oMemory.askedforconfirmation = true;

	return {
		messages: aMessages,
		memory: oMemory
	};
}

var requestRole = (data) => {
	return new Promise((resolve, reject) => {
		var oMemory = data.conversation.memory;
	  var sLang = data.conversation.language;

		// Keep user id
		var oUser = getUserEntity(data.nlp.entities);
		if(oUser){
			oMemory.user = oUser;
		}

		if(!oMemory.askedforrole && data.nlp.entities.system){
			oMemory.system = data.nlp.entities.system[0];
			oMemory.system.raw = oMemory.system.raw.toUpperCase();
		}

		if(!oMemory.askedforrole && data.nlp.entities.number){
			var aClients = getPotentialClientValues(data.nlp.entities.number);
			if(aClients.length > 0){
				oMemory.client = aClients[0];
			}
		}

		if(!oMemory.roles && data.nlp.entities.role){
			oMemory.roles = data.nlp.entities.role;
		}

	  if(!oMemory.system){
			let sResponseStringId;
			if(isIntentPresent(data.nlp.intents, "request-user")){
				sResponseStringId = "forwhichsystemdoyouneedauser";
			}else{
				sResponseStringId = "forwhichsystemdoyouneedarole";
			}

      var aMessages = [{
        type: 'text',
        content: strings.getRandom({ phrase: sResponseStringId, locale: sLang })
      }];

      return resolve({
        messages: aMessages,
        memory: oMemory
      });
	  }

	  if(!oMemory.roles){
	    if(data.nlp.entities.role){
	      oMemory.roles = data.nlp.entities.role;
				for(let i = 0; i < oMemory.roles.length; ++i){
					oMemory.roles[i].raw = oMemory.roles[i].raw.toUpperCase();
				}

			}else if(isRoleName(data.nlp.source)){
				oMemory.roles = [{ raw: data.nlp.source.trim().toUpperCase() }];

	    }else{
				if(oMemory.system && oMemory.askedforrole){
					if(!oMemory.client){
						// default client ID
						oMemory.client = { raw: config.DEFAULT_CLIENT, value: config.DEFAULT_CLIENT };
					}

					// try freetext search
					return db.getRolesByDescription(data.nlp.source, oMemory.system.raw, oMemory.client.raw)
						.then(aRoles => {
							if(!aRoles || aRoles.length === 0){
								var aMessages = [
									{
										type: 'text',
										content: strings.getRandom({ phrase: "rolenotfound", locale: sLang },
																							 data.nlp.source, oMemory.system.raw, oMemory.client.raw)
									},
									{
										type: 'text',
										content: strings.getRandom({ phrase: "whichrolesdoyouneed", locale: sLang }, oMemory.system.raw)
									}
								];

								delete oMemory.askedforrole;

								return resolve({
									messages: aMessages,
									memory: oMemory
								});

							}

							var sLink = config.LAUNCHPAD_APP_URL
													+ "?system=" + encodeURIComponent(oMemory.system.raw)
													+ "&mandant=" + encodeURIComponent(oMemory.client ? oMemory.client.raw : config.DEFAULT_CLIENT)
													+ (oMemory.user ? "&user=" + encodeURIComponent(oMemory.user.raw) : "")
													+ "&role=";

							var aElements = [];
							for(var oRole of aRoles){
								aElements.push({
									title: oRole.ROLENAME,
									subtitle: oRole.DESCRIPTION,
									imageUrl: "sap-icon://role",
									buttons: [{
										title: `Request role ${oRole.ROLENAME}`,
										type: "web_url",
										value: sLink + encodeURIComponent(oRole.ROLENAME)
									}]
								});
							}

							var aMessages = [
								{
					        type: 'rolelist',
					        content: {
										elements: aElements,
										buttons: []
									}
				      	},
								{
									type: 'buttons',
									content: {
										title: strings.getRandom({ phrase: "doyouneedoneoftheseroles", locale: sLang }, oMemory.system.user),
										buttons: [
											{
												title: 'Request roles',
												value: 'Request roles',
												type: 'postback'
											}
										]
									}
								}
							];

							//delete oMemory.system;
							delete oMemory.askedforrole;
							delete oMemory._current_skill;

				      return resolve({
				        messages: aMessages,
				        memory: oMemory
				      });

						})
						.catch(err => {
							oLogger.log("error", err);

							var aMessages = [{
				        type: 'text',
				        content: strings.getRandom({ phrase: "backenderrorwithmsgtext", locale: sLang }, JSON.stringify(err))
				      }];

							delete oMemory.askedforrole;
							delete oMemory._current_skill;

				      return resolve({
				        messages: aMessages,
				        memory: oMemory
				      });
						});

				}else{
					var aMessages = [{
						type: 'text',
						content: strings.getRandom({ phrase: "whichrolesdoyouneed", locale: sLang }, oMemory.system.raw)
					}];

					oMemory.askedforrole = true;

					return resolve({
						messages: aMessages,
						memory: oMemory
					});
				}
	    }
	  }

		if(!oMemory.reason){
			if(oMemory.askedforreason){
				oMemory.reason = data.nlp.source;

			}else{
				let sMessage;
				if(oMemory.roles.length > 1){
					sMessage = strings.getRandom({ phrase: "enterreasonmutlipleroles", locale: sLang });
				}else{
					sMessage = strings.getRandom({ phrase: "enterreasonsinglerole", locale: sLang })
				}

				aMessages = [{
					type: 'text',
					content: sMessage
				}];

				oMemory.askedforreason = true;

				return resolve({
					messages: aMessages,
					memory: oMemory
				});
			}
		}

		if(!oMemory.client){
			// default client ID
			oMemory.client = { raw: config.DEFAULT_CLIENT, value: config.DEFAULT_CLIENT };
		}

		if(!oMemory.rolerequestconfirmed){
			if(oMemory.askedforconfirmation){
				const bChoice = getChoiceYesNo(data.nlp.intents);
				if(bChoice === null){
					return resolve(roleRequestSummary(oMemory, sLang));

				}else if(bChoice === true){
					oMemory.rolerequestconfirmed = true;

				}else{
					delete oMemory.roles;
					delete oMemory.reason;
					delete oMemory.askedforrole;
					delete oMemory.askedforreason;
					delete oMemory.askedforconfirmation;
					delete oMemory._current_skill;

					const aMessages = [{
						type: 'text',
						content: strings.getRandom({ phrase: "startover", locale: sLang })
					}];

					return resolve({
						messages: aMessages,
						memory: oMemory
					});
				}

			}else{
				return resolve(roleRequestSummary(oMemory, sLang));
			}
		}

		var aRoles = [];
		for(let i = 0; i < oMemory.roles.length; i++){
			aRoles.push(oMemory.roles[i].raw);
		}

		return uap.requestRoles(oMemory.system.raw,
										 oMemory.client ? oMemory.client.raw : config.DEFAULT_CLIENT,
										 aRoles,
									   oMemory.reason ? oMemory.reason : "",
									 	 oMemory.jwt)
			.then(bSuccess => {
				let sResponseStringId;
				if(bSuccess){
					if(oMemory.roles.length > 1){
						sResponseStringId = "successfulrolerequests";
					}else{
						sResponseStringId = "successfulrolerequest";
					}

				}else{
					sResponseStringId = "unsuccessfulrolerequest";
				}

				const aMessages = [
					{
						type: 'text',
					//	content: strings.getRandom({ phrase: sResponseStringId, locale: sLang })
          content: bSuccess.status + ":" + bSuccess[0]+ ":" + bSuccess[1] + ":" + bSuccess[2]+ ":" + bSuccess[3]
					}
				];

				// const aMessages = [
				// 	{
				// 		type: 'requestedroles',
				// 		links: aUrls
				// 	},
				// 	{
				// 		type: 'text',
				// 		content: strings.getRandom({ phrase: sResponseStringId, locale: sLang })
				// 	}
				// ];

				// reset memory
				//delete oMemory.system;
				delete oMemory.roles;
				delete oMemory.reason;
				delete oMemory.askedforrole;
				delete oMemory.askedforreason;
				delete oMemory.askedforconfirmation;
				delete oMemory._current_skill;

				return resolve({
					messages: aMessages,
					memory: oMemory
				});
			})
			.catch(err => {
				oLogger.log("error", "Error in uap.requestRoles");
				oLogger.log("error", err);

				let sLink = buildFioriArmLink(oMemory);

				let sErrorResponse;
				if(err && err.response && err.response.text){
					sErrorResponse = strings.get({ phrase: "backenderrorwithmsgtext", locale: sLang }, err.response.text);
				}else{
					sErrorResponse = strings.get({ phrase: "backenderror", locale: sLang });
				}

				const aMessages = [
					{
						type: 'text',
						content: sErrorResponse
					},
					{
						type: 'buttons',
						content: {
							title: strings.get({ phrase: "clicktorequestrole", locale: sLang }),
							buttons: [{
								title: strings.get({ phrase: "requestrole", locale: sLang }),
								type: 'web_url',
								value: sLink
							}]
						}
					}
				];

				return resolve({
					messages: aMessages,
					memory: oMemory
				});
			})
	})
}

var resetPassword = (data) => {
  var oMemory = data.conversation.memory;
  var sLang = data.conversation.language;
  var sLink = config.PASSWORD_RESET_LINK;

        var aMessages = [{
          type: 'buttons',
          content: {
            title: strings.getRandom({ phrase: "clicktoresetpassword", locale: sLang }),
            buttons: [
              {
                type: 'web_url',
                title: strings.get({ phrase: "yes", locale: sLang }),
                value: sLink
              },
              {
                type: 'postback',
                title: strings.get({ phrase: "no", locale: sLang }),
                value: 'exit'
              }
            ]
          }
        }];
        delete oMemory._current_skill;

        return {
          messages: aMessages,
          memory: oMemory
        };
      }
var substitute = (data) => {
          var oMemory = data.conversation.memory;
          var sLang = data.conversation.language;
          var sLink = config.MY_SUBSTITUTE_LINK;

                var aMessages = [{
                  type: 'buttons',
                  content: {
                    title: strings.getRandom({ phrase: "substitute", locale: sLang }),
                    buttons: [
                      {
                        type: 'web_url',
                        title: strings.get({ phrase: "yes", locale: sLang }),
                        value: sLink
                      },
                      {
                        type: 'postback',
                        title: strings.get({ phrase: "no", locale: sLang }),
                        value: 'exit'
                      }
                    ]
                  }
                }];
                delete oMemory._current_skill;

                return {
                  messages: aMessages,
                  memory: oMemory
                };
              }
var authhistory = (data) => {
                  var oMemory = data.conversation.memory;
                  var sLang = data.conversation.language;
                  var sLink = config.MY_AUTHHISTORY_LINK;

                        var aMessages = [{
                          type: 'buttons',
                          content: {
                            title: strings.getRandom({ phrase: "authhistory", locale: sLang }),
                            buttons: [
                              {
                                type: 'web_url',
                                title: strings.get({ phrase: "yes", locale: sLang }),
                                value: sLink
                              },
                              {
                                type: 'postback',
                                title: strings.get({ phrase: "no", locale: sLang }),
                                value: 'exit'
                              }
                            ]
                          }
                        }];


        	// reset memory
	delete oMemory._current_skill;

  return {
    messages: aMessages,
    memory: oMemory
  };
}

var accessApprover = (data) => {
  var oMemory = data.conversation.memory;
  var sLang = data.conversation.language;
  var sLink = config.MULTI_ACCESS_LINK;

        var aMessages = [{
          type: 'buttons',
          content: {
            title: strings.getRandom({ phrase: "accessapprover", locale: sLang }),
            buttons: [
              {
                type: 'web_url',
                title: strings.get({ phrase: "yes", locale: sLang }),
                value: sLink
              },
              {
                type: 'postback',
                title: strings.get({ phrase: "no", locale: sLang }),
                value: 'exit'
              }
            ]
          }
        }];



        	// reset memory
	delete oMemory._current_skill;

  return {
    messages: aMessages,
    memory: oMemory
  };
}

var myAuthorizations = (data) => {
  var oMemory = data.conversation.memory;
  var sLang = data.conversation.language;
  var sLink = config.MY_AUTHORIZATION_LINK;

        var aMessages = [{
          type: 'buttons',
          content: {
            title: strings.getRandom({ phrase: "myaccess", locale: sLang }),
            buttons: [
              {
                type: 'web_url',
                title: strings.get({ phrase: "yes", locale: sLang }),
                value: sLink
              },
              {
                type: 'postback',
                title: strings.get({ phrase: "no", locale: sLang }),
                value: 'exit'
              }
            ]
          }
        }];



        	// reset memory
	delete oMemory._current_skill;

  return {
    messages: aMessages,
    memory: oMemory
  };
}

var registerSelectedRoles = async (data) => {
	if(!data.convid){
		throw new Error("Need conversation id to request roles.");
	}

	const oBotdata = await getMemory(data.convid);

	let oMemory = oBotdata.body.results.memory;
	if(!oMemory.system){
		throw new Error("Need system id to request roles.");
	}

	if(!oMemory.client){
		// default client ID
		oMemory.client = { raw: config.DEFAULT_CLIENT, value: config.DEFAULT_CLIENT };
	}

	const sSystemId = oMemory.system.raw.toUpperCase();
	const sClient = oMemory.client.raw;
	const aRoles = data.roles;
	const sReason = oMemory.reason ? oMemory.reason : "";

	oMemory.roles = aRoles.map(role => { return {raw: role} });

	return updateMemory(oMemory, "false", data.convid)
		.then(res => {
			return true;
		})
		.catch(err => {
			oLogger.log("error", err);
			throw new Error(err);
		})
}

/*
* Generate a message based on the identified intents and entities;
* the memory field "_current_skill" holds the last intent that was not
* processed completely yet (the field is deleted when the skill is completed)
*
* The memory field "_current_skill" has to be deleted after a skill is completed
*
* To enable this function, you have to disable the fallback skill in the
* bot builder on recast.ai
*/
var getMessageByIntent = (data) =>  {
  return new Promise((resolve, reject) => {
    var oMessage = {};

    if(data.nlp.intents.length === 0 && !data.conversation.memory._current_skill){
      return resolve([getFallbackMessage(data)]);
    }

    // check if a skill is still ongoing / not finished
    var sIntent;
    if(data.conversation.memory._current_skill){
      sIntent = data.conversation.memory._current_skill;

    }else{
      sIntent = getMostLikelyIntentByConfidence(data.nlp.intents);
      data.conversation.memory._current_skill = sIntent;
    }

    switch(sIntent){
      case "request-role":
				requestRole(data)
					.then(oResult => {
						updateMemory(oResult.memory, "false", data.conversation.id);
						return resolve(oResult.messages);
					})
					.catch(err => {
						return reject(err);
					});

        break;

			case "request-user":
				requestRole(data)
					.then(oResult => {
						updateMemory(oResult.memory, "false", data.conversation.id);
						return resolve(oResult.messages);
					})
					.catch(err => {
						return reject(err);
					});

        break;

      case "password-reset":
        var oResult = resetPassword(data);
        updateMemory(oResult.memory, "false", data.conversation.id);
        return resolve(oResult.messages);

        break;
		case "request-services":
        var oResult = requestServices(data);
        updateMemory(oResult.memory, "false", data.conversation.id);
        return resolve(oResult.messages);

        break;

        case "my-auth":
            var oResult = myAuthorizations(data);
            updateMemory(oResult.memory, "false", data.conversation.id);
            return resolve(oResult.messages);

            break;
        case "access-approver":
        var oResult = accessApprover(data);
        updateMemory(oResult.memory, "false", data.conversation.id);
        return resolve(oResult.messages);

                break;

                case "substitute-app":
                var oResult = substitute(data);
                updateMemory(oResult.memory, "false", data.conversation.id);
                return resolve(oResult.messages);break;

                case "auth-history":
                var oResult = authhistory(data);
                updateMemory(oResult.memory, "false", data.conversation.id);
                return resolve(oResult.messages);break;

			default:
				return resolve([getFallbackMessage(data)]);
    }

  });
}

var requestServices = (data) => {
  var oMemory = data.conversation.memory;
  var sLang = data.conversation.language;
  var sLink = config.SERVICE_NAME_LINK;
  var passRest = config.PASSWORD_RESET_LINK;

  var aMessages = [{
    type: 'buttons',
    content: {
      title: 'Select Services from below options',
      buttons: [


    {
          type: 'web_url',
          title: 'IAM HANA Services',
          value: sLink
        },{
          type: 'web_url',
          title: 'IAM HCP Services',
          value: sLink
        },
    {
          type: 'web_url',
          title: 'IAM S/4 HANA Services',
          value: sLink
        }
      ]
    }
  }];

	// reset memory
	delete oMemory._current_skill;

  return {
    messages: aMessages,
    memory: oMemory
  };
}

/*
* Main bot function
*/
var reply = (request, response) => {
	return new Promise((resolve, reject) => {
		var convid = request.body.convid;

		if(request.body.question === "<<<initialmessage>>>"){
			var jwt = null;
			try{
				jwt = scpUtils.parseJwtToken(request.headers.authorization);
			}catch(ex){
				// pass
			}

			let oMessage;
			if(jwt && jwt.given_name){
				var sName = jwt.given_name;
				var sName = jwt.given_name;
				var sFirstName = sName.split(".");
				  var fName = sFirstName[0].charAt(0).toUpperCase() + sFirstName[0].slice(1);
				oMessage = { type: 'text', content: strings.getRandom({ phrase: "hello", locale: "en" }) + " " + fName };

			}else{
				oMessage = { type: 'text', content: strings.getRandom({ phrase: "hello", locale: "en" }) };
			}

			// Get welcome message from SAP Conversational AI bot builder
			const sInitMsg = {type: "text", content: "what can you do?"};
			return client.dialog(sInitMsg, {conversationId: convid})
				.then(res => {
					let aMessages = res.messages;
					aMessages.unshift(oMessage);
					return resolve(aMessages);
				})
				.catch(err => {
					oLogger.log("error", err);
				});
		}

		const msg = { type: 'text', title: request.body.question, content: request.body.question };

	  return client.dialog(msg, {conversationId: convid})
		  .then(res => {
		  	reply = generateAnswer(res, request.headers.authorization);

		    return resolve(reply);
		  })
			.catch(err => {
				oLogger.log("error", err);

				return resolve([{
					type: 'text',
					content: strings.get({ phrase: "backenderror", locale: "en" })
				}]);
			});
	})
}

var generateAnswer = (data, jwt) => {
  var that = this;
  return new Promise((resolve, reject) => {
    var oMessage = {};

		data.conversation.memory.jwt = jwt;

    // check if additional actions are needed or message is provided by recast
    if(data.messages && data.messages.length > 0){
			// check for feedback to log to the database
			if(data.conversation.memory.save_feedback){
				let sComment;
				if(data.conversation.memory.save_comment){
					sComment = data.nlp.source;
				}else{
					sComment = null;
				}

			  db.saveFeedback(data.conversation.memory.rating.scalar, sComment)
					.then(bSuccess => {
						delete data.conversation.memory.ask_feedback;
						delete data.conversation.memory.wait_feedback;
						delete data.conversation.memory.rating;
						delete data.conversation.memory.save_feedback;
						delete data.conversation.memory.save_comment;
						updateMemory(data.conversation.memory, "false", data.conversation.id);
					})
					.catch(err => {
						oLogger.log("error", err);
					});

			}

			return resolve(data.messages);

    }else{
      getMessageByIntent(data).then(aMessages => {
        return resolve(aMessages);
      });
    }
  });
}

module.exports = {
  updateMemory,
	registerSelectedRoles,
  reply
}
