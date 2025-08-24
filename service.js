import express, { json } from "express";
import axios from "axios";
import admin from "firebase-admin";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const url = process.env.FIREBASE_DATABASE_URL ;
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.get("/", async(req, res) => {
    res.render("login.ejs");
});

app.get("/signUp", (req, res) => {
    res.render("signup.ejs");
});

app.get("/forgotPassword", (req, res) => {
  res.render("forgotPassword.ejs");
});

app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
      const response = await axios.get(`${url}/users.json`);
      const users = response.data;
  
      let loginSuccess = false;
      let IDuser = "";
  
      for (const userId in users) {
        const user = users[userId];
  
        if (user.email === email && user.password === password) {
          loginSuccess = true;
          IDuser = userId ;
          break;
        }
      }
  
      if (loginSuccess) {
        res.send(`<script>alert("Login Successful!"); window.location.href = "/${IDuser}";</script>`);
      } else {
        res.send(`<script>alert("Email or password is incorrect!"); window.location.href = "/";</script>`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("Internal Server Error");
    }
});

app.post("/signUp", async (req, res) => {
    const { name, email, password, rePassword } = req.body;
  
    // 🔒 Basic field validation
    if (!name || !email || !password || !rePassword) {
      return res.send("<script>alert('All fields are required!'); window.location.href='/signUp';</script>");
    }
  
    // 🔒 Password match check
    if (password !== rePassword) {
      return res.send("<script>alert('Passwords do not match!'); window.location.href='/signUp';</script>");
    }
  
    // 🔒 Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.send("<script>alert('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.'); window.location.href='/signUp';</script>");
    }
  
    try {
      const response = await axios.get(`${url}/users.json`);
      const users = response.data;
  
      // 🔍 Check if user already exists
      for (const userId in users) {
        const user = users[userId];
        if (user.email === email) {
          return res.send("<script>alert('Email already registered!'); window.location.href='/signUp';</script>");
        }
      }
  
      // ✅ If not exists, register user
      const data = {
        username: name,
        email: email,
        password: password
      };
  
      await axios.post(`${url}/users.json`, data);
  
      return res.send("<script>alert('Registration successful! Please login.'); window.location.href='/';</script>");
  
    } catch (error) {
      console.error("Error during sign up:", error);
      return res.status(500).send("Internal Server Error");
    }
});
  
