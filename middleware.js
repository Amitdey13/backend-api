const AWS = require("aws-sdk");

AWS.config.update({
region: "ap-south-1",
endpoint: "dynamodb.ap-south-1.amazonaws.com",
});

let docClient = new AWS.DynamoDB.DocumentClient();

// login function

const login = (req,res) => {
  // params
  let table = "users";

  let params = {
    TableName: table,
    Key: {
      email_id: req.body.email_id
    },
  };
  console.log("Reading item.....");
  
  docClient.get(params, function (err, data) {
    if (err) {
      res.status(err.status).send(err.body)
    } else {
      res.status(data.status).send(data.body)
    }
  });

}

const signup = (req, res) => {

  let table = "users";

  let params = {
    TableName: table,
    Item: {
      email_id: req.body.email_id,
      password: req.body.password,
      username: req.body.username,
    },
  };

  console.log("Adding item.....");
  docClient.put(params, function (err, data) {
    if (err) {
      res.status(err.status).send(err.body);
    } else {
      res.status(data.status).send(data.body);
    }
  });
  
}


module.exports = {
  login,
  signup
}