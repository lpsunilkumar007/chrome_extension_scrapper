'use strict';
//#region Varibles
var apiEndPoint = "http://localhost:52959";
//domain name of the articles
var domainArray = ["thehill.com", "breitbart.com", "americanthinker.com", "nypost.com"];
//content Identifier for parses content for different domain 
var contentIdentifierArray = [".content-wrp", "#ContentW", ".article_body", ".article-header"];
//content Identifier for parses content for different domain 
var contentSectionIdentifierArray = ["div.entry-content", "div.field-item.even", "div.article_body"];

//#region mapping content class with the domain
var contentSectionIdentifierKV = new Map();
contentSectionIdentifierKV.set('www.breitbart.com', 'div.entry-content');
contentSectionIdentifierKV.set('thehill.com', 'div.field-item.even');
contentSectionIdentifierKV.set('www.americanthinker.com', 'div.article_body');
contentSectionIdentifierKV.set('nypost.com', 'div.entry-content.entry-content-read-more');
//#endregion

var articleContent = "";
var selected;
var selectedText;
var currentUser = null;
//#endregion

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === "UserInfo" && msg.data.Id !== null) {
        currentUser = null;
        currentUser = msg.data;
    }
    //logout
    if (msg.logout === true) {
        currentUser = null;
    }


});

function toCamel(o) {
    var newO, origKey, newKey, value;
    if (o instanceof Array) {
        return o.map(function (value) {
            if (typeof value === "object") {
                value = toCamel(value);
            }
            return value;
        });
    } else {
        newO = {};
        for (origKey in o) {
            if (o.hasOwnProperty(origKey)) {
                newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString();
                value = o[origKey];
                if (value instanceof Array || (value !== null && value.constructor === Object)) {
                    value = toCamel(value);
                }
                newO[newKey] = value;
            }
        }
    }
    return newO;
}

//getComment
function getComment(value) {
    var commnetUserEmail = "";
    if (value.Email !== null && value.Email !== "null") {
        commnetUserEmail = value.Email;
    }
    let user = (value.UserName !== null) ? value.UserName : value.Email;
    if (typeof chrome.app.isInstalled !== 'undefined')
        return '<div class="direct-chat-messages" style="margin-bottom: 7px;padding: 10px;background-color: rgba(0, 0, 0, 0.03);"><div class="p-10"> <div class="direct-chat-text" style="font-weight: bold;"> ' + value.Comment + ' </div> <div class="direct-chat-infos clearfix"> <span  class="direct-chat-timestamp float-left">' + user + '</span>  <span  class="direct-chat-timestamp float-right">' + value.DateTimeHuman + '</span></div></div> <div class="direct-chat-infos clearfix mt-2"><span class="direct-chat-timestamp float-right"><div class="row"><div class="col"> <img src="' + chrome.runtime.getURL("images/like.png") + '" alt="Like" width="15" id="upVote" data-voteCount="' + value.TotalLikes + '" data-commentId="' + value.Id + '" data-userId="' + value.UserId + '" " data-vote="1"> <span id="likecount" data-commentidup="' + value.Id + '">' + value.TotalLikes + '</span> </div><div class="col"> <img src="' + chrome.runtime.getURL("images/dislike.png") + '" alt="Dislike" width="15" id="downVote" data-voteCount="' + value.TotalDislikes + '" data-commentId="' + value.Id + '" data-userId="' + value.UserId + '" data-vote="-1"> <span id="dislikecount" data-commentiddown="' + value.Id + '">' + value.TotalDislikes + '</span> </div></div></span></div> </div>';
}

//voteForComment
$(document).on("click", "#upVote, #downVote", function () {
    let commentId = $(this).data("commentid");
    let voteType = $(this).data("vote");
    postData(apiEndPoint + "/api/postvote", {
        CommentId: commentId,
        UserId: currentUser.Id,
        VoteStatus: (voteType == 1) ? 1 : 0
    }, 'saveupVoteSuccess');
});

