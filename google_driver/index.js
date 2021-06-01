import fs from "fs";
import util from "util";
import { dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { google } from "googleapis";
// TODO hiden token
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const readFile = util.promisify(fs.readFile);

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = __dirname + "/token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  try {
    // Check if we have previously stored a token.
    const token = await readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {
    return getAccessToken(oAuth2Client);
  }
}
function ask() {
  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      resolve(code);
    });
  });
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const code = await ask();
    const token = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(token);
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log("Token stored to", TOKEN_PATH);
    });
    return oAuth2Client;
  } catch (error) {
    console.error(error);
  }
}
// Load client secrets from a local file.
export const uploadFile = async (file) => {
  try {
    const content = await readFile(__dirname + "/credentials.json");
    const auth = await authorize(JSON.parse(content));
    return await uploadFileCallback(auth, file);
  } catch (error) {
    console.error(error);
  }
};
/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({ version: "v3", auth });
  drive.files.list(
    {
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const files = res.data.files;
      if (files.length) {
        console.log("Files:");
        files.map((file) => {
          console.log(`${file.name} (${file.id})`);
        });
      } else {
        console.log("No files found.");
      }
    }
  );
}

function uploadFileCallback(auth, file) {
  const drive = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: file._id,
    parents: ["1fPKi6192EorG3abA9s1ieVyrMFYDchNt"],
  };
  const media = {
    mimeType: "image/jpeg",
    body: file.source,
  };
  return drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id",
  });
}