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
    var result = [];
    console.log('result1');
    db.query("SELECT * FROM brand", (err, rows) => {
      if (err) return next(err);
      rows.forEach(row => {
        result.push({ id: row.id, name: row.name });
      });
      console.log('result2');
      console.log(result);
      res.render('index', { title: 'Express' });
    });
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
    function selectIdModel(modelName) {
      return new Promise(function (res) {
        db.query(`SELECT id FROM model WHERE name=?;`, [modelName], function (err, row) {
          if (err) return next(err);
          if (row.length == 0) return res(-1);
          else return res(row[0].id);
        });
      })
    }

    function selectIdEngine(engineName) {
      return new Promise(function (res) {
        db.query("SELECT id FROM engine WHERE name=?;", [engineName], function (err, row) {
          if (err) return next(err);
          if (row.length == 0) return res(-1);
          else return res(row[0].id);
        });
      })
    }

    function selectIdModif(modifName, idModel, idEngine) {
      return new Promise(function (res) {
        db.query("SELECT id FROM modification WHERE name=? AND id_model=? AND id_engine=?;", [modifName, idModel, idEngine], function (err, row) {
          if (err) return next(err);
          if (row.length == 0) return res(-1);
          else return res(row[0].id);
        });
      })
    }

    function selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height) {
      console.log("заходит в selectIdCar");
      return new Promise(function (res) {
        db.query("SELECT id FROM car WHERE id_modification=? AND id_type_car=? AND curb_weight=? AND full_weight=? AND full_length=? AND full_width=? AND full_height=?;", [modification, type_car, curb_weight, full_weight, full_length, full_width, full_height], function (err, row) {
          if (err) return next(err);
          if (row.length == 0) return res(-1);
          else return res(row[0].id);
        });
      })
    }

    function checkAlias(name) {
      console.log("заходит в checkAlias");
      return new Promise(function (res) {
        db.query("SELECT id_property FROM alias WHERE name=?;", [name], function (err, row) {
          if (err) return next(err);
          console.log("заходит в checkAlias, ", row.length);
          if (row.length == 0) return res(-1);
          else return res(row[0].id_property);
        });
      })
    }

    function insertModel(modelName, brand) {
      return new Promise(function (res) {
        if (modelName.length!=0) {
        db.query("INSERT into model (name,id_brand) values (?,?);", [modelName, brand], function (err) {
          if (err) console.log(err);
          res();
        });
        }
      })
    }
    
    function insertCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height) {
      console.log("заходит в insertCar");
      return new Promise(async function (res) {
        var idCar = await selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height);
        console.log('idCar '+idCar);
        if (idCar == -1) {
          db.query("INSERT into car (id_modification,id_type_car,curb_weight, full_weight, full_length, full_width, full_height) values (?,?,?,?,?,?,?);", [modification, type_car, curb_weight, full_weight, full_length, full_width, full_height], async function (err) {
            if (err) console.log(err);
            res(await selectIdCar(modification, type_car, curb_weight, full_weight, full_length, full_width, full_height));
          }); 
        }
        else res(idCar);
      })
    }

    function insertModification(modifName, idModel, idEngine) {
      return new Promise(async function (res) {
        console.log("insertModification");
        console.log(modifName, " ", idModel, idEngine);
        var idModif = await selectIdModif(modifName, idModel, idEngine);
        console.log("idModif ",idModif);
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
    }

    function insertCarProperty(idProperty, value, idCar) {
      console.log("заходит в insertCarProperty");
      return new Promise(async function (res) {
        //res();
        db.query("INSERT into car_property (id_car, id_property, value_null) values (?,?,?);", [idCar, idProperty, value], async function (err) {
          if (err) console.log(err);
          res();
        }); 
      })
    }

    function selectIdProperty(name) {
      return new Promise(function (res) {
        db.query("SELECT id FROM property WHERE name=?;", [name], function (err, row) {
          if (err) return next(err);
          if (row.length == 0) return res(-1);
          else return res(row[0].id);
        });
      })
    }

    function insertProperty(idCar, value, name) {
      console.log("заходит в insertProperty");
      return new Promise(async function (res) {
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
    }

  var url = req.body.address;
async function addDB(model, modification, car, brand, type_car, nameChar) {
  var idModel = await selectIdModel(model);
  if (idModel == -1) {
    await insertModel(model, brand);
    idModel = await selectIdModel(model);
  }
  
  var idEngine, full_length, full_width, full_height, curb_weight, full_weight;
  if (car['Коробка передач'].includes('Автомат')) idEngine = await selectIdEngine('Автомат');
  if (car['Коробка передач'].includes('Механика')) idEngine = await selectIdEngine('Механика');
  if (car['Коробка передач'].includes('Робот')) idEngine = await selectIdEngine('Робот');
  var idModification = await insertModification(modification, idModel, idEngine);
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
  var idCar = await insertCar(idModification, type_car, curb_weight, full_weight, full_length, full_width, full_height)

  for (let k in car) { //находим дополнительные характеристики и записываем их в БД
    if (k.includes('Габариты')) continue;
    else {
      if (k.includes('Полная масса')) continue;
      else {
        if (k==='Максимальная') continue;
        else {
          if (k==='Коробка передач') continue;
          else {
            var alias = await checkAlias(k);
            if (alias===-1) await insertProperty(idCar, car[k], k); 
            else await insertCarProperty(alias, car[k], idCar)
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

    var brand = 1;
    var type_car = 1;
    links.slice(1).forEach(link => {
      request(link, async function (error, response, body) {
        fs.readFile('testpage.html', 'utf8', async function(error, data) {
        //request('https://www.kia.ru/models/cerato/properties/', function (error, response, body) {
        if (!error) {
          var $ = cheerio.load(body);
          //var $ = cheerio.load(fs.readFileSync('testpage.html'));
          var model; 
          var modification =[], nameChar=[], allData=[];
          model = $('.page-title__title').text().replace('Характеристики ', '').replace(/ +/g, ' ').trim(); //модель
          console.log(model);
          $('.config__variants__slide__title').children().each(function (i, e) {//все модификации
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
          var car =[];
          var k = 0, j=0;
          //console.log(modification.length);
          for (var i = 0; i < modification.length; i++) {
            car[i] = {};
            //for (var j = 0; j < nameChar.length; j++) {
              //console.log(nameChar[j]);
              k = i;
              while (k < allData.length) {
                if (j==nameChar.length) j =0;
                car[i][nameChar[j]] = allData[k];
                //car[i].push({ nameChar: nameChar[j], val: allData[k] });
                //car[i][j] = allData[k];
                j++;
                k = k + modification.length;
              //}
            }
           // console.log(model, modification[i], car[i], brand, type_car, nameChar);
            //setTimeout(myFunction, 2000)
            //async function myFunction() {
              await addDB(model, modification[i], car[i], brand, type_car, nameChar);
            //}
          }
          fs.writeFileSync('output.json', JSON.stringify(car));
        } else {
          console.log("Произошла ошибка: " + error);
        }
      });
    });
    });
    //console.dir(obj);
    } else {
    console.log("Произошла ошибка: " + error);
    }
  });
res.send('respond with a resource');
});
});


module.exports = router;
