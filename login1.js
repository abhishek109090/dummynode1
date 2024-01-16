const express = require('express')
const crypto = require('crypto');
const {v4: uuidv4} = require('uuid');
const app = express()
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const secretKey = 'your-secret-key';
const {S3Client, PutObjectCommand, BucketType} = require('@aws-sdk/client-s3')
const dotenv = require('dotenv');
dotenv.config();

// const Pool = require('pg').Pool
// const pool = new Pool({
//     host: 'localhost',
//     port: 5432,
//     database: 'login',
//     user: 'postgres',
//     password: 'Abhi@2001',
// })
const mysql = require('mysql');  

const connection = mysql.createConnection({
  host: '68.178.149.116', 
  port:'3306',
  user: 'truckbooking',  
  password: 'truckbooking',     
  database: 'truckbooking',    
  connectTimeout: 30000,         
             
});                                 
  
connection.connect((err,connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  } 

  console.log('Connected to MySQL as ID:', connection.threadId);

  // Release the connection when done

});  
connection.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNRESET') {
    console.error('Connection to database was reset.');
  } else { 
    console.error('Unexpected database error:', err.message);
  }
});
const bucketname = process.env.BUCKET_NAME;
const bucketRegion =  process.env.BUCKET_REGION;
const accessKey =  process.env.ACCESS_KEY;
const secretAccessKey =  process.env.SECRET_ACCESS_KEY;
console.log(bucketname,bucketRegion,accessKey)
const s3 = new S3Client({
  region: bucketRegion,
  credentials: ({
    accessKeyId: accessKey,  
    secretAccessKey: secretAccessKey,
  }),
});
app.use(bodyParser.json());
const JWT_SECRET = 'aassddffghhddffddffddffggttggy';
// Replace this with your actual secret key

// Function to issue a JWT token when the user logs in
 
