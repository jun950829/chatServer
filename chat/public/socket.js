const redisDb  = require('../redis.js');
const SocketIO = require('socket.io');


let   io        = null;
let   chat      = null;
const webSocket = {};

webSocket.chat_room_status_alert = async function(event_name, history_add_yn, room_name, alert_msg)
{
	
	console.log(event_name + '> ' + alert_msg);

	if (false) { // why not ?
		//const socket = await chat.in(room_name).fetchSockets();
    	//await socket.to(room_name).emit(event_name, alert_msg);
	} else {
    	await chat.to(room_name).emit(event_name, alert_msg);
		
		if (history_add_yn == 'Y') {
			await redisDb.add_chat_message(room_name, alert_msg);
		}
	}
	
}

webSocket.init = async function(server, app) {

    io = SocketIO(server, { path : '/socket.io' });
    app.set('io', io);

    chat     = io.of('/chat');

	// b.chat �޼���(messageId update ������ �� ����)
	function server_chat_message(message) 
	{

		//var json = JSON.parse(JSON.stringify(message));
		//console.log(json);

		// update message Id 
		message.chat.messageId = new Date().getTime();
		return message;
	}

	// connect/disconnect/join/exit ����� �ְ� �޴� �޼���
	async function server_status_message(event_name, room_name, pk_name, data) 
	{
		var room_status = await get_rooms_status(event_name, room_name, pk_name);
		var _data       = null;

		if (data == null || data == undefined || data.user == undefined) { //disconnect
			_data = {user   : data, 
		             status : room_status
					};

		} else {                                 // join/exit
			_data = {user   : data.user, 
		             status : room_status
					};
		}

		return _data;
	}

	async function rooms_print(event_name, room_name)
	{

		const sockets = await chat.in(room_name).fetchSockets();

		// �� ���ϼ�
		console.log(event_name + '/total.io.client.number: ' + io.engine.clientsCount);
		// �� chat namespace ��
		console.log(event_name + '/chat.client.number    : ' + chat.sockets.size);

		// �ش� room ��� ��
		console.log(event_name + '/rooms_name: ' + room_name + ', length:' + sockets.length);

		// debug
		for (const socket of sockets) {
			//console.log(socket);

			if (false) {
				console.log(' 1> id..');
				console.log(socket.id);
				console.log(' 2> handshake..');
				console.log(socket.handshake);
				console.log(' 3> rooms..');
				console.log(socket.rooms);
				console.log(' 4> data..');
				console.log(socket.data);
			}
		}
	}

	async function get_rooms_status(event_name, room_name, pk_name)
	{
		const sockets           = await chat.in(room_name).fetchSockets();
		const _curr_room_status = await redisDb.get_chat_room_list(event_name, room_name);
		var   pk_name_list      = [];

		var max_conn_members     = sockets.length;
		var cur_max_conn_members = null;
		var cur_pk_name_list     = [];
		var cur_chat_yn          = 'Y';

		
		if (_curr_room_status[0] != null && _curr_room_status[0]['max_conn_members'] != null) {
			cur_max_conn_members  = _curr_room_status[0]['max_conn_members'];
		}
		if (_curr_room_status[0] != null && _curr_room_status[0]['pk'] != null) {
			cur_pk_name_list      = _curr_room_status[0]['pk'];
		}
		if (_curr_room_status[0] != null && _curr_room_status[0]['chat_yn'] != null) {
			cur_chat_yn           = _curr_room_status[0]['chat_yn'];
		}

		//console.log('get_room_status.length:' + _curr_room_status.length);
		//console.log(_curr_room_status);

		if (_curr_room_status.length > 0 && cur_max_conn_members != null) {
			if (sockets.length >= cur_max_conn_members) {
				max_conn_members = sockets.length;
			} else {
				max_conn_members = cur_max_conn_members;
			}
		} else {
			// 
		}

		if (_curr_room_status.length > 0 && cur_pk_name_list.length > 0) {
			var is_exist_yn = 'N';
			pk_name_list    = cur_pk_name_list;
			for (var x = 0; x < pk_name_list.length; x++) {
				if (pk_name_list[x] == pk_name) {
					is_exist_yn = 'Y';
				} else {
					//
				}
			}

			if (is_exist_yn == 'N') { // add
				pk_name_list[pk_name_list.length] = pk_name;
			} else {
				//pk_name_list[0] = pk_name;
			}
		} else { // first
			pk_name_list[0]     = pk_name;
		}

		var   _room_status = { name             : room_name,
				               //pk               : pk_name,
				               pk               : pk_name_list,
							   chat_yn          : cur_chat_yn,
				               conn_members     : sockets.length,    // connect/disconnect
				               join_members     : sockets.length,    // join/exit
				               max_conn_members : max_conn_members,  // max_connect/disconnect

							 };

		return _room_status;
	}

	async function update_rooms_list_status(event_name, room_name, pk_name)
	{
		// room.debug
		//await rooms_print(event_name, room_name);

		var room_status = await get_rooms_status(event_name, room_name, pk_name);
		var result      = await redisDb.update_chat_room_list(event_name, room_name, room_status);

	}

	function get_rooms_name(socket)
	{
        const req = socket.request;

        //console.log(req.url);
        //console.log(req);
        // console.log('referer', referer)
		
		let room_name = null;

		try {
			// 0. get room name by socket.io.query
			//
			// ex) var a = '/socket.io/?pk=pk_165275989168809013&room_name=pk_165275989168809013&EIO=4&transport=websocket&sid=pReUSOJ-siXlRYtUAAAC';
			
			room_name = req.url.split('room_name=')[1].split('&')[0];

			//console.log('pk:' + room_name );
			
			return room_name;
		} catch (e) {
            room_name = get_pk_name(socket);
		}

		return room_name;
	}

	function get_pk_name(socket)
	{
        const req = socket.request;

        //console.log(req.url);
        //console.log('----------');
        //console.log(req);
        //const { headers : {referer} } = req;

        //console.log('referer', referer)
		
		let pk = null;

		try {
			pk_name = req.url.split('pk=')[1].split('&')[0];

			return pk_name;
		} catch (e) {

			// 1. get room name by http.referer
            pk_name = referer
                .split('/')[referer.split('/').length - 1]
                .replace(/\?.+/, '');
		}

		return pk_name;
	}

	function update_chat_room_status_to_mysql()
	{

	}
	

	// b. chat namespace
    chat.on('connection', async (socket) => {
       
		//console.log('chat namespace connect')

		// 0. get room_name
		let room_name = get_rooms_name(socket);
		let pk_name   = get_pk_name(socket);

        console.log('------connection> chat connection roomId:[', room_name , '], id:', socket.id, ', pk:', pk_name);
        //console.log(socket.handshake);

		// 2. pk room join
		//console.log('current room name - pk cookie', pk_name);

        socket.join(room_name);

		// 3. room list update
		await update_rooms_list_status('connect', room_name, pk_name);

		// 3. chat/history ack
		var history_message = await redisDb.chat_history_message(room_name);
		// console.log('chat.on connection chat => ');
		if (false) { // 1���� ���� for debugging
			setInterval(() => {
				console.log('chat.on connection chat => ');
				socket.emit('chat/history', history_message);
			}, 2000);
		} else {
			socket.emit('chat/history', history_message);
		}

		// event flow
		// connect
		//            chat/history
		//            join
		//                  chat
		//            exit
		//            exit/ab
		// disconnect 
		//            
		//
		/////////////////////
		// event register (event�� ������ �̵��ؾ��ҵ�)

		// �� �����ϱ�
        socket.on('join', async (data) => {
            console.log('join:' + JSON.stringify(data));

			var _data  = await server_status_message('join', room_name, pk_name, data);
			var result = await redisDb.update_chat_room_user('join', room_name, socket.id, data.user);

        	socket.to(room_name).emit('join', _data);
        	socket.emit('join', _data);

			// update..
        });

		// �泪����
        socket.on('exit', async (data) => {
            console.log('exit:' + data);

			var _data  = await server_status_message('exit', room_name, pk_name, data);
			//var result = await redisDb.del_chat_room_user('exit', room_name, socket.id);

        	socket.to(room_name).emit('exit', _data);
        	socket.emit('exit', _data);
            //socket.leave(room_name);
        });

		// ����� ��������
        socket.on('exit/user', async (data) => {
            console.log('exit/user:' + data);

        	socket.to(room_name).emit('exit/user', data);
        	socket.emit('exit/user', data);
            //socket.leave(room_name);
        });
		
		// �޼��� ������
        socket.on('chat/hidden', async (data) => {
            console.log('chat/hidden:' + data);

        	socket.to(room_name).emit('chat/hidden', data);
        	socket.emit('chat/hidden', data);

			// redis sync (msg hidden)
			redisDb.hidden_chat_message('real', room_name, data);

        });

		// �ֱ� ä�ø޼��� �����丮 event (not used)
        //socket.on('chat/history', (data) => {
            //console.log('chat/history:' + data);
        //});

		// chat 
        socket.on('chat', (data) => {
            console.log('chat>' + room_name + '>' + data);

			try {
	
				// messageId update..
				var message = server_chat_message(data);

				// redis sync
				redisDb.add_chat_message(room_name, message);

				// broadcast..
        		socket.to(room_name).emit('chat', message);
        		socket.emit('chat', message);

				// for test
				redisDb.hidden_chat_message('test', room_name, data);
			} catch (error) {
				console.log('chat> error> ' + error);
			}

        });

        socket.on('disconnecting', (reason) => {
            console.log('chat> disconnecting> ' + reason);
		});

        socket.on('disconnect', async () => {
        	console.log('------disconnct pk<' + room_name + '>');
        	//console.log(socket.request);

            await socket.leave(room_name);

            //await socket.to(room_name).emit('exit', {
            //   user: 'guest',
            //   chat : `text가 퇴장하였습니다.`
            //});

			// redis get user info
			var _user   = await redisDb.get_chat_room_user('exit', room_name, socket.id);
			var _result = await redisDb.del_chat_room_user('exit', room_name, socket.id);
			//console.log(_user);

			var _data = await server_status_message('disconnect', room_name, pk_name, _user);
			//console.log(_data);
            await socket.to(room_name).emit('exit/ab', _data);

			// socket close
			//socket.close();
			socket.disconnect(true);
	
			// room list update
			await update_rooms_list_status('disconnect', room_name, pk_name);
        })

    })

};


module.exports = webSocket;
