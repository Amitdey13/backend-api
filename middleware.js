const AWS = require("aws-sdk");
const FileType = require("file-type")
const fs = require("fs");
const multiparty = require("multiparty")

// const cred = require("C:/Users/DD/OneDrive/Desktop/credentials.js");
const cred = require("/home/ubuntu/credentials.js");

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
  let table = "users";
  let password = req.body.password;

  let params = {
    TableName: table,
    Key: {
      email_id: req.body.email_id,
    },
  };
  console.log("Reading item.....");

  docClient.get(params, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      if (data.Item && data.Item.password === password) res.send(data);
      else if (data.Item) res.send({ message: "wrong password!" });
      else res.send({ message: "No account is available with this email!" });
    }
  });
};

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
      } else {
        let params = {
          TableName: table,
          Item: {
            email_id: req.body.email_id,
            password: req.body.password,
            username: req.body.username,
            profile:
              "https://gravater.s3.ap-south-1.amazonaws.com/public_gravatar.jpg",
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
const imageUpload = (path) => {
  const data = {
    key: path,
    body: "Image buffer",
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
    ACL: "public-read",
  };
  return new Promise((res, rej) => {
    s3Bucket.putObject(data, err=>{
      if (err) {
        rej(err)
      }
      else {
        res(s3Url + path);
      }
    })
  })
};

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
        TableName: users,
        Key: {
          email_id: request.body.email_id
        },
        UpdateExpression: "set profile = :r",
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

module.exports = {
  login,
  signup,
  editGravatar
};
