const mongoose = require('mongoose')
const express = require('express')
const app = express()
const user = require('./models/user')
const cards = require("./models/cards")
const UserDetails = require("./models/UserDetails")
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const Razorpay = require("razorpay");
const sendOtpEmail = require('./mailer');
const signupMail = require('./SignupMail')

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ["POST", "GET", "DELETE", "PATCH"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())
// middlewares
app.use(express.json({ extended: false }));


async function main() {
    await mongoose.connect(process.env.DB).then((data) => {
        console.log("connected port 3000");
    }).catch(() => console.log("Connection Port 3000 Failed TRY Again")
    )
}
main()

// Create a MongoClient with a MongoClientOptions object to set the Stable API version


// Server-side (Node.js) code to create Razorpay order
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

app.post("/create-order", async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: amount * 100, // amount in smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// LOGIN
app.post('/login', async (req, res) => {
    try {
        let { email, password, remember } = req.body
        let User = await user.findOne({ email })
        if (User == null) {
            return res.send('Invalid credentials') //If email invalid
        }
        bcrypt.compare(password, User.password).then((result, err) => {
            if (result) {
                if (remember == "remember") {
                    let token = jwt.sign(email, process.env.JWT_SECRET)
                    return res.cookie('token', token, {
                        maxAge: 28 * 24 * 60 * 60 * 1000,
                        sameSite: 'None', // For cross-origin cookies, SameSite must be 'None'
                    }).send('ok')
                }
                else {
                    let token = jwt.sign(email, process.env.JWT_SECRET)
                    return res.cookie('token', token).send('ok')
                }
            }
            else {
                return res.send('Invalid credentials')
            }
        })
    } catch (error) {
        console.log(error);
    }
})
// SIGN UP
app.post('/signup', async (req, res) => {
    try {
        let { firstName, lastName, number, email, gender, password } = await req.body
        let pic = gender == "Male" ? "https://yt3.ggpht.com/a/AATXAJzFE_5zKBk19JRw6RbSvLseEhNrI0W5qfPjoQ=s900-c-k-c0xffffffff-no-rj-mo" : "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
        let check = await user.find({ email })
        if (check.length > 0) {
            res.send("user_already_exist")
        } else {
            let saltRound = 10
            bcrypt.genSalt(saltRound, (err, salt) => {
                bcrypt.hash(password, salt, async (err, hash) => {
                    let data = await user({ profilePic: pic, firstName, lastName, email, gender, number, password: hash }).save()
                    if (data) {
                        // email to user for the signup
                        signupMail(email, firstName, lastName)
                        res.send('signup_done')
                    }
                })
            })
        }
    } catch (error) {
        console.log(error);
    }
})

    .post("/services", async (req, res) => {
        try {
            let categorise = req.body
            if (categorise == undefined || categorise.categorise == "all") {
                categorise = {}
            }
            let data = await cards.find(categorise)
            res.send(data)
        } catch (error) {
            console.log(error);
        }
    })

    // search in header
    .post("/search", async (req, res) => {
        try {
            let { value } = req.body
            // check condition string has number or not
            if (value.match(/\d+/g)) {
                let [num] = value.match(/\d+/g).map(Number)
                let data = await cards.find({ price: { $lt: num * 2 } })
                res.send(data)
            }
            else {
                let data = await cards.find({ $or: [{ categorise: { $regex: value, $options: "i" } }, { title: { $regex: value, $options: "i" } }] })
                res.send(data)
            }
        } catch (error) {
            console.log(error);
        }
    })

    .post("/addcart", async (req, res) => {
        try {
            let { id, cookies } = req.body
            let decode = jwt.verify(cookies.token, process.env.JWT_SECRET)
            let check = await user.find({ email: decode })
            await user.updateOne({ email: decode }, { $push: { addcart: id } })
            res.send(check)
        } catch (error) {
            console.log(error);
        }
    })

    .post("/addcart/user", async (req, res) => {
        try {
            let { cookies } = req.body
            let decode = jwt.verify(cookies.token, process.env.JWT_SECRET)
            let User = await user.find({ email:"krunaliparmar246@gmail.com" }).populate("addcart").populate("myitems").populate("myfavourites").populate('orderhistory.id')
            res.send(User)
        } catch (error) {
            console.log(error);
        }
    })
    .post("/addcart/purchase", async (req, res) => {
        try {
            let { data, id, amount } = req.body
            await user.updateMany({ _id: id }, { $push: { myitems: data } })
            await user.findByIdAndUpdate({ _id: id }, { $set: { addcart: [] } })
            await user.findByIdAndUpdate({ _id: id }, { $set: { newItems: [] } })
            await user.findByIdAndUpdate({ _id: id }, { $push: { newItems: data } }, { expireAfterSeconds: 60 })
            await user.findByIdAndUpdate({ _id: id }, { $push: { orderhistory: { amount, id: data } } })
            res.send('ok')
        } catch (error) {
            console.log(error);
        }
    })
    // delete addcarts
    // +++++
    .post("/addcart/delete/:id", async (req, res) => {
        try {
            let { id } = req.params
            let { cookies } = req.body
            let decode = jwt.verify(cookies.token, process.env.JWT_SECRET)
            let data = await user.updateOne({ email: decode }, { $pull: { addcart: id } })
            res.send(data)
        } catch (error) {
            console.log(error);
        }
    })




app.post('/send-otp', (req, res) => {
    const { email } = req.body;
    user.find({ email }).then((data) => {
        if (data.length <= 0) {
            res.send('User not found');
        }
        else {
            // Generate OTP and expiration
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            sendOtpEmail(email, otp);
            res.send(otp);
        }
    })
});

// Route to reset password
app.patch('/reset-password', async (req, res) => {
    const { email, password } = req.body;
    try {
        let saltRound = 10
        bcrypt.genSalt(saltRound, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                user.updateOne({ email }, { password: hash }).then((response) => {
                    if (response.length <= 0) {
                        res.send('password_not_reset')
                    }
                    else {
                        res.send('password_reset');
                    }
                })
            })
        })
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(400).send('Invalid OTP or expired token');
    }
});

