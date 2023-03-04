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
var main = require('E:/Projects/datascraping/scrapingapp/routes/main.js');

isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
};


router.get('/parser2',isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    res.render('parser', { title: 'Express' });
  });
  console.log('result3');
});


router.post("/kia",isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
  var url = req.body.address;
async function addDB(model, modification, car, brand, type_car, nameChar) {
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
            if (alias===-1) await main.insertProperty(idCar, car[k], k); 
            else await main.insertCarProperty(alias, car[k], idCar)
            }
        }
      }
    }
  }
}

request(url, function (error, response, body) {
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
    links.slice(1).forEach(link => {
      request(link, async function (error, response, body) {
        fs.readFile('testpage.html', 'utf8', async function(error, data) {
        //request('https://www.kia.ru/models/cerato/properties/', function (error, response, body) {
        if (!error) {
          var $ = cheerio.load(body);
          //var $ = cheerio.load(fs.readFileSync('testpage.html'));
          var models = []
          var model; 
          var nameChar=[], allData=[];
          model = $('.page-title__title').text().replace('Характеристики ', '').replace(/ +/g, ' ').trim(); //модель
          console.log("модель "+model);
          $('.config__variants__slide__title').children().each(function (i, e) {//все модификации
            models[i] = model;
            modification[i] = ($(this).text()).trim();
            if (modification) return;
          });
          $('.config__params__section__item__header').each(function (i, e) {//все характеристики
            nameChar[i] = ($(this).text()).replace(/(\r\n|\n|\r)/gm, "").trim();
            if (data) return;
          });
          $('.config__params__section__item__slide').each(function (i, e) {//вся информация
            allData[i] = ($(this).text()).replace(/(\r\n|\n|\r)/gm, "").trim();
            if (allData) return;
          });
          var car =[];
          var k = 0, j=0;
          for (var i = 0; i < modification.length; i++) {
            car[i] = {};
              k = i;
              while (k < allData.length) {
                if (j==nameChar.length) j =0;
                car[i][nameChar[j]] = allData[k];
                j++;
                k = k + modification.length;
            }
            await addDB(model, modification[i], car[i], brand, type_car, nameChar);
          }
        } else {
          console.log("Произошла ошибка: " + error);
        }
      });
    });
    });
    } else {
    console.log("Произошла ошибка: " + error);
    }
  });
res.send('respond with a resource');
});
});


module.exports = router;
