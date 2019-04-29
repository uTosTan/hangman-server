import express from "express";
import http from "http";
import socketio from "socket.io";

import Player from "./players";
import Room from "./rooms";
import { HOST_REQUEST, JOIN_REQUEST, ATTEMPT_LETTER, START_GAME } from "./actions";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});


app.get("/rooms", function(req, res) {
  res.set("Content-Type", "application/json");
  res.send(
    JSON.stringify(Room.getAll(), function(key, value) {
      if (key === "socket") {
        return undefined;
      } else {
        return value;
      }
    })
  );
});


app.get("/players", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(
    JSON.stringify(Player.getAll(), function(key, value) {
      if (key === "socket") {
        return undefined;
      } else if (key === "host") {
        return undefined;
      } else {
        return value;
      }
    })
  );
});

server.listen(3001, () => {
  console.log("Listening on 3000");
});

io.on("connection", socket => {
  Player.add(socket);

  socket.on("disconnect", () => {
    Room.removePlayer(Player.getRoom(socket.id), socket);
    Player.remove(socket.id);
  });

  socket.on(START_GAME, () => {
    Room.startGame(Player.getRoom(socket.id), socket, io);
  });

  socket.on(HOST_REQUEST, (word: string, nickname: string) => {
    Room.host(word, socket, nickname);
  });

  socket.on(JOIN_REQUEST, (room: string, nickname: string) => {
    Room.addPlayer(room, nickname, socket);
  });

  socket.on(ATTEMPT_LETTER, (letter: string) => {
    Room.attemptLetter(Player.getRoom(socket.id), letter, socket, io);
  });
});
