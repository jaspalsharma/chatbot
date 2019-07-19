sap.ui.define([	"sap/ui/core/Control"], function(Control, Button) {	"use strict";	return Control.extend("UniperChatbot.customControl.CardCarousel", {		metadata: {			properties: {},			aggregations: {				cards: {					type: "UniperChatbot.customControl.Card",					multiple: true				}			}		},		init: function() {			//initialisation code, in this case, ensure css is imported			var libraryPath = jQuery.sap.getModulePath("customcontrol"); //get the server location of the ui library			jQuery.sap.includeStyleSheet(libraryPath + "/../css/style.css"); //specify the css path relative from the ui folder		},		renderer: function(oRm, oControl) {			//first up, render a div for the ShadowBox			oRm.write("<div");			//add this controls style class (plus any additional ones the developer has specified)			oRm.addClass("CardCarousel");			oRm.writeClasses(oControl);			//render width & height & background properties			oRm.writeAttributeEscaped("style",				"width: 100%; max-height: auto;"			);			//next, render the control information, this handles your sId (you must do this for your control to be properly tracked by ui5).			oRm.writeControlData(oControl);			oRm.write(">");			$(oControl.getCards()).each(function() {				oRm.renderControl(this);			});			//and obviously, close off our div			oRm.write("</div>");		},		onAfterRendering: function(evt) {			if (sap.ui.core.Control.prototype.onAfterRendering) {				sap.ui.core.Control.prototype.onAfterRendering.apply(this, evt);			}		}	});});