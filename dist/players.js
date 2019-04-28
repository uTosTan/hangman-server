"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const players = {};
let playerCount = 0;
const add = (socket) => {
    players[socket.id] = {
        socket: socket,
        room: undefined
    };
    playerCount++;
};
const remove = (socketId) => {
    delete players[socketId];
    playerCount--;
};
const getAll = () => players;
const getPlayerCount = () => playerCount;
const getRoom = (socketId) => players[socketId].room;
const setRoom = (name, socketId) => players[socketId].room = name;
const Player = {
    add: add,
    remove: remove,
    getAll: getAll,
    getRoom: getRoom,
    setRoom: setRoom,
};
exports.default = Player;
//# sourceMappingURL=players.js.map