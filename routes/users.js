var express = require('express');
var router = express.Router();
var config = require("../config");
var mysql = require("mysql");
const fs = require('fs');
var pool = mysql.createPool(config.dbconnection);
var request = require("request"),
    cheerio = require("cheerio");

var passport = require("passport");
var bcrypt = require("bcryptjs");
var http = require('http');
//var Crawler = require("crawler");

/*auth part*/
isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/login", function(req, res, next) {
  res.render("login", {
    title: "Login",
    message: req.flash("loginMessage")
  });
});

router.post("/login", passport.authenticate("local-login", {
    successRedirect: "/", // redirect to the secure profile section
    failureRedirect: "/login", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  })
);

router.get("/logout", function(req, res, next) {
  req.logout();
  res.redirect("/login");
});

router.get('/register',isLoggedIn, function(req, res, next) {
  result = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
      var login,type_user,email = "";
      if (req.user){
          login = req.user.login;
          type_user = req.user.user_type;
          email = req.user.email;
      }
      if (req.user.user_type===0)    {
      res.render("register", {
          title: "Регистрация", login: login,
          type_user: type_user,
          email: email, message: req.flash("registerMessage")
      });}
      else res.redirect("/");
      db.release();
      if (err) return next(err);
  });
});

router.get("/personalAccount",isLoggedIn, function(req, res, next) {
  var login,type_user,email = "";
  if (req.user){
    login = req.user.login;
    type_user = req.user.user_type;
    email = req.user.email;
  }
  res.render("personalAccount", {
      title: "Настройки аккаунта",
      login: login,
      type_user: type_user,
      email: email
  });
});

router.post("/register", passport.authenticate("local-signup", {
  successRedirect: "/", //member page
  failureRedirect: "/register", //failed login
  failureFlash: true //flash msg
})
);

router.get("/changePassword",isLoggedIn, function(req, res, next) {
  var login,type_user,email = "";
  if (req.user){
    login = req.user.login;
    type_user = req.user.user_type;
    email = req.user.email;
  }
  res.render("changePassword", {
    title: "Изменение пароля",
      login:login,
      type_user: type_user,
      email: email,
      message: req.flash("changePassword")
  });
});

router.post("/changePassword", isLoggedIn, function(req, res, next) {
  if (req.body.newpassword1 == req.body.newpassword2) {
    var SALT_FACTOR = 5;
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(req.body.newpassword1, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        req.body.newpassword1 = hash;
        pool.getConnection(function(err, db) {
          if (err) return next(err);; // not connected!
          db.query(
            `UPDATE user SET password='${req.body.newpassword1}' WHERE id=?;`,
            req.user.id,
            (err, rows) => {
              if (err) {
                return next(err);
              }
              res.redirect("/");
            }
          );
          db.release();
          // Handle error after the release.
          if (err) return next(err);
          // Don't use the connection here, it has been returned to the pool.
        });
      });
    });
  }

  if (req.body.newpassword1 != req.body.newpassword2) {
    res.render("authorization/changePassword", {
      n: 1,
      title: "Изменение пароля",
      login: username,
      message: "Пароли не совпадают"
    });
  }
});

router.get("/changeLogin",isLoggedIn, function(req, res, next) {
  var login,type_user,email = "";
  if (req.user){
    login = req.user.login;
    type_user = req.user.user_type;
    email = req.user.email;
  }
  res.render("changeLogin", {
    title: "Изменение логина",
      login:login,
      type_user: type_user,
      email: email,
      message: req.flash("changeLogin")
  });
});

router.post("/changeLogin", isLoggedIn, function(req, res, next) {//ОШИБКА ТУТ
  pool.getConnection(function(err, db) {
    if (err) return next(err);; // not connected!
    console.log(req.user);
    db.query(
      `UPDATE user SET login='${req.body.newlogin}' WHERE id=?;`,
      req.user.id, (err, rows) => {
        if (err) {return next(err);}
        res.redirect("/personalAccount");
      }
    );
    db.release();
    // Handle error after the release.
    if (err) return next(err);
    // Don't use the connection here, it has been returned to the pool.
  });
});

router.get("/changeEmail",isLoggedIn, function(req, res, next) {
  var login,type_user,email = "";
  if (req.user){
    login = req.user.login;
    type_user = req.user.user_type;
    email = req.user.email;
  }
  res.render("changeEmail", {
    title: "Изменение email",
      login:login,
      type_user: type_user,
      email: email,
      message: req.flash("changeEmail")
  });
});

router.post("/changeEmail", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err);; // not connected!
    console.log(req.user);
    db.query(
      `UPDATE user SET email='${req.body.email}' WHERE id=?;`,
      req.user.id, (err, rows) => {
        if (err) {return next(err);}
        res.redirect("/personalAccount");
      }
    );
    db.release();
    // Handle error after the release.
    if (err) return next(err);
    // Don't use the connection here, it has been returned to the pool.
  });
});


module.exports = router;
