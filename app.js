import { Client } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";
import fs from "fs";
import ora from "ora";
import chalk from "chalk";
import https from "https";

let client;
let sessionData;
let joke;

const SESSION_FILE_PATH = "./session.json";
const jokeLink = "icanhazdadjoke.com";

const withSession = () => {
  const spinner = ora(`Laoding ${chalk().yellow("validating session...")}`);
  sessionData = require(SESSION_FILE_PATH);
  spinner.start();
  client = new Client({
    session: sessionData,
  });
  client.on("ready", () => {
    spinner.stop();
    console.log("Client is ready!");
  });
  client.initialize();
};

const withOutSession = () => {
  console.log("No session found");
  client = new Client();
  client.on("qr", (qr) => {
    qrCode.generate(qr, { small: true });
  });

  client.on("authenticated", (session) => {
    console.log("AUTHENTICATED", session);
    // sessionData = session;
    // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
    //   if (err) {
    //     console.error(err);
    //   }
    // });
  });

  client.initialize();

  client.on("ready", () => {
    console.log("Client is ready!");
    listenerMessage();
  });
};

const getJoke = async (from) => {
  const options = {
    hostname: jokeLink,
    path: "/",
    headers: {
      Accept: "application/json",
    },
  };
  https
    .get(options, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on("end", () => {
        sendMessage(
          from,
          "te lo cuent oen ingles porque si lo traduzco pierde el sentido"
        );
        console.log(data);
        sendMessage(from, JSON.parse(data).joke);
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
};

const listenerMessage = async () => {
  client.on("message", (message) => {
    const { from, to, body } = message;

    console.log(message);
    switch (body) {
      case "Hola":
        sendMessage(from, "Hola ser humano");
        break;
      case "Chiste":
        getJoke(from);
        break;
      default:
        sendMessage(from, "No entiendo");
        break;
    }
  });
};

const sendMessage = (to, message) => {
  client.sendMessage(to, message);
};

fs.existsSync(SESSION_FILE_PATH) ? withSession() : withOutSession();
