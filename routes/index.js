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
var main = require('./main');
//var Crawler = require("crawler");

/*auth part*/
isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
};


router.get("/listBase", isLoggedIn, function(req, res, next) {
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
      db.query("SELECT car.curb_weight, car.full_weight,car.full_length,car.full_width, car.full_height,type_car.name as typeName, modification.name as mName FROM car INNER JOIN modification ON modification.id = car.id_modification INNER JOIN type_car ON type_car.id = car.id_type_car", (err, rows) => {
          if (err) return next(err);
          rows.forEach(row => {
              result.push({ 
                curb_weight: row.curb_weight, 
                full_weight: row.full_weight,
                full_length: row.full_length,
                full_width: row.full_width, 
                full_height:row.full_height,
                mName: row.mName,
                typeName: row.typeName
              });
          });
          res.render("listBase", {
              result: result, login: login,
              title: "Список машин и базовых характеристик",
              type_user: type_user,
              email: email
          });
      });
      db.release();
      if (err) return next(err);
  });
});

/* GET home page. */
router.get('/', isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    var login, type_user, email = "";
    if (req.user) {
        login = req.user.login;
        type_user = req.user.user_type;
        email = req.user.email;
    }
    var result = [];
      console.log('result2');
      res.render('index', { login: login, title: 'Express' });
  });
  console.log('result3');
});

router.get('/parser',isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    res.render('parser', { title: 'Express' });
  });
  console.log('result3');
});


router.post("/parser", function(req, res, next) {
  pool.getConnection(function(err, db) {
  var url = req.body.address;
async function addDB(model, modification, car, brand, type_car, nameChar) {
  return new Promise(async function (res) {
    console.log(model, modification, car, brand, type_car);
  var idModel = await main.selectIdModel(model);
  if (idModel == -1) {
    await main.insertModel(model, brand);
    idModel = await main.selectIdModel(model);
  }
  
  var idEngine, full_length, full_width, full_height, curb_weight, full_weight;
  if (car['Коробка передач'].includes('Автомат')) idEngine = await main.selectIdEngine('Автомат');
  if (car['Коробка передач'].includes('Механика')) idEngine = await main.selectIdEngine('Механика');
  if (car['Коробка передач'].includes('Робот')) idEngine = await main.selectIdEngine('Робот');
  var idModification = await main.insertModification(modification, idModel, idEngine);
  for (let k in car) { //находим базовые характеристики
    if (k.includes('Габариты')) 
    { 
      let arr = car[k].replace(/\s/g, '').split('/');
      full_length = arr[0];
      full_width = arr[1];
      full_height = arr[2];
    }
    if (k.includes('Полная масса')) curb_weight = car[k];
    if (k==='Максимальная') full_weight = car[k];
  }
  var idCar = await main.insertCar(idModification, type_car, curb_weight, full_weight, full_length, full_width, full_height)
async function some() {
  return new Promise(async function (res) {
  for (let k in car) { //находим дополнительные характеристики и записываем их в БД
    if (k.includes('Габариты')) continue;
    else {
      if (k.includes('Полная масса')) continue;
      else {
        if (k==='Максимальная') continue;
        else {
          if (k==='Коробка передач') continue;
          else {
            var alias = await main.checkAlias(k);
            if (alias===-1) {await main.insertProperty(idCar, car[k], k); res()}
            else {await main.insertCarProperty(alias, car[k], idCar); res()}
            }
        }
      }
    }
  }
})
}
await some();
  res();
  })
}

request(url, async function (error, response, body) {
  if (!error) {
    var $ = cheerio.load(body);
    var links = [];
    $('.car-card__photo-wrapper').each(function (i, e) {//берем ссылки на все модели на странице
      var link = 'https://www.kia.ru' + $(this).children().attr('href').replace('desc','properties');
      //console.log(link);
      links[i] = link;
    });
    var modification =[];
    var brand = 1;
    var type_car = 1;
    var models = []
    var model; 
    var nameChar=[], allData=[]; var car =[];
    async function first() {
    return new Promise(async function (res) {
    links.slice(1).forEach(link => {
      request(link, async function (error, response, body) {
        fs.readFile('testpage.html', 'utf8', async function(error, data) {
        //request('https://www.kia.ru/models/cerato/properties/', function (error, response, body) {
        if (!error) {
          //var $ = cheerio.load(body);
          var $ = cheerio.load(fs.readFileSync('testpage.html'));
          model = $('.page-title__title').text().replace('Характеристики ', '').replace(/ +/g, ' ').trim(); //модель
          //console.log("модель "+model);
          $('.config__variants__slide__title').children().each(function (i, e) {//все модификации
            models[i] = model;
            modification[i] = ($(this).text()).trim();
            if (modification) return;
          });
          $('.config__params__section__item__header').each(function (i, e) {//все характеристики
            nameChar[i] = ($(this).text()).replace(/(\r\n|\n|\r)/gm, "").trim();
            //console.log(nameChar);
            if (data) return;
          });
          $('.config__params__section__item__slide').each(function (i, e) {//вся информация
            allData[i] = ($(this).text()).replace(/(\r\n|\n|\r)/gm, "").trim();
            if (allData) return;
          });
          var k = 0, j=0, i=0;
          for (var i = 0; i < modification.length; i++) {
            car[i] = {};
              k = i;
              while (k < allData.length) {
                if (j==nameChar.length) j =0;
                car[i][nameChar[j]] = allData[k];
                j++;
                k = k + modification.length;
            }
            var l = await addDB(model, modification[i], car[i], brand, type_car, nameChar)
          }
        } else {
          console.log("Произошла ошибка: " + error);
        }
      });
    });
    });
  });
  } first();
    } else {
    console.log("Произошла ошибка: " + error);
    }
  });
//res.send('respond with a resource');
res.redirect("/listParsers");
});
});


module.exports = router;
