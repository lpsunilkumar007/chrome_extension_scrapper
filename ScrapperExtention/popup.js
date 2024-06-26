"use strict";
//#region Variables
var getUrl = document.getElementById("getUrl");
var ddlDemo = document.getElementById("ddlContent");
var postUrl = document.getElementById("postUrl");
var apiEndPoint = "https://localhost:7278";
var proofReadContent = "";
var domain = "thehill.com";
var domainArray = [
    "thehill.com",
    "www.breitbart.com",
    "www.americanthinker.com",
    "reason.com",
];
var url, tab;
var currentUserInfo = null;
//An environment code needs to be added to the extension.  The values are PRD and INT.
var environmentCode = "PRD";
//var environmentCode = "INT";

//#endregion

//#region Local Storage functions
// get locla data by key
const getStorageData = (key) =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, (result) =>
            chrome.runtime.lastError
                ? reject(Error(chrome.runtime.lastError.message))
                : resolve(result)
        )
    );
//set local storage Data
const setStorageData = (data) =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.set(data, () =>
            chrome.runtime.lastError
                ? reject(Error(chrome.runtime.lastError.message))
                : resolve()
        )
    );

function clearLocalStorage() {
    chrome.storage.sync.clear(function () {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (var key in changes) {
            var storageChange = changes[key];
            if (storageChange.newValue == undefined) {
                //open login modal
                showMainContainer($("#section-login"));
                //sending msg to content js
                chrome.tabs.query(
                    { currentWindow: true, active: true },
                    function (tabs) {
                        var activeTab = tabs[0];
                        chrome.tabs.sendMessage(activeTab.id, { logout: true });
                    }
                );
            }
        }
    });
}
//#endregion

function postData(url, data, successfunction) {
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json", // Setting Content-Type to application/json
        dataType: "json", // Expecting a JSON response
        success: function successHandler(result) {
            if (successfunction !== undefined && successfunction.trim() !== "") {
                window[successfunction](result, data);
            }
        },
        error: function (error) {
            //failAlert("Bad Request");
            if (successfunction !== undefined && successfunction.trim() !== "") {
                //set for error
                window[successfunction](error, false);
            }
        },
    });
}

//#region Document Load
$(document).ready(function () {
    window["showMainPanel"]();
});

// display interface based on the evironment set.
async function showMainPanel() {
    //clearLocalStorage();
    currentUserInfo = await getStorageData("currentUserInfo");
    if (
        currentUserInfo.currentUserInfo === undefined ||
        currentUserInfo.currentUserInfo == null
    ) {
        showMainContainer($("#section-login"));
        return;
    }
    if (environmentCode === "INT") {
        showMainContainer($("#section-INT-container"));
    } else {
        showMainContainer($("#section-PRD-container"));
        window.history.back()
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            getData(apiEndPoint + "/api/scrapper/getPropperty", {
                scrapUrl: tabs[0].url
            });
        });
    }
    //send to content.js
    await sendCurrentUserInfo();
}

// display interface based on the evironment set.
async function sendCurrentUserInfo() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        url = tabs[0].url;
        tab = tabs[0];

        var msg = {
            type: "UserInfo",
            data: currentUserInfo.currentUserInfo,
        };
        chrome.tabs.sendMessage(tab.id, msg);
    });
}

//get scrap data 
function getData(url, data) {
    $.ajax({
        type: "GET",
        url: url,
        data: data,
        success: function successHandler(result) {
            if (result !== null) {
                $('#scrap-image').attr('src', result.image);
                $('#PriceBreakup').text(result.price);
                $("#total-comment").text(result.totalcomment);
                $("#Address").text(result.address);
                $("#BookingAmount").text(result.bookingAmount);
                $("#Landmarks").text(result.landmarks);
                $("#Furnishing").text(result.furnishing);
                $("#Flooring").text(result.flooring);
                $("#LoanOffered").text(result.loanOffered);
                $("#Description").text(result.description);
                $("#SuperBuiltArea").text(result.superBuiltArea);
                $("#Developer").text(result.developer);
                $("#Project").text(result.project);
                $("#Floor").text(result.floor);
                $("#TransactionType").text(result.transactiontype);
                $("#AdditionalRooms").text(result.additionalRooms);
                $("#Facing").text(result.facing);
                $("#Lifts").text(result.lifts);
                $("#FurnishedStatus").text(result.furnishedStatus);
            } else {
                $("#total-comment").text(0);
                $("#overall-total-comments").text(0);
            }
        },
        error: function (error) { },
    });
}
//#endregion

