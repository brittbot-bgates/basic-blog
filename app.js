require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require('express-session');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// -- Database connection
mongoose.connect(process.env.DB_HOST);

// -- For blog user authentication
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/dashboard"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// -- For blog posts
const postsSchema = new mongoose.Schema({
  title: String,
  content: String
});

const Post = mongoose.model("Post", postsSchema);

// -- Routing info
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/auth/google",
passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/dashboard",
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
  // After successful authentication redirect to dashboard.
  res.redirect("/dashboard");
});

app.get("/create", (req, res) => {
  // TODO: Add code to redirect user to login page if user is not logged in
  res.render("create", {});
});

app.post("/create", (req, res) => {
  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postContent
  });

  post.save(function(err){
    if(!err){
      res.redirect("/dashboard");
    }
  });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/dashboard");
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/posts", (req, res) => {
  // TODO: Add code to redirect user to login page if user is not logged in

  Post.find({}, function(err, posts){
    res.render("view_posts", {
      posts: posts
    });
  });
});

app.get("/view_posts/:postId", function(req, res){
  // TODO: Add code to redirect user to login page if user is not logged in

  const requestedPostTitle = req.params.postTitle;
  Post.findOne({title: requestedPostTitle}, function(err, post){
    res.render("view_posts", {
      title: post.title,
      content: post.content
    });
  });
});

app.get("/privacy_policy", (req, res) => {
  res.render("privacy_policy");
});

app.get("/sign_up", (req, res) => {
  res.render("sign_up");
});

app.post("/sign_up", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/dashboard");
      });
    }
  });
});

app.get("/terms", (req, res) => {
  res.render("terms");
});

// -- Port info
app.listen(port, () => {
  console.log("App listening at http://localhost:" + port);
});
