const express = require("express");
const cors = require("cors");
const {testConnection } = require('./config/db')



const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
});

app.get("/health", (req, res) => {
  res.json({
    status: ok,
    service: "Github Analyzer API",
    timestamp: new Date().toISOString(),
  });
});

const start = async () => {
    await testConnection()
    app.listen(PORT,()=>{
        console.log(`Running on PORT : ${PORT}`)
    })
};
