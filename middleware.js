const AWS = require("aws-sdk");

// const cred = require("C:/Users/DD/OneDrive/Desktop/credentials.js");
const cred = require("/home/ubuntu/credentials.js");

AWS.config.update({
region: "ap-south-1",
  endpoint: "dynamodb.ap-south-1.amazonaws.com",
  accessKeyId:cred.secretId,
secretAccessKey:cred.secretAccessKey
});

let docClient = new AWS.DynamoDB.DocumentClient();

// login function

const login = (req,res) => {
  // params
  let table = "users";
  let password = req.body.password;

  let params = {
    TableName: table,
    Key: {
      email_id: req.body.email_id
    },
  };
  console.log("Reading item.....");
  
  docClient.get(params, function (err, data) {
    if (err) {
      res.send(err)
    } else {
      if(data.Item && data.Item.password===password)
        res.send(data)
      else if (data.Item)
        res.send({ message: "wrong password!" })
      else
        res.send({ message: "No account is available with this email!" });
    }
  });

}

const signup = (req, res) => {

  let table = "users";

  let check = {
    TableName: table,
    Key: {
      email_id: req.body.email_id,
    },
  };

  docClient.get(check, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      if (data.Item) {
        res.send({ message: "An account is already created with this email" });
      }
      else {
        let params = {
          TableName: table,
          Item: {
            email_id: req.body.email_id,
            password: req.body.password,
            username: req.body.username,
          },
        };
        docClient.put(params, function (err, data) {
          if (err) {
            res.send(err);
          } else {
            res.send(data);
          }
        });
      }
    }
  });
  
}


module.exports = {
  login,
  signup
}