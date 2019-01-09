/**
 * Copyright (c) 2018, Veiled
 * Document: index.js
 * Developer: Prashant Shrestha
 * Date: Sat Dec 29 22:01:09 EST 2018
 */

const PORT = process.env.PORT || 3001;
let app = require("express")(),
    https = require("https"),
    cors = require("cors"),
    helmet = require("helmet"),
    fs = require("fs");

// Setting up HTTPS options
const httpsOptions = {
    key: fs.readFileSync("/etc/letsencrypt/live/serv.prashant.me/privkey.pem"),
    cert: fs.readFileSync(
        "/etc/letsencrypt/live/serv.prashant.me/fullchain.pem"
    )
};

// Setting up CORS options
const allowedHosts = [
    "http://veiled.prashant.me",
    "https://veiled.prashant.me",
    "veiled.prashant.me",
    "localhost"
];

// Creating a server with both HTTP & HTTPS options.
const server = https.createServer(httpsOptions, app);
const io = require("socket.io")(server);

app.use(
    cors({
        origin: (origin, callback) => {
            if (allowedHosts.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(
                    "Not allowed! Visit https://veiled.prashant.me.",
                    false
                );
            }
        },
        optionsSuccessStatus: 200
    })
);
app.use(helmet());

// Socket stuff.
io.of("/veil").on("connection", socket => {
    console.log("New client connected");
    // Client joins the room.
    socket.on("join", room => {
        socket.join(room.roomid, () => {
            console.log(`Client joined ${room.roomid}`);
            socket.emit("notification", {
                error: false,
                message: `Successfully joined the room ${room.roomid}!`
            });
        });
    });

    // Client sends message.
    socket.on("message", data => {
        const { roomid, message, sender, date } = data;
        let modifiedData = data;
        modifiedData.emitted = true;
        if (roomid && message && sender && date) {
            io.of("/veil")
                .in(roomid)
                .emit("message", modifiedData);
        } else {
            console.log("Relaying msg failed!");
        }
    });

    // Client leaves the room.
    socket.on("leave", room => {
        socket.leave(room.roomid, () => {
            console.log(`Client left the room ${room.roomid}.`);
            let roomLeft = typeof socket.rooms[room.roomid] === "undefined";
            return socket.emit("notification", {
                error: false,
                message: `${
                    roomLeft ? "Successfully left" : "Could not leave "
                } the room ${room.roomid}`,
                rooms: socket.rooms
            });
        });
    });

    // Client disconnects.
    socket.on("disconnect", () => {
        console.log(`A client disconnected.`);
        socket.disconnect();
    });
});

server.listen(PORT, () => {
    console.log(`Listening at PORT *:${PORT} with SSL.`);
});