function saveupVoteSuccess(result, data) {
    if (result.status) {
        toastr.success(result.msg, 'Voted');

        $.get(apiEndPoint + "/api/getvotecount", { commentId: result.commentId })
            .done(function (votes) {
                $("#upVote").data("votecount", votes.data.TotalLikes);
                $("#downVote").data("votecount", votes.data.TotalDislikes);

                $('[data-commentidup="' + result.commentId + '"]').text(votes.data.TotalLikes);
                $('[data-commentiddown="' + result.commentId + '"]').text(votes.data.TotalDislikes);


            });

    }
    else
        toastr.warning(result.msg, 'Fail');
}

function failAlert(message) {
    // Display an error toast, with a title
    toastr.error(message, 'Fail');
}

function successAlert(heading, message) {
    // Display a success toast, with a title
    toastr.success(message, heading);
}

function warningAlert(heading, message) {
    // Display a success toast, with a title
    toastr.warning(message, heading);
}

//
function saveConversationContentSuccess(result, data) {

    //append the 
    $('#conversation-body').prepend(getComment(result));
    let newNo = parseInt($("#total-comment-count").text(), 10) + 1;
    $('#total-comment-count').empty().text(newNo);
    // make text area empty 
    $('#conversation-comment').val('');
}

function markSubmittedComment(result) {
    //get div class from map with key (domain name)
    let elem = contentSectionIdentifierKV.get(location.href.split('/')[2]);
    var camelResult = toCamel(result);
    // content identifier for different section 
    //  $.each(contentSectionIdentifierArray, function (index, value) {
    $(elem).find("*").each(function (index, elemItem) {
        if ($(this).context.innerText != undefined && $(this).context.innerText.includes(camelResult.selectedTextContainer)) {
            //if single string in the paragraph 
            if (elemItem.nodeName.toLocaleLowerCase() == "blockquote") {
                $(elemItem).children().each(function (index) {
                    if ($(this).context.innerText != undefined && $(this).context.innerText.includes(camelResult.selectedTextContainer)) {
                        addClassonSelected(this, camelResult);
                    }
                });

            } else {
                addClassonSelected(this, camelResult);
            }
        }
    });
    //});
}

function addClassonSelected(item, camelResult) {
    //if will match first value of offset
    if ((($(item).context.innerText.indexOf(camelResult.selectedText) === camelResult.selectedTextAnchorOffset) ||
        ($(item).context.innerText.indexOf(camelResult.selectedText) + 1 === camelResult.selectedTextAnchorOffset + 1) ||
        ($(item).context.innerText.indexOf(camelResult.selectedText) - 1 === camelResult.selectedTextAnchorOffset - 1))) {
       
        $(item).html($(item).html().replace(camelResult.selectedText.trim(), '<span class="proofread-comment" style="text-decoration: underline;text-decoration-color: red;">' + camelResult.selectedText + '</span>'));
      
        return;
    }
    else {
        //if multiple string in the paragraph distinguish by neighboring word
        $(item).html(
            $(item).html().replace($(item).
                context.innerText.substr(camelResult.selectedTextAnchorOffset, camelResult.selectedText.length + 10),
                '<span class="proofread-comment" style="text-decoration: underline;text-decoration-color: red;">'
                + $(item).context.innerText.substr(camelResult.selectedTextAnchorOffset, camelResult.selectedText.length) + '</span>' +
                ($(item).context.innerText.substr(camelResult.selectedTextAnchorOffset, camelResult.selectedText.length + 10))
                    .substring(camelResult.selectedText.length))
        );
        return;
    }
}

//append 
function saveContentCommentSuccess(result, data) {
    markSubmittedComment(data);
    successAlert("Success", "Inline comment submitted");
}

//#region On Page Load
//load all comments of the article
$(document).ready(function () {
    var currentUrl = location.href;
    //parse article on page load if it matches domain name;
    var parseArticle = isAllowedDomain(window.location.hostname, domainArray);

    if (parseArticle) {
        // each on content Identifier Array to find content identifier 
        $.each(contentIdentifierArray, function (index, value) {
            if ($(value).length > 0) {
                articleContent = $(value)[0].innerText;
                postArticle(apiEndPoint + "/api/posturl", { articleContent: articleContent, currentUrl: currentUrl });
                //send message to background js
                chrome.runtime.sendMessage({ articleContentParsed: $(value)[0].innerText }, function (response) { });
            }
        });

        //fetching the user data on page load
        chrome.storage.sync.get("currentUserInfo", function (userData) {
            if (typeof userData !== undefined && userData.currentUserInfo !== undefined) {
                currentUser = userData.currentUserInfo;
                //loading content if the user is logged in
                loadAllComment(apiEndPoint + "/api/loadpagecomment", { currentUrl: currentUrl });
            }
        });
    }
});
//#endregion

