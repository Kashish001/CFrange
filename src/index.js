document.getElementById("button").addEventListener("click", callMe, false);
let request = require("request-promise");
let cheerio = require('cheerio');
let { contains } = require("cheerio");
let baseLinkofProblem = "https://codeforces.com"
let problemsAndTitles = new Map();
let ratingWiseProblems = new Map();
let anotherUserProblems = new Map();
let isChecked = document.getElementById("userId");

// NUmber of pages of Submissions that have to be Scrapped

function getNumberOfPages(url) {
    return new Promise(async (resolve) => {
        let pageResponse = await request.get(url);
        let $ = cheerio.load(pageResponse);
        for(let child of $(".status-frame-datatable > tbody > tr")) {
            let attr = $(child).attr('data-submission-id');
            if(typeof attr !== typeof undefined && attr !== false && $(child).find("td:nth-child(3) > span").text() == "") {
               var title = $(child).find("td:nth-child(3) > a").attr('title');
               var problemName = $(child).find("td:nth-child(4) > a").text().trim().substring(4);
               var linkToProblem =  $(child).find("td:nth-child(4) > a").attr('href');
               var verdict = $(child).find("td:nth-child(6) > span").attr('submissionverdict');
               if(!problemsAndTitles.has(problemName)) {
                    let obj = {
                        "title": title,
                        "link" : baseLinkofProblem + linkToProblem,
                        "verdict": verdict,
                    };
                    problemsAndTitles.set(problemName, obj);
                }
            }
        }
        let len = $(".pagination > ul > li").length;
        let toBeFound = ".pagination > ul > li:nth-child(" + (len) + ")";
        resolve($(toBeFound).text());
    });
}

////////////////////////////////////////////////////////////////////////

