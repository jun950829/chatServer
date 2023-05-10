// Setup basic express server
const express = require('express');
const app     = express();
const path    = require('path');
const cors    = require('cors');

// const bodyParser = require('body-parser');
const server    = require('http').createServer(app);
// const io     = require('socket.io')(server, {path: '/socket.io'});
const webSocket = require('./public/socket.js');
const port      = process.env.PORT || 5001;
// const nunjucks = require('nunjucks');
const engine    = require('ejs-locals');
const redisDb   = require('./redis.js');
const { instrument } = require("@socket.io/admin-ui");


const reqRouter   = require('./public/request.js');
const indexRouter = require('./routes/svr_router.js');
const { use } = require('./public/request.js');


//레디스 연결
redisDb.connectDB();

// app.use(cors())
//get post 위한 세팅 
app.use(express.json());
app.use(express.urlencoded({extended : true}));
// app.use(bodyParser.urlencoded({extended : true}))

// Routing
app.engine('html', require('ejs').renderFile );
app.set('view engine', 'html');
app.set('views', path.join(__dirname + '/views'));

app.use(express.static(path.join(__dirname, '/public')));

app.use('/',      indexRouter);
app.use('/video', reqRouter);

const corsOptions = {
	//'Access-Control-Allow-Origin': '*',
	//'Access-Control-Allow-Mehotd': 'GET,POST',
	//credentials: false
	origin: '*'
}

//app.use(cors(corsOptions));
//app.use(cors());


// app.post('/setNick',function(req,res){
//   // res.send('req: ' + req);
//   res.header("Access-Control-Allow-Origin", "*")
  
// })
// app.get('/getNick',function(req,res){
//   // res.send('req: ' + req);
//   res.header("Access-Control-Allow-Origin", "*")

//   res.status(200).send(g_nickName)
//   // g_nickName = req.body.nickName;
  
// })


server.listen(port, () => {
  console.log('Server listening at port %d', port);
});


//webSocket(server, app);
webSocket.init(server, app);
