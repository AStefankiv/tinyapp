const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body><b>Hello World</b></body></html>\n"); // Respond with html string
});

app.get('/urls', (req, res) => {// Add a new route to handle the GET request to /urls
  const templateVars = { urls: urlDatabase };// Pass the urlDatabase object to our template
  res.render("urls_index", templateVars);// Pass the urlDatabase object to our 'urls_index' template
});

app.get("/urls/new", (req, res) => {// Add a new route to handle the GET request to /urls/new
  res.render("urls_new");// Pass the urlDatabase object to our 'urls_new' template
});

app.get("/urls/:id", (req, res) => {// Add a new route to handle the GET request to /urls/:id
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };// Pass the urlDatabase object to our template
  res.render("urls_show", templateVars);// Pass the urlDatabase object to our 'urls_show' template
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();// Generate a shortURL
  const longURL = req.body.longURL;// Get the longURL from the request
  urlDatabase[shortURL] = longURL; // Add a new key-value pair to the urlDatabase object
  res.redirect(`/urls/${shortURL}`); // Redirect the client to /urls/:shortURL
});

app.get("/u/:id", (req, res) => {// Add a new route to handle the GET request to /u/:id
  const longURL = urlDatabase[req.params.id];// Get the longURL from the urlDatabase object
  res.redirect(longURL);// Redirect the client to the longURL
});

app.post("/urls/:id/delete", (req, res) => {// Add a new route to handle the POST request to /urls/:id/delete
  const shortURL = req.params.id;// Get the shortURL from the request
  delete urlDatabase[shortURL];// Delete the key-value pair from the urlDatabase object
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {// Add a new route to handle the POST request to /urls/:id
  const shortURL = req.params.id;// Get the shortURL from the request
  const longURL = req.body.longURL;// Get the longURL from the request
  urlDatabase[shortURL] = longURL;// Update the key-value pair in the urlDatabase object
  res.redirect('/urls');// Redirect the client to /urls
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};