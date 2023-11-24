const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs')

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // Respond with a json string of the urlDatabase object
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n"); // Respond with html string
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app. get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});
 
// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// }
// );

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});