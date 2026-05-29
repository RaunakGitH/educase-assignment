const mysql = require("mysql2")
require("dotenv").config()

const pool = mysql.createPool({
    host:process.env.DB_HOST || "localhost",
    port:process.env.PORT || 3306,
    user:process.env.DB_USER || "root",
    password:process.env.DB_PASSWORD|| "",
    database:process.env.DB_NAME || "github_analyzer",
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
})

const testConnection = async () =>{
    try{
        const conn = await pool.getConnection()
        console.log("DB connected")
        conn.release()
    }catch(err){
        console.error("DB connection failed", err.message)
        process.exit(1)
    }
}
module.exports = {
    pool , testConnection
}