const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// In-memory state to track rooms and players
const rooms = {};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. Complexity is the enemy of execution. In the heart of the digital arena, speed and precision define the victor.";

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room
    socket.on('createRoom', (data, callback) => {
        const roomId = generateRoomCode();
        // Initialize room state
        rooms[roomId] = {
            id: roomId,
            host: socket.id,
            players: [{ id: socket.id, name: data?.playerName || 'Host', progress: 0, wpm: 0, avatar: data?.avatar }],
            status: 'waiting'
        };

        socket.join(roomId);
        console.log(`[${roomId}] Room created by ${socket.id}`);

        if (callback) callback({ success: true, roomId, room: rooms[roomId] });
    });

    // Join an existing room
    socket.on('joinRoom', ({ roomId, user }, callback) => {
        roomId = roomId?.toUpperCase();
        const room = rooms[roomId];

        if (!room) {
            if (callback) callback({ success: false, error: 'Room not found' });
            return;
        }

        if (room.status !== 'waiting') {
            if (callback) callback({ success: false, error: 'Race already started' });
            return;
        }

        if (room.players.length >= 4) {
            if (callback) callback({ success: false, error: 'Room is full' });
            return;
        }

        // Add player to the room
        const newPlayer = {
            id: socket.id,
            name: user?.playerName || 'Player',
            progress: 0,
            wpm: 0,
            avatar: user?.avatar
        };
        room.players.push(newPlayer);

        socket.join(roomId);
        console.log(`[${roomId}] ${socket.id} joined room`);

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('playerJoined', { player: newPlayer, room });

        // Callback to the sender
        if (callback) callback({ success: true, room });
    });

    // Start the race
    socket.on('startRace', ({ roomId }, callback) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.host !== socket.id) {
            if (callback) callback({ success: false, error: 'Only the host can start the race' });
            return;
        }

        room.status = 'playing';
        console.log(`[${roomId}] Race started!`);

        // Broadcast to EVERYONE in the room including the host
        io.to(roomId).emit('raceStarted', {
            text: SAMPLE_TEXT,
            startTime: Date.now() + 3000 // Give frontend ~3s to count down
        });
    });

    // Update typing progress
    socket.on('updateProgress', ({ roomId, playerId, progressPercentage, wpm }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Default to the socket's id if playerId isn't directly passed
        const pid = playerId || socket.id;
        const player = room.players.find(p => p.id === pid);

        if (player) {
            player.progress = progressPercentage;
            player.wpm = wpm;

            // Instantly broadcast this specific user's progress to everyone ELSE in the room
            socket.to(roomId).emit('progressUpdated', {
                playerId: player.id,
                progressPercentage,
                wpm
            });
        }
    });

    // Handle player finishing the race
    socket.on('playerFinished', (data) => {
        const { roomId, playerName, wpm, accuracy } = data;
        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.progress = 100;
            player.wpm = wpm;
            player.accuracy = accuracy;
            player.finished = true;

            if (room.status !== 'finished') {
                room.status = 'finished';
                console.log(`[${roomId}] Race Over! Winner: ${playerName}`);
                io.to(roomId).emit('raceOver', {
                    winnerName: playerName,
                    wpm,
                    accuracy
                });
            }
        }
    });

    // Reset room for a new race
    socket.on('resetRoom', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.host !== socket.id) return;

        room.status = 'waiting';
        room.players = room.players.map(p => ({
            ...p,
            progress: 0,
            wpm: 0,
            finished: false
        }));

        console.log(`[${roomId}] Room reset for new race`);
        io.to(roomId).emit('roomReset', { room });
    });

    // Handle user dropping out
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        for (const [roomId, room] of Object.entries(rooms)) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                const removedPlayer = room.players.splice(playerIndex, 1)[0];
                console.log(`[${roomId}] ${removedPlayer.id} left the room`);

                // If room is empty, delete it from memory
                if (room.players.length === 0) {
                    delete rooms[roomId];
                    console.log(`[${roomId}] Room deleted (empty)`);
                } else {
                    // If the host drops, automatically reassign host to the next person
                    if (room.host === socket.id) {
                        room.host = room.players[0].id;
                        console.log(`[${roomId}] Host reassigned to ${room.host}`);
                    }
                    // Notify the remaining players
                    io.to(roomId).emit('playerLeft', {
                        playerId: socket.id,
                        newHost: room.host,
                        room
                    });
                }
            }
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Socket.io Server running on port ${PORT}`);
});
