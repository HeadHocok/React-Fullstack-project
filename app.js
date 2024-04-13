const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs'); //проверка наличия папки
const cors = require('cors'); //позволяет контролировать доступ к ресурсам на сервере
require('dotenv').config(); //делаем доступным файл .env

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json()); //
app.use(express.urlencoded({ extended: false })); //устанавливают нам body в наши запросы ибо по умолчанию в express нету
app.use(cookieParser());
app.set('view engine', 'jade');
app.use('/uploads', express.static('uploads')); //будет автоматически создаваться
//раздавать статические файлы из папки uploads
app.use('/api', require('./routes')); //все роуты отсылаем на api

if(!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
