// app.js
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");

// Models
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

// Routes
const listingRoutes = require("./routes/listing.js");


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Connect MongoDB
async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("onnected to MongoDB"))
  .catch((err) => console.log("Mongo Error:", err));

//  View Engine + Middleware Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUnintialized: true,
  cookie: {
    expires: Date.now() + 7*24*60*60*1000,
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next)=> {
  res.locals.success = req.flash("success");
  next();
})

//  Routes Mount
app.get("/", (req, res) => {
  res.send("Wanderlust Server Running...");
});

app.use("/listings", listingRoutes);


// REVIEW ROUTES (without router)
app.post("/listings/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    const review = new Review({
      rating: req.body.review.rating,
      comment: req.body.review.comment,
    });

    listing.reviews.push(review);
    await review.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.log(" Error while adding review:", err);
    res.send("Something went wrong while saving review!");
  }
});

//  Start Server
app.listen(8080, () => {
  console.log("Server is running to port 8080");
});