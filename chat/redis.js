const redis       = require('redis');
const {promisify} = require('util');

const redisDb = {};

//const redisInfo = { host : '127.0.0.1', port : 6379, db : 0, //  password : '1234', };
const redis_client = redis.createClient({ host : process.env.NW_REDIS_HOST, port : process.env.NW_REDIS_PORT, db : 0, password: process.env.NW_REDIS_AUTH });

// async function bind
const zrevRangeAsync  = promisify(redis_client.zrevrange).bind(redis_client)
const zrangeAsync     = promisify(redis_client.zrange).bind(redis_client)
const zrangeByScoreAsync  = promisify(redis_client.zrangebyscore).bind(redis_client)
const zaddAsync    = promisify(redis_client.zadd).bind(redis_client);
const zremRangeByScoreAsync    = promisify(redis_client.zremrangebyscore).bind(redis_client);
const hsetAsync    = promisify(redis_client.hset).bind(redis_client);
const hdelAsync    = promisify(redis_client.hdel).bind(redis_client);
const hgetallAsync = promisify(redis_client.hgetall).bind(redis_client);
const hvalsAsync   = promisify(redis_client.hvals).bind(redis_client);
const hgetAsync    = promisify(redis_client.hget).bind(redis_client);
const delAsync     = promisify(redis_client.del).bind(redis_client);


function get_chat_room_name_table(room_name)
{
	return 'chat_room_msg_' + room_name;
}

function get_chat_room_list_table()
{
	return 'chat_room_list';
}

function get_chat_room_user_table(room_name)
{
	return 'chat_room_user_' + room_name;

	//return 'chat_room_user';
}

function get_chat_room_user_key(room_name, room_user)
{
	return room_user;
	
	//return room_name + '_' + room_user;
}

//레디스 연결
redisDb.connectDB = async function() {
    console.log('redis connected..')

	try {
    	var result        = await delAsync(get_chat_room_user_table());
		
	} catch (error) {
		//
	}

}

redisDb.getPK = async function(room_name) {

    await redis_client.get(`${room_name}`, (err, reply) => {
        if(err) {
            console.log(err);
        } 

        else {
            console.log('redisdb.getPK', reply);

            return reply;
        }
    })
}

redisDb.getClient = async function(room_name) {

    await redis_client.get(`${room_name}redis_client`, (err, reply) => {
        if(err) {
            console.log(err);
        } 

        else {
            console.log('redis.getClient', reply);
            return reply;
        }
    })
}

redisDb.setPk = async function(room_name) {
    await redis_client.set(`${room_name}`, 'open');
}

redisDb.setClient = async function(room_name, redis_client) {
    await redis_client.set(`${room_name}redis_client`, redis_client)
}

// hash type
// 1. message (hset) �ֱ� �޼��� ������ ���ϳ�?
// 2. ���� ���ϴ� ��� �ֱ� �޼����� �������� ����� ����?
redisDb.addChatMessageBack = async function(room_name, message) {

	// timetimestamp sequence
	var  redis_score = new Date().getTime();	
	try {
    	var result       = await redis_client.hlen(get_chat_room_name_table(room_name));
		console.log(result);
		console.log('addChatMessage.hlen.result:' + result);

    	result       = await redis_client.hset(get_chat_room_name_table(room_name), redis_score, message);
		console.log('addChatMessage.hset.result:' + result);
	} catch (error) {
		console.log('addChatMessage.error:' + room_name + ', ' + redis_score + ', ' + error);
	}
}

// chat event (zset)
redisDb.add_chat_message = async function(room_name, message) {

	var  redis_score = null;

	// timetimestamp sequence
	if (message.chat.messageId == 0) { //
		redis_score = new Date().getTime();
	} else {
		redis_score = message.chat.messageId;
	}

	try {
    	var result       = await zaddAsync(get_chat_room_name_table(room_name), redis_score, JSON.stringify(message));
		//console.log('add_chat_message.zadd.result:' + result);
	} catch (error) {
		console.log('add_chat_message.error:' + room_name + ', ' + redis_score + ', ' + error);
	}
}

redisDb.hidden_chat_message = async function(prefix, room_name, message) {

	var redis_score = null;

	if (prefix == 'test') {
		return;

		redis_score = '1655714748536'; // test
	}
	
	 // ZRANGEBYSCORE chat_room_msg_pk_1655345358895944795 1654849420816 1654849420816  withscores  
	try {
		if (prefix == 'test' || message.chat.messageId == null || message.chat.messageId == undefined) {
		//if (message.chat.messageId == null || message.chat.messageId == undefined) {
			return;
		}

		if (prefix == 'test') {
			//
		} else {
			redis_score = message.chat.messageId;
		}

    	var result       = await zrangeByScoreAsync(get_chat_room_name_table(room_name), redis_score, redis_score);
		//console.log('hidden_chat_message.result1:' + result);
		//console.log('hidden_chat_message.redis:' + get_chat_room_name_table(room_name));
		//console.log(result);
		var _message = JSON.parse(result);
		_message.chat.message = "..."; // message hidden
		_message.chat.hidden  = "Y";
	//	console.log('hidden_chat_message.result.change:' + result);

		// delete..
    	var result2      = await zremRangeByScoreAsync(get_chat_room_name_table(room_name), redis_score, redis_score);
	//	console.log('hidden_chat_message.result2:' + result2);

		// update..
    	var result3      = await zaddAsync(get_chat_room_name_table(room_name), redis_score, JSON.stringify(_message));
	//	console.log('hidden_chat_message.result3:' + result3);
	} catch (error) {
		console.log('hidden_chat_message.error:' + room_name + ', ' + redis_score + ', ' + error);
		//console.log(message);
	}
}

