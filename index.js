// Selenium nodejs code for replying to Craigslist posts
// By: Ari Saif
// Disclaimer:  This code is only for educational purposes.
//              Do not use automation on websites without their permission!
var nodemailer = require('nodemailer');
var moment = require('moment');
const winston = require('winston')

var webdriver = require("selenium-webdriver"),
    By = webdriver.By,
    until = webdriver.until;

// Fill out these options
var options = {
    searchURL: "https://sfbay.craigslist.org/d/furniture/search/fua",   //The page we are searching
    searchTerm: "tv",                                                   //The keyword we are searching
    printBody: false,
    printTitle: true,
    badWords: ["badword1", "badword2"],                                 //Detects bad words in title and body of each text
    fromName: 'Ari',                                                    //Sender name in the email being sent
    email: "uid@gmail.com",                                       //Your email address
    password: "password",                                           //Your password
    smtpServer: 'smtp.gmail.com',                                       //SMTP server. Use smtp.gmail.com for gmail
    //The body of email sent to each poster
    emailBody: `Hi,                                                     

    What is your lowest price?
    
    Thanks,
    Ari
    `,
};

// Setup winston logger
var logFileName = moment().format('MM-DD-YYYY-hh-mm') + "-combined.log";
console.log('logFileName=' + logFileName);
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: logFileName })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
// ----------------------------------------------------------------
// Main script starts from here!
var driver = new webdriver.Builder().forBrowser("chrome").build();

// Open the search page
driver.get(options.searchURL);

// Type in search item
driver.findElement(By.name("query")).sendKeys(options.searchTerm + "\n");

// Switch to list view
driver.findElement(By.id("gridview")).click();
driver.findElement(By.id("listview")).click();

// Find all posts in the first page
driver.findElements(By.xpath('//*[@id="sortable-results"]/ul/li')).then(elements => {
    logger.log('info', "length: " + elements.length);
    logger.log('info', "------------------------------------------------------------------");
    let outputText = Array[elements.length];
    let curUrl;
    let curTitle;
    for (let i = 1; i <= elements.length; i++) {
        try {
            let link = '//*[@id="sortable-results"]/ul/li[' + i + "]/p/a";

            // Find the URL of the post
            driver.findElement(By.xpath(link)).click();
            driver.sleep(1500);

            driver.findElement(By.xpath("/html/body/section/section/header/button")).click().catch((e) => {
                // continue
            });
            driver.sleep(1000);

            // Get current URL
            driver.getCurrentUrl().then(url => {
                curUrl = url;
                // console.log(i + ". URL: ", url);
                logger.log('info', i + ". URL: "+  url);
            });


            //Get Title
            driver
                .findElement(By.id("titletextonly"))
                .getText()
                .then(s => {
                    curTitle = s;
                    if (options.printTitle) {
                        logger.log('info', i + ". Title: " + s);
                    }
                    if (containsBadWord(s, options.badWords)) {
                        console.log("Contains bad words!");
                        logger.log('info', "Contains bad words!");
                    }
                })
                .catch(e => {
                    logger.log('info', i + ". Title wasn't found!");
                    
                });

            //Get body
            driver
                .findElement(By.id("postingbody"))
                .getText()
                .then(s => {
                    if (options.printBody) {
                        logger.log('info', i + ". Body: " + s);
                        if (containsBadWord(s, options.badWords)) {
                            console.log("Contains bad words!");
                        }
                    }

                    // Extract any phone number and email in the body
                    var helper = require("watsonhelper");
                    var phonelist = helper.phoneextractor(s);
                    if (phonelist) {
                        console.log("**Body phonelist: ", phonelist);
                    }
                    var email = helper.emailextractor(s);
                    if (email) {
                        console.log("**Body email: ", email);
                    }
                })
                .catch(e => {
                    logger.log('info', i + ". Body wasn't found!");
                });

            // Get price
            driver
                .findElement(By.className("price"))
                .getText()
                .then(s => {
                    logger.log('info', i + ". Price: " + s);
                })
                .catch(e => {
                    logger.log('info', i + ". Price wasn't found!");
                });

            // Get email and send a response
            driver
                .findElement(By.className("anonemail"))
                .getText()
                .then(s => {
                    logger.log('info', i + ". Email: " + s);
                    var mailOptions = {
                        to: "ourarash@gmail.com",
                        subject: "Re: " + curTitle, // Subject line 
                        text: options.emailBody + "\n\n" + curUrl, // plaintext body 
                        html: linkify(options.emailBody + "\n\n" + curUrl), // plaintext body 
                    };
                    // TODO: check if we have sent to this email address before
                    SendMail(mailOptions);
                })
                .catch(e => {
                    logger.log('info', i + ". Email wasn't found!");
                });

            // Get phone number
            driver
                .findElement(By.className("reply-tel-number"))
                .getText()
                .then(s => {
                    var phoneNumber = s.replace(/[^0-9]/g, "");
                    logger.log('info', i + ". Phone number: " + phoneNumber);
                    logger.log('info', "------------------------------------------------------------------");
                })
                .catch(e => {
                    logger.log('info', i + ". Phone number wasn't found!");
                    logger.log('info', "------------------------------------------------------------------");
                });
        } catch (e) {
            console.log("E: ", e);
        }

        driver.navigate().back();
    }
});

//TODO: click on next to go to the next page and repeat
driver.quit();

//-------------------------------------------------------------------------------
// Utility functions
//-------------------------------------------------------------------------------
linkify = function (str) {

    // http://, https://, ftp://
    var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

    // www. sans http:// or https://
    var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    // Email addresses
    var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

    //Newline Pattern
    newlinePattern = /\n/gim;;
    var str2 = str.replace(urlPattern, '<a href="$&">$&</a>')
        .replace(pseudoUrlPattern, '$1<a href="http://$2">$2</a>')
        .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>')
        .replace(newlinePattern, '&nbsp;<br />');

    // alert("str2="+ str2);
    return str2;
};

// -----------------------------------------------------------
// create reusable transporter object using the default SMTP transport 
// var transporter = nodemailer.createTransport('smtps://trystnotifications@gmail.com:Cuisine7@smtp.gmail.com');
var transporter = nodemailer.createTransport('smtps://' + options.email + ':' + options.password + '@' + 'smtp.gmail.com');
// send mail with defined transport object 
SendMail = function (mailOptions) {
    if (!mailOptions.from)
        mailOptions.from = options.fromName + "<" + options.email + ">";

    if (!mailOptions.to) {
        logger.log("error", "SendMail Error: No to address provided");
        return (false);
    }

    if (!mailOptions.text) {
        logger.log("error", "SendMail Error: No to text provided");
        return (false);
    }

    if (!mailOptions.html) {
        logger.log("error", "SendMail Error: No to html provided");
        return (false);
    }

    if (!mailOptions.subject) {
        logger.log("error", "SendMail Error: No to html provided");
        return (false);
    }
    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return logger.log("error", error);
        }
        logger.log("info", 'Message sent to: ' + mailOptions.to + " " + info.response);
        logger.log('info', "------------------------------------------------------------------");
    });
}

// -----------------------------------------------------------
containsBadWord = function (str, badWords) {

    if (str && badWords && badWords.length > 0) {
        if (new RegExp(badWords.join("|"), "i").test(str.toLowerCase())) {
            return true;
        }
    }
    return false;
};