//#region User  Activity
//get comment on mouse over
$(document).on("mouseover", ".proofread-comment", function (event) {
    if (event.relatedTarget.innerText !== null)
        var selectedContainer = event.relatedTarget.innerText;
    console.log(selectedContainer);
    //var selectedContainer = event.target.parentElement.parentNode.innerText;
    if (event.toElement.innerText !== null)
        var selectedText = event.toElement.innerText;

    var offset = 0;
    //if first word is special character
    if ($(this).context.nextSibling !== null) {
        if (($(this).context.nextSibling.data.substring(0, 1) === '.') || ($(this).context.nextSibling.data.substring(0, 1) === ',') || ($(this).context.nextSibling.data.substring(0, 1) === '"') || ($(this).context.nextSibling.data.substring(0, 1) === '—') || ($(this).context.nextSibling.data.substring(0, 1) === "”" || ($(this).context.nextSibling.data.substring(0, 1) !== ' '))) {
            offset = selectedContainer.indexOf(selectedText + $(this).context.nextSibling.data.substring(0, 15));
        }
        else {
            offset = selectedContainer.indexOf(selectedText.trim() + " " + $(this).context.nextSibling.data.substring(0, 15).trim());
        }
    } else {

        if ($(event.target).parents('BLOCKQUOTE').length > 0) {
            $(event.target).parents('BLOCKQUOTE').children().each(function (index) {
                if ($(this).context.innerText != undefined && $(this).context.innerText.includes(selectedContainer)) {
                    offset = selectedContainer.indexOf($(this).context.previousSibling.data.substring($(this).context.previousSibling.data.length - 5) + selectedText) + 5;
                }
            });
        }

        else if ($(event.target).parents('a').length > 0) {
            $(event.target).parents('a').parents('p').children().each(function (index) {
                if ($(this).context.innerText != undefined && selectedContainer.includes($(this).context.innerText)) {
                    if ($(this).context.previousSibling.data !== null && $(this).context.previousSibling.data !== undefined) {
                        offset = selectedContainer.indexOf($(this).context.previousSibling.data.substring($(this).context.previousSibling.data.length - 5) + selectedText) + 5;
                    }
                    else {
                        offset = selectedContainer.indexOf(selectedText) + 5;
                    }
                }
            });
        }

        else {
            if (selectedContainer.indexOf($(this).context.previousSibling.data != null)) {
                offset = selectedContainer.indexOf($(this).context.previousSibling.data.substring($(this).context.previousSibling.data.length - 5) + selectedText) + 5;
            }
        }

    }
    if (offset !== -1) {
        loadComment(apiEndPoint + "/api/getcomment", { selectedText: selectedText, selectedContainer: selectedContainer, offset: offset }, event.pageY);
    }
});

