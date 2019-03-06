const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session') //Step 1 added for sessions


const db = require('./data/dbConfig.js');
const Users = require('./users/users-model.js');



const server = express();


//Step 3 added for sessions 
const sessionConfig = {
  name: 'jingle bells',
  secret: 'keep it secret, keep it safe!',
  cookie: {
    maxAge: 1000 * 60 * 15, //in ms
    secure: false, //used over https only 
  },
 httpOnly: true, //can the user access the cookie from using document.cookie
 resave: false, // 
 saveUninitialized: false, // GDPR - law abiding setting cookies automatically 
}






server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig)); // Step 2 added for sessions
 
server.get('/', (req, res) => {
  res.send("It's alive!");
});


//| POST   | /api/register 
//| Creates a `user` using the information sent inside the `body` of the request. 
//**Hash the password** before saving the user to the database. 

server.post('/api/register', (req, res) => {
  let user = req.body;

  const hash = bcrypt.hashSync(user.password, 16) // added this 
  user.password = hash // added this 

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});


// | POST   | /api/login    
// | Use the credentials sent inside the `body` to authenticate the user.
// On successful login, create a new session for the user and send back a 'Logged in' message and a cookie that contains the user id.
// If login fails, respond with the correct status code and the message: 'You shall not pass!' |

server.post('/api/login', (req, res) => {
  let { username, password } = req.body;


  // check that passwords match: here we also save data about the user and the session:
    //add this below: 

  Users.findBy({ username })
    .first()
    .then(user => {

    // check that passwords match:
    //add this below: 
      if (user  && bcrypt.compareSync(password, user.password)) {
        req.session.username = user.username // saves username in the session for maxAge attribute
        res.status(200).json({ message: `Welcome ${user.username}!, here's your cookie!` });
      } else {
        res.status(401).json({ message: 'You Shall Not Pass!' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});




// | GET/POST    | /api/users   
// | If the user is logged in, respond with an array of all the users contained in the database. 
//If the user is not logged in respond with the correct status code and the message: 'You shall not pass!'.   

//without sessions code follows below:
// function restricted(req,res, next) {
//   const { username, password } = req.headers

//   if ( username && password ) {
//     Users.findBy({ username })
//     .first()
//     .then(user => {
//       if (user && bcrypt.compareSync(password, user.password)) {
//         next()
//       } else {
//         res.status(401).json({ message: 'You shall not pass!' })
//     }
//   })
//     .catch(error => {
//       res.status(500).json(error)
//     })
//   }
// }


//with sessions code simplifies to the following: 
function restricted(req,res, next) {
  

  if ( req.session && req.session.username ) {
    next()
  } else {
    res.status(401).json({ message: 'You shall not pass!' })
  }
}
  
  


server.post('/api/users', restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});






module.exports = server; 