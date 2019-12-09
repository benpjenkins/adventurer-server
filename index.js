const path = require("path");
const express = require("express");
const morgan = require("morgan");
const compression = require("compression");
const session = require("express-session");
const passport = require("passport");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const db = require("./db");
const sessionStore = new SequelizeStore({ db });
const PORT = process.env.PORT || 1337;
const app = express();
const graphHTTP = require("express-graphql");
// const schema = require("./graphql/schema");
const server = require("http").createServer(app);

module.exports = app;

// This is a global Mocha hook, used for resource cleanup.
// Otherwise, Mocha v4+ never quits after tests.
if (process.env.NODE_ENV === "test") {
  // eslint-disable-next-line no-undef
  after("close the session store", () => sessionStore.stopExpiringSessions());
}

if (process.env.NODE_ENV !== "production") require("./secrets");

// passport registration
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.models.user.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const createApp = () => {
  // logging middleware
  app.use(morgan("dev"));

  // body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // compression middleware
  app.use(compression());

  // session middleware with passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "my best friend is Cody",
      store: sessionStore,
      resave: false,
      saveUninitialized: false
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // auth and api routes
  app.use("/auth", require("./auth"));
  // app.use("/api", require("./api"));

  //use graphql
  // app.use(
  //   '/graphql',
  //   graphHTTP({
  //     schema,
  //     graphiql: true,
  //     customFormatErrorFn: error => {
  //       const message = {
  //         message: error.message,
  //         locations: error.locations,
  //         stack: error.stack ? error.stack.split('\n') : [],
  //         path: error.path
  //       }
  //       console.log(message)
  //       return message
  //     }
  //   })
  // )

  // error handling endware
  app.use((err, req, res, next) => {
    console.error(err);
    console.error(err.stack);
    res.status(err.status || 500).send(err.message || "Internal server error.");
  });
};

const startListening = () => {
  // start listening (and create a 'server' object representing our server)
  server.listen(PORT, () => console.log(`Mixing it up on port ${PORT}`));
};

const syncDb = () => db.sync();

async function bootApp() {
  await sessionStore.sync();
  await syncDb();
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