function rating() {
    var e = document.getElementById("opt");
    var value = e.options[e.selectedIndex].value;
    return value;
}
function callMe() {
    (async () => {
        let userName = await document.getElementById("exampleInputEmail1").value;
        let ratingWantByUser = await rating();
        if(userName == "") {
            alert("Enter User Name");
            return ;
        } else if(ratingWantByUser == "Rating") {
            alert("Select Rating");
            return ;
        }
        //Show Timer
        document.getElementById("smay").style.display = "block";
        //-------------------------------------------------------------
        let dataOfAnotherUser;
        //If User Wants to Check thhere Problems with Another user
        if(isChecked.checked == true) {
            let nameOfAnotherUSer = await document.getElementById("playerId").value;
            if(nameOfAnotherUSer == "") {
                alert("Enter User Id to be Mapped with")
                return ;
            }
            let urlOfAnotherUser = "https://codeforces.com/api/user.status?handle="+ nameOfAnotherUSer + "&from=1";
            dataOfAnotherUser = await fetch(urlOfAnotherUser)
            dataOfAnotherUser = dataOfAnotherUser.json();
            if(dataOfAnotherUser["status"] !== "OK") {
                alert("Wrong User Id");
                document.getElementById("smay").style.display = "none";
                return ;
            }
            for(let problemData of dataOfAnotherUser["result"]) {
                if(!anotherUserProblems.has(problemData["problem"]["name"])) {
                    anotherUserProblems.set(problemData["problem"]["name"], problemData["verdict"])
                }
            }
        }
        //------------------------------------------------------------

        let baseLinkOfPage = "https://codeforces.com/submissions/" + userName + "/page/"
        let linkToGetPageNumbers =  "https://codeforces.com/submissions/" + userName + "/page/1"
        ratingWantByUser = ratingWantByUser + " " + userName;
        let checkUserResposne = await fetch("https://codeforces.com/api/user.rating?handle=" + userName);
        let checkUser = await checkUserResposne.json();
        if(checkUser['status'] !== 'OK'){
            alert("Wrong User Id");
            document.getElementById("smay").style.display = "none";
            return ;
        }
        let numberOfPages = await getNumberOfPages(linkToGetPageNumbers);
        numberOfPages -= 1;
        let links = []
        for(let pageNum = 2; pageNum <= numberOfPages; pageNum++) {
            links.push(baseLinkOfPage + pageNum);
        }
        let resposeOfLinks = await Promise.all(links.map(async (url) => {
            try {
                let response = await request.get(url);
                return response;
            } catch(e) {
                return e.message;
            }
        }));

        for(let pageResponse of resposeOfLinks) {
            let $ = cheerio.load(pageResponse);
            for(let child of $(".status-frame-datatable > tbody > tr")) {
                let attr = $(child).attr('data-submission-id');
                if(typeof attr !== typeof undefined && attr !== false && $(child).find("td:nth-child(3) > span").text() == "") {
                    var problemName = $(child).find("td:nth-child(4) > a").text().trim().substring(4);
                   var title = $(child).find("td:nth-child(3) > a").attr('title');
                   var linkToProblem =  $(child).find("td:nth-child(4) > a").attr('href');
                   var verdict = $(child).find("td:nth-child(6) > span").attr('submissionverdict');
                   if(!problemsAndTitles.has(problemName)) {
                        let obj = {
                            "title": title,
                            "link" : baseLinkofProblem + linkToProblem,
                            "verdict": verdict,
                        };
                        problemsAndTitles.set(problemName, obj);
                    }
                }
            }
        } 
        for(let [problemName, problemObject] of problemsAndTitles) {
            if(!ratingWiseProblems.has(problemObject["title"])) {
                ratingWiseProblems.set(problemObject["title"], new Set())
                let obj = {
                    "name": problemName,
                    "data": problemObject
                };
                ratingWiseProblems.get(problemObject["title"]).add(obj);
            } else {
                let obj = {
                    "name": problemName,
                    "data": problemObject
                };
                ratingWiseProblems.get(problemObject["title"]).add(obj);
            }
        }
        let dataOfUser = "<table class='table table-striped table-dark' id = 'problemTable'><thead><tr><th scope='col'>S.NO</th><th scope='col'>Problem List of " + userName + "</th>"
        if(isChecked.checked == true) {
            dataOfUser += "<th scope='col'> Your Status </th>"
        }
        dataOfUser += "</tr></thead><tbody>";
        let numOfProblem = 1;
        let check = "ALL" + " " + userName;
        if(ratingWantByUser == check) {
            for(let [problemName, problemObject] of problemsAndTitles) {
                if(isChecked.checked == true) {
                    dataOfUser += "<tr><th scope='row'>" + numOfProblem + "</th>"
                    if(problemObject["verdict"] == "OK") dataOfUser += "<td id = 'AC'>"
                    else dataOfUser += "<td id = 'WA'>"
                    dataOfUser += "<a class = 'tableProblem' href = '" + problemObject["link"] + "' target = '_blank'>" + problemName + "</a></td>"; 
                    if(anotherUserProblems.has(problemName)) {
                        let verd = anotherUserProblems.get(problemName);
                        let verdict;
                        if(verd == "OK") verdict = "AC";
                        else if(verd == "TIME_LIMIT_EXCEEDED") verdict = "TLE";
                        else if(verd == "WRONG_ANSWER") verdict = "WA";
                        else if(verd == "MEMORY_LIMIT_EXCEEDED") verdict = "MLE"
                        else verdict = "CE"; 
                        if(verdict == "AC") {
                            dataOfUser += "<td id = '"+verdict+"'>";
                        } else {
                            dataOfUser += "<td id = 'WA'>";
                        }
                        dataOfUser += verdict + "</td></tr>"
                    } else {
                        dataOfUser += "<td id = 'notDone'>Not Done</td></tr>"
                    }
                } else {
                    dataOfUser += "<tr><th scope='row'>" + numOfProblem + "</th>"
                    if(problemObject["verdict"] == "OK") dataOfUser += "<td id = 'AC'>"
                    else dataOfUser += "<td id = 'WA'>"
                    dataOfUser += "<a class = 'tableProblem' href = '" + problemObject["link"] + "' target = '_blank'>" + problemName + "</a></td></tr>";    
                }
                numOfProblem += 1;
            }
        }
        else if(!ratingWiseProblems.has(ratingWantByUser)) {
            dataOfUser += "<tr><th scope='row'> 0 </th><td> No Data Found </td></tr>"
        } else {
            for(let problem of ratingWiseProblems.get(ratingWantByUser)) {
                if(isChecked.checked == true) {
                    dataOfUser += "<tr><th scope='row'>" + numOfProblem + "</th>"
                    if(problem["data"]["verdict"] == "OK") dataOfUser += "<td id = 'AC'>"
                    else dataOfUser += "<td id = 'WA'>"
                    dataOfUser += "<a class = 'tableProblem' href = '" + problem["data"]["link"] + "' target = '_blank'>" + problem["name"] + "</a></td>"; 
                    if(anotherUserProblems.has(problem["name"])) {
                        let verd = anotherUserProblems.get(problem["name"]);
                        let verdict;
                        if(verd == "OK") verdict = "AC";
                        else if(verd == "TIME_LIMIT_EXCEEDED") verdict = "TLE";
                        else if(verd == "WRONG_ANSWER") verdict = "WA";
                        else if(verd == "MEMORY_LIMIT_EXCEEDED") verdict = "MLE"
                        else verdict = "CE"; 
                        if(verdict == "AC") {
                            dataOfUser += "<td id = '"+verdict+"'>";
                        } else {
                            dataOfUser += "<td id = 'WA'>";
                        }
                        dataOfUser += verdict + "</td></tr>"
                    } else {
                        dataOfUser += "<td id = 'notDone'>Not Done</td></tr>"
                    }
                } else {
                    dataOfUser += "<tr><th scope='row'>" + numOfProblem + "</th>"
                    if(problem["data"]["verdict"] == "OK") dataOfUser += "<td id = 'AC'>"
                    else dataOfUser += "<td id = 'WA'>"
                    dataOfUser += "<a class = 'tableProblem' href = '" + problem["data"]["link"] + "' target = '_blank'>" + problem["name"] + "</a></td></tr>";    
                }
                numOfProblem += 1;
            }
        }
        document.getElementById("smay").style.display = "none";
        dataOfUser += "</tbody></table>";
        document.getElementById("pt").innerHTML = dataOfUser;
        window.scrollBy(0, 580);
        ratingWiseProblems.clear();
        problemsAndTitles.clear();
    })();
}

