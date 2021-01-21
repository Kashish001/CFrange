document.getElementById("button").addEventListener("click", callMe, false);
let request = require("request-promise");
let cheerio = require('cheerio');
let { contains } = require("cheerio");
let baseLinkofProblem = "https://codeforces.com"
let problemsAndTitles = new Map();
let ratingWiseProblems = new Map();

function getNumberOfPages(url) {
    return new Promise(async (resolve) =>{
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
        let baseLinkOfPage = "https://codeforces.com/submissions/" + userName + "/page/"
        let linkToGetPageNumbers =  "https://codeforces.com/submissions/" + userName + "/page/1"
        ratingWantByUser = ratingWantByUser + " " + userName;
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
        let dataOfUser = "<table class='table table-striped table-dark' id = 'problemTable'><thead><tr><th scope='col'>#</th><th scope='col'>Problems</th></tr></thead><tbody>"
        let numOfProblem = 1;
        if(!ratingWiseProblems.has(ratingWantByUser)) {
            dataOfUser += "<tr><th scope='row'> 0 </th><td> No Data Found </td></tr>"
        } else {
            for(let problem of ratingWiseProblems.get(ratingWantByUser)) {
                if(problem["data"]["verdict"] == "OK") {
                    dataOfUser += "<tr id = 'AC'>"
                } else dataOfUser += "<tr id = 'WA'>"
                dataOfUser += "<th scope='row'>" + numOfProblem + "</th>" + "<td>" + "<a class = 'tableProblem' href = '" + problem["data"]["link"] + "' target = '_blank'>" + problem["name"] + "</a></td></tr>";
                numOfProblem += 1;
            }
        }
        dataOfUser += "</tbody></table>";
        document.getElementById("pt").innerHTML = dataOfUser;
        window.scrollBy(0, 580);
        ratingWiseProblems.clear();
        problemsAndTitles.clear();
    })();
}

