var express = require('express');
var router = express.Router();
var config = require("../config");
var mysql = require("mysql");
var pool = mysql.createPool(config.dbconnection);
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

router.get("/listModels",isLoggedIn, function(req, res, next) {
    var result = [];
    var brands=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        db.query("SELECT brand.id as bId, brand.name as bName, model.id, model.name FROM model INNER JOIN brand ON brand.id = model.id_brand ORDER BY model.name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({
                    brandId: row.bId,
                    brandName: row.bName,
                    id: row.id,
                    name: row.name
                });
            });
            db.query("SELECT * FROM brand", (err, rows) => {
                if (err)return next(err);
                rows.forEach(row => {
                    brands.push({id: row.id, name: row.name});
                });
                res.render("listModels", {
                    result: result, brands: brands, login: login,
                    lastname: lastname, title: "Список моделей",
                    firstname: firstname,
                    secondname: secondname,
                    type_user: type_user,
                    email: email
                });
            });

        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/model/:id", isLoggedIn,function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        db.query("SELECT * FROM brand WHERE brand.id=?", req.params.id, (err, rows) => {
            if (err) return next(err);
            res.render("brand", {
                title: "Марка",
                val: rows[0], login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/addModel",isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("INSERT into model(name,id_brand) VALUES (?,?);",
            [req.body.nameModel,req.body.brand], (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect("/listModels");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/brand/:id", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        console.log(req.body);
        db.query("UPDATE brand SET brand.name=? WHERE brand.id=?;",
            [req.body.name,req.params.id], (err) => {
                if (err) return next(err);
                res.redirect("/listBrands");
            });
        db.release();
        if (err) return next(err);
    });
});

router.post("/addBrand", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(
            `INSERT INTO brand(name) VALUES ('${req.body.name}');`,
            err => {
                if (err) {
                    return next(err);
                }
                res.redirect("/listBrands");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.get("/delBrand/:id", isLoggedIn,function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT * FROM brand WHERE brand.id=?", req.params.id, (err, rows) => {
            if (err) return next(err);
            var login,lastname,secondname,firstname,type_user,email = "";
            if (req.user){
                login = req.user.login;
                lastname = req.user.last_name;
                firstname = req.user.first_name;
                type_user = req.user.user_type;
                email = req.user.email;
                secondname = req.user.second_name;
            }
            res.render("delBrand", {title: "Удалить марку",
                val: rows[0],login: login
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/delBrand/:id", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(`DELETE FROM brand WHERE id=?;`, req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
    res.redirect("/listBrands");
});

module.exports = router;