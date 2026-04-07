const path = require('path')
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();
require('./db/mongooseConnect.js')
const UserEmail = require('./db/model/userEmail.js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')))

app.post('/notify-save', async (req, res) => {
    try{
        await new UserEmail(req.body).save()
        res.send({status: 'success'});

    }catch(e){
        res.status(500).send({error:"error has occured."})
    }
})


app.listen(process.env.PORT || 3000, () => {console.log("we're live.");});