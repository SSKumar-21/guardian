import express from "express";
import axios from "axios";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Setup for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://her-6d883-default-rtdb.firebaseio.com",
});

const db = admin.database();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/signUp", (req, res) => {
  res.render("signup.ejs");
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const snapshot = await db.ref("users").once("value");
    let userFound = false;
    let username = "";

    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.email === email && user.password === password) {
        userFound = true;
        username = user.name || user.username;
      }
    });

    if (userFound) {
      res.redirect(`/${username}`);
    } else {
      res.send(
        `<script>alert("Email or password is incorrect!"); window.location.href = "/";</script>`
      );
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/:username", (req, res) => {
  res.render("index.ejs", { username: req.params.username });
});

app.post('/signUp', async (req, res) => {
    const { name, email, password, rePassword } = req.body;
  
    // Basic validation
    if (!name || !email || !password || !rePassword) {
      return res.send("<script>alert('All fields are required!'); window.location.href='/signUp';</script>");
    }
  
    if (password !== rePassword) {
      return res.send("<script>alert('Passwords do not match!'); window.location.href='/signUp';</script>");
    }
  
    // Password complexity check (example)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.send("<script>alert('Password must be at least 8 characters, include uppercase, lowercase, number, and special char.'); window.location.href='/signUp';</script>");
    }
  
    try {
      const ref = db.ref("users");
      const snapshot = await ref.once("value");
      const users = snapshot.val() || {};
  
      // Check if user with same email exists
      const userExists = Object.values(users).some(user => user.email === email);
      if (userExists) {
        return res.send("<script>alert('Email already registered!'); window.location.href='/signUp';</script>");
      }
  
      // Store user in Firebase Realtime Database
      const newUserRef = ref.push();
      await newUserRef.set({
        name,
        email,
        password  // For production, hash this password!
      });
  
      // Redirect to login page after success
      res.send("<script>alert('Registration successful! Please login.'); window.location.href='/';</script>");
    } catch (error) {
      console.error(error);
      res.send("<script>alert('Registration failed. Try again later.'); window.location.href='/signUp';</script>");
    }
  });
  


app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});