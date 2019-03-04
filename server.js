const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./data/dbConfig.js');
const Users = require('./users/users-model.js');



const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());
 
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

  Users.findBy({ username })
    .first()
    .then(user => {

    // check that passwords match:
    //add this below: 
      if (user  && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
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


function restricted(req,res, next) {
  const { username, password } = req.headers

  if ( username && password ) {
    Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        next()
      } else {
        res.status(401).json({ message: 'You shall not pass!' })
    }
  })
    .catch(error => {
      res.status(500).json(error)
    })
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