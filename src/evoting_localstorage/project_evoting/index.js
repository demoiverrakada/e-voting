const express=require('express');
const cors=require('cors');
const helmet=require('helmet');
const rateLimit=require('express-rate-limit');
const bodyParser=require('body-parser')
const mongoose =require('mongoose')
const PORT=5000;

const app=express();

const corsOptions = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : 'http://localhost:3000'
};
app.use(cors(corsOptions));
app.use(helmet());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(generalLimiter);

const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many vote requests from this IP, please try again after 15 minutes'
});
app.use('/vote*', voteLimiter);

require('./models/User')
//routes will come below this
const requireToken=require('./middleware/requireToken')
const authRoutes=require('./routes/authRoutes')
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.use(authRoutes)


/*app.get('/',(req,res)=>
{
    res.send('hello')
})
*/

app.post('/',(req,res)=>
{
    console.log(req.body)
    res.send('hello')
})

app.listen(PORT, () => {
    console.log('Server is running on', PORT);
});
