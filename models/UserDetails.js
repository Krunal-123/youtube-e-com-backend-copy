const mongoose=require("mongoose")
const userdetailsSchema= new mongoose.Schema({},{strict:false})
const UserDetails= mongoose.model("UserDetails",userdetailsSchema)
module.exports=UserDetails
 