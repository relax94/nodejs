var express = require('express');
app = express();
server = require('http').createServer(app);
io = require("socket.io").listen(server);
mongoose = require('mongoose');
users = {};
app.use(express.static(__dirname + '/public'));
//app.set('domain', 'http:/192.168.0.104/');
server.listen(81);
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

 //client.authDriver(new Dropbox.AuthDriver.NodeServer(3000));

   /* client.authenticate(function(error, client) {
      if (error) {
        console.log("Some shit happened trying to authenticate with dropbox");
        console.log(error);
        return;
      }
  });*/


/*client.writeFile(DROPBOX_PATH + "hello_world.txt", "Hello, world!\n", function(error, stat) {
  if (error) {
    return showError(error);  // Something went wrong.
  }

  console.log(stat);
});*/

//Cloud MongoDB : mongodb://relax94:transcend123@oceanic.mongohq.com:10081/NewsDB
mongoose.connect('mongodb://relax94:transcend123@oceanic.mongohq.com:10081/NewsDB', function(err){
	if(err)
		console.log(err);
	else
		console.log("Successfully connected to mongodb");
});



var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
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
	if(files)
	{
		for (var i in files) {
			console.log(files[i].originalname);
			uploadFile(files[i]);
		}
		res.send("Files saved!");
	}
	else {
				res.send("Err!");
		}	
			});





function updateNicknames()
{
	io.sockets.emit('usernames', Object.keys(users));
}

console.log("server socket");
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
		console.log(data);
		var message = data.msg.trim();
		var first = message.indexOf('[');
		var last = message.indexOf(']');
		var newMessage = new Chat({msg: data.msg, nick: socket.nickname, object : data.objects});
		if(first != -1 && last != -1)
		{

			var recipient = message.substr(first+1,(last-first-1));
			console.log(recipient);
			users[recipient].emit('newMessage', newMessage);
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