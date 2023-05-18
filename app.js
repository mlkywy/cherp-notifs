const axios = require("axios");
const FormData = require("form-data");
const { createAndSendEmail } = require("./nodemailer");

require("dotenv").config();
const { CHERPUSER, CHERPPASS } = process.env;

let username = CHERPUSER;
let password = CHERPPASS;
let PHPSESSID;
let cherpsession;
let cherpusername;

const pollInterval = 60000; // 60 seconds
let dates = []; // Keep track of previously created chats

function pollForUpdates() {
  axios
    .get("https://cherp.chat/api/chat/list/unread", {
      headers: {
        Cookie: `${PHPSESSID}; ${cherpsession}; ${cherpusername}`,
      },
    })
    .then((response) => {
      console.log("GET https://cherp.chat/api/chat/list/unread", response.data);

      // Extract the updated dates of the current unread chats
      const current = response.data.chats.map((chat) => chat.updated);

      // Find new unread chats by comparing with previous updated dates
      const unread = current.filter(
        (updatedDate) => !dates.includes(updatedDate)
      );

      // Send notifications for new unread chats
      if (unread.length > 0) {
        console.log("New unread chat created dates:", unread);
        // TODO: send notifications or handle new unread chats
        createAndSendEmail("New unread message from CheRP!", "this is a test");
      }

      dates = current;

      // Start the next long poll after the current one completes
      setTimeout(pollForUpdates, pollInterval);
    })
    .catch((error) => {
      console.error(error);
      // Handle errors and start the next long poll after the current one completes
      setTimeout(pollForUpdates, pollInterval);
    });
}

axios
  .get("https://cherp.chat/")
  .then((response) => {
    PHPSESSID = serializeCookies(response.headers["set-cookie"]);

    return axios.get("https://cherp.chat/api/csrf", {
      headers: { Cookie: PHPSESSID },
    });
  })
  .then((response) => {
    console.log("GET /api/csrf", response.data);
    const csrf = response.data.csrf;
    const csrfname = response.data.csrfname;

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("csrf", csrf);
    formData.append("csrfname", csrfname);

    return axios.post("https://cherp.chat/api/user/login", formData, {
      headers: { Cookie: PHPSESSID },
    });
  })
  .then((response) => {
    console.log("POST /api/user/login", response.data);
    cherpsession = serializeCookies(response.headers["set-cookie"][0]);
    cherpusername = serializeCookies(response.headers["set-cookie"][1]);

    pollForUpdates();
  })
  .catch((error) => {
    console.error(error);
  });

function serializeCookies(cookies) {
  if (cookies) {
    if (Array.isArray(cookies)) {
      return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
    } else if (typeof cookies === "string") {
      return cookies.split(";")[0];
    }
  }
  return "";
}
