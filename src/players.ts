import { Socket } from "socket.io";

interface PlayerInfo {
  socket: Socket;
  room: string;
}
interface Players {
  [key: string]: PlayerInfo;
}

const players: Players = {};

let playerCount = 0;

const add = (socket: Socket) => {
  players[socket.id] = {
    socket: socket,
    room: undefined
  };
  playerCount++;
};

const remove = (socketId: string) => {
  delete players[socketId];
  playerCount--;
};

const getAll = () => players;

const getPlayerCount = () => playerCount;

const getRoom = (socketId: string) => players[socketId].room;

const setRoom = (name: string, socketId: string) => players[socketId].room = name;

const Player = {
  add: add,
  remove: remove,
  getAll: getAll,
  getRoom: getRoom,
  setRoom: setRoom,
};

export default Player;
