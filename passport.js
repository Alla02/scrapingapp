(function (pp) {

    var passport        = require('passport'),
        LocalStrategy   = require('passport-local').Strategy,
        bcrypt          = require('bcryptjs'),
        config          = require('./config'),
        mysql           = require('mysql'),
        db              = mysql.createConnection(config.dbconnection);
    //init passport functions

    pp.init = function (app) {

        passport.serializeUser(function (user, done) {
            done(null, user.login);
        }); //end serialize

        passport.deserializeUser(function (login, done) {
                var sql = "select * from user where login='" + login + "'";
                var sql2;
                db.query(sql, function (err, row, next) {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                    var user = {};
                    user.id = row[0].id;
                    user.login = row[0].login;
                    user.user_type = row[0].type_user;
                    user.email = row[0].email;
                    done(err, user);
                });
        }); //end deserialize

        //register new user strategy
        passport.use('local-signup', new LocalStrategy({
                usernameField : 'login',
                passwordField : 'password',
                passReqToCallback : true
            },

            function (req, login, password,done) {
                var sql = "select * from user where login=?";
                var sql2 = "select * from user where email=?";
				try{
					db.query(sql, [login], function (err, row) {
						if (err) {
							return done(err);
						}
						if (row.length) { //then there is a user here already
                            console.log("login");
							return done(null, false, req.flash('registerMessage', 'Пользователь с данным логином уже существует'));
						}
						else {
							db.query(sql2, [req.body.email], function (err, row) {
								if (err) {
									return done(err);
								}
								if (row.length) { //then there is email here already
                                    console.log("email");
									return done(null, false, req.flash('registerMessage', 'Пользователь с данным email уже существует'));
								}
								else {
									var user = {};
									user.login = login;
									if (req.body.password == req.body.password2) {
										bcrypt.hash(password, 5, function (err, hash) { //hash the password and save to the mysql database
											if (err) {
												return next(err);
											}
                                            if (req.body.user_type==='Администратор') user.user_type = 0;
                                            else user.user_type = 1
                                            user.password = hash;
                                            user.login = req.body.login;
                                            db.query("INSERT into user (login,password,type_user,email) values (?,?,?,?);",[user.login,user.password,user.user_type,req.body.email], function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                else {
                                                    console.log("inserted into users")
                                                }
                                            });
                                            done(err, req.user, req.flash('registerMessage', 'Пользователь успешно зарегистрирован'));
										})//end hash										
									}//end check passwords
									else {
										console.log('Пароли не совпадают');
										return done(null, false, req.flash('registerMessage', 'Пароли не совпадают'));
									}//end third else 
								}//end second else
							})//end second query
						}//end first else
					})//end first query
				}//end try
				catch(err){
                    console.log(err);
                }
		}));//end passport use signup

        //login strategy
        passport.use('local-login', new LocalStrategy({
                usernameField : 'login',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },

            function (req, login, password, done) {
                console.log(login, password);
                db.query("SELECT * FROM user WHERE login=? or email=?", [login,login] , function (err, row) {
                    if (err) return done(err);
                    if (!row.length) return done(null, false, req.flash('loginMessage', 'Неверно введенный логин/email'));
                    var user = {};
                    user.login = row[0].login;
                    user.user_type = row[0].type_user;
                    user.email = row[0].email;
                    console.log(row[0].password);
                    bcrypt.compare(password, row[0].password, function (err, res) {
                        console.log('2')
                        if (res) return done(null, user);
                        else return done(null, false, req.flash('loginMessage', 'Неверно введенный логин и/или пароль'));
                    }); //end compare
                });//end db.get
            })); //end local-login
        //app.use(session({secret: config.sessionSecret, saveUninitialized: true, resave: true})); 
        app.use(passport.initialize());
        app.use(passport.session());
    }; //end init
})(module.exports);