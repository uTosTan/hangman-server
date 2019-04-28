"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const actions_1 = require("./actions");
const players_1 = __importDefault(require("./players"));
let rooms = {};
const MAX_ATTEMPTS = 7; // TODO: Move to .env
const removePlayer = (room, socket) => {
    if (room && room in rooms) {
        delete rooms[room].players[socket.id];
        rooms[room].count--;
        rooms[room].playersArray.splice(rooms[room].playersArray.indexOf(socket.id), 1);
        socket.to(room).emit(actions_1.PLAYER_LEAVE_ROOM, socket.id);
    }
};
const addPlayer = (room, nickname, socket) => {
    if (room in rooms &&
        !rooms[room].started &&
        rooms[room].count < rooms[room].maxPlayers &&
        !(socket.id in rooms[room].players)) {
        socket.join(room);
        players_1.default.setRoom(room, socket.id);
        rooms[room].players[socket.id] = {
            socketId: socket.id,
            attemptedLetters: []
        };
        rooms[room].count++;
        rooms[room].playersArray.push(socket.id);
        if (rooms[room].playersArray.length === 1) {
            rooms[room].turn = 0;
        }
        socket.emit(actions_1.SEND_BLANKS, JSON.stringify(rooms[room].blanks));
        socket.emit(actions_1.INITIATE_PLAYER, room, rooms[room].host.id, JSON.stringify(rooms[room].playersArray));
        socket.to(room).emit(actions_1.PLAYER_JOIN_ROOM, socket.id);
    }
    else {
        socket.emit(actions_1.GAME_ERROR, "Unable to join room");
    }
};
const startGame = (room, socket, io) => {
    if (room &&
        room in rooms &&
        rooms[room].host.id === socket.id &&
        !rooms[room].started &&
        rooms[room].playersArray.length > 0) {
        rooms[room].started = true;
        io.to(room).emit(actions_1.GAME_STARTED);
    }
    else {
        socket.emit(actions_1.GAME_ERROR, "Unable to start game");
    }
};
const attemptLetter = (room, letter, socket, io) => {
    if (room && // player is in a room
        rooms[room].started && // game has started
        !rooms[room].win && // has not been won
        !rooms[room].loss && // has not been lost
        !(letter in rooms[room].attempts) && // letter has not been attempted before
        rooms[room].playersArray[rooms[room].turn] === socket.id // correct turn
    ) {
        const word = rooms[room].word;
        rooms[room].attempts[letter] = {
            found: false,
            frequency: 0,
            player: socket.id
        };
        rooms[room].attemptCount++;
        for (let i = 0; i < word.length; i++) {
            if (letter === word.charAt(i)) {
                rooms[room].blanks[i] = letter;
                rooms[room].attempts[letter].found = true;
                rooms[room].attempts[letter].frequency++;
                rooms[room].players[socket.id].attemptedLetters.push(letter);
            }
        }
        if (rooms[room].attempts[letter].found) {
            io.to(room).emit(actions_1.SEND_BLANKS, JSON.stringify(rooms[room].blanks));
            io.to(room).emit(actions_1.ATTEMPT_RESULT, letter, 1);
            rooms[room].remainingCount -= rooms[room].attempts[letter].frequency;
        }
        else {
            rooms[room].failCount++;
            io.to(room).emit(actions_1.ATTEMPT_RESULT, letter, 0);
        }
        if (rooms[room].failCount > MAX_ATTEMPTS) {
            rooms[room].loss = true;
            io.to(room).emit(actions_1.GAME_LOST);
        }
        if (rooms[room].remainingCount <= 0) {
            rooms[room].win = true;
            io.to(room).emit(actions_1.GAME_WON, socket.id);
        }
    }
    else {
        socket.emit(actions_1.GAME_ERROR, "Are you sure its your turn?");
    }
};
const host = (word, socket, nickname) => {
    const randomRoom = crypto_1.default.randomBytes(4).toString("hex");
    socket.join(randomRoom);
    players_1.default.setRoom(randomRoom, socket.id);
    rooms[randomRoom] = createRoom(randomRoom, socket, word);
    socket.emit(actions_1.INITIATE_ROOM, randomRoom, socket.id);
    socket.emit(actions_1.SEND_BLANKS, JSON.stringify(rooms[randomRoom].blanks));
};
const createRoom = (room, socket, word) => {
    return {
        players: {},
        playersArray: [],
        count: 0,
        word: word,
        blanks: Array.from("_".repeat(word.length)),
        remainingCount: word.length,
        attempts: {},
        attemptCount: 0,
        failCount: 0,
        win: false,
        loss: false,
        host: socket,
        maxPlayers: 4,
        turn: undefined,
        started: false
    };
};
const getAll = () => rooms;
const Room = {
    removePlayer: removePlayer,
    host: host,
    addPlayer: addPlayer,
    attemptLetter: attemptLetter,
    startGame: startGame,
    getAll: getAll
};
exports.default = Room;
//# sourceMappingURL=rooms.js.map