'use strict';
//#region Variables
var proofReadContent = "";
//#endregion

//#region Chrome Extension Method
//communication between scripts.js
chrome.runtime.onInstalled.addListener(function () {
    console.log("Extension is loaded.");
});

//listen message from content.js
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    proofReadContent = msg;    
});

//send message to popup.js
chrome.runtime.onConnect.addListener(function (port) {
    console.log(port);
    port.onMessage.addListener(function (msg) {
        port.postMessage(proofReadContent);
    });
});

//#endregion