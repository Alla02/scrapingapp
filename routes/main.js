var express = require('express');
var config = require("../config");
var mysql = require("mysql");
const fs = require('fs');
var pool = mysql.createPool(config.dbconnection);
var request = require("request"),
    cheerio = require("cheerio");

var passport = require("passport");
var bcrypt = require("bcryptjs");
var http = require('http');

async function selectIdModel(modelName) {
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query(`SELECT id FROM model WHERE name=?;`, [modelName], function (err, row) {
      if (err) return next(err);
      if (row.length == 0) return res(-1);
      else return res(row[0].id);
    });
  })
  })
}

async function selectIdEngine(engineName) {
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query("SELECT id FROM engine WHERE name=?;", [engineName], function (err, row) {
      if (err) return next(err);
      if (row.length == 0) return res(-1);
      else return res(row[0].id);
    });
  })
  })
}

async function selectIdModif(modifName, idModel, idEngine) {
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query("SELECT id FROM modification WHERE name=? AND id_model=? AND id_engine=?;", [modifName, idModel, idEngine], function (err, row) {
      if (err) return next(err);
      if (row.length == 0) return res(-1);
      else return res(row[0].id);
    });
  })
  })
}

async function selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height) {
  console.log("заходит в selectIdCar");
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query("SELECT id FROM car WHERE id_modification=? AND id_type_car=? AND curb_weight=? AND full_weight=? AND full_length=? AND full_width=? AND full_height=?;", [modification, type_car, curb_weight, full_weight, full_length, full_width, full_height], function (err, row) {
      if (err) return next(err);
      if (row.length == 0) return res(-1);
      else return res(row[0].id);
    });
  })
  })
}

async function checkAlias(name) {
  console.log("заходит в checkAlias");
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query("SELECT id_property FROM alias WHERE name=?;", [name], function (err, row) {
      if (err) return next(err);
      console.log("заходит в checkAlias, ", row.length);
      if (row.length == 0) return res(-1);
      else return res(row[0].id_property);
    });
  })
  })
}

async function insertModel(modelName, brand) {
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    if (modelName.length!=0) {
    db.query("INSERT into model (name,id_brand) values (?,?);", [modelName, brand], function (err) {
      if (err) console.log(err);
      res();
    });
    }
  })
  })
}

async function insertCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height) {
  console.log("заходит в insertCar");
  return new Promise(async function (res) {
    pool.getConnection(async function(err, db) {
    var idCar = await selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height);
    //console.log('idCar '+idCar);
    if (idCar == -1) {
      db.query("INSERT into car (id_modification,id_type_car,curb_weight, full_weight, full_length, full_width, full_height) values (?,?,?,?,?,?,?);", [modification, type_car, curb_weight, full_weight, full_length, full_width, full_height], async function (err) {
        if (err) console.log(err);
        var idCar = await selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height);
        res(idCar);
      }); 
    }
    else res(idCar);
  })
  })
}

async function insertModification(modifName, idModel, idEngine) {
  return new Promise(async function (res) {
    pool.getConnection(async function(err, db) {
    console.log("insertModification");
    //console.log(modifName, " ", idModel, idEngine);
    var idModif = await selectIdModif(modifName, idModel, idEngine);
    //console.log("idModif ",idModif);
    if (idModif === -1) {
      //console.log("inserted");
      //res();
      db.query("INSERT into modification (name,id_model, id_engine) values (?,?,?);", [modifName, idModel, idEngine], async function (err) {
        console.log("inserted");
          res(await selectIdModif(modifName, idModel));
      });
    }
    else res(idModif);
  })
  })
}

async function insertCarProperty(idProperty, value, idCar) {
  console.log("заходит в insertCarProperty");
  return new Promise(async function (res) {
    //res();
    pool.getConnection(function(err, db) {
    db.query("INSERT into car_property (id_car, id_property, value_null) values (?,?,?);", [idCar, idProperty, value], async function (err) {
      if (err) console.log(err);
      res();
    }); 
  })
  })
}

async function selectIdProperty(name) {
  return new Promise(function (res) {
    pool.getConnection(function(err, db) {
    db.query("SELECT id FROM property WHERE name=?;", [name], function (err, row) {
      if (err) return next(err);
      if (row.length == 0) return res(-1);
      else return res(row[0].id);
    });
  })
  })
}

async function insertProperty(idCar, value, name) {
  console.log("заходит в insertProperty");
  return new Promise(async function (res) {
    pool.getConnection(async function(err, db) {
    var idProperty = await selectIdProperty(name);
    if (idProperty == -1) {
    db.query("INSERT into property (name) values (?);", [name], async function (err) {
      if (err) console.log(err);
      db.query("SELECT id FROM property ORDER BY id DESC LIMIT 1;", async function (err, row) {
        if (err) console.log(err);
        await insertCarProperty(row[0].id, value, idCar)
        res();
      }); 
      //res(await selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height));
    }); 
  }
  else {await insertCarProperty(idProperty, value, idCar)
    res();}
  })
})
}
/*

  selectIdModel: main,
  selectIdEngine: main,
  selectIdCar: main,
  checkAlias: main,
  insertModel: main,
  insertCar: main,
  insertModification: main,
  insertCarProperty: main,
  selectIdProperty: main,
  insertProperty: main*/
  module.exports = {
    selectIdModel:selectIdModel,
    selectIdEngine:selectIdEngine,
    selectIdCar:selectIdCar,
    checkAlias:checkAlias,
    insertModel:insertModel,
    insertCar:insertCar,
    insertModification:insertModification,
    insertCarProperty:insertCarProperty,
    selectIdProperty:selectIdProperty,
    insertProperty:insertProperty
    };