const path = require('path')
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();
require('./db/mongooseConnect.js')
const UserEmail = require('./db/model/userEmail.js');
const cors = require('cors');
const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 5mins
    max: 3, // request in 5 mins for an ip
    message: "You're attempting too many request, chill a bit"
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

app.use(cors({
    origin: '*'
}));

app.use(limiter);

app.post('/notify-save', async (req, res) => {
    try{

        const incomingEmail = [];

        if(incomingEmail.includes(req.body.EmailAddress))
            return res.send({status: 'success'});

        await new UserEmail(req.body).save()

        incomingEmail.push(req.body.EmailAddress);

        res.send({status: 'success'});

    }catch(e){
        res.status(400).send({error:"Email captured already."})
    }
})


app.listen(process.env.PORT || 3000, () => {console.log("we're live.");});