// chat/history event
redisDb.chat_history_message = async function(room_name) {

	try {
    	//var result       = await zrevRangeAsync(get_chat_room_name_table(room_name), 0, 50, 'WITHSCORES');
    	var result       = await zrevRangeAsync(get_chat_room_name_table(room_name), 0, 50);

		// room status
    	var _status      = await hgetAsync(get_chat_room_list_table(), room_name);

		console.log(_status);

		//return JSON.parse('{\"status\":{}, \"history\":[]}');

		//return JSON.parse('[' + result + ']');
		return JSON.parse('{\"status\":' + _status + ', \"history\":[' + result + ']}');
	} catch (error) {
		console.log('chat_history_message.error:' + get_chat_room_name_table(room_name) + ', error:' + error);
		//return JSON.parse('[]');
		return JSON.parse('{\"status\":{}, \"history\":[]}');
	}
}

// join/exit �ϸ� �� �����ڼ� 
redisDb.update_chat_room_list = async function(event_name, room_name, room_status) {

	try {
    	var result       = await hsetAsync(get_chat_room_list_table(), room_name, JSON.stringify(room_status));
		return result;
		//console.log('update_chat_room_list.hset.result:' + result);
	} catch (error) {
		console.log('update_chat_room_list.error:' + room_name + ', ' + room_status + ', ' + error);
		return null;
	}
}

redisDb.get_chat_room_list = async function(event_name, room_name) {

	try {
    	var result       = null;

		if (room_name == null) {
    		//result       = await hgetallAsync(get_chat_room_list_table());
    		result       = await hvalsAsync(get_chat_room_list_table());
		} else {
    		result       = await hgetAsync(get_chat_room_list_table(), room_name);
		}

		return JSON.parse('[' + result + ']');
	} catch (error) {
		console.log('get_chat_room_list.error:' + error);
		return JSON.parse([]);
	}
}

redisDb.get_chat_room_list2 = async function(event_name, room_name) {

	try {
    	var result       = null;

   		result       = await hgetAsync(get_chat_room_list_table(), room_name);

		return JSON.parse(result);
	} catch (error) {
		console.log('get_chat_room_list.error:' + error);
		return null;
	}
}

// join/exit �ϸ� �� ����� ����
redisDb.update_chat_room_user = async function(event_name, room_name, user_name, data) {

	try {
		var room_user_key = get_chat_room_user_key(room_name, user_name);
    	var result        = await hsetAsync(get_chat_room_user_table(room_name), room_user_key, JSON.stringify(data));
		return result;
	} catch (error) {
		console.log('update_chat_room_user.error:' + room_name + ', ' + room_user + ', ' + error);
		return null;
	}
}

redisDb.get_chat_room_user = async function(event_name, room_name, user_name) {

	try {
		var room_user_key = get_chat_room_user_key(room_name, user_name);
    	var result        = await hgetAsync(get_chat_room_user_table(room_name), room_user_key);
//    	                    await hdelAsync(get_chat_room_user_table(room_name), room_user_key);

		return JSON.parse(result);
	} catch (error) {
		console.log('get_chat_room_user.error:' + error);
		return null;
	}
}

redisDb.del_chat_room_user = async function(event_name, room_name, user_name) {

	try {
		var room_user_key = get_chat_room_user_key(room_name, user_name);
    	var result        = await hdelAsync(get_chat_room_user_table(room_name), room_user_key);
		return result;
	} catch (error) {
		console.log('del_chat_room_user.error:' + error);
		return null;
	}
}

redisDb.chat_history_message_replay = async function(prefix, room_name, redis_score_from, redis_score_to) {

	if (prefix == 'test') {
		return;
	}
	
	 // ZRANGEBYSCORE chat_room_msg_pk_1655345358895944795 1654849420816 1654849420816  withscores  
	try {
		if (prefix == 'test' || room_name == null || room_name == undefined || redis_score_from == null || redis_score_from == undefined || redis_score_to == null || redis_score_to == undefined) {
			return;
		}

		console.log(room_name + ', ' + redis_score_from + ', ' + redis_score_to);
		console.log(get_chat_room_name_table(room_name));

    	var result       = await zrangeByScoreAsync(get_chat_room_name_table(room_name), redis_score_from, redis_score_to);

		//console.log(result);

		return JSON.parse('{\"history\":[' + result + ']}');
	} catch (error) {
		console.log('get_chat_message_history.error:' + room_name + ', ' + redis_score_from + ' ~ '+ redis_score_to + ', ' + error);
		//console.log(message);
		return JSON.parse('{\"history\":[]}');
	}
}

module.exports = redisDb;
