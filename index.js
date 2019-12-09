const express = require("express");
const app = express();
const morgan = require("morgan");
const compression = require("compression");
const PORT = process.env.PORT || 1337;

const createApp = () => {
  //logging
  app.use(morgan("dev"));
  //body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  //compression
  app.use(compression());
  //404
  app.use((req, res, next) => {
    res.status(404).send("Not found");
  });
};

const startListening = () => {
  const server = app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
  });
};

//const syncDb = () => {
//   db.sync();
// }

async function bootApp() {
  // await sessionStore.sync();
  // await syncDb();
  await createApp();
  await startListening();
}
// This evaluates as true when this file is run directly from the command line,
// i.e. when we say 'node server/index.js' (or 'nodemon server/index.js', or 'nodemon server', etc)
// It will evaluate false when this module is required by another module - for example,
// if we wanted to require our app in a test spec
if (require.main === module) {
  bootApp();
} else {
  createApp();
}
