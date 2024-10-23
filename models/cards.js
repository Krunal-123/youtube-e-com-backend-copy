const mongoose=require("mongoose")
const cardsSchema=new mongoose.Schema({},
    {strict:false}
)
const cards=mongoose.model("cards",cardsSchema)
module.exports=cards