//get comment on mouse over success
function loadComment(url, data, position) {

    $.ajax({
        type: "GET",
        url: url,
        data: data,
        success: function successHandler(result) {
            $("#conversation-pop-up").remove();
            if (result !== "") {
                //append all the comments and display pop up 
                var upper = ' <div id="conversation-pop-up"> <div id="conversation-pop-up-outer"><div class="card" id="conversation-card"  style=" width: 400px!important;"> <div class="card-header"><div class="row"><div class="col"> <h1 style="color: red;"><strong>Comments</strong></h1></div> <div class="col"><h4 class="text-right" style=" line-height: 35px; "> Total Comments <span id="total-comment-count" style="color:red;">' + Object.keys(result).length + '</span> </h4>  </div></div> </div><div class="card-body" id="conversation-body" style="height: 220px;overflow-y: scroll; color: black;"> ';
                var comments = "";
                var conversationId = 0;
                // iterate Each comment and bind
                $.each(result, function (key, value) {

                    conversationId = value.OwnerId;
                    comments = comments + getComment(value);
                });

                var lowerButtons = '<div class="" style="padding: 10px;"><button type="button" id="saveConversationContent" tabindex="1001" class="btn btn-primary mb-3" data-conversation-id=' + conversationId + '>Save Comment</button> <button type="button" id="btn-close-conversation" class="btn btn-light mb-3">Close</button>  </div>';
                var lower = '</div><div class="card-footer"> <div class="form-group "> <textarea class="form-control " id="conversation-comment" name="comment" rows="4"  tabindex="1000" > </textarea> ' + lowerButtons + '</div></div></div></div></div>';
                var conversationPopUp = upper + comments + lower;
                //append POP Up to body
                $($.parseHTML(conversationPopUp)).appendTo('body');
                $('#conversation-card').css({
                    "right": "0",
                    "position": "fixed",
                    "width": "360px",
                    "top": "77px",
                    "bottom": "0"
                });
                $('#conversation-comment').focus();
                $('#conversation-pop-up').show();
            }
            else {
                warningAlert("Warning", "Comment did not loaded properly.");
            }
        },
        error: function (error) {
        }
    });
}

//post  Conversation Content
$(document).on("click", "#saveConversationContent", function () {
    var conversationComment = $("#conversation-comment").val();
    if (conversationComment.trim() !== '') {
        var ownerId = $(this).data('conversationId');

        if (currentUser !== null && currentUser !== undefined && currentUser.Id !== null && currentUser.Email !== null) {
            postData(apiEndPoint + "/api/postinlinecommentconversation", {
                OwnerId: ownerId,
                Comment: conversationComment,
                UserId: currentUser.Id,
                Email: currentUser.Email,
                UserName: currentUser.UserName,
            }, 'saveConversationContentSuccess');
        } else {
            warningAlert("Please login first to comment.");
        }


    }
});

// close conversation box
$(document).on("click", "#btn-close-conversation", function () {
    $("#conversation-pop-up").remove();
});

//clear comment
$(document).on("mouseout", ".proofread-comment", function () {
    $('#commented-text').remove();
});

//close button of the modal
$(document).on("click", "#btn-close", function () {
    $("#selected-text").hide();
});

//post In line comment
$(document).on("click", "#saveContent", function () {
    $("#selected-text").hide();
    var currentUrl = location.href;
    selectedText = $("#content-parser").text();
    var selectedTextContainer = $("#selected-text-container").text();
    var selectedTextAnchorOffset = $("#selected-text-anchor-offset").html();
    var selectedTextComment = $("#comment-on-selected-text").val();
    var currentPluginUserEmail = "";
    if (currentUser !== null && currentUser !== undefined && currentUser.Id !== null) {
        currentPluginUserEmail = currentUser.Email;
    }
    postData(apiEndPoint + "/api/postinlinecomment", {
        selectedText: selectedText,
        comment: selectedTextComment,
        currentUrl: currentUrl,
        selectedTextContainer: selectedTextContainer,
        selectedTextAnchorOffset: selectedTextAnchorOffset,
        Email: currentPluginUserEmail,
        UserId: currentUser.Id,
        UserName: currentUser.UserName
    }, 'saveContentCommentSuccess');
});

