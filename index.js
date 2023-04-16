const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');



/*
  From line number 15 to 97 , Whenevery we run this application 
  The user will asked to signed in using a gmail account
  Which full fills the first challenge of asking user to login.
  Task-1 Completed.

*/


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

authorize().then(listLabels).catch(console.error);



/*

    Since we are now authenticated we will get three things that is client_id,client_secret and refresh_token in
    token.json file we can also get the same from google cloud platform but refresh_token will not be generated
    Now after getting all the credentials we will connect to the goole api and set credentials for it
    from line number 120 to 129

*/


const credentials = {
    client_id: '797457166572-kabmfc3ca2d2q4e3v7tf8gv2dg541vc7.apps.googleusercontent.com',
    client_secret:'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',
    refresh_token: "1//0ghh_aN-nP6jSCgYIARAAGBASNwF-L9IruvNwrMnHOip6lz2fjWo468NS3n4dc-y1YDmid2tpR5tLxblH2z5JEoBDpl2-EENXLKg"
  };
  
  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
  );
  
  oauth2Client.setCredentials({
    refresh_token: credentials.refresh_token
  });
  
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});

gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread'
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
  
    const messages = res.data.messages[0];
  
        const threadId = messages.threadId;
        getEmails(threadId,messages.id)
  });

/*This Functions help us to convert the email of the sender which we can use to assign the message */

const convertEmail=(email)=>{
    let i=0;
    while(email[i]!='<'){
        i++;
    }
    i++
    let ans="";
    while(email[i]!='>'){
        ans+=email[i];
        i++;
    }
    return ans;
}


/*The getEmails method is used to get the fitst thread of unread message. */

const getEmails=(thread_id,message_id)=>{


    gmail.users.messages.get({
        userId: 'me',
        id: thread_id
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        
     const headers = res.data.payload.headers;
    
      // Find the "From" header in the headers array
      const fromHeader = headers.find((header) => header.name === 'From');
      const fromValue = fromHeader.value;

      // Extract the sender's name from the From header
      const match = fromValue.match(/^([^<]+)</);
      const senderName = match ? match[1].trim() : fromValue;
      console.log(senderName)
    
      const replyEmail=convertEmail(fromHeader.value)
      console.log(replyEmail)

        const reply = 'Hi thanks for reaching me i am on hoiday and will get back to you shortly';
        const subject='On a vication'
        const raw = `From: "Aryan pathak" <aryanpathak738@gmail.com>\r\nTo: "suyash" <${replyEmail}>\r\nSubject: RE: ${subject}\r\n\r\n${reply}`;

        gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: Buffer.from(raw).toString('base64')
        }
        }, (err, res) => {
            console.log('HI')
        if (err) return console.log('The API returned an error: ' + err);

        console.log(res.data);
});
        

        });


}

