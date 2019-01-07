/**
 * Copyright (c) 2018, Veiled
 * Document: index.js
 * Developer: Prashant Shrestha
 * Date: Sat Dec 29 22:01:09 EST 2018
 */

const PORT = process.env.PORT || 3001;
let app = require("express")(),
    server = app.listen(PORT),
    io = require("socket.io").listen(server),
    cors = require("cors"),
    helmet = require("helmet");

app.use(helmet());
app.use(
    cors({
        origin: "*"
    })
);

// io.on('join', handleJoinEvent);
// io.on('leave', handleLeaveEvent);
// io.on('message', handleMessageEvent);
// io.on('disconnect', handleDisconnectEvent);

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
});
