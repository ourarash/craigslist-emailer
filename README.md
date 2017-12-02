<img src="https://github.com/ourarash/craigslist-emailer/blob/master/capture.gif?raw=true" width="350" align="right">


# Craigslist-Emailer

[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ourarash/craigslist-emailer)

### Automation Script for sending an email to each Craigslist post
This script searches for a keyword in a craigslist URL, and then automatically sends an email to each poster. The body of the email can be set in the options variable.

Implemented in nodejs using the Selenium module.


**Disclaimer**: Please Note that this is a research project. I am by no means responsible for any usage of this tool. Use on your own behalf. I’m also not responsible if your  get into any trouble due to extensive use of this tool.


Table of Contents
=================

* [Getting Started](#getting-started)
  * [Basic Installation](#basic-installation)
  * [Gmail Settings](#gmail-settings)
* [Run the Script](#run-the-script)
 
## Getting started

### Basic Installation:

```bash
1. git clone https://github.com/ourarash/craigslist-emailer.git
2. cd craigslist-emailer
3. npm install
```

Set searchURL, searchTerm, your email, password, emailBody, and SMTP servers in index.js

```javascript
// Fill out these options
var options = {
    searchURL: "https://sfbay.craigslist.org/d/furniture/search/fua",   //The page we are searching
    searchTerm: "tv",                                                   //The keyword we are searching
    printBody: false,
    printTitle: true,
    badWords: ["badword1", "badword2"],                                 //Detects bad words in title and body of each text
    fromName: 'Your-name',                                              //Sender name in the email being sent
    email: "uid@gmail.com",                                             //Your email address
    password: "password",                                               //Your password
    smtpServer: 'smtp.gmail.com',                                       //SMTP server. Use smtp.gmail.com for gmail
                                                                        //The body of email sent to each poster
    emailBody: `Hi,                                                     

    What is your lowest price?
    
    Thanks,
    John Doe
    `,
};

```

### Gmail Settings:
If you use Gmail, in order to send emails using this script, you will need to set Gmail to allow sending email from less secure sources.
Gmail will send you an email with instructions once you run this script for the first time.

Alternatively, you can set it from here:
https://myaccount.google.com/lesssecureapps

### Run the Script:
Execute it:

```bash
$ node index.js
```
