const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const { serializeCookies, createAndSendEmail } = require("./helpers");
const { CHERPUSER, CHERPPASS } = process.env;

let username = CHERPUSER;
let password = CHERPPASS;
let PHPSESSID;
let cherpsession;
let cherpusername;

const pollInterval = 60000; // 60 seconds
const maxChats = 100;
let chats = []; // Keep track of the most recent chats

function pollForUpdates() {
  axios
    .get("https://cherp.chat/api/chat/list/unread", {
      headers: {
        Cookie: `${PHPSESSID}; ${cherpsession}; ${cherpusername}`,
      },
    })
    .then((response) => {
      console.log("GET https://cherp.chat/api/chat/list/unread", response.data);

      if (response.data.status === "failure") {
        // Re-login and start the next long poll after the current one completes
        loginAndPoll();
        return;
      }

      // Extract the current unread chats
      const currentChats = response.data.chats;

      // Find new unread chats by comparing with previously fetched chats
      const newChats = currentChats.filter((chat) => {
        const foundChat = chats.find(
          (c) => c.chatMessage.ID === chat.chatMessage.ID
        );
        return !foundChat;
      });

      // Send notifications for new unread chats
      if (newChats.length > 0) {
        const urls = newChats.map(
          (chat) =>
            `https://cherp.chat/chats/${chat.chatURL} (${chat.chatMessage.type})`
        );
        const body = urls.join("\n");

        console.log("New unread chats:", newChats);
        createAndSendEmail("New unread CheRP chats!", body);
      }

      // Update the chats array with the most recent chats
      chats = [...newChats, ...chats.slice(0, maxChats - newChats.length)];

      // Start the next long poll after the current one completes
      setTimeout(pollForUpdates, pollInterval);
    })
    .catch((error) => {
      console.error(error);
      // Handle errors and start the next long poll after the current one completes
      setTimeout(pollForUpdates, pollInterval);
    });
}

function loginAndPoll() {
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

      pollForUpdates(); // Start polling the API
    })
    .catch((error) => {
      console.error(error);
    });
}

loginAndPoll();
