const express = require('express'); // importing express to perform routing and middleware
const router = express.Router(); // creating a tiny app which handles (idk what)
const dummyUsers = {
    "101":{name : "Alice", role : "Developer"},
    "102":{name : "Deeks", role : "Manager"},
    "103":{name : "Mahesh", role:"Designer"}
} ;
router.get('/users',(req,res)=>{
    res.json(dummyUsers);
})// i guess we are sending this data to somewhere 
router.get('/users/:id',(req,res)=>{
    const {id} = req.params;//extracts id from the url lets say ..../users/101 it extracts the 101
    const user = dummyUsers[id];//user is the detail of the specific id mentioned

    if(user){
        res.json({id,...user});// if the user exists then give the information in json format 
    }else{
        res.status(404).json({message:"User not found"});//if the user is not present in the dummyUsers database then give an error saying user not found 
    }
})
router.post('/users',(req,res)=>{
    const {id,name,role} = req.body;
    if(dummyUsers[id]){
       return res.status(400).json({message:`User Data already exists with id ${id}`});
    }
    dummyUsers[id] = {name,role};
    res.status(201).json({message:"User Data added successfully",user:{id,name,role}});
});
router.put('/users/:id',(req,res)=>{
    const{id} = req.params;
    const {name,role} = req.body;
    const user = dummyUsers[id];

    if(!dummyUsers[id]){
        return res.status(404).json({message:`User with id ${id} not found in the database.`});
    }
    dummyUsers[id] = {name,role};
    res.status(201).json({message:"User details are updated successfully",user:{id,name,role}});
});
router.delete('/users/:id',(req,res)=>{
    const{id} = req.params;
    const user = dummyUsers[id];
    if(!dummyUsers[id]){
        return res.status(404).json({message:`User with id ${id} not found in the database.`});
    }
    delete dummyUsers[id];
    res.status(200).json({message : `User with id ${id} has been deleted.`});
});
module.exports = router;//used to export the router so that the files like index.js can use it 