app.get("/:IDuser", async (req, res) => {
  const id = req.params.IDuser;
  let User;

  try {
    //finding user
    const response = await axios.get(`${url}/users.json`);
    const users = response.data;

    for (const userId in users) {
      if (userId === id) {
        User = users[userId];
        break;
      }
    }

    if (!User) {
      return res.status(404).send("User not found");
    }

    // trusted contact
    const contacts = Object.entries(User)
      .filter(([key]) => key.toLowerCase().startsWith("contact"))
      .map(([, contact]) => contact);


    // Loading page
    res.render("index.ejs", {
      username: User.name || User.username,
      userId: id,
      contacts: contacts,
      user: User
    });
  } catch (err) {
    console.error("Error during user fetch:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/forgotPassword", async (req, res) => {

  const email = req.body.email;

  try {
    const response = await axios.get(`${url}/users.json`);
    const users = response.data;
    let userexist = false;
    let User;
    let id;

    for (const userId in users) {
      const user = users[userId];
      if (user.email === email) {
        userexist = true;
        User = user;
        id = userId;
        break;
      }
    }

    if (!userexist) {
      return res.send("<script>alert('Email Not Found'); window.location.href='/forgotPassword';</script>");
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    function generateRandomPassword(length = 12) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?";
      let password = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }
      return password;
    }

    const newPassword = generateRandomPassword();
    const subject = 'Password Reset Confirmation';
    const message = `Dear ${User.name || User.username},

    We have successfully reset your password as per your request.
    
    Your new login credentials are as follows:
    
    Username: ${User.name || User.username}
    
    New Password: ${newPassword}
    
    For your security, please log in immediately and change your password to something memorable yet secure. If you did not request this change, contact our support team right away.
    
    Best regards,
    Guardian Angel Support Team
    website Link: https://guardianangel.onrender.com
    [Customer Care Number]
`;

    const mailInfo = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: message,
    };

    // Send email and wait for completion
    await transporter.sendMail(mailInfo);

    // Update the password in database after email sent successfully
    await axios.patch(`${url}/users/${id}.json`, { password: newPassword });

    return res.send("<script>alert('Email Sent'); window.location.href='/forgotPassword';</script>");
  } catch (err) {
    console.error("Error during forgot password process:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/trusted-contacts/:IDuser", async(req, res) => {
  const id = req.params.IDuser;
  const data = {
    Name: req.body.name,
    Relation: req.body.relation,
    Pho: req.body.phone
  }
  try {
    const response = await axios.get(`${url}/users.json`);
    let User;
    const users =  response.data;
    for (const userId in users) {
      if (userId === id) {
        User = users[userId];
        break;
      }
    }

    const contactNo = `Contact${Object.keys(User).length - 2}`;

    await axios.patch(`${url}/users/${id}.json`, {
      [contactNo]: data,
    })

    res.send(`<script>alert("Contact Added Successfully");window.location.href = "/${id}";</script>`);  
  } catch(err){
    console.error("Error during forgot password process:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/update-personal-info/:IDuser",async(req,res)=>{
  try{const id = req.params.IDuser;

    const response = await axios.get(`${url}/users.json`);
    let User;
    const users =  response.data;
    for (const userId in users) {
      if (userId === id) {
        User = users[userId];
        break;
      }}


  await axios.patch(`${url}/users/${id}.json`,{
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  });

  res.send(`<script>alert("Information Updated");window.location.href = "/${id}";</script>`);  
  }catch(err){
    console.error("Error during forgot password process:", err);
    return res.status(500).send("Internal Server Error");
  }
})

app.get("/Delete/:IDuser",(req,res)=>{
  res.render("Delete.ejs",{
    userId : req.params.IDuser
  });
});

app.post("/Delete/:IDuser", async (req, res) => {
  const id = req.params.IDuser;

  try {
    // find user
    const response = await axios.get(`${url}/users.json`);
    const users = response.data;
    let User;

    for (const userId in users) {
      if (userId === id) {
        User = users[userId];
        break;
      }
    }

    if (!User) {
      return res.status(404).send("User not found");
    }

    // generate 6-digit OTP
    const key = Math.floor(100000 + Math.random() * 900000).toString();

    // store in DB
    await axios.patch(`${url}/users/${id}.json`, { Delete: key });

    // transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // mail content
    const subject = "Account Deletion Security Code";
    const message = `Dear ${User.name || User.username},

Your security code for account deletion is: ${key}

If you did not request account deletion, please ignore this email.`;

    const mailInfo = {
      from: process.env.EMAIL_USER,
      to: User.email,
      subject: subject,
      text: message,
    };

    // send email
    await transporter.sendMail(mailInfo);


    // ✅ render confirmation page AFTER sending mail
    res.render("DelConfirmation.ejs", { userId: id });

  } catch (err) {
    console.error("Error during user fetch:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/Delete/:IDuser/verify", async (req, res) => {
  const id = req.params.IDuser;
  const enteredOTP = [
    req.body.otp1,
    req.body.otp2,
    req.body.otp3,
    req.body.otp4,
    req.body.otp5,
    req.body.otp6
  ].join(""); // e.g. "123456"

  // fetch user from DB
  const response = await axios.get(`${url}/users/${id}.json`);
  const User = response.data;

  if (!User) return res.status(404).send("User not found");

  if (User.Delete === enteredOTP) {
    // OTP correct → delete user
    await axios.delete(`${url}/users/${id}.json`);
    res.send("<script> alert('Account deleted successfully!'); window.location.href='/'; </script>");
  } else {
    res.status(400).send("<script>alert('❌ Invalid OTP. Please try again.');</script>");
  }
});


app.listen(port, () => {
    console.log(`Server running on port: ${port}...`);
});