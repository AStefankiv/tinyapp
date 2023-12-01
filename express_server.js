const express = require("express");
const cookieParser = require('cookie-parser');
const e = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const urlDatabase = {
  'b2xVn2': { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  '9sm5xK': { longURL: "http://www.google.com", userID: "aJ48lW" }
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
  if (users[req.cookies.user_id]) {//If user is logged in, render urls_index
    const templateVars = { urls: urlDatabase, username: users[req.cookies.user_id] };
    res.render("urls_index", templateVars);//Render urls_index
  } else {//If user is not logged in, redirect to /login
    res.send('<html><body><b>Cannot view URLs without logging in</b></body></html>\n');
  }
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies.user_id]) {//If user is logged in, render urls_new
    const templateVars = { username: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);//Render urls_new
  } else {//If user is not logged in, redirect to /login
    res.redirect('/login');//Redirect to /login
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: users[req.cookies.user_id] };
  console.log(`templateVars: ${templateVars.longURL}`);
  // console.log();
  // res.redirect(`${templateVars.longURL}`);
  const userID = req.cookies.user_id;
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  console.log('userID: ', userID);
  console.log('shortURL: ', shortURL);
  console.log('longURL: ', longURL);

  if (!userID) {
    return res.status(401).send('<html><body><b>Cannot view URLs without logging in</b></body></html>\n');
  }
  
  if (!longURL) {
    return res.status(404).send('<html><body><b>Short URL does not exist</b></body></html>\n');
  }

  if (urlsForUser(userID)[shortURL]) {
    const templateVars = { shortURL, longURL, username: users[req.cookies.user_id] };
    return res.render("urls_show", templateVars);
  }

  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
  if (users[req.cookies.user_id]) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('<html><body><b>Cannot create new URL without logging in</b></body></html>\n');
  }
});

app.get("/u/:id", (req, res) => {
  // if (urlDatabase[req.params.id]) {
  //   const longURL = urlDatabase[req.params.id];
  //   res.redirect(longURL);
  // } else {
  //   res.send('<html><body><b>Short URL does not exist -  /u/:id -- </b></body></html>\n');
  // }
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: users[req.cookies.user_id] };
  console.log(`templateVars: ${templateVars.longURL}`);
  // console.log();
  // res.redirect(`${templateVars.longURL}`);
  const userID = req.cookies.user_id;
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  console.log('userID: ', userID);
  console.log('shortURL: ', shortURL);
  console.log('longURL: ', longURL);

  if (!userID) {
    return res.status(401).send('<html><body><b>Cannot view URLs without logging in</b></body></html>\n');
  }
  
  if (!longURL) {
    return res.status(404).send('<html><body><b>Short URL does not exist</b></body></html>\n');
  }

  // if (urlsForUser(userID)[shortURL]) {
  //   const templateVars = { shortURL, longURL, username: users[req.cookies.user_id] };
  //   return res.render("urls_show", templateVars);
  // }

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


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  // const templateVars = { username: users[req.cookies.user_id] };
  // res.render("urls_register", templateVars);
  if (users[req.cookies.user_id]) {//If user is logged in, redirect to /urls
    res.redirect('/urls');//Redirect to /urls
  } else {//If user is not logged in, render login page
    const templateVars = { username: users[req.cookies.user_id] };
    res.render("urls_register", templateVars);//Render login page
  }
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
    console.log('Users:');
    console.log(users);
  }
});

app.get("/login", (req, res) => {
  if (users[req.cookies.user_id]) {//If user is logged in, redirect to /urls
    res.redirect('/urls');//Redirect to /urls
  } else {//If user is not logged in, render login page
    const templateVars = { username: users[req.cookies.user_id] };
    res.render("urls_login", templateVars);//Render login page
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


const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return false;
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