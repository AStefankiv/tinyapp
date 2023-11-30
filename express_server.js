const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body><b>Hello World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: users[req.cookies.user_id] };
  // console.log(users[req.cookies.user_id]);//Log the user_id cookie
  res.render("urls_index", templateVars);
  // console.log(req.cookies['user_id']);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// app.post("/login", (req, res) => {
//   const username = req.body.username;
//   res.cookie('username', username);
//   res.redirect('/urls');
// });

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  const templateVars = { username: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const newUser = {
    id: userId,
    email,
    password,
  };

  if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty');
  } else if (getUserByEmail(email, users)) {
    return res.status(400).send('Email already exists');
  } else {
    users[userId] = newUser;
    res.cookie('user_id', userId);
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userFound = getUserByEmail(email, users);

  if (!email || !password) {
    return res.status(403).send('Email or password cannot be empty');
  } else if (!userFound) {
    return res.status(403).send('Email does not exist');
  } else if (userFound.password !== password) {
    return res.status(403).send('Password is incorrect');
  } else {
    res.cookie('user_id', userFound.id);
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  const templateVars = { username: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
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


const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return false;
};