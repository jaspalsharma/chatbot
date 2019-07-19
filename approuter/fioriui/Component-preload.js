/**
* This file was auto-generated by SAP Web IDE build and includes all
* the source files required by SAPUI5 runtime for performance optimization.
* PLEASE DO NOT EDIT THIS FILE!! Changes will be overwritten the next time the build is run.
*/
jQuery.sap.registerPreloadedModules({
	"version": "2.0",
	"name": "chatbot/Component-preload",
	"modules": {
		"chatbot/Component.js": "sap.ui.define([\n\t\"sap/ui/core/UIComponent\",\n\t\"sap/ui/Device\",\n\t\"chatbot/model/models\"\n], function(UIComponent, Device, models) {\n\t\"use strict\";\n\n\treturn UIComponent.extend(\"chatbot.Component\", {\n\n\t\tmetadata: {\n\t\t\tmanifest: \"json\"\n\t\t},\n\n\t\t/**\n\t\t * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.\n\t\t * @public\n\t\t * @override\n\t\t */\n\t\tinit: function() {\n\t\t\t// call the base component's init function\n\t\t\tUIComponent.prototype.init.apply(this, arguments);\n\n\t\t\t// set the device model\n\t\t\tthis.setModel(models.createDeviceModel(), \"device\");\n\t\t}\n\t});\n});",
		"chatbot/model/models.js": "sap.ui.define([\n\t\"sap/ui/model/json/JSONModel\",\n\t\"sap/ui/Device\"\n], function(JSONModel, Device) {\n\t\"use strict\";\n\n\treturn {\n\n\t\tcreateDeviceModel: function() {\n\t\t\tvar oModel = new JSONModel(Device);\n\t\t\toModel.setDefaultBindingMode(\"OneWay\");\n\t\t\treturn oModel;\n\t\t}\n\n\t};\n});",
		"chatbot/controller/Main.controller.js": "sap.ui.define([\n\t\"sap/ui/core/mvc/Controller\",\n\t\"sap/ui/model/json/JSONModel\"\n], function(Controller, JSONModel) {\n\t\"use strict\";\n\n\tvar sScrollToId = 0;\n\n\treturn Controller.extend(\"chatbot.controller.Main\", {\n\n\t\tonInit: function() {\n\t\t\tthis.oChatModel = new JSONModel({\n\t\t\t\tchat: []\n\t\t\t});\n\t\t\tthis.getView().setModel(this.oChatModel, \"chatmodel\");\n\t\t\tthis.oModel = this.oChatModel;\n\t\t},\n\n\t\tonAfterRendering: function() {\n\t\t\tvar that = this;\n\t\t\tthis.byId(\"MessageInput\").onkeyup = function(oEvent) {\n\t\t\t\tif (oEvent.key === \"Enter\") {\n\t\t\t\t\tthat.onSendChat();\n\t\t\t\t}\n\t\t\t};\n\t\t},\n\n\t\tonPressWebcam: function() {\n\n\t\t\tnavigator.camera.getPicture(onSuccess, onFail, {\n\t\t\t\tquality: 50\n\t\t\t});\n\n\t\t\tfunction onSuccess(imageData) {\n\t\t\t\tvar image = document.getElementById('myImage');\n\t\t\t\timage.src = \"data:image/jpeg;base64,\" + imageData;\n\t\t\t}\n\n\t\t\tfunction onFail(message) {\n\n\t\t\t}\n\t\t},\n\n\t\tonReadErpData: function(filter) {\n\t\t\tvar aFilter;\n\t\t\tvar aFilterVal;\n\t\t\tvar that = this;\n\n\t\t\tfor (var x = 0; x < filter.length; x++) {\n\t\t\t\tif (filter[x].type === \"filter\") {\n\t\t\t\t\taFilter = filter[x].answer;\n\t\t\t\t} else if (filter[x].type === \"filterVal\") {\n\t\t\t\t\taFilterVal = filter[x].answer;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tthis.getView().getModel().read(\"/SalesOrderCollection?$filter=\" + aFilter + parseInt(aFilterVal), {\n\t\t\t\turlParameters: {\n\t\t\t\t\t\"$select\": \"TotalSum,CustomerName\"\n\t\t\t\t},\n\t\t\t\tsuccess: function(data) {\n\t\t\t\t\tvar sum = 0;\n\t\t\t\t\tfor (var y = 0; y < data.results.length; y++) {\n\t\t\t\t\t\tsum += parseInt(data.results[y].TotalSum);\n\t\t\t\t\t}\n\n\t\t\t\t\tvar sumInput = {\n\t\t\t\t\t\tanswer: \"The revenue is \" + sum + \" Dollar\",\n\t\t\t\t\t\tauthor: \"bot\",\n\t\t\t\t\t\ttype: \"text\"\n\t\t\t\t\t};\n\n\t\t\t\t\tthat.oModel = that.getView().getModel(\"chatmodel\");\n\t\t\t\t\tthat.aData = that.oModel.getProperty(\"/chat\");\n\t\t\t\t\tsScrollToId++;\n\t\t\t\t\tthat.aData.push(sumInput);\n\t\t\t\t\tthat.oModel.setProperty(\"/chat\", that.aData);\n\n\t\t\t\t},\n\t\t\t\terror: function(err) {\n\n\t\t\t\t}\n\t\t\t});\n\t\t},\n\n\t\tonSendChat: function() {\n\t\t\tthis.enteredData = {\n\t\t\t\tmessage: this.byId(\"MessageInput\").getValue()\n\t\t\t};\n\t\t\tthis.byId(\"MessageInput\").setValue(\"\");\n\t\t\tthis.oModel = this.getView().getModel(\"chatmodel\");\n\t\t\tthis.aData = this.oModel.getProperty(\"/chat\");\n\n\t\t\tvar userInput = {\n\t\t\t\tanswer: this.enteredData.message,\n\t\t\t\tautor: \"User\",\n\t\t\t\ttype: \"text\"\n\t\t\t};\n\n\t\t\tsScrollToId++;\n\t\t\tthis.aData.push(userInput);\n\t\t\tthis.oModel.setProperty(\"/chat\", this.aData);\n\t\t\tvar that = this;\n\n\t\t\t$.ajax({\n\t\t\t\ttype: \"POST\",\n\t\t\t\turl: \"/api/askBot\",\n\t\t\t\tcrossDomain: true,\n\t\t\t\tdatatype: 'json',\n\t\t\t\tcontext: this,\n\t\t\t\tcontentType: \"application/json\",\n\t\t\t\tdata: JSON.stringify(this.enteredData),\n\t\t\t\tsuccess: function(data) {\n\t\t\t\t\tvar oAddMsg = function(oMsg) {\n\t\t\t\t\t\treturn new Promise(function(fnResolve, fnReject) {\n\t\t\t\t\t\t\tthat.aData.push(oMsg);\n\t\t\t\t\t\t\tthat.oModel.setProperty(\"/chat\", that.aData);\n\t\t\t\t\t\t\tsScrollToId++;\n\t\t\t\t\t\t});\n\t\t\t\t\t};\n\t\t\t\t\tfor (var i = 0; i < data.length; i++) {\n\t\t\t\t\t\tif (data[i].type === \"filter\") {\n\t\t\t\t\t\t\tthat.onReadErpData(data);\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tvar oMsg = JSON.parse(JSON.stringify(data[i]));\n\t\t\t\t\t\tsetTimeout(oAddMsg, i * (Math.floor(Math.random() * (2000+1))), JSON.parse(JSON.stringify(oMsg)));\n\t\t\t\t\t}\n\t\t\t\t},\n\t\t\t\terror: function(err) {\n\t\t\t\t\tconsole.log(err);\n\t\t\t\t}\n\t\t\t});\n\t\t},\n\n\t\tscrollToLastMessage: function(oEvent) {\n\t\t\twindow.setTimeout(function() {\n\t\t\t\tdocument.getElementById(\"__box0-__xmlview0--chatList-\" + (sScrollToId - 1)).scrollIntoView();\n\t\t\t}, 50);\n\t\t}\n\n\t});\n});",
		"chatbot/view/Main.view.xml": "<mvc:View controllerName=\"chatbot.controller.Main\" xmlns:html=\"http://www.w3.org/1999/xhtml\" xmlns:mvc=\"sap.ui.core.mvc\" displayBlock=\"true\"\n\txmlns=\"sap.m\" xmlns:f=\"sap.f\" xmlns:core=\"sap.ui.core\" xmlns:com=\"sap.suite.ui.commons\" xmlns:viz=\"sap.viz.ui5.controls\"\n\txmlns:viz.data=\"sap.viz.ui5.data\" xmlns:viz.feeds=\"sap.viz.ui5.controls.common.feeds\">\n\t<App>\n\t\t<pages>\n\t\t\t<Page title=\"{i18n>title}\" id=\"message-page\" showHeader=\"false\">\n\t\t\t\t<!--<customHeader>\n\t\t\t\t\t<Bar>\n\t\t\t\t\t\t<contentLeft>\n\t\t\t\t\t\t\t<f:Avatar src=\"sap-icon://person-placeholder\" displaySize=\"XS\" class=\"headerAvatar\"></f:Avatar>\n\t\t\t\t\t\t</contentLeft>\n\t\t\t\t\t\t<contentMiddle>\n\t\t\t\t\t\t\t<Text class=\"titleText\" text=\"{i18n>title}\"></Text>\n\t\t\t\t\t\t\t<Image class=\"titleImage\" src=\"{mainView>/root}/img/heart.png\" height=\"20px\"></Image>\n\t\t\t\t\t\t</contentMiddle>\n\t\t\t\t\t\t<contentRight>\n\t\t\t\t\t\t\t<Button icon=\"sap-icon://action-settings\" enabled=\"false\" type=\"Transparent\"></Button>\n\t\t\t\t\t\t</contentRight>\n\t\t\t\t\t</Bar>\n\t\t\t\t</customHeader>-->\n\t\t\t\t<List items=\"{chatmodel>/chat}\" id=\"chatList\" updateFinished=\"scrollToLastMessage\" noDataText=\" \" width=\"100%\"\n\t\t\t\t\tclass=\"sapUiTinyMarginTop sapUiTinyMarginBottom\">\n\t\t\t\t\t<CustomListItem>\n\t\t\t\t\t\t<content>\n\t\t\t\t\t\t\t<FlexBox height=\"auto\" alignItems=\"Start\" justifyContent=\"{= ${chatmodel>author} === 'bot' ? 'Start' : 'End'}\" class=\"sapUiTinyMargin\"\n\t\t\t\t\t\t\t\twidth=\"100%\">\n\t\t\t\t\t\t\t\t<items>\n\t\t\t\t\t\t\t\t\t<f:Avatar src=\"sap-icon://it-instance\" visible=\"{= ${chatmodel>author} === 'bot'}\" displaySize=\"XS\" class=\"sapUiSmallMarginEnd\"></f:Avatar>\n\t\t\t\t\t\t\t\t\t<FlexBox wrap=\"Wrap\" backgroundDesign=\"{= ${chatmodel>author} === 'bot' ? 'Solid' : 'Translucent'}\" height=\"auto\" width=\"70%\">\n\t\t\t\t\t\t\t\t\t\t<items>\n\t\t\t\t\t\t\t\t\t\t\t<Text wrapping=\"true\" visible=\"{= ${chatmodel>type} === 'text'}\" text=\"{chatmodel>answer}\" class=\"sapUiSmallMargin\" width=\"auto\"\n\t\t\t\t\t\t\t\t\t\t\t\tid=\"chatBubble\"></Text>\n\t\t\t\t\t\t\t\t\t\t\t<Link width=\"auto\" target=\"_blank\" class=\"sapUiSmallMargin\" id=\"chatLink\" visible=\"{= ${chatmodel>type} === 'link'}\"\n\t\t\t\t\t\t\t\t\t\t\t\thref=\"{chatmodel>answer}\" text=\"Link\"></Link>\n\t\t\t\t\t\t\t\t\t\t\t<HBox class=\"sapUiSmallMargin\" id=\"pdfDocument\" visible=\"{= ${chatmodel>type} === 'pdf'}\" alignItems=\"Center\">\n\t\t\t\t\t\t\t\t\t\t\t\t<core:Icon src=\"sap-icon://pdf-attachment\" size=\"1.5rem\" class=\"sapUiTinyMarginEnd\"></core:Icon>\n\t\t\t\t\t\t\t\t\t\t\t\t<Link href=\"{chatmodel>answer}\" text=\"Here is your document\"></Link>\n\t\t\t\t\t\t\t\t\t\t\t</HBox>\n\t\t\t\t\t\t\t\t\t\t\t<Image class=\"sapUiSmallMargin\" visible=\"{= ${chatmodel>type} === 'image'}\" src=\"{chatmodel>answer}\"></Image>\n\t\t\t\t\t\t\t\t\t\t\t<HBox class=\"sapUiSmallMargin\" id=\"chatWebcam\" visible=\"{= ${chatmodel>type} === 'webcam'}\" alignItems=\"Center\">\n\t\t\t\t\t\t\t\t\t\t\t\t<core:Icon src=\"sap-icon://picture\" size=\"1.5rem\" class=\"sapUiTinyMarginEnd\"></core:Icon>\n\t\t\t\t\t\t\t\t\t\t\t\t<Link href=\"{chatmodel>answer}\" text=\"I hope that's you\" press=\"onPressWebcam\"></Link>\n\t\t\t\t\t\t\t\t\t\t\t</HBox>\n\t\t\t\t\t\t\t\t\t\t\t<viz:VizFrame uiConfig=\"{applicationSet:'fiori'}\" legendVisible=\"false\" vizType='bar'\n\t\t\t\t\t\t\t\t\t\t\t\tvizProperties=\"{ title: {text : ' ' }, plotArea: { window: { start: 'firstDataPoint', end: 'lastDataPoint' }}}\" id=\"customerChart\"\n\t\t\t\t\t\t\t\t\t\t\t\tvisible=\"{= ${chatmodel>type} === 'revenuechart'}\">\n\t\t\t\t\t\t\t\t\t\t\t\t<viz:dataset>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:FlattenedDataset data=\"{/SalesOrderCollection}\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:dimensions>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:DimensionDefinition name=\"Customer\" value=\"{CustomerName}\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:dimensions>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:measures>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:MeasureDefinition name=\"Revenue\" value=\"{TotalSum}\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:measures>\n\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:FlattenedDataset>\n\t\t\t\t\t\t\t\t\t\t\t\t</viz:dataset>\n\t\t\t\t\t\t\t\t\t\t\t\t<viz:feeds>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.feeds:FeedItem id='valueAxisFeed' uid=\"valueAxis\" type=\"Measure\" values=\"Revenue\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.feeds:FeedItem id='categoryAxisFeed' uid=\"categoryAxis\" type=\"Dimension\" values=\"Customer\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t</viz:feeds>\n\t\t\t\t\t\t\t\t\t\t\t</viz:VizFrame>\n\t\t\t\t\t\t\t\t\t\t\t<viz:VizFrame uiConfig=\"{applicationSet:'fiori'}\" legendVisible=\"false\" vizType='timeseries_line'\n\t\t\t\t\t\t\t\t\t\t\t\tvizProperties=\"{ title: {text : ' ' }, plotArea: { window: { start: 'firstDataPoint', end: 'lastDataPoint' }}}\" id=\"costChart\"\n\t\t\t\t\t\t\t\t\t\t\t\tvisible=\"{= ${chatmodel>type} === 'costchart'}\">\n\t\t\t\t\t\t\t\t\t\t\t\t<viz:dataset>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:FlattenedDataset data=\"{/SalesOrderCollection}\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:dimensions>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:DimensionDefinition name=\"Date\" value=\"{CreatedAt}\" dataType=\"date\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:dimensions>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:measures>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.data:MeasureDefinition name=\"Cost\" value=\"{NetSum}\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:measures>\n\t\t\t\t\t\t\t\t\t\t\t\t\t</viz.data:FlattenedDataset>\n\t\t\t\t\t\t\t\t\t\t\t\t</viz:dataset>\n\t\t\t\t\t\t\t\t\t\t\t\t<viz:feeds>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.feeds:FeedItem id='valueAxisFeed3' uid=\"valueAxis\" type=\"Measure\" values=\"Cost\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<viz.feeds:FeedItem id='timeAxisFeed' uid=\"timeAxis\" type=\"Dimension\" values=\"Date\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t</viz:feeds>\n\t\t\t\t\t\t\t\t\t\t\t</viz:VizFrame>\n\t\t\t\t\t\t\t\t\t\t</items>\n\t\t\t\t\t\t\t\t\t</FlexBox>\n\t\t\t\t\t\t\t\t\t<f:Avatar src=\"sap-icon://person-placeholder\" displaySize=\"XS\" visible=\"{= ${chatmodel>author} !== 'bot'}\"\n\t\t\t\t\t\t\t\t\t\tclass=\"sapUiSmallMarginBegin sapUiSmallMarginEnd\"></f:Avatar>\n\t\t\t\t\t\t\t\t</items>\n\t\t\t\t\t\t\t</FlexBox>\n\t\t\t\t\t\t</content>\n\t\t\t\t\t</CustomListItem>\n\t\t\t\t</List>\n\t\t\t\t<footer>\n\t\t\t\t\t<Toolbar id=\"inputPanel\" class=\"input-panel\" height=\"3.5rem\">\n\t\t\t\t\t\t<FlexBox direction=\"Column\" alignItems=\"Stretch\" width=\"100%\">\n\t\t\t\t\t\t\t<items>\n\t\t\t\t\t\t\t\t<FlexBox direction=\"Row\" alignItems=\"Start\" width=\"100%\">\n\t\t\t\t\t\t\t\t\t<items>\n\t\t\t\t\t\t\t\t\t\t<VBox width=\"100%\">\n\t\t\t\t\t\t\t\t\t\t\t<FlexBox alignItems=\"Start\">\n\t\t\t\t\t\t\t\t\t\t\t\t<items>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<TextArea id=\"MessageInput\" rows=\"1\" class=\"input-message\" placeholder=\"{i18n>MESSAGE_INPUT}\" width=\"99%\" liveChange=\"onInputVal\"\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tmaxLength=\"2040\">\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t<layoutData>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<FlexItemData growFactor=\"3\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t</layoutData>\n\t\t\t\t\t\t\t\t\t\t\t\t\t</TextArea>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<Button id=\"btnSend\" class=\"input-send-button sendButton\" enabled=\"true\" icon=\"sap-icon://paper-plane\" width=\"3rem\" press=\"onSendChat\"/>\n\t\t\t\t\t\t\t\t\t\t\t\t</items>\n\t\t\t\t\t\t\t\t\t\t\t</FlexBox>\n\t\t\t\t\t\t\t\t\t\t</VBox>\n\t\t\t\t\t\t\t\t\t</items>\n\t\t\t\t\t\t\t\t</FlexBox>\n\t\t\t\t\t\t\t</items>\n\t\t\t\t\t\t</FlexBox>\n\t\t\t\t\t</Toolbar>\n\t\t\t\t</footer>\n\t\t\t</Page>\n\t\t</pages>\n\t</App>\n</mvc:View>"
	}
});