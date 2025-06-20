const express = require('express');
const router = express.Router();

const student_Database = {
    's001':{name:"Neerav",branch:"CSE",roll_no:"VU21CSEN0100480"},
    's002':{name:"Amrutha",branch:"CSE",roll_no:"VU21CSEN0101493"},
    's003':{name:"Deekshith",branch:"CSE",roll_no:"VU21CSEN0101731"}
};

router.get('/users',(req,res)=>{
    res.status(201).json(student_Database);
});
router.get('/users/:id',(req,res)=>{
    const {id} = req.params;
    const student = student_Database[id];
    if(student_Database[id]){
        res.status(200).json({message : `Details of the Student with id ${id} are`,student});
    }
});
router.post('/users/:id',(req,res)=>{
    const {id} = req.params;
    const student = student_Database[id];
    const {name,branch,roll_no} = req.body;
    if(!student_Database[id]){
        student_Database[id] = {name,branch,roll_no};
        return res.status(201).json({message:`Student with id ${id} is successfully added to the Student Database`,student:student_Database[id],allstudents:student_Database});
    }
    res.status(404).json({message:`Student with the id ${id} is not found in the student database.`});
});
router.put('/users/:id',(req,res)=>{
    const {id} = req.params;
    const student = student_Database[id];
    const {name,branch,roll_no} = req.body;
    if(student_Database[id]){
        student_Database[id] = {name,branch,roll_no};
        return res.status(201).json({message:`The name of the Student with id ${id} is successfully updated to the Student Database`,student:student_Database[id],allstudents:student_Database});
    }
    res.status(404).json({message:`Student with the id ${id} is not found in the student database.`});
});
router.delete('/users/:id',(req,res)=>{
    const {id} = req.params;
    const student = student_Database[id];
    if(student_Database[id]){
        delete student_Database[id];
        return res.status(201).json({message:`The name of the Student with id ${id} is successfully deleted from the Student Database`,student:student_Database[id],allstudents:student_Database});
    }
    res.status(404).json({message:`Student with the id ${id} is not found in the student database.`});
});
module.exports = router;