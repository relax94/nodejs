


var app = angular.module('chat',['ngRoute', 'ngCookies']);

app.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider.
		when('/auth', {
			templateUrl: '/templates/auth.html',
			controller: 'AuthCtrl'
		}).
			when('/chatroom', {
			templateUrl: '/templates/chat.html',
			controller: 'ChatCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
	}
	]);

app.service('socket', function($rootScope)
{
	var socket = io.connect();

	var sendMessage = function(data)
	{
		socket.emit('sendMessage', data);
	};

	var authUser = function(nick, callback)
	{
		socket.emit('newUser', nick, function(data)
		{
			$rootScope.$apply(function(){ callback(data); });
		});
	};

	var loadHistory = function(callback)
	{
		socket.emit('loadHistory', function(result){
			$rootScope.$apply(function(){callback(result);});
		});
	};

	var loadAvaibleUsers = function()
	{
		socket.emit('loadAvaibleUsers');
	};

	socket.on('newMessage', function(data)
	{
		$rootScope.$broadcast('newMessage', data);
	});

	socket.on('loadHistory', function(data){
		$rootScope.$broadcast('loadHistory', data);
	});

	socket.on('usernames', function(data){
		$rootScope.$broadcast('avaibleUsers', data);
	});

	return {
		sendMessage: sendMessage,
		authUser: authUser,
		loadHistory: loadHistory,
		loadAvaibleUsers: loadAvaibleUsers
	};

});

app.controller('AuthCtrl', function($scope,$cookies, socket)
{
	$scope.connect = function()
	{
		socket.authUser($scope.username, function(result){
			if(result)
			{
				document.getElementById('currUser').text  = $scope.username;
				location.href = '#/chatroom';
				$cookies.nick = $scope.username;
			}
			else
				$scope.errorText = "username is already taken";
		});
	};


		if($cookies.nick)
		{
			location.href = '#/chatroom';
		}

});


app.controller('ChatCtrl', function($scope,$routeParams,$cookies, socket)
{

	$(".slider").noUiSlider({
	start: [20],
	range: {
		'min': 0,
		'max': 100
	}
});
	
	var DROPBOX_LINK = 'https://dl.dropboxusercontent.com/u/60906355/nodefiles/';
	$scope.avaibleUsers = [];	
	$scope.messages = {};
	$scope.errorMessageInput = '';
	$scope.messageText = '';
	$scope.loaderText = 0;
	var files = [];
	$scope.filesStorage = [];
	$scope.recipients = [];

	$scope.$on('avaibleUsers', function(e,args)
	{
		console.log(args);
			$scope.avaibleUsers = args;


	socket.loadHistory(function(result)
	{
		$.map(result, function(item){
		    for(var i = 0; i < $scope.avaibleUsers.length; i++){
		    	if(item.nick == $scope.avaibleUsers[i].name)
		    	{
		        	item.av = $scope.avaibleUsers[i].avcolor;
		        	return item;
		        }
		    }
		});


		$scope.messages = result;
	});
			$scope.$apply();
	});


	$scope.$on('newMessage', function(e,args)
	{
		console.log('newMessage',args);
			$scope.messages.splice(0,0,args);
			$scope.$apply();
	});



	$scope.send = function()
	{
		var data = 
		{
			msg : $scope.messageText,
			recipients: $scope.recipients,
			objects : files
		};

		if($scope.messageText != '' || $scope.dropboxPath != '')
			socket.sendMessage(data);
		else
			$scope.errorMessageInput = 'Message text isRequired';
		$scope.messageText = '';
	};


	if($cookies.nick)
	{
		socket.authUser($cookies.nick, function(result){
				if(result)
				{
					document.getElementById('currUser').text  = $cookies.nick;
					//location.href = '#/chatroom';
					//$cookies.nick = $scope.username;
				}
				else 
				{
					/*if(location.hash === "#/chatroom")
					{
					delete $cookies.nick;
					location.href = '#/auth';
					}*/
				}

			});
		socket.loadAvaibleUsers();
	}
	else
		location.href = '#/auth';

	$scope.setUser = function(user)
	{
		var temp = $scope.recipients;
		var index = temp.indexOf(user.name);
		if(index != -1)
		{
			$scope.recipients.splice(index,1);
		}
		else
		$scope.recipients.push(user.name);
	}



   $scope.setFiles = function(element) {
    $scope.$apply(function(scope) {
      // Turn the FileList object into an Array
        var fd = new FormData()
        for (var i in element.files) {
            if(element.files[i].type) 
            {
            	fd.append("uploadedFile", element.files[i]);
              files.push({path:DROPBOX_LINK + element.files[i].name, name: element.files[i].name });
           }
		}

        var xhr = new XMLHttpRequest()
       // xhr.upload.addEventListener("progress", uploadProgress, false)
        //r.addEventListener("load", uploadComplete, false)
       //hr.addEventListener("error", uploadFailed, false)
       //hr.addEventListener("abort", uploadCanceled, false)
        xhr.open("POST", "/fileupload")
		xhr.addEventListener("load", transferComplete, false);
		xhr.addEventListener("error", transferFailed, false);
		xhr.addEventListener("abort", transferCanceled, false);



	xhr.open("POST", "/fileupload")

	function transferComplete(evt) {
	  alertify.success("files succesfully upload");
	}

	function transferFailed(evt) {
	  alertify.error("files failed uploaded");
	}

	function transferCanceled(evt) {
	  alert("The transfer has been canceled by the user.");
	}
	       // scope.progressVisible = true
	        xhr.send(fd);
	      });
	    };
	});