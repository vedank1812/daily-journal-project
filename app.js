const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const app = express();

const { DB_URL, EMAIL, PASSWORD, ALTERNATE_EMAIL, PORT } = require("./CONSTANTS")();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

mongoose.set('strictQuery', false);
mongoose.connect(DB_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Cannot Connect to Database : ", err))

const sendMail = async (subject, data) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: EMAIL,
      pass: PASSWORD
    },
  });
  const mailOptions = {
    from: EMAIL,
    to: ALTERNATE_EMAIL,
    subject: subject,
    html: data
  };
  await transporter.sendMail(mailOptions);
  transporter.close();
}

const postSchema = {
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
};

const Post = mongoose.model("Post", postSchema);

app.get("/", (req, res) => {
  Post.find({}, (err, posts) => {
    if (err) {
      res.send("error");
    } else {
      res.render("home", { posts })
    }
  })
});

app.get("/posts/:postName", (req, res) => {
  const requestedTitle = req.params.postName;
  Post.findOne({ title: requestedTitle }, (err, post) => {
    if (!err && post) {
      res.render("post", {
        title: post.title,
        content: post.content
      })
    } else {
      res.send("error");
    }
  })
});

app.get("/about", (req, res) => res.render("about"));

app.get("/contact", (req, res) => res.render("contact"));

app.get("/compose", (req, res) => res.render("compose"));

app.post("/compose", (req, res) => {
  const { postTitle, postBody } = req.body;
  const post = {
    title: postTitle,
    content: postBody
  };
  if (postTitle === '' || postBody === '') {
    return res.send("Please Fill all the fields");
  }
  Post.create(post, (err, docs) => {
    if (!err && docs) {
      res.redirect("/");
    } else {
      res.send("error");
    }
  })
});

app.post("/post/:postName", (req, res) => {
  const title = req.params.postName;
  Post.findOneAndDelete({ title: title }, (err, docs) => {
    if (!err && docs) {
      res.redirect("/");
    } else {
      res.send("error");
    }
  })
})

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  const subject = `${name} submitted a form`;
  const data =
    `
  Name : ${name} <br />
  Email : ${email} <br />
  Message : ${message} <br />
  `;

  await sendMail(subject, data);
  res.redirect("/");
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));