import { Socket, Server } from "socket.io";
import crypto from "crypto";
import {
  PLAYER_LEAVE_ROOM,
  INITIATE_ROOM,
  SEND_BLANKS,
  INITIATE_PLAYER,
  PLAYER_JOIN_ROOM,
  GAME_ERROR,
  ATTEMPT_RESULT,
  GAME_LOST,
  GAME_WON,
  GAME_STARTED
} from "./actions";
import Player from "./players";

interface Room {
  players: { [key: string]: Player }; // update
  playersArray: Array<string>;
  count: number;
  word: string;
  blanks: Array<string>;
  remainingCount: number;
  attempts: any; // update
  attemptCount: number;
  failCount: number;
  win: boolean;
  loss: boolean;
  host: Socket;
  maxPlayers: 4;
  turn: number;
  started: boolean;
}

interface Player {
  socketId: string;
  attemptedLetters: Array<string>;
}

interface Rooms {
  [key: string]: Room;
}

let rooms: Rooms = {};

const MAX_ATTEMPTS = 7; // TODO: Move to .env

const removePlayer = (room: string, socket: Socket) => {
  if (room && room in rooms) {
    delete rooms[room].players[socket.id];
    rooms[room].count--;
    rooms[room].playersArray.splice(
      rooms[room].playersArray.indexOf(socket.id),
      1
    );
    socket.to(room).emit(PLAYER_LEAVE_ROOM, socket.id);
  }
};

const addPlayer = (room: string, nickname: string, socket: Socket) => {
  if (
    room in rooms &&
    !rooms[room].started &&
    rooms[room].count < rooms[room].maxPlayers &&
    !(socket.id in rooms[room].players)
  ) {
    socket.join(room);
    Player.setRoom(room, socket.id);
    rooms[room].players[socket.id] = {
      socketId: socket.id,
      attemptedLetters: []
    };
    rooms[room].count++;
    rooms[room].playersArray.push(socket.id);

    if (rooms[room].playersArray.length === 1) {
      rooms[room].turn = 0;
    }

    socket.emit(SEND_BLANKS, JSON.stringify(rooms[room].blanks));
    socket.emit(
      INITIATE_PLAYER,
      room,
      rooms[room].host.id,
      JSON.stringify(rooms[room].playersArray)
    );
    socket.to(room).emit(PLAYER_JOIN_ROOM, socket.id);
  } else {
    socket.emit(GAME_ERROR, "Unable to join room");
  }
};

const startGame = (room: string, socket: Socket, io: Server) => {
  if (
    room &&
    room in rooms &&
    rooms[room].host.id === socket.id &&
    !rooms[room].started &&
    rooms[room].playersArray.length > 0
  ) {
    rooms[room].started = true;
    io.to(room).emit(GAME_STARTED);
  } else {
    socket.emit(GAME_ERROR, "Unable to start game");
  }
};

const attemptLetter = (
  room: string,
  letter: string,
  socket: Socket,
  io: Server
) => {
  if (
    room && // player is in a room
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
      io.to(room).emit(SEND_BLANKS, JSON.stringify(rooms[room].blanks));
      io.to(room).emit(ATTEMPT_RESULT, letter, 1);
      rooms[room].remainingCount -= rooms[room].attempts[letter].frequency;
    } else {
      rooms[room].failCount++;
      io.to(room).emit(ATTEMPT_RESULT, letter, 0);
    }

    if (rooms[room].failCount > MAX_ATTEMPTS) {
      rooms[room].loss = true;
      io.to(room).emit(GAME_LOST);
    }

    if (rooms[room].remainingCount <= 0) {
      rooms[room].win = true;
      io.to(room).emit(GAME_WON, socket.id);
    }
  } else {
    socket.emit(GAME_ERROR, "Are you sure its your turn?");
  }
};

const host = (word: string, socket: Socket, nickname: string) => {
  const randomRoom = crypto.randomBytes(4).toString("hex");
  socket.join(randomRoom);
  Player.setRoom(randomRoom, socket.id);
  rooms[randomRoom] = createRoom(randomRoom, socket, word);
  socket.emit(INITIATE_ROOM, randomRoom, socket.id);
  socket.emit(SEND_BLANKS, JSON.stringify(rooms[randomRoom].blanks));
};

const createRoom = (room: string, socket: Socket, word: string): Room => {
  return {
    players: {}, //change to array
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

export default Room;
