sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	var aSelectedRoles = [];
	var bRoleSelectionMode = false;
	var iScrollToId = 0;
	var bRecognizing = false;
	var bIgnoreOnEnd = false;
	var conversationID;
	var that;

	return Controller.extend("AMSBot.controller.Main", {

		onInit: function () {
			that = this;
			this.oChatModel = new JSONModel({
				chat: []
			});
			this.getView().setModel(this.oChatModel, "chatmodel");
			this.oModel = this.getView().getModel("chatmodel");
			this.aData = this.oModel.getProperty("/chat");

			//this.initSpeechRecognition();
		},

		onAfterRendering: function () {
			this.byId("MessageInput").onkeyup = function (oEvent) {
				if (oEvent.key === "Enter") {
					that.onSendChat();
				}
			};

			function guid() {
				function s4() {
					return Math.floor((1 + Math.random()) * 0x10000)
						.toString(16)
						.substring(1);
				}
				return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			}

			conversationID = guid();

			that.sendInitialMessage();
		},

		onSelectionChange: function (oEvent) {
			aSelectedRoles = [];
			var aSelectedItems = oEvent.oSource.getSelectedItems();
			for (var i = 0; i < aSelectedItems.length; ++i) {
				aSelectedRoles.push(aSelectedItems[i].getDomRef().getElementsByClassName("recastListItemTitle")[0].children[0].innerHTML);
			}
		},

		initSpeechRecognition: function () {
			if (!('webkitSpeechRecognition' in window)) {
				this.getView().byId("btnRecord").setVisible(false);
			} else {
				this.oSpeechRecognition = new webkitSpeechRecognition();
				this.oSpeechRecognition.continuous = true;
				this.oSpeechRecognition.interimResults = true;
				this.oSpeechRecognition.lang = 'en-US';

				this.oSpeechRecognition.onstart = function () {
					bRecognizing = true;
					var oRecordButton = that.getView().byId("btnRecord");
					oRecordButton.setType("Reject");
					oRecordButton.addStyleClass("recordingButton");
				};

				this.oSpeechRecognition.onerror = function (event) {
					var oRecordButton = that.getView().byId("btnRecord");
					oRecordButton.setType("Emphasized");
					oRecordButton.removeStyleClass("recordingButton");

					if (event.error == 'no-speech') {
						bIgnoreOnEnd = true;
					}

					if (event.error == 'audio-capture') {
						start_img.src = 'mic.gif';
						showInfo('info_no_microphone');
						bIgnoreOnEnd = true;
					}

					if (event.error == 'not-allowed') {
						if (event.timeStamp - start_timestamp < 100) {
							showInfo('info_blocked');
						} else {
							showInfo('info_denied');
						}

						bIgnoreOnEnd = true;
					}
				};

				this.oSpeechRecognition.onend = function () {
					var oRecordButton = that.getView().byId("btnRecord");
					oRecordButton.setType("Emphasized");
					oRecordButton.removeStyleClass("recordingButton");
					bRecognizing = false;
				};

				this.oSpeechRecognition.onresult = function (event) {
					var sInterimTranscript = "";
					var sFinalTranscript = "";
					var oInput = that.getView().byId("MessageInput");
					var oRecordButton = that.getView().byId("btnRecord");
					oRecordButton.setType("Emphasized");
					oRecordButton.removeStyleClass("recordingButton");
					for (var i = event.resultIndex; i < event.results.length; ++i) {
						if (event.results[i].isFinal) {
							sFinalTranscript += event.results[i][0].transcript;
						} else {
							sInterimTranscript += event.results[i][0].transcript;
						}
					}

					oInput.setValue(sFinalTranscript);
				};
			}
		},

		sendInitialMessage: function () {
			var enteredData = {
				question: "<<<initialmessage>>>",
				convid: conversationID
			};

			this.onSendMessageToBot(enteredData);
		},

		sendMessageToBot: function (message, csrftoken) {
			$.ajax({
				type: "POST",
				url: "/api/userInput",
				crossDomain: true,
				datatype: "json",
				context: this,
				contentType: "application/json",
				data: JSON.stringify(message),
				headers: {
					cache: false,
					'X-CSRF-Token': csrftoken
				},
				success: function (data) {
					var oAddMsg = (function (oMsg) {
						this.aData.push(oMsg);
						this.oModel.setProperty("/chat", this.aData);
						iScrollToId++;
						this.byId("chatList").setBusy(false);
					}).bind(that);

					for (var i = 0; i < data.length; i++) {
						var oMsg = JSON.parse(JSON.stringify(data[i]));
						if (oMsg.type === "rolelist") {
							bRoleSelectionMode = true;
						}

						// if (oMsg.type === "requestedroles") {
						// 	for (let j = 0; j < oMsg.links.length; j++) {
						// 		let url = oMsg.links[j];
						// 		let w = window.open(url, "ARM Request " + j);
						// 		if (w) {
						// 			w.focus();
						// 		}
						// 	}
						//
						// 	continue;
						// }

						oMsg.author = "bot";
						setTimeout(oAddMsg, 100, JSON.parse(JSON.stringify(oMsg)));
					}
				},
				error: function (err) {
					console.log(err);
				}
			});
		},

		onSendMessageToBot: function (message) {
			message.authtoken = this.getView().getModel("i18n").getResourceBundle().getText("TOKEN");

			if (bRoleSelectionMode === true) {
				let bSent = this.onSendSelection(that.sendMessageToBot, message);
				if (bSent) {
					bRoleSelectionMode = false;
				} else {
					$.ajax({
							type: "GET",
							url: "/",
							headers: {
								ContentType: 'application/json',
								Accept: 'application/json',
								cache: false,
								'X-CSRF-Token': 'Fetch'
							}
						})
						.done(function (data, textStatus, request) {
							var csrftoken = request.getResponseHeader('X-Csrf-Token');
							that.sendMessageToBot(message, csrftoken);
						})
						.fail(function (jqXHR, textStatus, error) {
							if (jqXHR.status === 401) {
								sap.m.MessageToast.show("Your session has expired, reloading page...", {
									duration: 3000,
									width: "15em",
									my: "center bottom",
									at: "center bottom"
								});

								setTimeout(function () {
									location.reload(true);
								}, 2000);

							} else {
								console.error(JSON.stringify(error));
							}
						});
				}

			} else {
				$.ajax({
						type: "GET",
						url: "/",
						headers: {
							ContentType: 'application/json',
							Accept: 'application/json',
							cache: false,
							'X-CSRF-Token': 'Fetch'
						}
					})
					.done(function (data, textStatus, request) {
						var csrftoken = request.getResponseHeader('X-Csrf-Token');
						that.sendMessageToBot(message, csrftoken);
					})
					.fail(function (jqXHR, textStatus, error) {
						if (jqXHR.status === 401) {
							sap.m.MessageToast.show("Your session has expired, reloading page...", {
								duration: 3000,
								width: "15em",
								my: "center bottom",
								at: "center bottom"
							});

							setTimeout(function () {
								location.reload(true);
							}, 3000);

						} else {
							console.error(JSON.stringify(error));
						}
					});
			}
		},

		onPressAnyButton: function (oEvent) {
			var value = oEvent.getSource().getAggregation("customData")[0].getProperty("value");
			var type = oEvent.getSource().getAggregation("tooltip");

			if (type === "web_url") {
				var win = window.open(value, '_blank');
				win.focus();
			} else if (type === "phonenumber") {
				window.location.href = "tel://" + value;
			} else if (type === "postback") {
				this.onSendChat(value);
			}
		},

		onSendChat: function (message) {
			if (this.byId("MessageInput").getValue()) {
				message = this.byId("MessageInput").getValue();
			}

			this.enteredData = {
				question: message.replace(/\n/g, " "),
				convid: conversationID
			};

			this.byId("MessageInput").setValue("");
			this.oModel = this.getView().getModel("chatmodel");
			this.aData = this.oModel.getProperty("/chat");
			var userInput = {
				content: this.enteredData.question,
				author: "user",
				type: "text"
			};
			iScrollToId++;
			this.aData.push(userInput);
			this.oModel.setProperty("/chat", this.aData);

			this.onSendMessageToBot(this.enteredData);
		},

		onRecordChat: function () {
			if (bRecognizing) {
				this.oSpeechRecognition.stop();
				return;
			}

			this.oSpeechRecognition.start();
			bIgnoreOnEnd = false;
		},

		onSendSelection: function (callback, message) {
			if (aSelectedRoles.length === 0) {
				// No role selected
				/*
				if(bRoleSelectionMode){
					sap.m.MessageToast.show("Please select a role or mention it in your next message", {
						duration: 5000,
						width: "15em",
						my: "center bottom",
						at: "center bottom"
					});
				}
				*/

				return false;
			}

			var body = {
				authtoken: this.getView().getModel("i18n").getResourceBundle().getText("TOKEN"),
				roles: aSelectedRoles,
				convid: conversationID
			};

			$.ajax({
					type: "GET",
					url: "/",
					headers: {
						ContentType: 'application/json',
						Accept: 'application/json',
						cache: false,
						'X-CSRF-Token': 'Fetch'
					}
				})
				.done(function (data, textStatus, request) {
					var token = request.getResponseHeader('X-Csrf-Token');

					$.ajax({
						type: "POST",
						url: "/api/registerSelectedRoles",
						crossDomain: true,
						datatype: "json",
						context: this,
						contentType: "application/json",
						data: JSON.stringify(body),
						headers: {
							cache: false,
							'X-CSRF-Token': token
						},
						success: function (data) {
							if (callback && message) {
								callback(message, token);
							}
						},
						error: function (err) {
							console.log(err);
						}
					});
				});

			return true;
		},

		scrollToLastMessage: function (oEvent) {
			window.setTimeout(function () {
				var oDomElem = document.getElementById("__box0-__xmlview0--chatList-" + (iScrollToId - 1));
				if (oDomElem !== null) {
					oDomElem.scrollIntoView();
				}
			}, 50);
		}
	});
});