//#region Chrome Extension Method

// Content script connecting to the background service worker
const port = chrome.runtime.connect();

// Sending a message to the background service worker
port.postMessage({ message: "Hello, background!" });

// Listening for a response from the background service worker
port.onMessage.addListener(function (msg) {
    proofReadContent = msg;
});

//get current tab url
function getCurrentTabUrl() {
    var queryInfo = {
        active: true,
        currentWindow: true,
    };
    chrome.tabs.query(queryInfo, (tabs) => {
        var tab = tabs[0];
        var url = tab.url;

        console.assert(typeof url === "string", "tab.url should be a string");
        document.getElementById("url").innerHTML = url;
    });
}
//#endregion

//#region User Activity
//on changing value of drop down
ddlDemo.onchange = function (element) {
    var selectedText = ddlDemo.options[ddlDemo.selectedIndex].text;
    alert(selectedText);
};

//getting current url
getUrl.onclick = function (element) {
    getCurrentTabUrl();
};

function highlightHandler(e) {
    // get the highlighted text
    var text = document.getSelection();
    // check if anything is actually highlighted
    if (text !== "") {
        // we've got a highlight, now do your stuff here
    }
}
document.onmouseup = highlightHandler;
//get selected text
document.getElementById("getText").onclick = function (element) {
    chrome.tabs.executeScript(
        {
            code: "window.getSelection().toString();",
        },
        function (selection) {
            document.getElementById("selectedtext").innerHTML = selection[0];
        }
    );
};

//logout user
document.getElementById("logoutUser").onclick = function (element) {
    clearLocalStorage();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
    });
};

//posting current url to api
postUrl.onclick = function (element) {
    postCurrentTabUrl();
};
//#endregion

//#region User Functions
//parse article content
function postCurrentTabUrl() {
    //current page url
    var currentUrl = document.getElementById("url").innerHTML;
    if (currentUrl !== " ") {
        if (proofReadContent.articleContentParsed === undefined) {
            alert(
                "Please close extension popup and reload article to parse its content properly."
            );
        } else {
            postArticle(apiEndPoint + "/api/posturl", {
                articleContent: proofReadContent.articleContentParsed,
                currentUrl: currentUrl,
            });
        }
    } else {
        alert("please select Get url tab first to parse article");
    }
}

//parse article success
function postArticle(url, data) {
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        success: function successHandler(result) {
            if (result === 0) {
                alert("Article is being parsed");
            } else {
                alert("Article already parsed");
            }
        },
        error: function (error) {
            alert("Bad request");
        },
    });
}
//#endregion

//#region User Authentication

function showMainContainer(element) {
    var containers = [
        "section-login",
        "section-register",
        "section-set-password",
        "section-PRD-container",
        "section-INT-container",
    ];
    containers.forEach(function (item, index) {
        if ($(element).data("parent-container") == item) {
            //  $(element).data('parent-container').removeClass('d-none');
            $("#" + item).removeClass("d-none");
        } else {
            $("#" + item).addClass("d-none");
        }
    });
}

//get selected text
document.getElementById("btnCreateAccount").onclick = function (element) {
    showMainContainer(this);
};
//get selected text
document.getElementById("btnBackToLoginSection").onclick = function (element) {
    showMainContainer(this);
};
//get selected text
document.getElementById("btnBacktoLogin").onclick = function (element) {
    showMainContainer(this);
};
////get selected text
document.getElementById("btnShowSetPassword").onclick = function (element) {
    if (validEmail("txtnewUserEmail")) {
        showMainContainer($("#btnshowSetPassForm"));
        $("#new-user-email").text($("#txtnewUserEmail").val());
    }
};