function generateCRN() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    return `CRN${timestamp}${randomNum}`;
  }
  app.post('/users', (req, res) => {
    const { phonenumber, password } = req.body;
   
    try {
      const crnNumber = generateCRN();
  
      pool.query(
        'INSERT INTO main2 (phonenumber, password, crn_number) VALUES ($1, $2, $3)',
        [phonenumber, password, crnNumber]
      );
   
      res.status(201).json({ message: 'User added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }); 
  app.get('/validateToken', (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token is invalid' });
      }
  
      // Token is valid, you can proceed with the request
      const userCRN = decoded.crn;
      // You can fetch user data from the CRN and send it back if needed
      res.json({ userCRN });
    });
  });
  function generateAccessToken(user) {
    return jwt.sign(user, secretKey, { expiresIn: '24h' });
  }
  const authenticateUser = (request, response) => {
    const { phonenumber, password } = request.body;
  
    connection.query(
      'SELECT * FROM owner1 WHERE phonenumber = ? AND password = ?',
      [phonenumber, password],
      (error, results) => {
        if (error) {
          throw error;
        }  
       
        // Check if results is defined and has length property
        if (results && results.length > 0) {
          // Authentication successful, return user data
          const user = results[0];
          const token = jwt.sign({ user }, JWT_SECRET);
          response.status(200).json({ message: 'Authentication successful', user, token });
          console.log('Sent user data:', user);
        } else {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });   
        }
      }
    );
    };


    const updateonwer1 = (request, response) => {
      const { crn, loggedstatus, password } = request.body;
      console.log(crn, loggedstatus, password);
    
      connection.query(
        'UPDATE owner1 SET loggedstatus = ?, password = ? WHERE crn = ?',
        [loggedstatus, password, crn],
        (error, results) => {
          if (error) {
            throw error;
          }
          console.log(results);
    
          if (results.affectedRows > 0) {
            response.status(200).send(`Password updated successfully`);
          } else {
            response.status(500).send(`Failed to update password`);
          }
        }
      );
    };
    const updateAgent = (request, response) => {
      const { crn, loggedstatus, password } = request.body;
      console.log(crn, loggedstatus, password);
    
      connection.query(
        'UPDATE agent SET loggedstatus = ?, password = ? WHERE crn = ?',
        [loggedstatus, password, crn],
        (error, results) => {
          if (error) {
            throw error;
          }
          console.log(results);
    
          if (results.affectedRows > 0) {
            response.status(200).send(`Password updated successfully`);
          } else {
            response.status(500).send(`Failed to update password`);
          }
        }
      );
    };
    
    const createOwner1 = async (request, response) => {
      try {
        const crn = generateCRN();
        const {
          ownername,
          owneremail,
          userType,
          phonenumber,
          password,
          agentNumber,
          bankName,
          holderName,
          accNumber,
          bankIfsc,
          aadharNumber,
          pancardNumber,
          doorNo,
          street,
          landmark,
          village,
          pincode,
          mandal,
          district,
          state,
          feildcrn,
          
        } = request.body;
    
        const { uploadAadhar, uploadPan } = request.files;
        const filenames = {
          uploadAadhar: `aadhar_${uuidv4()}.jpg`, // Use UUID for unique filenames
          uploadPan: `pan_${uuidv4()}.jpg`,
        };
    
        // Upload files to AWS S3
        await Promise.all([
          uploadFileToS3(uploadAadhar[0], filenames.uploadAadhar),
          uploadFileToS3(uploadPan[0], filenames.uploadPan),
        ]);
        console.log(request.files)
    console.log('requst file buffer',request.files.buffer)
        // Insert data into the MySQL database
        const results = await insertOwnerDataIntoDB({
          ownername,
          owneremail,
          userType,
          phonenumber,
          password,
          agentNumber,
          bankName,
          holderName,
          accNumber,
          bankIfsc,
          aadharNumber,
          pancardNumber,
          street,
          doorNo,
          landmark,
          village,
          pincode,
          mandal,
          district,
          state,
          feildcrn,
    
          crn,
          filenames,
        });
    
        response.status(200).send(`Truck added with ID: ${results.insertId}`);
      } catch (error) {
        console.error(error);
        response.status(500).send("Internal Server Error");
      }
    };
    
    // Function to upload a file to AWS S3
    const uploadFileToS3 = async (file, filename) => {
      const params = {
        Bucket: bucketname,
        Key: filename,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
      };  
    console.log(params)
      try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
      } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;  
      }
    };
    const ownerId = generateRandomAgentId();

    // Function to insert owner data into the MySQL database
    const insertOwnerDataIntoDB = async ({
      ownername,
      owneremail,   
      userType,
      phonenumber,  
      password,
      agentNumber,
      bankName,
      holderName,
      accNumber,
      bankIfsc,
      aadharNumber,
      pancardNumber,
      street,
      doorNo,
      landmark,
      village,
      pincode,
      mandal,
      district,
      state,
      feildcrn,
    
      crn,
      filenames,
    }) => {
      return new Promise((resolve, reject) => {
        
        connection.query(
          `INSERT INTO owner1 
          (ownername, owneremail, userType, phonenumber, password, agentNumber, bankName, holderName, 
          accNumber, bankIfsc, aadharNumber, pancardNumber, uploadAadhar, uploadPan, street, doorNo, 
          landmark, village, pincode, mandal, district, state, feildcrn, ownerId, crn) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ownername,
            owneremail,
            userType,
            phonenumber,
            password,
            agentNumber,
            bankName,
            holderName,
            accNumber,
            bankIfsc,
            aadharNumber,
            pancardNumber,
            filenames.uploadAadhar,
            filenames.uploadPan,
            street,
            doorNo,
            landmark,
            village,
            pincode,
            mandal,
            district,
            state,
            feildcrn,
            ownerId,
            crn,
          ],
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      });
    };
    function generateRandomAgentId() {
      const min = 10000000; // Minimum 6-digit number
      const max = 99999999; // Maximum 6-digit number
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  const authenticateAgent = (request, response) => {
    const { phonenumber, password } = request.body;
  
    connection.query(
      'SELECT * FROM market WHERE phonenumber = ? AND password = ?',
      [phonenumber, password],
      (error, results) => {
        if (error) {
          throw error;
        }
     
        // Check if results is defined and has length property
        if (results && results.length > 0) {
          // Authentication successful, return user data
          const user = results[0];
          const token = jwt.sign({ user }, JWT_SECRET);
          response.status(200).json({ message: 'Authentication successful', user, token });
          console.log('Sent user data:', user);
        } else {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });   
        }
      }
    );
  };
  
const getUsers = (request, response) => {
  const {crn}=request.query;
  connection.query('SELECT * FROM owner1 where crn=?  ',[crn], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results)
    })
}
const getAgentUsers = (request, response) => {
  const { feildcrn } = request.query;
  console.log('Request query:', request.query);
  console.log('feildcrn:', feildcrn);

  // Check if feildcrn is provided
  if (!feildcrn) {
    response.status(400).json({ error: 'feildcrn is required' });
    return;
  }  

  connection.query('SELECT * FROM `owner1` WHERE feildcrn = ? ', [feildcrn], (error, results) => {
    if (error) {
      console.error('Error fetching owner data:', error);
      response.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log('Query result:', results);

   

    response.status(200).json(results);
    console.log('Fetched owner data:', results);
  });
};
  
// Additional code for setting up the server, database connection, etc.

// Additional code for setting up the server, database connection, etc.

const getUserById = (request, response) => {
    const id = parseInt(request.params.id)
    connection.query('SELECT * FROM main2 WHERE id = $1', [id], (error, results) => {
        if (error) { 
            throw error
        }  
        response.status(200).json(results.rows)
    })
} 
const createUser = (request, response) => {   
    const {
       
        phonenumber,
        password,
      
         
    } = request.body
    const crn = generateCRN(); 
    connection.query('INSERT INTO main2 (   phonenumber,password, crn ) VALUES ($1, $2,$3)', [  phonenumber,password,crn], (error, results) => {
        if (error) {  
            throw error
        }
        response.status(200).send(`User added with ID: ${results.insertId}`)
    })
}
const createAgent = (request, response) => {
  const { phonenumber, password, name } = request.body;
  const crn = generateCRN();
  
  connection.query( 'INSERT INTO market (phonenumber, password, name, crn) VALUES (?,?,?,?)', [phonenumber, password, name, crn], (error, results) => {
          if (error) {
              throw error;
          }
          response.status(200).send(`User added with ID: ${results.insertId}`);
      }
  );
};
 
const updateUser = (request, response) => { 
    const id = parseInt(request.params.id)
    const {
        
        username,
        password,crn,
    } = request.body
    connection.query(
        'UPDATE main2SET  username = $2, password = $3,crn=$4 WHERE id = $1',
        [id, username, password,crn],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`User modified with ID: ${results.id}`)
        }
    )
}
const deleteUser = (request, response) => {
    const id = parseInt(request.params.id)
    connection.query('DELETE FROM main2 WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`User deleted with ID: ${results.id}`)
    })
}
module.exports = {
    getUsers,
    authenticateUser, 
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    authenticateAgent,
    createAgent,
    createOwner1,
    getAgentUsers,
    updateonwer1,
    updateAgent
}