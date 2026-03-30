require('dotenv').config();
const db = require('./config/db');

const sql = `ALTER TABLE subjects 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN daily_goal DECIMAL(5,2)`;

db.query(sql, (err, res) => {
    if(err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error(err);
    } else {
        console.log("DB Altered Successfully or fields already exist");
    }
    process.exit();
});
