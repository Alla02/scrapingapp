var express = require('express');
var router = express.Router();
var config = require("../config");
var mysql = require("mysql");
var pool = mysql.createPool(config.dbconnection);

var passport = require("passport");
var bcrypt = require("bcryptjs");
var fs = require('fs');
var http = require('http');

/*auth part*/
isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/register");
  }
};

router.get("/reports",isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    var login,type_user,email = "";
    if (req.user){
      login = req.user.login;
      type_user = req.user.user_type;
      email = req.user.email;
    }
    var brands = []; var propeties = [];
    db.query("SELECT * FROM brand;", (err, rows) => {
      if (err) return next(err);
      rows.forEach(row => {
        brands.push({ id: row.id, name: row.name });
      });
      db.query("SELECT * FROM property;", (err, rows) => {
        if (err) return next(err);
        rows.forEach(row => {
          propeties.push({ id: row.id, name: row.name });
        });
        res.render("reports", {
          title: "Отчеты",
          login: login,
          type_user: type_user,
          email: email,brands: brands,
          propeties:propeties
        });
      });
    });
    db.release();
    if (err) return next(err);
  });
});

router.post("/modelsListReport", function(req, res, next) {
  var modelsList = [];
  var idBrand = req.body.idBrand;
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
      db.query("SELECT * FROM model WHERE id_brand=?;", [idBrand], (err, rows) => {
        if (err) return next(err);
        rows.forEach(row => {
          modelsList.push({
            id: row.id,
            name: row.name
          });
        });
        res.send(JSON.stringify(modelsList));
      });
    db.release();
    if (err) return next(err);
  });
});

router.post("/modificationsListReport", function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    var modificationsList = [];
    //console.log("modificationsList");
    var idModel = req.body.idModel;
      db.query("SELECT modification.id, modification.name, engine.name as engineName FROM modification INNER JOIN engine ON engine.id= modification.id_engine WHERE id_model=?;",[idModel], (err, rows) => {
        if (err) return next(err);
        //console.log("1");
        rows.forEach(row => {
          modificationsList.push({ id: row.id, name: row.name, engineName:row.engineName });
        });
        res.send(JSON.stringify(modificationsList));
      });
    db.release();
    if (err) return next(err);
  });
});

router.post("/carsListReport", function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    var modificationsList = [];
    //console.log("modificationsList");
    var idModel = req.body.idModel;
      db.query("SELECT modification.id, modification.name, engine.name as engineName FROM modification INNER JOIN engine ON engine.id= modification.id_engine WHERE id_model=?;",[idModel], (err, rows) => {
        if (err) return next(err);
        //console.log("1");
        rows.forEach(row => {
          modificationsList.push({ id: row.id, name: row.name, engineName:row.engineName });
        });
        res.send(JSON.stringify(modificationsList));
      });
    db.release();
    if (err) return next(err);
  });
});

router.post("/getReport", function(req, res, next) {
  var result=[];
  pool.getConnection(function(err, db) {
    console.log("getReport");
    console.log(req.body.idBrand,req.body.idModel,req.body.idModification);
    if (req.body.idBrand != "0" & req.body.idModel === "0" & req.body.idModification === "0"){//если только бренд, выводим список моделей
      db.query("SELECT model.name as modelName, brand.name as brandName FROM model INNER JOIN brand ON brand.id=model.id_brand WHERE model.id_brand=?;",[req.body.idBrand], (err, rows) => {
        if (err) return next(err);
        rows.forEach(row => {
          result.push({ que: 1, modelName: row.modelName,
            brandName: row.brandName});
        });
        res.send(JSON.stringify(result));
      });
    }
    else {
      if (req.body.idBrand != "0" & req.body.idModel != "0" & req.body.idModification === "0") {//если бренд и модель, список модификаций
        db.query("SELECT model.name as modelName, brand.name as brandName, modification.name as modifName, engine.name as engineName FROM model\n" + 
        "INNER JOIN modification ON modification.id_model=model.id\n" +
        "INNER JOIN brand ON brand.id=model.id_brand\n" +
        "INNER JOIN engine ON modification.id_engine = engine.id\n"+
        "WHERE modification.id_model=?;",[req.body.idModel], (err, rows) => {
          if (err) return next(err);
          rows.forEach(row => {
            result.push({ que: 2, modelName: row.modelName,
              brandName: row.brandName, modifName:row.modifName, engineName: row.engineName});
          });
          res.send(JSON.stringify(result));
        });
      }
      else {
         //если бренд, модель и модификаиция, список машин
          db.query("SELECT model.name as modelName, brand.name as brandName, modification.name as modifName,engine.name as engineName,\n" + 
          "type_car.name as typeName, car.curb_weight, car.full_weight,car.full_length, car.full_width, car.full_height FROM model\n"+
          "INNER JOIN modification ON modification.id_model=model.id\n" +
          "INNER JOIN brand ON brand.id=model.id_brand\n" +
          "INNER JOIN car ON car.id_modification = modification.id\n"+
          "INNER JOIN type_car ON car.id_type_car = type_car.id\n"+
          "INNER JOIN engine ON modification.id_engine = engine.id\n"+
          "WHERE car.id_modification=?;",[req.body.idModification], (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
              result.push({ que: 3, modelName: row.modelName,
                brandName: row.brandName, modifName:row.modifName,engineName: row.engineName, typeName: row.typeName, curb_weight:row.curb_weight, 
                full_weight: row.full_weight,full_length:row.full_length, full_width:row.full_width, full_height:row.full_height});
            });
            res.send(JSON.stringify(result));
          });
      }
    }
    /*
    db.query("SELECT model.name as modelName, modification.name as modeifName, engine.name as engineName,\n"+
    "type_car.name as typeName, car.curb_weight, car.full_weight,car.full_length, car.full_width, car.full_height,\n"+
    "car_property.value_null, value_of_property.name as valOfPropName\n"+
    "FROM model\n"+
    "INNER JOIN modification ON modification.id_model = model.id\n"+
    "INNER JOIN engine ON modification.id_engine = engine.id\n"+
    "INNER JOIN car ON car.id_modification = modification.id\n"+
    "INNER JOIN type_car ON car.id_type_car = type_car.id\n"+
    "INNER JOIN car_property ON car_property.id_car = car.id\n"+
    "INNER JOIN value_of_property ON car_property.value_link = value_of_property.id\n"+
    "WHERE model.id_brand=?;",[req.body.idBrand], (err, rows) => {
      if (err) return next(err);
      //console.log("1");
      //console.log(rows);
      rows.forEach(row => {
        result.push({ modelName: row.modelName,
          modeifName: row.modeifName,
          engineName: row.engineName,
          typeName: row.typeName,
          curb_weight: row.curb_weight,
          full_weight: row.full_weight,
          full_length: row.full_length,
          full_width: row.full_width,
          full_height: row.full_height,
          value_null: row.value_null,
          valOfPropName: row.valOfPropName});
      });
      res.send(JSON.stringify(result));
    });*/
    db.release();
    if (err) return next(err);
  });
});

