var dbconnection = {
connectionLimit : 10,
host : 'localhost',
user : 'root',
password : '',
port : '3306',
database : 'scrappingapp2'
   };

module.exports = {
    "applicationName": "scrappingapp",
    "sessionSecret": "blabla",
    "dbconnection": dbconnection,
    "sessionTimeout": 3600000
};  