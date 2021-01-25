import * as path from "path";
import * as express from "express";
// import * as Data from "./data/index";

interface ServerConfig {
  auth: string;
}

function makeServer(config: ServerConfig): express.Application {
  const app = express.default();

  // Basic auth
  app.use((req, res, next) => {
    const unauthorized = () => {
      res.setHeader("www-authenticate", "basic");
      return res.status(401).send();
    };

    const authData = req.header("authorization");
    if (!authData) return unauthorized();

    const authDecoded = Buffer.from(
      authData.replace(/^Basic /, ""),
      "base64"
    ).toString("utf8");

    if (authDecoded !== config.auth) return unauthorized();
    next();
  });

  app.use(express.static(path.join(__dirname, "../static")));

  // Routes

  return app;
}

const authString = process.env.AUTH_STRING;
if (!authString) throw new Error("Must provide AUTH_STRING");

module.exports = () =>
  makeServer({ auth: authString }).listen(3333, () =>
    console.log("Listening on 3333")
  );
