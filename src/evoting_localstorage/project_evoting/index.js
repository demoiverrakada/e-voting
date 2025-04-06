const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser')
const mongoose =require('mongoose')
const PORT=5000;

const app=express();

app.use(cors());

require('./models/User')
//routes will come below this
const requireToken=require('./middelware/requireToken')
const authRoutes=require('./routes/authRoutes')
app.use(bodyParser.json({ limit: '200mb' })); // Set a higher limit, e.g., 50MB
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
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
