var express = require('express');
app = express();
server = require('http').createServer(app);
io = require("socket.io").listen(server);
mongoose = require('mongoose');
users = {};

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on', server.address().port);
});;

mongoose.connect('mongodb://localhost/chat', function(err){
	if(err)
		console.log(err);
	else
		console.log("Successfully connected to mongodb");
});


var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message',chatSchema);

app.get('/chat', function(req,res){
	res.sendFile(__dirname + '/index.html');

});


function updateNicknames()
{
	io.sockets.emit('usernames', Object.keys(users));
}

console.log("server socket");
io.sockets.on('connection', function(socket){

		var dbQuery = Chat.find({});
		dbQuery.sort('-created').limit(8).exec(function(err, docs)
		{
			if(err) throw err;
			socket.emit('loadHistory', docs);
		});


	socket.on('sendMessage', function(data)
	{
		var message = data.trim();
		var first = message.indexOf('[');
		var last = message.indexOf(']');
		if(first != -1 && last != -1)
		{
			var recipient = message.substr(first+1,(last-first-1));
			console.log(recipient);
			users[recipient].emit('newMessage', {message : data, nick : socket.nickname});
		}
		else
		{
			var newMessage = new Chat({msg: data, nick: socket.nickname});
			newMessage.save(function(err)
			{
				if(err) throw err;
				io.sockets.emit('newMessage', {message : data, nick : socket.nickname});
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