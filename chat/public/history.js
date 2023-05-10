$(function() {

    const $window = $(window);
    const $messages = $('.messages')[0];           // Messages area
    const $chatPage = $('.chat.page');          // The chatroom page  
    
    //방송 시작 시간 + timeline 선택시간 (메세지 호출 처음 시간)
    let fromtime = 0;
    // 메세지 호출 마지막 시간
    let lasttime = 0;
    //방송 종료 시간
    let endtime = 0;
    let isPlay = true;
    let messages = null;

    let interval = 1000;

    let makeMessageIntv = null;

    function _getChatUrl() {
        return 'https://zzzzzhahatestserver.beeblock.co.kr:5001';
       // return 'http://localhost:5001';
    }

    //비디오 클릭 시 보내주는 데이터 받기
    window.addEventListener('message', async function(event) {

        //비디오 시작, 정지에 
        if(event.data.data.eventType === 'isPlay') {

            isPlay = event.data.data.isPlay;
            //방송 시작 시간 세팅
            fromtime = event.data.data.startTime;
            endtime = event.data.data.endTime;

            if(isPlay == false) {
                clearTimeout(makeMessageIntv);
                return;
            }

            setBeforeChats(fromtime, event.data.data.pk);

            setChatsInt(fromtime, endtime, event.data.data.pk);
        } 

        //비디오 타임 라인 선택 시
        else {
            clearTimeout(makeMessageIntv);
        
            fromtime = event.data.data.fromtime;
            endtime = event.data.data.endtime;

            //1. 현재 시점 까지 채팅 불러오기
            setBeforeChats(fromtime, event.data.data.pk);

            // //재생중인지 체크
            // if(isPlay == true) {
                
            //     //채팅 interval 마다 쌓는 로직
            //     setChatsInt(fromtime, endtime, event.data.data.pk);
            // }
        }
    });



    //메세지 올려주는 interval 만들기
    function setMakeMessage() {

            lasttime = fromtime;
            fromtime += interval;
            if(fromtime >= endtime) {
                return;
            }

            if(messages !== null) {
                messages['history'].forEach((element) => {
                    if(element.chat.messageId > lasttime && element.chat.messageId < fromtime) {
                    // if(element.chat.messageId > lasttime) {
                        makeChatDiv(element);
                    }
                })
            }

            console.log('선택시간 - 종료시간 모든 채팅데이터 불러와서 필터링 해서 1초마다 올리는중 ~ ', new Date(fromtime));
            makeMessageIntv = setTimeout(() => {
                setMakeMessage();
            }, interval);
    }

    // 현재 시점 이전 chat 가져와서 세팅
    async function setBeforeChats(fromtime, pk) {
        let params = {
            'message_id_from' : 0,
            'message_id_to' : fromtime,
            'room_name' : pk,
        };

        let query = Object.keys(params).map(k =>encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
        let url = _getChatUrl() + '/nft_live/chat_history?' + query;


        let messages = await fetch(url, {
            headers: {
                'nft-access-key' : 'graybridge',
                'nft-access-secret' : 'beeblock'
            },
        })
        .then((res) => res.json())
        .then((data) => {
            return data;
        })
        .catch((e) => {
            console.log(e);
        });    
        //기존 채팅 모두 제거
        clearChatDiv();
        messages['history'].forEach((element) => {
            if(element.chat.messageId > 0 && element.chat.messageId < fromtime) {
            // if(element.chat.messageId > lasttime) {
                makeChatDiv(element);
            }
        })
    }

    //채팅 쌓기
    async function setChatsInt(fromtime, endtime, pk) {
        let params = {
            'message_id_from' : fromtime,
            'message_id_to' : endtime,
            'room_name' : pk,
        };

        let query = Object.keys(params).map(k =>encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
        let url = _getChatUrl() + '/nft_live/chat_history?' + query;


        messages = await fetch(url, {
            headers: {
                'nft-access-key' : 'graybridge',
                'nft-access-secret' : 'beeblock'
            },
        })
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            return data;
        })
        .catch((e) => {
            console.log(e);
        });
        
        makeMessageIntv = setTimeout(() => {
            setMakeMessage();
        }, interval);
    }


    //채팅 div쌓기
    function makeChatDiv(data) {
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
		user.textContent = data.user.nick_name;
		user.style.width = '100px';
        user.style.color = '#61DFE7';
		// if(wusid == data.user.uuid){
		// 	user.style.color = '#F0AC15';
		// } else {
		// 	user.style.color = '#61DFE7';
		// }
		user.style.overflow = 'hidden';
		user.style.textOverflow = 'ellipsis';
		user.style.whiteSpace = 'nowrap';
		leftbox.appendChild(user);

		const chat = document.createElement('div');
		chat.classList.add('chatlayer');
		chat.classList.add(data.chat.messageId);
		chat.textContent = data.chat.message;
		chat.style.width = '310px';
		chat.style.color = '#ffffff';
		chat.style.marginLeft = '5px';
		leftbox.appendChild(chat);

        const time = document.createElement('div');
		time.classList.add('timelayer');
		time.style.width = '75px';
		time.style.color ='white';
		time.style.textAlign = 'right';
		let date = new Date(data.chat.messageId);

		time.textContent = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);


		div.appendChild(leftbox);
		div.appendChild(time);


		$messages.appendChild(div);

		$messages.scrollTop = $messages.scrollHeight;
    }

    function clearChatDiv() {
        let element = $messages;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
})


