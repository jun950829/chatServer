const express  = require('express');
const router   = express.Router();
const redisDb  = require('../redis.js');
const webSocket = require('../public/socket.js');
const path = require('path');
const crypto   = require('crypto');


// router.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html')
// })
//
router.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname , '..', '/public/history.html'));

});

router.get('/nft_live/status', async(req, res, next) => {
    try {
		// console.log('--------router/get status start------');
		//console.log(req);
		// console.log(req.headers);
		// console.log(req.query);
		//console.log(req.body);
		// console.log('--------router/get status end------');

		// nft-access-key, nft-access-secret
		//let _key       = req.get('nft-access-key');
		//let _secret    = req.get('nft-access-secret');
		let _key       = req.query['nft-access-key'];
		let _secret    = req.query['nft-access-secret'];
		let _room_name = req.query.name;
		if (_room_name == null || _room_name == undefined || _room_name == "") {
			_room_name = null;
		}

		//console.log('nft-access-key:' + req.query['nft-access-key']);

		//console.log(req.body.name);

		// null check..
		// key/secret checksum check..

	if (false) {
		// console.log(_key + ', ' + _secret + ', ' + _room_name);

		if (_key == null || _key == undefined || _key == "" || _secret == null || _secret == undefined || _secret == "") {
			return responsePush(res, 500);
		} else {
			//
		}
	}

		var verify_result = _get_uuid_verify('status', _key, _secret);
		if (verify_result == true) {
			var result  = await redisDb.get_chat_room_list('status', _room_name);

			responsePushData(res, result)
		} else { // forbidden
			return responsePush(res, 403);
		}

    } catch(e) {
        console.log(e);
		return responsePush(res, 500);
    }
})

function responsePush(res, code)
{
	res.header("sec-fetch-mode", "no-cors");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "POST, GET");
	res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, remember-me");

    res.sendStatus(code);
}

function responsePushData(res, data)
{
	res.header("sec-fetch-mode", "no-cors");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "POST, GET");
	res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, remember-me");

    res.send(data);
}

router.get('/nft_live/auth', async(req, res, next) => {
    try {
		// console.log('--------router/get auth start------');
		//console.log(req);
		// console.log(req.headers);
		// console.log(req.query);
		//console.log(req.body);
		// console.log('--------router/get auth end------');

		// nft-access-key, nft-access-secret
		let _key       = req.get('nft-access-key');
		let _secret    = req.get('nft-access-secret');
		let _room_name = req.query.name;
		if (_room_name == null || _room_name == undefined || _room_name == "") {
			_room_name = null;
		}

		//console.log('nft-access-key:' + req.query['nft-access-key']);

		//console.log(req.body.name);

		// null check..
		// key/secret checksum check..

		console.log('router/get>auth:' + _key + ', ' + _secret + ', ' + _room_name);

		if (_key == null || _key == undefined || _key == "" || _secret == null || _secret == undefined || _secret == "") {
			return responsePush(res, 500);
		} else {
			var verify_result = _get_uuid_verify('auth', _key, _secret);
			if (verify_result == true) { // ok
				return responsePush(res, 200);
			} else {
				return responsePush(res, 403); // forbidden
			}
		}

		return responsePush(res, 500);
    } catch(e) {
        // console.log(e);
		return responsePush(res, 500);
    }
})

router.get('/nft_live/chat_able_yn', async(req, res, next) => {
    try {
		console.log('--------router/get chat_yn start------');
		console.log(req.query);

		// nft-access-key, nft-access-secret
		let _key       = req.get('nft-access-key');
		let _secret    = req.get('nft-access-secret');

		// console.log('auth:' + _key + ', ' + _secret + ', ' + _room_name);

		if (_key == null || _key == undefined || _key == "" || _secret == null || _secret == undefined || _secret == "") {
			return responsePush(res, 500);
		} else {
			var verify_result = _get_uuid_verify('chat_able_yn', _key, _secret);

			if (verify_result == true) { // ok..
				let _chat_yn   = req.query['chat_yn'];
				let _room_name = req.query['room_name'];

				if (_chat_yn != null && (_chat_yn == 'Y' || _chat_yn == 'N') && _room_name != null) {
					var result  = await redisDb.get_chat_room_list2('status', _room_name);

					//console.log(result);

					if (result != null) {
						result.chat_yn = _chat_yn;
					}

					await redisDb.update_chat_room_list('status', _room_name, result);

					var event_json = { 
										chat : { 
											channelType: 'nft_live',
											msgType    : 'chat_yn',
											messageId  : new Date().getTime(),
											message    : _chat_yn
										},
										user : {
											nick_name: '',
											uuid     : '',
											writer_image_path: '',
								 		}
									 };
									 
					try { // alert push
		
						await webSocket.chat_room_status_alert('alert', 'N', _room_name, event_json);
					} catch(error) { 
						console.log(error);
					}

					return responsePush(res, 200);
				}
			} else {
				return responsePush(res, 403); // forbidden
			}
		}

		return responsePush(res, 500);
    } catch(e) {
        console.log(e);
		return responsePush(res, 500);
    }
})

