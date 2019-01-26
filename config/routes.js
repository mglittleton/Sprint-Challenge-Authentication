const axios = require("axios");
const bcrypt = require("bcryptjs");
const knex = require("knex");

const { authenticate, generateToken } = require("../auth/authenticate");
const knexConfig = require("../knexfile");
const db = knex(knexConfig.development);

const cl = console.log;

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

function register(req, res) {
  const creds = req.body;
  creds.password = bcrypt.hashSync(creds.password, 12);
  cl('creds', creds)
  db("users")
    .insert(creds)
    .then(ids => {
      const id = ids[0];
      cl("id", id);
      db("users")
        .where("id", id)
        .first()
        .then(user => {
          const token = generateToken(user);
          cl('token', token)
          res.status(201).json({ id: user.id, token });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function login(req, res) {
  const creds = req.body;
  db('users').where('username', creds.username).first().then(user => {
    if (user && bcrypt.compareSync(creds.password, user.password)) {
      const token = generateToken(user);
      res.json({ message: `Welcome ${user.username}`, token });
    } else {
      res.status(401).send("Shove off, faker!")
    }
  }).catch(err => {
    res.status(500).send(err)
  })
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
