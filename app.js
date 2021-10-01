require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
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

  res.render("index", {});
});

app.get("/sign_up", (req, res) => {
  // After successful registration the app should redirect to dashboard

  res.render("sign_up", {});
});

app.get("/auth/google",
passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/dashboard",
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect to dashboard.
  res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
  // After successful login the app should redirect to dashboard

  res.render("login", {});
});

app.get("/dashboard", (req, res) => {
  // If the user is not logged in the page should redirect to login

  res.render("dashboard", {});
});

app.get("/privacy_policy", (req, res) => {

  res.render("privacy_policy", {});
});

app.get("/create_post", (req, res) => {
  // If the user is not logged in the page should redirect to login

  res.render("create_post", {});
});

app.get("/delete_post", (req, res) => {
  // If the user is not logged in the page should redirect to login

  res.render("delete_post", {});
});

app.get("/edit_post", (req, res) => {
  // If the user is not logged in the page should redirect to login

  res.render("edit_post", {});
});

app.get("/view_posts", (req, res) => {
  // If the user is not logged in the page should redirect to login

  res.render("view_posts", {});
});

// -- Port info

app.listen(port, () => {
  console.log("App listening at http://localhost:" + port);
});
