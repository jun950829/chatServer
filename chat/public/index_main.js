$(function() {
	const FADE_TIME = 150; // ms
	const TYPING_TIMER_LENGTH = 400; // ms
	const COLORS = [
		'#ffb11a', '#91580f', '#f8a700', '#f78b00',
		'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
		'#3b88eb', '#3824aa', '#a700ff', '#d300e7',
	];

	// Initialize variables
	const $window = $(window);
	const $usernameInput = $('.usernameInput'); // Input for username
	const $messages = $('.messages')[0];           // Messages area
	const $inputMessage = $('.inputMessage');   // Input message input box
	//const $startPage = $('.start.page');        // The start page
	const $inputNickname = $('.inputNickname');

	// const $loginPage = $('.login.page');        // The login page
	const $chatPage = $('.chat.page');          // The chatroom page


	const $adminChat = $('.adminChat');

	let chatUrl = '';

	// Prompt for setting a username
	var is_join_status = false;
	var cookie_value = null;
	let pk = null;  // chat channel name
	let realpk = null; // real pk 
	let nftNickName = null;
	let uid = null;
	let setNickName = 'N';

	//관리자 챗 open 여부
	let adminChatOpen = false;
	let wusid = '';

	//관리자인지
	let isAdmin = 'N';
	let isChatYn = 'Y';

	//추방 당했는지
	let isKicked = 'N';

	function _getChatUrl() {
		return 'https://zzzzzhahatestserver.beeblock.co.kr:5001';
		// return 'http://localhost:5001';
	}


	var _selector = document.body;
	_selector.addEventListener('touchstart', function(event) {
		if (messageHandler) {
			messageHandler.postMessage('touched');
		}
	});

	//iphone zoom off
	document.documentElement.addEventListener('touchstart', function(event) {
		if(event.touches.length > 1) {
			event.preventDefault();
		}
	}, false);

	var lastTouchEnd = 0;
	document.documentElement.addEventListener('touchend', function(event) {
	var now = (new Date()).getTime();

		if(now - lastTouchedEnd <= 300) {
			event.preventDefault();
		}

    lastTouchEnd = now;
	}, false);

	//  console.log(document.cookie);

	cookie_value  = document.cookie.match('(^|;) ?' + 'livePk' + '=([^;]*)(;|$)');
	if (cookie_value != null) {
		pk = cookie_value[2];
	} else {
		pk = '.';
	}

	cookie_value  = document.cookie.match('(^|;) ?' + 'realPk' + '=([^;]*)(;|$)');
	if (cookie_value != null) {
		realpk = cookie_value[2];
	} else {
		realpk = '.';
	}


	cookie_value = document.cookie.match('(^|;) ?' + 'nftNickName' + '=([^;]*)(;|$)');
	//   if (cookie_value != null) {
		// 	 nftNickName = cookie_value[2];
	//   } else {
	nftNickName = 'guest';
	//   }

	cookie_value = document.cookie.match('(^|;) ?' + 'wusid' + '=([^;]*)(;|$)');
		if (cookie_value != null) {
			wusid = cookie_value[2];
		} 

	cookie_value = document.cookie.match('(^|;) ?' + 'uid' + '=([^;]*)(;|$)');
		if (cookie_value != null) {
			uid = cookie_value[2];
		} else {
			var date = new Date();
	//uid = 'guest_uid';
			uid = date.getMilliseconds().toString() + 'guestUid'+(Math.random()*1000).toFixed(0);
		}

	//init css
	$('.start').css('display', 'none');
	$adminChat.css('display','none');
	$('.deletePopup').css('display','none');
	$('.forceoutPopup').css('display', 'none');

	if(nftNickName == 'guest') {
		$('.inputMessage').css('display', 'none');
	} else {
		$('.inputNftname').css('display', 'none');
		setNickName = 'Y';
	}

	// s_join_status = true;

	// format Ȯ���ؾ� ��
	function client_chat_message(message) {
		var _message = {
			chat : { 
				channelType: 'nft_live',
				msgType    : 'chat',
				messageId  : 0,
				message    : message
			},
			user : {
				nick_name: nftNickName,
				uuid     : uid,
				writer_image_path: ''
			}
		};
	return _message;
	}

	function client_join_message(message) {
		var _message = {
			user : {
				nick_name: nftNickName,
				uuid     : uid ,
				writer_image_path: '',
			}
		};
	return _message;
	}

	

	function makeChatDiv(data) {

		if (data.user != null && data.user != undefined && data.chat != null && data.chat != undefined) {
			//
		} else {
			return;
		}

		if (data.chat.msgType == undefined || data.chat.msgType == 'chat' || data.chat.msgType == 'product_buy') {
			//
		} else {
			return;
		}

		if (data.user.uuid == "") {
			return;
		}

		if(data.user.nick_name == null || data.user.nick_name == ''){
			return;
		}
		
		const div = document.createElement('div');
		div.style.display = 'flex';
		div.style.justifyContent = 'space-between';
		div.style.lineHeight = 1.5;
		div.style.height = 'auto';
		div.style.fontWeight = 500;
		div.classList.add('other');

		const leftbox = document.createElement('div');
		leftbox.style.display = 'flex';
		leftbox.classList.add('leftbox');
		const user = document.createElement('div');
		user.classList.add('userlayer');
		user.classList.add(data.user.uuid);
		user.textContent = data.user.nick_name;
		user.onclick = forceoutUser;
		DLOG('user nick_name', data.user.nick_name);
		DLOG('user nick_name length', data.user.nick_name.length);
		user.style.width = '100px';
		if(wusid == data.user.uuid){
			user.style.color = '#F0AC15';
		} else {
			user.style.color = '#61DFE7';
		}
		user.style.overflow = 'hidden';
		user.style.textOverflow = 'ellipsis';
		user.style.whiteSpace = 'nowrap';
		leftbox.appendChild(user);

		const chat = document.createElement('div');
		chat.classList.add('chatlayer');
		chat.classList.add(data.chat.messageId);
		chat.textContent = data.chat.message;
		chat.onclick = deleteMessage;
		chat.style.width = '380px';
		chat.style.color = '#ffffff';
		chat.style.marginLeft = '5px';
		leftbox.appendChild(chat);

		div.appendChild(leftbox);
		// const time = document.createElement('div');
		// time.classList.add('timelayer');
		// time.style.width = '45px';
		// time.style.color ='white';
		// time.style.textAlign = 'right';
		// let date = new Date(data.chat.messageId);

		// time.textContent = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);

		// div.appendChild(time);


		$messages.appendChild(div);

	}


	const socket = io.connect(_getChatUrl() + '/chat', {
	path : '/socket.io',
 	   //path : pk,
	extraHeaders: {
		'x-clientid': 'abc'
	},
		query: { room_name : pk, pk : realpk  }
    });



	function DLOG(message)
	{

	}

	// for chat/history
	// user.application event
	socket.on('chat/history', function(data) {
		
	
		if (data.status.chat_yn === 'N') {
			$(".inputNickname").attr("placeholder", "현재는 채팅 금지 상태 입니다.");
			$(".inputNickname").attr("readonly",true); 
			$(".inputNickname").attr('id', 'inputNicknamePlace');
		} else if (data.status.chat_yn === 'Y') {
			$(".inputNickname").attr("placeholder", "채팅에 참여하려면 닉네임을 여기에 입력해주세요");
			$(".inputNickname").attr("readonly",false); 
			$(".inputNickname").attr('id', '');
		}

		var _data = data.history.reverse();
		if (_data == null || _data == undefined) {
			return;
		}


		for(let i = 0; i < _data.length; i++) {

			if (_data[i] != null && _data[i].chat != null && _data[i].chat.msgType == 'product_buy') {
				divEventUpdate('', '#6AD321', _data[i].chat.message, _data[i]);
			} else {
				makeChatDiv(_data[i]);
			}
		}


		$messages.scrollTop = $messages.scrollHeight;
	   // TODO ȭ��ǥ��

		chatUserUpdate(data);
	})

	socket.on('chat', function(data) {

	makeChatDiv(data);

	$messages.scrollTop = $messages.scrollHeight;

	})

	function divEventUpdate(_event_name, _color, _msg, data)
	{
	
	const div = document.createElement('div');
	div.style.textAlign = 'center';
	div.style.color = _color;
	div.style.fontWeight = 500;

	if (data.user != null && data.user.nick_name != null) {
		div.textContent = data.user.nick_name + _msg ;
	} else { // 방진입 안한사람이 창 닫는 경우 
		div.textContent = '...' +  _msg ;
		return;
	}
	$messages.appendChild(div);
	$messages.scrollTop = $messages.scrollHeight;

	}

	socket.on('exit', function(data) {
		is_join_status = false;   
	   // document.cookie = `chatUserNum_${pk} = ${data.status.conn_members}`;

       //DLOG('client> exit> ', data);

	   //divEventUpdate('exit/user', 'yellow', ' 님이 방을 나갔습니다. ', data);
	
	   //chatUserUpdate(data);

	})

   // alert
	socket.on('alert', function(data) {
		is_join_status = false;
	
	//    console.log('alert !!!!!!!!!!!!!!!!!!!')
	//    console.log('alert event_msg',  data.event_msg);
	//    console.log('alert event_type',  data.event_type);

		if(data.chat.msgType == 'chat_yn') {

			if (data.chat.message == 'N') {
				isChatYn = 'N';
				$(".inputNickname").attr("placeholder", "현재는 채팅 금지 상태 입니다.");
				$(".inputNickname").attr("readonly",true); 
				$(".inputNickname").attr('id', 'inputNicknamePlace');
			} else if (data.chat.message == 'Y') {
				isChatYn = 'Y';
				$(".inputNickname").attr("placeholder", "채팅에 참여하려면 닉네임을 여기에 입력해주세요");
				$(".inputNickname").attr("readonly",false); 
				$(".inputNickname").attr('id', '');
			}

		} else if(data.chat.msgType=="product_buy"){
			//divEventUpdate('', '#6AD321', '상품이 판매되었습니다.', data);
			divEventUpdate('', '#6AD321', data.chat.message, data);
		}
	})

	socket.on('chat/hidden', function(data) {
		var receiveMessageId = data.chat.messageId;
		$(`.${receiveMessageId}`)[0].style.color = 'orange';
		$(`.${receiveMessageId}`)[0].innerText = '관리자에 의해 가려진 메세지입니다.'
	})

	socket.on('exit/user', function(data) {

		divEventUpdate('exit/user', 'yellow', ' 님이 금지되었습니다. ', data); // 강퇴 
		
		// 나만 exit 상태로 쿠키 업데이트
		// exit 신호 보내기 
		if (isMyExitCheck(data) == true) {
			exitUserUpdate(data.user.nick_name);
			socket.emit('exit', data);
		}

	})

	function isMyExitCheck(data)
	{
		if (data != null && data.user != null && data.user.uuid != null ) {
			
			if (data.user.uuid == uid) {
				return true;
			}
		}

		return false;
	}


	socket.on('exit/ab', function(data) {
		divEventUpdate('exit/ab', 'red', ' 님이 퇴장하였습니다.', data);
		
		chatUserUpdate(data);
	})

   // socket event
	socket.on('connect', function() {
		DLOG('client> connect> ' + socket.id);
	})

	socket.on('disconnect', function(reason) {
		DLOG('client> disconnect> ' + reason);
		//socket.close();
	})

	socket.on('connect_error', function(error) {
		DLOG('client> connect_error> ' + error);
	})

	socket.on('join', function(data) {
	
		if (data.status.chat_yn === 'N') {
			$(".inputMessage").attr("placeholder", "현재는 채팅 금지 상태 입니다.");
			$(".inputMessage").attr("readonly",true); 
			$(".inputMessage").attr('id', 'inputNicknamePlace');
		} else if (data.status.chat_yn === 'Y') {
			$(".inputNickname").attr("placeholder", "채팅에 참여하려면 닉네임을 여기에 입력해주세요");
			$(".inputNickname").attr("readonly",false); 
			$(".inputNickname").attr('id', '');
		}


		divEventUpdate('join', '#6AD321', ' 님이 참여하였습니다.', data);

		// if($inputMessage.val() !== '') {
		// 	socket.emit('chat', client_chat_message( $inputMessage.val() ));
		// 	$inputMessage.val('');
		// }

		chatUserUpdate(data);	
	})


   // manager event
	socket.io.on('error', function(error) {
		DLOG('client> error> ' + error);
	})
	socket.io.on('reconnect', function(attemp) {
		DLOG('client> manager> reconnect> ' + attemp + ', join_status:' + is_join_status);

       // �� �����ϱ� (�����ϱ� �����̸�)
		if (is_join_status) {
			socket.emit('join', client_join_message('join'));
		}
	})

	socket.io.on('reconnect_attempt', function(attemp) {
		DLOG('client> manager> reconnect_attempt> ' + attemp);
	})

	socket.io.on('reconnect_error', function(error) {
		DLOG('client> manager> reconnect_error> ' + error);
	})

	socket.io.on('reconnect_failed', function() {
		DLOG('client> manager> reconnect_failed ');
	})

	socket.io.on('ping', function() {
		DLOG('client> manager> ping ');
	})


	try {

		//참여하기 누르면 pk 에 맞는 livechat router
		$('.chatStart button').click(()=>{

		// �� �����ϱ�
		socket.emit('join', client_join_message('join'));
		is_join_status = true;

		// connected = true;
		//socket.emit('testchat', 'aaa');

		//	$startPage.fadeOut()
		// $chatPage.fadeIn()

		});

	} catch(e) {

	}


  //if(nftNickName !== 'guest') {
  //		  socket.emit('join', client_join_message('join'));
  //	 	  is_join_status = true;
  // }

//   클릭했을 때

	$('.sendMessageIcon').on('click',(e)=>{
		if(adminChatOpen == true) return;

		if(exitUserCheck() == true) {
			alert('관리자에 의하여 추방당하였습니다. ');
			return ;
		}
		try {

			if(nftNickName !== 'guest' && is_join_status == false) {
					socket.emit('join', client_join_message('join'));
					is_join_status = true;
					return;
			}

			message = $inputMessage.val();
			var tmpNickname = $inputNickname.val().replaceAll(' ', '');

			if(tmpNickname.indexOf("'") !== -1) {
				alert(" ' 는 닉네임에 사용할 수 없습니다.");
				return;
			}

			if(tmpNickname.indexOf("\\") !== -1) {
				alert("\\ 는 닉네임에 사용할 수 없습니다.");
				return;
			}

			if(tmpNickname.length > 10) {
				alert('닉네임은 10자 이하로 가능합니다.');
				return;
			}


			if(tmpNickname == '' && setNickName == 'N') {
				alert('채팅하려면 닉네임을 먼저 입력하세요.');
				return;
			} else if(setNickName == 'N') {
				nftNickName = tmpNickname;
				socket.emit('join', client_join_message('join'));
				is_join_status = true;

				$inputNickname.val('');
				$('.inputNickname').css('display', 'none');
				$('.inputMessage').css('display', 'block');
				$('.inputMessage').focus();
				setNickName = 'Y';
			}



			if(message == '') {
				return;
			} else if( message.length > 100) {
				alert('채팅은 100자 이하로 가능합니다.');
				return;
			}

			if (is_join_status) {

				if(message.indexOf("'") !== -1) {
					alert(" ' 는 채팅에 사용할 수 없습니다.");
					return;
				}

				if(message.indexOf("\\") !== -1) {
					alert("\\ 는 채팅에 사용할 수 없습니다.");
					return;
				}


				socket.emit('chat', client_chat_message(message));
				$inputMessage.val('');
			} else {
				DLOG('not joined..');
			}

		} catch(e) {

		}
	})

	//   엔터키 눌렀을 때

	$window.keydown(event => {
	
		if(event.which === 13) {

			if(adminChatOpen == true) return;
		
			if(exitUserCheck() == true) {
				alert('관리자에 의하여 추방당하여 방입장이 불가합니다.');
			return ;
		}

		try {

			if(nftNickName !== 'guest' && is_join_status == false) {
					socket.emit('join', client_join_message('join'));
					is_join_status = true;
					return;
			}

			message = $inputMessage.val();
			var tmpNickname = $inputNickname.val().replaceAll(' ', '');

				if(tmpNickname.indexOf("'") !== -1) {
					alert(" ' 는 닉네임에 사용할 수 없습니다.");
					return;
				}

				if(tmpNickname.indexOf("\\") !== -1) {
					alert("\\ 는 닉네임에 사용할 수 없습니다.");
					return;
				}

				if(tmpNickname.indexOf("　") !== -1) {
					alert("공백은 닉네임에 사용할 수 없습니다.");
					return;
				}

				if(tmpNickname.length > 10) {
					alert('닉네임은 10자 이하로 가능합니다.');
					return;
				}


				if(tmpNickname == '' && setNickName == 'N') {
					alert('채팅하려면 닉네임을 먼저 입력하세요.');
					return;
				} else if(setNickName == 'N') {
					nftNickName = tmpNickname;
					socket.emit('join', client_join_message('join'));
					is_join_status = true;


					$inputNickname.val('');
					$('.inputNickname').css('display', 'none');
					$('.inputMessage').css('display', 'block');
					$('.inputMessage').focus();
					setNickName = 'Y';
				}



				if(message == '') {
					return;
				} else if( message.length > 100) {
					alert('채팅은 100자 이하로 가능합니다.');
					return;
				}

				if (is_join_status) {

					if(message.indexOf("'") !== -1) {
						alert(" ' 는 채팅에 사용할 수 없습니다.");
						return;
					}

					if(message.indexOf("\\") !== -1) {
						alert("\\ 는 채팅에 사용할 수 없습니다.");
						return;
					}


					socket.emit('chat', client_chat_message(message));
					$inputMessage.val('');
				} else {
					DLOG('not joined..');
				}

			} catch(e) {
				console.log('chat exception:' + e);
			}
		}
	});



	$( window ).unload(function() {
		socket.onclose = function () {

		}; // disable onclose handler first
		socket.close();

	});

	var isCtrl = false;
	var isQ = false;
	document.onkeyup= function(e) {
		if(e.which == 17) { isCtrl = false; }
	}

	document.onkeydown = function(e) {
		if(e.which == 17) isCtrl = true;
		if(e.which == 81) isQ = true

		if(e.which == 89 && isCtrl == true && isQ == true ) {
			$adminChat.css('display', 'block');
			adminChatOpen = true;
		}

		if(e.which == 13 && isCtrl ==  true) {
			// if($adminChat.val() == 'blockbee119') {
				let ps = $adminChat.val().split('/');
				$adminChat.val('');

				fetch(_getChatUrl() + '/nft_live/auth', {
					headers : {
						'nft-access-key' : ps[0],
						'nft-access-secret' : ps[1]
					}
				})
				.then((res) => {
					//console.log(res)
					if(res.status == 200) {
						alert('관리자 접속 확인 완료')
						isAdmin = 'Y';
						$adminChat.css('display', 'none');
						// $(".inputMessage").css('display', 'none');
						$(".inputNickname").attr("placeholder", "현재는 관리자 모드 입니다.");
						$(".inputNickname").attr('id', 'inputNicknamePlace');
						return ;
					}
				})
				.catch((err) => alert("잘못된 접근"))
			

		}
	}

	//admin functions

	var toKickuid = '';
	var tokickNickname = '';
	var tohiddenMessageId = '';

	var btn = document.createElement('div');
	var btn2 = document.createElement('div');
	var hiddenbtn;
	var hiddenbtn2;
	var kickbtn;
	var kickbtn2;
	var kickbtn3;
	// btn.style.width = '100px';
	// btn.style.height = '20px';
	// btn.style.fontSize = '15px';
	// btn.style.cursor = 'pointer';
	// btn.style.backgroundColor = 'grey';
	// btn.style.borderRadius = '2px';

	const $hiddenPopup = $('.deletePopup')[0];
	const $kickPopup = $('.forceoutPopup')[0];

	hiddenbtn = btn.cloneNode();
	hiddenbtn2 = btn2.cloneNode();
	hiddenbtn.textContent = '삭제';
	hiddenbtn2.textContent = '취소';
	hiddenbtn.onclick = hiddenConfirm;
	hiddenbtn2.onclick = hiddenConfirm2;
	$hiddenPopup.appendChild(hiddenbtn);
	$hiddenPopup.appendChild(hiddenbtn2);
	kickbtn = btn.cloneNode();
	kickbtn2 = btn2.cloneNode();
	kickbtn.textContent = '내보내기';
	kickbtn2.textContent = '취소';
	kickbtn.onclick = kickConfirmYes;
	kickbtn2.onclick = kickConfirmCancel;
	$kickPopup.appendChild(kickbtn);
	$kickPopup.appendChild(kickbtn2);
	

	function deleteMessage(e) {
		if(isAdmin == 'Y') {
			$('.deletePopup').css('display','block');

			tohiddenMessageId = e.target.className.split(' ')[1];
		}


	}

	function forceoutUser(e) {

		if(isAdmin == 'Y') {
			$('.deletePopup').css('display', 'none')
			$('.forceoutPopup').css('display','block');

			tokickNickname = e.target.innerText;
			toKickuid = e.target.className.split(' ')[1];
			
			$('.name').text(tokickNickname);

			// let div = document.createElement('div');
			// div.className = 'name'
			// div.innerHTML = tokickNickname
			
			// $('.forceoutPopup').prepend(div)
		}

	}

	function hiddenConfirm() {
		$('.forceoutPopup').css('display', 'none')
		$('.deletePopup').css('display','none');


		var _message = {
			chat : {
				channelType : 'nft_live',
				message : "",
				messageId : tohiddenMessageId,
			}
		}

		socket.emit('chat/hidden', _message);

	}

	function hiddenConfirm2() {
		$('.deletePopup').css('display','none');
		

	}

	function kickConfirmYes() {
		$('.forceoutPopup').css('display', 'none');

		// 추방 보낼 사용자의 uid를 올려줘야 한다.
		var data = {
			user : {
				nick_name : tokickNickname,
				uuid : toKickuid,
				writer_image_path : '',
			}
		}
		
		if (exitUserCheck()) {
			alert('이미 추방된 사용자 입니다.')
			return false
		}
		
		socket.emit('exit/user', data);
	}

	function exitUserUpdate()
	{
		document.cookie = `kickUserNickname_${pk} = ${uid}`;
	}

	function exitUserCheck()
	{
		if (getCookieValue(`kickUserNickname_${pk}`) != "") {
			return true;
		}

		return false;
	}


	function kickConfirmCancel() {
		$('.forceoutPopup').css('display', 'none');
	}

	const getCookieValue = (key) => {
		let cookieKey = key + "="; 
		let result = "";
		const cookieArr = document.cookie.split(";");
		
		for(let i = 0; i < cookieArr.length; i++) {
			if(cookieArr[i][0] === " ") {
				cookieArr[i] = cookieArr[i].substring(1);
			}
		
			if(cookieArr[i].indexOf(cookieKey) === 0) {
				result = cookieArr[i].slice(cookieKey.length, cookieArr[i].length);
				return result;
			}
		}
		return result;
	}

	function chatUserUpdate(data){
		if (data != null && data.status != null && data.status.conn_members != null) {
			document.cookie = `chatUserNum_${pk} = ${data.status.conn_members}`;		
		}
	}
});
