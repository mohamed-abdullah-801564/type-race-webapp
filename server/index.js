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

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const QUOTES = [
    { text: 'the quick brown fox jumps over the lazy dog and rests by the river', difficulty: 'easy', category: 'prose' },
    { text: 'she sells sea shells by the sea shore and the shells she sells are sea shells', difficulty: 'easy', category: 'prose' },
    { text: 'how much wood would a woodchuck chuck if a woodchuck could chuck wood', difficulty: 'easy', category: 'prose' },
    { text: 'a journey of a thousand miles begins with a single step forward', difficulty: 'easy', category: 'prose' },
    { text: 'In the middle of difficulty lies opportunity. Keep your eyes on the stars.', difficulty: 'medium', category: 'prose' },
    { text: 'Success is not final, failure is not fatal: it is the courage to continue.', difficulty: 'medium', category: 'prose' },
    { text: 'The only way to do great work is to love what you do. Keep looking.', difficulty: 'medium', category: 'prose' },
    { text: 'Believe you can and you are halfway there. The rest is discipline.', difficulty: 'medium', category: 'prose' },
    { text: 'To print variables in JS, use console.log("Hello!"); it is 100% effective.', difficulty: 'hard', category: 'prose' },
    { text: 'The regex pattern /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}$/ validates email.', difficulty: 'hard', category: 'prose' },
    { text: 'Run: git commit -m "fix: resolve #42 — null-pointer exception" && git push.', difficulty: 'hard', category: 'prose' },
    { text: 'She said, "It\'s 2 AM — why are you still coding?!" He replied: "One more bug."', difficulty: 'hard', category: 'prose' },
];

const CODE_SNIPPETS = [
    { text: 'function debounce(fn, delay) {\n    let timer;\n    return (...args) => {\n        clearTimeout(timer);\n        timer = setTimeout(() => fn(...args), delay);\n    };\n}', difficulty: 'medium', category: 'code', language: 'javascript' },
    { text: 'def get_fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b', difficulty: 'medium', category: 'code', language: 'python' },
    { text: 'SELECT users.name, COUNT(orders.id) AS total_orders\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id\nGROUP BY users.id\nHAVING total_orders > 5;', difficulty: 'hard', category: 'code', language: 'sql' },
    { text: 'const root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(<App />);', difficulty: 'easy', category: 'code', language: 'javascript' },
    { text: 'class Circle:\n    def __init__(self, radius):\n        self.radius = radius\n    def area(self):\n        return 3.14 * self.radius ** 2', difficulty: 'medium', category: 'code', language: 'python' }
];

// In-memory state to track rooms and players
const rooms = {};

let globalChampionGhost = { wpm: 0, name: '', keystrokes: [] };

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
    socket.on('startRace', ({ roomId, difficulty, category }, callback) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.host !== socket.id) {
            if (callback) callback({ success: false, error: 'Only the host can start the race' });
            return;
        }

        // Pick a random quote based on difficulty and category
        const diff = difficulty || 'medium';
        const cat = category || 'prose';
        const source = cat === 'code' ? CODE_SNIPPETS : QUOTES;
        const pool = source.filter(q => q.difficulty === diff);
        const selectedQuote = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].text : source[0].text;

        room.status = 'playing';
        console.log(`[${roomId}] Race started with difficulty: ${diff}, category: ${cat}`);

        // Broadcast to EVERYONE in the room including the host
        io.to(roomId).emit('raceStarted', {
            text: selectedQuote,
            startTime: Date.now() + 3000, // Give frontend ~3s to count down
            championGhost: globalChampionGhost
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

// Helper to end a race
const endRace = (roomId) => {
    const room = rooms[roomId];
    if (!room || room.status === 'finished') return;

    room.status = 'finished';
    if (room.timer) clearTimeout(room.timer);

    // Sort players by WPM descending for results
    const results = [...room.players].sort((a, b) => (b.wpm || 0) - (a.wpm || 0));
    const winner = results[0];

    console.log(`[${roomId}] Race Over! Winner: ${winner.name}`);
    io.to(roomId).emit('raceOver', {
        winnerId: winner.id,
        winnerName: winner.name,
        wpm: winner.wpm,
        accuracy: winner.accuracy,
        keystrokes: winner.keystrokes,
        text: room.text, // Include the text so players can archive any ghost
        results: results
    });
};

// ... existing code ...

    // Provide a random quote for SoloMode
    socket.on('getQuote', ({ difficulty, category }, callback) => {
        const diff = difficulty || 'medium';
        const cat = category || 'prose';
        const source = cat === 'code' ? CODE_SNIPPETS : QUOTES;
        const pool = source.filter(q => q.difficulty === diff);
        const selected = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : source[0];
        if (callback) callback({ text: selected.text });
    });

    // NEW: Single source of truth for SoloMode quotes
    socket.on('getSoloQuote', ({ difficulty, category }, callback) => {
        const diff = difficulty || 'medium';
        const cat = category || 'prose';
        const source = cat === 'code' ? CODE_SNIPPETS : QUOTES;
        const pool = source.filter(q => q.difficulty === diff);
        const selected = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : source[0];
        if (callback) callback({ success: true, text: selected.text });
    });

    // Handle player finishing the race
    socket.on('playerFinished', (data) => {
        const { roomId, wpm, accuracy, keystrokes } = data;
        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.progress = 100;
            player.wpm = wpm;
            player.accuracy = accuracy;
            player.finished = true;
            player.keystrokes = keystrokes;

            if (wpm > globalChampionGhost.wpm) {
                globalChampionGhost = {
                    wpm,
                    name: player.name,
                    keystrokes: keystrokes || []
                };
                console.log(`[Global Champion] New record: ${wpm} WPM by ${player.name}`);
            }

            // If this is the first player to finish, start the grace period
            if (room.status === 'playing') {
                room.status = 'grace_period';
                const graceDuration = 10000; // 10 seconds
                const endTime = Date.now() + graceDuration;

                console.log(`[${roomId}] Grace Period Started! Ends in 10s.`);
                io.to(roomId).emit('gracePeriodStarted', { endTime });

                room.timer = setTimeout(() => {
                    endRace(roomId);
                }, graceDuration);
            }

            // Check if everyone has finished
            const allFinished = room.players.every(p => p.finished);
            if (allFinished) {
                console.log(`[${roomId}] All players finished. Ending race early.`);
                endRace(roomId);
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
