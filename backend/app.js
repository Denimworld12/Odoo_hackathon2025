const express = require('express');
const cprs = require('cors');
require('dotenv').config();

const app = express();
app.use(cprs());

app.use(express.json());

app.listen(3000, ()=>{
    console.log('server is running on port 3000');  
})