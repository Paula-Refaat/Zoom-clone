const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.DATABASE, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    })
    .then((conn) => {
      console.log(`Database Connected on host ${conn.connection.host}`);
    });
};
module.exports = dbConnection;
