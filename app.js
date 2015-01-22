var express = require('express');
app = express();
server = require('http').createServer(app);
io = require("socket.io").listen(server);
mongoose = require('mongoose');
users = {};
app.use(express.static(__dirname + '/public'));
//app.set('domain', 'http:/192.168.0.104/');
server.listen(process.env.PORT || 81, function(){
  console.log('listening on', server.address().port);
});

var bodyParser = require('body-parser');
var multer = require('multer'); 
var fs = require('fs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data



Dropbox = require("dropbox");
var DROPBOX_PATH = 'Public/nodefiles/';
var DROPBOX_LINK = 'https://dl.dropboxusercontent.com/u/60906355/nodefiles/';
var client = new Dropbox.Client({
	token : "XQ8I0hR-FMUAAAAAAAAerp49egTXbNQtRn1ulbIPIf-RqQ_2VQuG5bxffdlbbb38"
});

//Cloud MongoDB : mongodb://relax94:transcend123@oceanic.mongohq.com:10081/NewsDB
mongoose.connect('mongodb://localhost/chat', function(err){
	if(err)
		console.log(err);
	else
		console.log("Successfully connected to mongodb");
});



var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	av:String,
	created: {type: Date, default: Date.now},
	object : []
});

var Chat = mongoose.model('Message',chatSchema);

app.get('/chat', function(req,res){
	res.sendFile(__dirname + '/index.html');

});



function uploadFile(fileMeta)
{
			fs.readFile(fileMeta.path, function(err, data) {
				if (err) throw err;
				client.writeFile(DROPBOX_PATH + fileMeta.originalname, data, function(error, stat) {
					if (error) {
   					 return showError(error);  // Something went wrong.
   					}


   				});
			});
}



app.post('/fileupload', function(req, res) {
	console.log("app post");
	var files = req.files['uploadedFile'];
	console.log("files ",files);
	if(files)
	{
		if(files.length > 1)
		{
		for (var i in files) {
			console.log(files[i].originalname);
			uploadFile(files[i]);
		}
		}
		else
		{
			uploadFile(files);
		}
			res.send("Files saved!");
		}
	else {
				res.send("Err!");
		}	
			});


// использование Math.round() даст неравномерное распределение!
function getRandomColor()
{
	var colors = {
	0 : 'bg-red-300',
	1 : 'bg-pink-300',
	2 : 'bg-purple-300',
	3 : 'bg-indigo-300',
	4 : 'bg-blue-300',
	5 : 'bg-cyan-300',
	6 : 'bg-teal-300'
};
	var min = 0;
	var max = 6;
  return colors[Math.floor(Math.random() * (max - min + 1)) + min];
}





function updateNicknames()
{
	var result = [];
	Object.keys(users).forEach(function(element, index, array)
	{
		result.push({name:element, avcolor:users[element].avcolor})
	});

	io.sockets.emit('usernames', result);
}


io.sockets.on('connection', function(socket){

	var dbQuery = Chat.find({});
	socket.on('loadHistory', function(callback)
	{


		dbQuery.sort('-created').limit(8).exec(function(err, docs)
		{
			if(err) throw err;
			callback(docs);
		});

	});

	socket.on('loadAvaibleUsers', function()
	{
		updateNicknames();
	});

	socket.on('sendMessage', function(data)
	{


		var newMessage = new Chat({msg: data.msg, nick: socket.nickname, object : data.objects, av:socket.avcolor});
		if(data.recipients.length >= 1)
		{
			data.recipients.forEach(function(element, index, array)
			{
				users[element].emit('newMessage', newMessage);
			});
			
		}
		else
		{
			
			newMessage.save(function(err)
			{
				if(err) throw err;
				io.sockets.emit('newMessage', newMessage);
			});

		}
		//socket.broadcast.emit('newMessage',data);
	});

	socket.on('newUser', function(data,callback){
		if(data in users)
			callback(false);
		else
		{
			socket.nickname = data;
			socket.avcolor = getRandomColor();
			users[socket.nickname] = socket;
			callback(true);
			updateNicknames();
		}
	});

	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});