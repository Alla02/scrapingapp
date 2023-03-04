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

router.get("/listProperties",isLoggedIn, function(req, res, next) {
    var result = [];
    var brands=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            type_user = req.user.user_type;
            email = req.user.email;
        }
        db.query("SELECT * FROM property", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ 
                  name: row.name, 
                  type: row.type,
                  id: row.id 
                });
            });
            res.render("listProperties", {
                result: result, login: login,
                title: "Список дополнительных характеристик",
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
    });
  });

router.get("/property/:id",isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            type_user = req.user.user_type;
            email = req.user.email;
        }
        db.query("SELECT * FROM property WHERE property.id=?", req.params.id, (err, rows) => {
            if (err) return next(err);
            var type;
            if (rows[0].type === 'int') type = 'Число';
            if (rows[0].type === 'varchar') type = 'Строка';
            if (rows[0].type === 'link') type = 'Ссылка';
            if (rows[0].type === 'boolean') type = 'Логический';
            res.render("property", {
                title: "Характеристика",
                val: rows[0], type: type, login: login,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/updateProperty", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var type;
        console.log('updateProperty');
        if (req.body.propertyType === 'Число') type = 'int';
        if (req.body.propertyType === 'Строка') type = 'varchar';
        if (req.body.propertyType === 'Ссылка') type = 'link';
        if (req.body.propertyType === 'Логический') type = 'boolean';
        console.log(req.body, type);
        db.query("UPDATE property SET name=?, type=? WHERE id=?;",
            [req.body.name,type,req.body.idProperty], (err) => {
                if (err) return next(err);
                console.log('done updatin property')
                res.send((1).toString());
            });
        db.release();
        if (err) return next(err);
    });
});

router.post("/updateCarPropertyLink", async function(req, res, next) {
    pool.getConnection(async function(err, db) {
        if (err) return next(err);
        function insertCarProperty(idProperty, value, idCar) {
            console.log("заходит в insertCarProperty");
            return new Promise(async function (res) {
              db.query("INSERT into car_property (id_car, id_property, value_null) values (?,?,?);", [idCar, idProperty, value], async function (err) {
                if (err) console.log(err);
                res();
              }); 
            })
          }
        function selectIdValueOfProp(name) {
            console.log("заходит в selectIdValueOfProp");
            return new Promise(async function (res) {
                db.query("SELECT id FROM value_of_property WHERE name=?", [name], function (err, row) {
                    if (err) console.log(err);
                    console.log('name, row '+name,row);
                    if (row.length==0) return res(-1);
                    else return res(row[0].id);
                }); 
            })
        }
        function updateCarProp(id, value_link) {
            console.log("заходит в updateCarProp");
            return new Promise(async function (res) {
                db.query('UPDATE car_property SET value_link=?, value_int=?,value_boolean=?,value_varchar=? WHERE id=?', [value_link,null,null,null,id], (err) => {
                    if (err) console.log(err);
                    //console.log(row);
                    res();
                }); 
            })
        }
        function insertValueOfProp(idProperty, value) {
            console.log("заходит в insertValueOfProp");
            return new Promise(async function (res) {
              db.query("INSERT into value_of_property (name,id_property) values (?,?);", [value, idProperty], async function (err) {
                if (err) console.log(err);
                res();
              }); 
            })
          }

        var type, idValueOfProp, sql;
        console.log('updateCarPropertyLink');
        //console.log(req.body, type);
        db.query("SELECT * FROM car_property WHERE id_property=?", req.body.idProperty, async function (err, rows)  {
            if (err) return next(err);
            //console.log(rows);
            for (const row of rows) {
                idValueOfProp = await selectIdValueOfProp(row.value_null);
                console.log('idValueOfProp1 ',idValueOfProp);
                if (idValueOfProp === -1){
                    idValueOfProp = 0;
                    console.log('idValueOfProp21 ', idValueOfProp);
                    await insertValueOfProp(req.body.idProperty, row.value_null)
                    idValueOfProp = await selectIdValueOfProp(row.value_null);
                    console.log('idValueOfProp2 ', idValueOfProp);
                    await updateCarProp(row.id, idValueOfProp) 
                }
                else await updateCarProp(row.id, idValueOfProp) 
            }
            res.send('/listProperties');
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/updateCarPropertyValues", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var type, result, sql;
        console.log('updateCarPropertyValues');
        if (req.body.propertyType === 'Число') {type = 'int'; sql = 'UPDATE car_property SET value_int=?,value_varchar=?,value_boolean=?,value_link=? WHERE id=?'}
        if (req.body.propertyType === 'Строка'){type = 'varchar'; sql = 'UPDATE car_property SET value_varchar=?,value_int=?,value_boolean=?,value_link=? WHERE id=?'}
        //if (req.body.propertyType === 'Ссылка') {type = 'link'; sql = 'UPDATE car_property SET value_link=? WHERE id=?'}
        if (req.body.propertyType === 'Логический') {type = 'boolean'; sql = 'UPDATE car_property SET value_boolean=?,value_varchar=?,value_int=?,value_link=? WHERE id=?'}
        //console.log(req.body, type);
        db.query("SELECT * FROM car_property WHERE id_property=?", req.body.idProperty, (err, rows) => {
            if (err) return next(err);
            //console.log(rows);
            rows.forEach(row => {
                db.query(sql, [row.value_null,null,null,null,row.id], (err) => {
                    if (err) return next(err);
                });
            });
            res.send('/listProperties');
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/listAliases", isLoggedIn,function(req, res, next) {
    var result = [];
    var properties=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            type_user = req.user.user_type;
            email = req.user.email;
        }
        db.query("SELECT alias.id as bId, alias.name as bName, property.id, property.name FROM alias INNER JOIN property ON property.id = alias.id_property ORDER BY alias.name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({
                    aliasId: row.bId,
                    aliasName: row.bName,
                    id: row.id,
                    name: row.name
                });
            });
            db.query("SELECT * FROM property", (err, rows) => {
                if (err)return next(err);
                rows.forEach(row => {
                    properties.push({id: row.id, name: row.name});
                });
                res.render("listAliases", {
                    result: result, properties: properties, login: login,
                    title: "Список псевдонимов",
                    type_user: type_user,
                    email: email
                });
            });

        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/addAlias", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("INSERT into alias(name,id_property) VALUES (?,?);",
            [req.body.nameAlias,req.body.property], (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect("/listAliases");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

module.exports = router;