router.post("/getReportProperties", function(req, res, next) {
  var result, propertiesArr=[]; 
  pool.getConnection(function(err, db) {
    var sqlStart = "SELECT model.name as modelName, brand.name as brandName, modification.name as modifName,engine.name as engineName,"
    var sqlEnd = " FROM car INNER JOIN modification ON modification.id=car.id_modification INNER JOIN engine ON modification.id_engine = engine.id INNER JOIN model ON model.id = modification.id_model INNER JOIN brand ON brand.id=model.id_brand"
    var sqlSelect = ""; var sqlJoin = "";
    var properties=((req.body.properties).slice(1,-1)).split(',');
    console.log(properties);
    for (var i=0; i<properties.length; i++)
    {
      if (i!=properties.length-1) sqlSelect =sqlSelect +" cp"+i+".value_null as value"+i+", prop"+i+".name as propName"+i+",";
      else sqlSelect =sqlSelect +" cp"+i+".value_null as value"+i+", prop"+i+".name as propName"+i;
      sqlJoin =sqlJoin+ " INNER JOIN car_property as cp"+i+" ON car.id=cp"+i+".id_car AND cp"+i+".id_property="+properties[i]+" INNER JOIN property as prop"+i+" ON prop"+i+".id=cp"+i+".id_property ";
    }
    var sql = sqlStart + sqlSelect+ sqlEnd+sqlJoin
    //console.log(sql);
      /*db.query("SELECT model.name as modelName, brand.name as brandName, modification.name as modifName,engine.name as engineName,\n"+
      "car_property.value_null, property.name as propertyName FROM car_property\n"+ 
      "INNER JOIN property ON property.id=car_property.id_property\n"+ 
      "INNER JOIN car ON car.id=car_property.id_car\n"+
      "INNER JOIN modification ON modification.id=car.id_modification\n"+
      "INNER JOIN engine ON modification.id_engine = engine.id\n"+ 
      "INNER JOIN model ON model.id = modification.id_model\n"+ 
      "INNER JOIN brand ON brand.id=model.id_brand\n"+
      'WHERE car_property.id_property IN ('+properties+');', (err, rows) => {
        if (err) console.log(err);
        res.send(JSON.stringify(rows));
      })*/
      db.query(sql, (err, rows) => {
        if (err) console.log(err);
        console.log(rows)
        res.send(JSON.stringify(rows));
      })
      /*db.query("SELECT model.name as modelName, brand.name as brandName, modification.name as modifName,engine.name as engineName,\n" + 
          "type_car.name as typeName, car.curb_weight, car.full_weight,car.full_length, car.full_width, car.full_height FROM model\n"+
          "INNER JOIN modification ON modification.id_model=model.id\n" +
          "INNER JOIN brand ON brand.id=model.id_brand\n" +
          "INNER JOIN car ON car.id_modification = modification.id\n"+
          "INNER JOIN type_car ON car.id_type_car = type_car.id\n"+
          "INNER JOIN engine ON modification.id_engine = engine.id\n"+
          "WHERE car.id_modification=?;",[req.body.idModification], (err, rows) => {
      if (err) return next(err);
      rows.forEach(row => {
        result.push({ que: 3, modelName: row.modelName,
          brandName: row.brandName, modifName:row.modifName,engineName: row.engineName, typeName: row.typeName, curb_weight:row.curb_weight, 
          full_weight: row.full_weight,full_length:row.full_length, full_width:row.full_width, full_height:row.full_height});
      });
      res.send(JSON.stringify(result));
    });*/
    db.release();
    if (err) return next(err);
  });
});

module.exports = router;
