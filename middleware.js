const AWS = require("aws-sdk");
const FileType = require("file-type")
const fs = require("fs");
const multiparty = require("multiparty")
const {v4:uuidv4} = require('uuid')

// const cred = require("C:/Users/DD/OneDrive/Desktop/credentials.js");
const cred = require("/home/ubuntu/credentials.js");

const table = "User"

AWS.config.update({
  region: "ap-south-1",
  accessKeyId: cred.secretId,
  secretAccessKey: cred.secretAccessKey,
});

let docClient = new AWS.DynamoDB.DocumentClient();

// bucket name
const bucketName = "gravater";
const s3Bucket = new AWS.S3()

// login function

const login = (req, res) => {
  // params
  let Password = req.body.password;

  let params = {
    TableName: table,
    FilterExpression: "#yr = :yyyy",
    ExpressionAttributeNames: {
      "#yr": "Email",
    },
    ExpressionAttributeValues: {
      ":yyyy": req.body.email_id,
    },
  }; 
  console.log("Reading item.....");

  docClient.scan(params, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      console.log(data.Items[0])
      if (data.Items[0] && data.Items[0].Password === Password) res.send(data);
      else if (data.Item) res.send({ message: "wrong password!" });
      else res.send({ message: "No account is available with this email!" });
    }
  });
};

// signup function

const signup = (req, res) => {

  let check = {
    TableName: table,
    FilterExpression: "#yr = :yyyy",
    ExpressionAttributeNames: {
      "#yr": "Email",
    },
    ExpressionAttributeValues: {
      ":yyyy": req.body.email_id,
    },
  };

  docClient.scan(check, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      if (data.Items[0]) {
        res.send({ message: "An account is already created with this email" });
      } else {
        let params = {
          TableName: table,
          Item: {
            UserId: req.body.userId,
            Email: req.body.email_id,
            Password: req.body.password,
            UserName: req.body.username,
            ProfileImageURL:
              "https://gravater.s3.ap-south-1.amazonaws.com/public_gravatar.jpg",
            FriendList: []
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
};

// image upload fuction

const uploadFile = (buffer, name, type) => {
  const params = {
    ACL: "public-read",
    Body: buffer,
    Bucket: bucketName,
    ContentType: type.mime,
    Key: `${name}.${type.ext}`,
  };
  return s3Bucket.upload(params).promise();
};

const editGravatar = (request, response) => {
  const form = new multiparty.Form();
  form.parse(request, async (error, fields, files) => {
    if (error) {
      return response.status(500).send(error);
    }
    try {
      const path = files.file[0].path;
      const buffer = fs.readFileSync(path);
      const type = await FileType.fromBuffer(buffer);
      const fileName = `${Date.now().toString()}`;
      const data = await uploadFile(buffer, fileName, type);
      console.log(data.Location)
      var params = {
        TableName: table,
        Key: {
          UserId: fields.UserId[0]
        },
        UpdateExpression: "set ProfileImageURL = :r",
        ExpressionAttributeValues: {
          ":r": data.Location
        },
        ReturnValues: "UPDATED_NEW",
      };

      console.log("Updating the item...");
      docClient.update(params, function (err, data) {
        if (err) {
          console.error(
            "Unable to update item. Error JSON:",
            JSON.stringify(err, null, 2)
          );
        } else {
          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
      });

      return response.status(200).send(data);
    } catch (err) {
      console.log(err);
    }
  });
};

const peoples = (req, res) => {
  let params = {
    TableName: table
  };
  docClient.scan(params, (err, data) => {
    if (err) {
      console.error(
        "Unable to scan the table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      // print all the movies
      console.log("Scan succeeded.");
      res.send(data.Items);
    }
  });

}

// Create DynamoDB service object
// var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

const friends = (req, res) => {
  console.log(req.body.friendList)
  var params = {
    RequestItems: {
      User: {
        Keys: req.body.friendList,
        ProjectionExpression: "UserId, UserName, Email, ProfileImageURL",
      },
    },
  };

  docClient.batchGet(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      let users = data.Responses.User;
      console.log(users);
      res.send(users)
    }
  });
}

const addfriend = (req,res) => {
  console.log(req.body.newFriendList);
  let params = {
    TableName: table,
    Key: {
      "UserId":req.body.userId
    },
    UpdateExpression: "set FriendList = :r",
    ExpressionAttributeValues:{
        ":r":req.body.newFriendList,
    },
    ReturnValues:"UPDATED_NEW"
  };
  docClient.update(params, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
}

module.exports = {
  login,
  signup,
  editGravatar,
  peoples,
  friends,
  addfriend
}
