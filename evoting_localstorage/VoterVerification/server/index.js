const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser')
const mongoose =require('mongoose')
const PORT=7000;

const app=express();

app.use(cors());

require('./models/User')
//routes will come below this
const authRoutes=require('./routes/authRoutes')
app.use(bodyParser.json())
app.use(authRoutes)


/*app.get('/',(req,res)=>
{
    res.send('hello')
})
*/
app.use(bodyParser.json())

app.post('/',(req,res)=>
{
    console.log(req.body)
    res.send('hello')
})

app.listen(PORT, () => {
    console.log('Server is running on', PORT);
});