function showError(identifier) {
    $("#" + identifier)
        .siblings(".error-info-label")
        .removeClass("d-none");
}
//
function showInfo(identifier) {
    $("#" + identifier)
        .siblings(".error-info-label")
        .addClass("d-none");
}
/// return true if field is valid else false for invalid
function fieldRequired(identifier) {
    if ($("#" + identifier).val() === "" || $("#" + identifier).val() === null) {
        // show error
        showError(identifier);
        return false;
    } else {
        // remove errror and show the main label
        showInfo(identifier);
        return true;
    }
}

/// return true if field is valid else false for invalid
function validEmail(identifier) {
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (
        fieldRequired(identifier) &&
        $("#" + identifier)
            .val()
            .match(mailformat)
    ) {
        showInfo(identifier);
        // email  is  valid
        return true;
    } else {
        showError(identifier);
        //invalid Email
        return false;
    }
}

document.getElementById("btnLogin").addEventListener("click", function (event) {
    event.preventDefault();
    if (validEmail("txtLoginEmail") && fieldRequired("txtLoginPassword")) {
        loginUser($("#txtLoginEmail").val(), $("#txtLoginPassword").val());
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        });
    }
});

document.getElementById("btnCreateNewUser").onclick = function (element) {
    if (
        fieldRequired("txtNewUserPassword") &&
        fieldRequired("txtUserConfirmPassword")
    ) {
        registerNewUser(
            $("#txtnewUserEmail").val(),
            $("#txtUsername").val(),
            $("#txtNewUserPassword").val(),
            $("#txtUserConfirmPassword").val()
        );
    }
};

//parse article success
function registerNewUser(email, username, password, confirmPassword) {
    postData(
        apiEndPoint + "/api/account/register",
        {
            Email: email,
            Username: username,
            Password: password,
            ConfirmPassword: confirmPassword,
        },
        "registerNewUserSuccess"
    );
}
//login User Success
async function registerNewUserSuccess(result, status) {
    if (status === false) {
        if ($("#section-set-password-error").hasClass("d-none")) {
            $("#section-set-password-error").removeClass("d-none");
        }
        $("#section-set-password-error-text").text(
            JSON.parse(result.responseText).Message
        );
        return;
    }

    $("#section-set-password-error-text").text("");
    $("#set-password-error-text").addClass("d-none");
    await setStorageData({ currentUserInfo: result });
    currentUserInfo = await getStorageData("currentUserInfo");
    $("#currentUserId").val(currentUserInfo.currentUserInfo.Id);
    //show main panel
    window["showMainPanel"]();
    await sendCurrentUserInfo();
}

//login User
function loginUser(email, password) {
    postData(
        apiEndPoint + "/api/account/login",
        {
            Email: email,
            Password: password,
        },
        "loginUserSuccess"
    );
}
//login User Success
async function loginUserSuccess(result, status) {
    if (result.success === false) {
        if ($("#section-set-login-error").hasClass("d-none")) {
            $("#section-set-login-error").removeClass("d-none");
            $("#section-set-login-error").text("Invalid email or password");
        }

        return;
    }
    $("#set-password-error-text").addClass("d-none");
    await setStorageData({ currentUserInfo: result });
    currentUserInfo = await getStorageData("currentUserInfo");
    $("#currentUserId").val(currentUserInfo.currentUserInfo.Id);
    //show main panel
    window["showMainPanel"]();
    await sendCurrentUserInfo();
}
//#endregion

//this is used to hide and show the password
var passwordID = ("show_hide_password");
var confirmPassword = ("txtNewUserConfirmPassword");
$(`#${passwordID} a`).on('click', function (event) {
    event.preventDefault();
    ShowHidePassword(passwordID);
});

$(`#${confirmPassword} a`).on('click', function (event) {
    event.preventDefault();
    ShowHidePassword(confirmPassword)
});
function ShowHidePassword(inputId) {
    if ($(`#${inputId} input`).attr("type") == "text") {
        $(`#${inputId} input`).attr('type', 'password');
        $(`#${inputId} i`).addClass("fa-eye-slash");
        $(`#${inputId} i`).removeClass("fa-eye");
    } else if ($(`#${inputId} input`).attr("type") == "password") {
        $(`#${inputId} input`).attr('type', 'text');
        $(`#${inputId} i`).removeClass("fa-eye-slash");
        $(`#${inputId} i`).addClass("fa-eye");
    }
}