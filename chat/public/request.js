// const { response } = require('express');
const express = require('express');
var reqRouter = express.Router();
const request = require('request')
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const socket = require('./socket.js');
const redisDb = require('../redis.js');



reqRouter.post('/get', upload.single('videoSrc'), function(req, res ,next) {
	console.log('----------get/videoSrc-------');
    //console.log(req);
	// test
    //return res.send({'isLiving' : 'connect'});

    // console.log(req);
    // console.log('서버 호출', req.body.videoSrc);

    res.header("Access-Control-Allow-Origin", "*");
    
    request({url : req.body.videoSrc, method: "GET"}, function(err, response, body) {
        if(err) {
            console.log('request.err:' + err)
        }
        //console.log('response');
		//console.log(response);
        if(res.statusCode === 200) {
			try {
                if(response.body.indexOf('#EXT') !== -1)
                    res.send({'isLiving' : 'connect'});
                else {
                    res.send({'isLiving' : 'disconnect'})
                }
			} catch (e) {
               console.log('response.error');
               //console.log(response);
               res.send({'isLiving' : 'disconnect'})
			}
        }

        else {
            res.send({'isLiving' : 'error'})
        }
    })

    // hls.loadSource(req.body.videoSrc);

    // hls.on(Hls.Events.ERROR, function(event, data) {
        // if(data.response.code === 404) {
            // console.log('실패')
        // }
    // })
})

reqRouter.post('/pk', upload.single('pk'), async function(req, res, next) {

        var pk = req.body.pk;


        // //월요일에 db붙혀보자
        // if(redisDb.getPK(pk) !== 'open') {
        //     // console.log(redisDb.getPK(pk) + '같은지 확인');
        //     // console.log('pk로 채널 만듬', pk)
        //     // redisDb.setPk(pk);
        //     // socket.makeChannel(pk);    



        // } else {
        //     console.log('pk 중복으로 안만듬', pk)
        //     // _lastPK = req.body.pk;
        // }

        res.header("Access-Control-Allow-Origin", "*");
        res.send({'pk': pk});

})



reqRouter.get('/getClient', async function(req, res, next) {

    var result = await socket.checkChannel
    console.log('getClient : ' , result);

    res.send({'connection': result});


})



module.exports = reqRouter;
