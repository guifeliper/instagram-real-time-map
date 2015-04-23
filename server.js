'use strict';

// Tools
var env = require('dotenv').load();	// Load environment settings
var logger = require('morgan');		// Logs HTTP Requests

// Project
var publicDir = 'app';

///////////////////////////////////////////////////////////

//
// Express

var http = require('http');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');

var app = express();
var server = http.Server(app);

// all environments
app.set('port', process.env.PORT || 3000);

app.set('view engine', 'html');
app.use(favicon(__dirname + '/'+publicDir+'/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.get('/', routes.index);
app.get('/detail/:id', routes.index);

// development
if ('development' == app.get('env')) {

	app.use(express.static(path.join(__dirname, publicDir)));
	app.use(express.static(path.join(__dirname, '/.tmp')));
	app.set('views', path.join(__dirname, 'views'));

	// error handling middleware should be loaded after the loading the routes
	app.use(errorHandler());
}

// production
if ('production' == app.get('env')) {
	app.use(express.static(path.join(__dirname + '/dist')));
}


///////////////////////////////////////////////////////////

//
// Instagram API

var Instagram = require('instagram-node-lib');

// Set the configuration
Instagram.set('client_id', process.env.INSTAGAM_CLIENT_ID);
Instagram.set('client_secret', process.env.INSTAGAM_CLIENT_SECRET);
Instagram.set('callback_url', process.env.SITE_URL + '/callback');
Instagram.set('redirect_uri', process.env.SITE_URL);
Instagram.set('maxSockets', 10);

// Subscribe to Instagram Real Time API with Hashtag
// Instagram.subscriptions.subscribe({
// 	object: 'tag',
// 	object_id: process.env.SITE_URL,
// 	aspect: 'media',
// 	callback_url: process.env.SITE_URL + '/callback',
// 	type: 'subscription',
// 	id: '#'
// });


///////////////////////////////////////////////////////////

//
// Socket.io

var socket = require('socket.io');
var io = socket(server);

// Start Server with socket.io
server.listen(app.get('port'));

// First connection
io.sockets.on('connection', function (socket) {
	console.log("Socket IO: Connected. Waiting for Handshake...");
	// Instagram.tags.recent({
	// 	name: process.env.SITE_URL,
	// 	complete: function(data) {
	// 		console.log("Socket IO: Initial Add");
	// 		socket.emit('initialAdd', { initialAdd: data });
	// 	}
	// });
});

// Handshake
app.get('/callback', function(req, res){
	console.log("Socket IO: Handshake");
	// var handshake =  Instagram.subscriptions.handshake(req, res);
});

// New Instagrams
app.post('/callback', function(req, res) {
	console.log("Socket IO: Send Instagrams to Client");
	var data = req.body;
	data.forEach(function(tag) {
		var url = 'https://api.instagram.com/v1/tags/' + tag.object_id + '/media/recent?client_id='+process.env.INSTAGAM_CLIENT_ID;
		io.sockets.emit('add', { add: url });
	});
	res.end();
});

// Socket.io on Heroku https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
// io.configure(function () {
//   io.set("transports", [
//     'websocket'
//     , 'xhr-polling'
//     , 'flashsocket'
//     , 'htmlfile'
//     , 'jsonp-polling'
//     ]);
//   io.set("polling duration", 10);
// });
