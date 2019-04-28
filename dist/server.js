"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const players_1 = __importDefault(require("./players"));
const rooms_1 = __importDefault(require("./rooms"));
const actions_1 = require("./actions");
const app = express_1.default();
const server = http_1.default.createServer(app);
const io = socket_io_1.default(server);
app.get("/rooms", (req, res) => {
    res.json("works");
});
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});
app.get("/rooms", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(JSON.stringify(rooms_1.default.getAll(), function (key, value) {
        if (key === "socket") {
            return undefined;
        }
        else if (key === "host") {
            return undefined;
        }
        else {
            return value;
        }
    }));
});
app.get("/players", (req, res) => {
    res.set("Content-Type", "application/json");
    res.send(JSON.stringify(players_1.default.getAll(), function (key, value) {
        if (key === "socket") {
            return undefined;
        }
        else if (key === "host") {
            return undefined;
        }
        else {
            return value;
        }
    }));
});
server.listen(3000, () => {
    console.log("Listening on 3000");
});
io.on("connection", socket => {
    players_1.default.add(socket);
    socket.on("disconnect", () => {
        rooms_1.default.removePlayer(players_1.default.getRoom(socket.id), socket);
        players_1.default.remove(socket.id);
    });
    socket.on(actions_1.START_GAME, () => {
        rooms_1.default.startGame(players_1.default.getRoom(socket.id), socket, io);
    });
    socket.on(actions_1.HOST_REQUEST, (word, nickname) => {
        rooms_1.default.host(word, socket, nickname);
    });
    socket.on(actions_1.JOIN_REQUEST, (room, nickname) => {
        rooms_1.default.addPlayer(room, nickname, socket);
    });
    socket.on(actions_1.ATTEMPT_LETTER, (letter) => {
        console.log("here");
        rooms_1.default.attemptLetter(players_1.default.getRoom(socket.id), letter, socket, io);
    });
});
//# sourceMappingURL=server.js.map