router.get('/nft_live/alert', async(req, res, next) => {
    try {
		console.log('--------router/get alert start------');
		console.log(req.query);

		// nft-access-key, nft-access-secret
		let _key       = req.get('nft-access-key');
		let _secret    = req.get('nft-access-secret');

		// console.log('auth:' + _key + ', ' + _secret + ', ' + _room_name);

		if (_key == null || _key == undefined || _key == "" || _secret == null || _secret == undefined || _secret == "") {
			return responsePush(res, 500);
		} else {
			var verify_result = _get_uuid_verify('alert', _key, _secret);
			if (verify_result == true) {
				let _room_name  = req.query['room_name'];
				let _event_type = req.query['event_type'];
				let _event_msg  = req.query['event_msg'];

				if (_room_name != null && _event_type != null && _event_msg != null) {
				
					if (_event_type == 'product_buy') {
						_event_msg = '작품이 판매되었습니다.';
					}
					var _message = {
						chat : { 
								channelType: 'nft_live',
								msgType    : _event_type,
								messageId  : new Date().getTime(),
								message    : _event_msg
						},
						user : {
								   nick_name: '',
								   uuid     : _secret,
								   writer_image_path: '',
						}
					};


					try { // alert push
						await webSocket.chat_room_status_alert('alert', 'Y', _room_name, _message);
					} catch(error) { 
						console.log(error);
					}

					return responsePush(res, 200);
				}
			} else {
				return responsePush(res, 403);
			}
		}

		return responsePush(res, 500);
    } catch(e) {
        console.log(e);
		return responsePush(res, 500);
    }
})

router.get('/nft_live/chat_history', async(req, res, next) => {
    try {
		console.log('--------router/get chat_history start !!!!------');
		console.log(req.query);
		


		// nft-access-key, nft-access-secret
		let _key       = req.get('nft-access-key');
		let _secret    = req.get('nft-access-secret');

		// console.log('auth:' + _key + ', ' + _secret + ', ' + _room_name);
				

		//if (_key == null || _key == undefined || _key == "" || _secret == null || _secret == undefined || _secret == "") {	
		//	return responsePush(res, 500);
		//} else {
			var verify_result = _get_uuid_verify('chat_history', _key, _secret);
			
			if (verify_result == true) {
				
				let _room_name       = req.query['room_name'];
				let _message_id_from = req.query['message_id_from'];
				let _message_id_to   = req.query['message_id_to'];
				
				if (_room_name != null && _message_id_from != null && _message_id_to != null) {
					try { // alert push
						var result = await redisDb.chat_history_message_replay('alert', _room_name, _message_id_from, _message_id_to);
						var resultNew = {
							pk : req.query.room_name,
							data : result
						}
						console.log(resultNew);

						 return responsePushData(res, result);


					} catch(error) { 
						console.log(error);
					}
					
					return responsePush(res, 200);
				}
			} else {
				return responsePush(res, 403);
			}
		//}

		return responsePush(res, 500);
    } catch(e) {
        console.log(e);
		return responsePush(res, 500);
    }
})

function _get_uuid_verify(type, key, secret)
{

	console.log('type:' + type + ', key   :' + key + ', ' + secret);

	if (type == 'status') { // status �� key/secret skip..
		return true;
	}
	if (type == 'chat_history') { // status �� key/secret skip..
		return true;
	}

	// default test 
	if (key == 'graybridge' && secret == 'beeblock') {
		return true;
	}

	var new_key = key + 'beeblockx';

	var sha256_value = crypto.createHash('sha256').update(new_key).digest('hex');

	if (secret == sha256_value) {
		console.log('key ok:' + secret + ', ' + sha256_value);
		return true;
	}

	console.log('key xx:' + secret + ', ' + sha256_value);
	return false;
}


module.exports = router;