// update details
app.patch("/updatedetails", async (req, res) => {
    let { profilePic, firstName, lastName, email, gender, number } = req.body
    user.updateOne({ email }, { profilePic, firstName, lastName, gender, number }).then((r) => {
        res.send('updated')
    })
})

    // add in favourite section
    .post("/addfavourite", async (req, res) => {
        const { email, id } = req.body;
        try {
            user.updateOne({ email }, { $push: { myfavourites: id } }).then((r) => {
                if (r <= 0) {
                    res.send("not_save")
                }
                else {
                    res.send('save')
                }
            })
        } catch (error) {
            console.log(error);
        }
    })
// delete myfavourites
app.post("/addfavourite/delete", async (req, res) => {
    const { email, id } = req.body;
    try {
        user.updateOne({ email }, { $pull: { myfavourites: id } }).then((r) => {
            res.send('done')
        })
    } catch (error) {
        console.log(error);
    }
})

    .post("/review", async (req, res) => {
        let { reviewData } = req.body
        let { id, profilePic, name, review, rating } = reviewData
        if (rating == null) {
            rating = 0
        }
        cards.findByIdAndUpdate({ _id: id }, { $push: { reviews: { _id: new mongoose.Types.ObjectId(), profilePic, name, review, rating, createdAt: Date() } } }, { new: true })
            .then((r) => {
                console.log(r);
                res.send("ok")
            })
    })

    // user details for contact them
    .post("/usersdetails", async (req, res) => {
        let { Name, Phone, Email, Subject, Message } = req.body;
        await UserDetails({ Name, Phone, Email, Subject, Message }).save();
        res.send('done');
    })

// dark or light mode update here
// .post('/light',async(req,res)=>{
//     let {email,mode} =req.body
//     console.log(email);
//     await user.updateOne({email},{lightMode:mode}).then((p)=>{
//         console.log(p);
//         console.log(mode);
//         res.send('done')
//     })
// })

//   App listing
app.listen(3000, () => {
    console.log('listning');
})