//select the highlighted text
document.addEventListener('mouseup', function (event) {
    if (isAllowedDomain(window.location.hostname, domainArray) && currentUser !== null) {
        var sel = window.getSelection();
        var selectedTextContainer = "";
        // avoid to select already selected word
        var marks = document.getElementsByClassName('proofread-comment');
        for (var i = 0; i < marks.length; i++) {
            if (sel.containsNode(marks[i], false) !== sel.containsNode(marks[i], true)) {
                sel.removeAllRanges();  // clear selection
                return;
            }
        }
        //get selected text location and content
        selected = window.getSelection();
        if (selected !== null && selected.toString() !== "") {
            var selectedText = selected.toString().trim();
            var selectedTextParentNode = selected.extentNode.parentNode.localName;
            if (selectedTextParentNode === "a") {
                selectedTextContainer = selected.extentNode.parentNode.parentNode.innerText.trim();
            }
            else {
                selectedTextContainer = selected.extentNode.parentNode.innerText.trim();
            }

            if (selected.focusNode.parentNode.localName === "span") {
                selectedTextContainer = selected.extentNode.parentElement.parentNode.innerText.trim();
            }

            //cases for anchor offset
            var selectedTextAnchorOffSet = selectedTextContainer.indexOf(selectedText);
            //if multiple string in same paragraph
            var array = getIndicesOf(selectedText, selectedTextContainer, false);
            if (array.length > 1) {
                var range = window.getSelection().getRangeAt(0);
                var allWordsAfter = range.startContainer.wholeText.substr(range.startOffset, range.endOffset).trim().split(' ');
                if (allWordsAfter.length > 1) {
                    if (allWordsAfter.length > 2) {
                        var nextWord = allWordsAfter[1] + " " + allWordsAfter[2];
                    }
                    else {
                        nextWord = allWordsAfter[1];
                    }
                    selectedTextAnchorOffSet = selectedTextContainer.indexOf(allWordsAfter[0] + " " + nextWord);
                }
                else {
                    selectedTextAnchorOffSet = range.startOffset;
                }
            }
            //remove the existing pop up 
            $("#selected-text").remove();
            var html = '<div id="selected-text"> <div class="card"> <div class="card-header"> <h1 style="color: red;margin: 0px !important;"><strong>Comment</strong><h1> </div><div class="card-body" id="comment"> <div id="content-parser" class="mb-2"></div><div id="selected-text-anchor-offset" style="display:none;">0</div><div id="selected-text-container" style="display:none;"></div></div><div class="card-footer"> <div id="text-area" class="form-group "> <textarea class="form-control " id="comment-on-selected-text" name="comment" rows="5" cols="50" tabindex="100"> </textarea> </div> <div class=""><button type="button" id="saveContent" tabindex="101" class="btn btn-primary mb-3">Save Comment</button> <button type="button" id="btn-close" class="btn btn-light mb-3">Close</button>  </div></div></div></div>';

            if ($("#selected-text").length === 0) {
                $($.parseHTML(html)).appendTo('body');
            }
            $("#content-parser").html(selectedText);
            $("#selected-text-anchor-offset").html(selectedTextAnchorOffSet);
            $("#selected-text-container").html(selectedTextContainer);
            $('#selected-text').css({
                "position": "absolute",
                "z-index": "99999999999999",
                "top": event.pageY, "left": event.pageX,
                "background-color": "white",
                "border-radius": "8px", "box-shadow": "1px 1px 2px 1px #ccc"
            });
            $('#comment-on-selected-text').focus();
            $('#selected-text').show();
        }
    }
});
//#endregion

//#region  User Functions
//inlineComment success
function postData(url, data, successfunction) {
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        success: function successHandler(result) {
            if (successfunction !== undefined && successfunction.trim() !== "") {
                window[successfunction](result, data);
            }
        },
        error: function (error) {
            //failAlert("Bad Request");
        }
    });
}

// to parse particular article of particle of domain
function isAllowedDomain(domain, domainArray) {
    for (var i = 0; i < domainArray.length; i++) {
        if (domain.includes(domainArray[i])) {
            return true;
        }
    }
    return false;
}

//post article  success
function postArticle(url, data) {
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        success: function successHandler(result) {
            if (result === 0) {
                successAlert('Success', 'Article is being parsed');
            }
            else {
                successAlert('Success', 'Article already parsed');
            }
        },
        error: function (error) {
        }
    });
}

//get indices of multiple string in a paragraph
function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen === 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

//success of load all comments
function loadAllComment(url, data) {
    $.ajax({
        type: "GET",
        url: url,
        data: data,
        success: function successHandler(result) {
            if (result !== null) {
                for (var i = 0; i < result.length; i++) {
                    console.log("Comment count " + i)
                    markSubmittedComment(result[i]);
                }
            }
            else {
                warningAlert("Warning", "No comments on this article");
            }
        },
        error: function (error) {
        }
    });
}

//#endregion






