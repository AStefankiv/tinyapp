const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const getUserByEmail = require('./helpers');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['secret keys'],
  maxAge: 24 * 60 * 60 * 1000
}));


const urlDatabase = {
  'b2xVn2': { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW", visitors: 0},
  '9sm5xK': { longURL: "http://www.google.com", userID: "aJ48lW", visitors: 0},
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
  const loggedInUser = users[req.session.user_id];
  if (loggedInUser) {
    const userURLs = urlsForUser(req.session.user_id);
    const templateVars = { urls: userURLs, username: loggedInUser };
    res.render("urls_index", templateVars);
  }
  if (!loggedInUser) {
    res.send('<html><body><b>Cannot view URLs without logging in</b></body></html>\n');
  }
});

app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
    const templateVars = { username: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  const loggedInUser = users[req.session.user_id];
  const shortURL = req.params.id;
  const url = urlDatabase[req.params.id];
  if (loggedInUser) {
    if (url.userID !== req.session.user_id) {
      return res.status(401).send('<html><body><b>This is not your url.</b></body></html>\n');
    }

  } else if (!loggedInUser) {
    return res.status(401).send('<html><body><b>Cannot view URLs without logging in. (page "/urls/:id") </b></body></html>\n');
  } else if (!urlDatabase[req.params.id]) {
    return res.status(404).send('<html><body><b>Short URL does not exist -  /urls/:id -- </b></body></html>\n');
  }
  const templateVars = { shortURL: req.params.id,
    longURL: url,
    username: users[req.session.user_id],
    visitors: url.visitors,
    uniqueVisitors: url.uniqueVisitors
  };
  if (url.uniqueVisitors) {
    templateVars.uniqueVisitors = url.uniqueVisitors;
  }
  if (!url.uniqueVisitors) {
    templateVars.uniqueVisitors = 0;
  }

  if (url.visitors) {
    templateVars.visitors = url.visitors;
  }
  if (!url.visitors) {
    templateVars.visitors = 0;
  }

  res.render('urls_show', templateVars);

});

app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;

    urlDatabase[shortURL] = {
      longURL,
      userID: req.session.user_id
    };

    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('<html><body><b>Cannot create new URL without logging in</b></body></html>\n');
  }
});

app.get("/u/:id", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[req.params.id];
  const longURL = urlDatabase[shortURL].longURL;
  
  if (!url.visitors) {
    url.visitors = 1;
  } else if (url.visitors) {
    url.visitors += 1;
  }

  if (!userID) {
    return res.status(401).send('<html><body><b>Cannot view URLs without logging in</b></body></html>\n');
  }
  
  if (!longURL) {
    return res.status(404).send('<html><body><b>Short URL does not exist</b></body></html>\n');
  }

  res.redirect(url.longURL);
});

app.delete("/urls/:id/delete", (req, res) => {
  const loggedInUser = users[req.session.user_id];
  if (!loggedInUser) {
    return res.status(401).send('<html><body><b>Cannot view URLs without logging in. (page "/urls/:id") </b></body></html>\n');
  }


  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('<html><body><b>Short URL does not exist -  /urls/:id -- </b></body></html>\n');
  }

  const url = urlDatabase[req.params.id];
  if (url.userID !== req.session.user_id) {
    return res.status(401).send('<html><body><b>Access denied. This is not your url.</b></body></html>\n');
  }

  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');

});

app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(401).send('<html><body><b>This is not your url, so /urls/:id won`t work.</b></body></html>\n');
  }
  if (urlDatabase[req.params.id]) {
    const shortURL = req.params.id;
    const longURL = req.body.longURL;
    urlDatabase[shortURL].longURL = longURL;
    res.redirect('/urls');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('<html><body><b>Short URL does not exist -  /urls/:id -- </b></body></html>\n');
  }

});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get("/register", (req, res) => {

  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    const templateVars = { username: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, 10)
  };

  if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty');
  } else if (getUserByEmail(email, users)) {
    return res.status(400).send('Email already exists');
  } else {
    users[userId] = newUser;
    req.session.user_id = userId;
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(403).send('Email or password cannot be empty');
  }

  const userFound = getUserByEmail(email, users);
 
  if (!userFound) {
    return res.status(403).send('Email does not exist');
  }

  if (!bcrypt.compareSync(password, userFound.password)) {
    return res.status(403).send('Password is incorrect');
  }

  req.session.user_id = userFound.id;
  res.redirect('/urls');

});

app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    const templateVars = { username: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  }
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



const urlsForUser = (id) => {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};