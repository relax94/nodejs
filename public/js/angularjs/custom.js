


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
	console.log(location);
var DROPBOX_LINK = 'https://dl.dropboxusercontent.com/u/60906355/nodefiles/';
	$scope.avaibleUsers = [];	
	$scope.messages = {};
	$scope.errorMessageInput = '';
	$scope.messageText = '';

	$scope.$on('avaibleUsers', function(e,args)
	{
			$scope.avaibleUsers = args;
			$scope.$apply();
	});


	$scope.$on('newMessage', function(e,args)
	{
			$scope.messages.splice(0,0,args);
			$scope.$apply();
	});

	socket.loadHistory(function(result)
	{
		$scope.messages = result;
	});

	$scope.send = function()
	{
		var data = 
		{
			msg : $scope.messageText,
			objPath : $scope.dropboxPath || '',
			objName : $scope.dropboxName || ''
		};

		if($scope.messageText != '' || $scope.dropboxPath != '')
			socket.sendMessage(data);
		else
			$scope.errorMessageInput = 'Message text isRequired';
		$scope.messageText = '';
		$scope.dropboxPath = '';
	    $scope.dropboxName = '';
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
		$scope.messageText = "["+user+"]";
	}

   $scope.setFiles = function(element) {
    $scope.$apply(function(scope) {
      // Turn the FileList object into an Array
        var fd = new FormData()
       // for (var i in element.files) {
            fd.append("uploadedFile", element.files[0]);

        var xhr = new XMLHttpRequest()
        //r.upload.addEventListener("progress", uploadProgress, false)
        //r.addEventListener("load", uploadComplete, false)
       //hr.addEventListener("error", uploadFailed, false)
       //hr.addEventListener("abort", uploadCanceled, false)
        xhr.open("POST", "/fileupload")
       // scope.progressVisible = true
        xhr.send(fd);

		$scope.dropboxPath = DROPBOX_LINK + element.files[0].name;
		$scope.dropboxName = element.files[0].name;

      });
    };
});