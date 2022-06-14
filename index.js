const express = require("express");
const redis = require("redis");
const axios = require("axios");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6739;

const client = redis.createClient(REDIS_PORT);

const app = express();

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos </h1>`;
}
async function getRepos(req, res, next) {
  try {
    console.log("fetching data");
    const { username } = req.params;

    const response = await axios(`https://api.github.com/users/${username}`);

    const data = response.data;

    const repos = data.public_repos;
    client.connect();

    client.on("connect", () => {
      client.setEx(username, 3600, repos);
      console.log("connected");
    });

    res.send(setResponse(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}

function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}
app.get("/repos/:username", cache, getRepos);

app.listen(5000, () => {
  console.log(`App listening on ${PORT}`);
});
