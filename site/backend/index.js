const express = require("express");
const app = express();
const passport = require("passport");
const passportSetup = require("./config/passport-setup");
const port = 4000;
const session = require('express-session');

app.use(passport.initialize());

app.use(session({
    secret: "_oPKtPwlOQt2qDvtloeWfjmm15Dm2o0X"
}))

app.get("/auth/discord", passport.authenticate("discord", { permissions: 8 }));
app.get("/auth/discord/callback", passport.authenticate('discord', {
    failureRedirect: '/'
}), function(req, res) {
    res.redirect("http://localhost:3000/")
});

app.listen(port, () => console.log(`Server is running on port ${port}`));