require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
});

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: Invalid session"));
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        socket.user = { 
            uid: decodedToken.uid,
            name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown Operator'
        };
        next();
    } catch (error) {
        next(new Error("Authentication error: Invalid session"));
    }
});

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const QUOTES = [
    { text: 'Learning to type is a wonderful skill that opens many doors for you in this modern world. When you first start, your fingers might feel a bit slow and clumsy on the keys, but that is perfectly normal. The secret to success is to keep your eyes on the screen while you move your hands across the board. If you practice for just a few minutes every day, you will find that your speed and accuracy improve very quickly. Typing allows you to share your ideas, write stories, and connect with people from all over the globe. It is a quiet and smooth rhythm that once mastered, feels as natural as breathing.', difficulty: 'easy', category: 'prose' },
    { text: 'Nature is a beautiful and quiet place where you can find peace and calm. In the spring, the bright green leaves start to grow on the tall trees and the colorful flowers begin to bloom in the garden. You can hear the happy birds sing their songs in the warm morning air. During the summer, the days are long and hot, and many people love to go to the beach to swim in the cool water. When the fall comes, the green leaves turn into shades of red and orange before they fall softly to the ground. Every season has its own special beauty and it is nice to spend time outside in the fresh air.', difficulty: 'easy', category: 'prose' },
    { text: 'Friendship is a very important part of our lives that makes us happy. Having a good friend means you always have someone to talk to and share your thoughts with. Friends help each other when times are hard and they celebrate together when things go well. When we work as a team, we can achieve much more than we could ever do by ourselves. Teamwork makes difficult tasks feel easy and much more fun for everyone involved. You should always try to be kind and listen to what your friends have to say to you. A group of friends who trust each other can reach any goal they set together.', difficulty: 'easy', category: 'prose' },
    { text: 'Technology has revolutionized the way we interact with the world around us in significant ways. The internet connects billions of people, allowing for the instant exchange of information and ideas across vast distances. Have you ever considered how different life was before we had smartphones in our pockets? We can now access a massive library of knowledge with just a few taps on a screen. From online education to remote work, the digital landscape is constantly evolving and expanding. As we embrace these new tools, we must also be mindful of our privacy and security in the virtual space. What will the next decade of innovation bring to our society? The possibilities are truly endless.', difficulty: 'medium', category: 'prose' },
    { text: 'Space exploration represents the ultimate frontier for human curiosity and scientific endeavor. For decades, we have looked up at the stars and wondered if we are alone in this vast universe. Missions to the moon and Mars have provided us with incredible insights into the history of our solar system. Astronomers use powerful telescopes to capture images of distant galaxies that formed billions of years ago. Can you imagine a future where humans live and work on other planets? The technical challenges are immense, yet our drive to explore remains stronger than ever. Every small step we take into the cosmos deepens our understanding of existence and pushes the boundaries of what is possible for mankind.', difficulty: 'medium', category: 'prose' },
    { text: 'Artificial intelligence is rapidly transforming industries by enabling machines to learn from data and perform complex tasks. From self-driving cars to personalized medicine, AI applications are becoming more integrated into our daily routines. Have you noticed how virtual assistants can understand your voice and answer your questions? This technology relies on sophisticated algorithms that process massive amounts of information in real time. While AI offers many benefits, it also raises important ethical questions about the future of work and decision-making. How can we ensure that these systems are transparent and fair for everyone? As we continue to develop smarter machines, we must focus on creating technology that complements human skills and improves our quality of life.', difficulty: 'medium', category: 'prose' },
    { text: 'Cybersecurity is the critical frontline of defense in our increasingly interconnected digital age. As hackers become more sophisticated, organizations must employ advanced multi-factor authentication and 256-bit encryption to protect sensitive data from theft. A single 0-day vulnerability can compromise an entire network, leading to catastrophic financial loss and privacy breaches. Consider the complexity of a modern firewall protecting a cloud-based infrastructure against a massive DDoS attack. In the shadowy world of "black-hat" operations, every bit of information is a potential target. Is your system resilient enough to withstand a persistent threat? Remember: security is not just a one-time configuration but a continuous cycle of monitoring, patching, and evolving protocols to stay one step ahead of total system failure.', difficulty: 'hard', category: 'prose' },
    { text: 'Software engineering demands a rigorous balance between high-performance logic and long-term maintainability of codebases. Modern architects favor microservice patterns to decouple components, yet this often introduces complex synchronization challenges across distributed systems. We must optimize for sub-100ms latency while ensuring thread-safety in highly concurrent environments. Think about the scale of a platform handling 1,000,000+ concurrent websocket connections! Technical debt is the silent killer of innovation; if left unchecked, it will eventually paralyze the growth of even the most robust applications. Effective engineers treat code like a living organism that requires constant refactoring and testing. The goal is to build digital bridges that are as strong and reliable as their physical counterparts in the real world.', difficulty: 'hard', category: 'prose' },
    { text: 'Data science is the art of transforming raw, chaotic bits of information into actionable insights and predictive models. We utilize complex statistical methods, such as "gradient-boosted" decision trees and deep neural networks, to identify subtle patterns within massive datasets. Data cleaning often accounts for 80% of the workload, as "noisy" data can significantly degrade the performance of an ML algorithm. Consider the mathematical elegance of a high-dimensional vector space where every point represents a unique feature of the user experience. Are your models truly capturing the underlying signal, or are they just over-fitting to the noise? In this data-driven era, those who can master the synthesis of math and logic will lead the way into an intelligent and automated future.', difficulty: 'hard', category: 'prose' },
];

const CODE_SNIPPETS = [
    { 
        text: 'function calculateSumOfSquares(numbers) {\n    /**\n     * Calculates the square of each number in an array and returns the sum.\n     * This is a fundamental utility function used throughout the application\n     * to process numerical datasets for performance analysis and metrics.\n     */\n    if (!Array.isArray(numbers) || numbers.length === 0) {\n        console.warn("Invalid input: numbers must be a non-empty array");\n        return 0;\n    }\n    let totalSum = 0;\n    for (let i = 0; i < numbers.length; i++) {\n        // Square the current number and add it to the running total\n        const squaredValue = numbers[i] * numbers[i];\n        totalSum += squaredValue;\n    }\n    // Return the final calculated sum to the caller for further processing\n    return totalSum;\n}', 
        difficulty: 'easy', 
        category: 'code', 
        language: 'javascript' 
    },
    { 
        text: 'async function fetchWithRetry(endpoint, maxRetries = 3) {\n    /**\n     * Asynchronously fetches user data from a remote API endpoint and\n     * implements a retry mechanism to handle transient network failures.\n     * This pattern ensures the application remains resilient under load.\n     */\n    let attempts = 0;\n    while (attempts < maxRetries) {\n        try {\n            const response = await fetch(endpoint);\n            // Check if the response was successful (HTTP status code 200-299)\n            if (response.ok) {\n                const payload = await response.json();\n                return payload;\n            }\n            throw new Error(`Server returned error status: ${response.status}`);\n        } catch (error) {\n            attempts++;\n            console.error(`Attempt ${attempts} failed: ${error.message}`);\n            // Wait for 1 second before the next retry attempt\n            if (attempts < maxRetries) await new Promise(r => setTimeout(r, 1000));\n        }\n    }\n    return null;\n}', 
        difficulty: 'medium', 
        category: 'code', 
        language: 'javascript' 
    },
    { 
        text: 'class ProjectManager:\n    """\n    A robust class designed to manage multiple developmental workflows.\n    It tracks task status, priority levels, and assigned personnel.\n    """\n    def __init__(self, name):\n        self.name = name\n        self.registry = {}\n\n    def deploy_feature(self, feature_id, priority="Normal"):\n        if feature_id in self.registry:\n            print(f"ALARM: Feature {feature_id} is already in the queue.")\n            return False\n        # Initialize the feature metadata in the central registry\n        self.registry[feature_id] = {\n            "prio": priority,\n            "status": "INITIALIZING",\n            "timestamp": "2026-04-25"\n        }\n        print(f"SUCCESS: Feature {feature_id} assigned to {self.name}.")\n        return True', 
        difficulty: 'medium', 
        category: 'code', 
        language: 'python' 
    },
    { 
        text: '/*\n * Complex analytical query to identify high-value customer segments\n * based on transaction volume, average spend, and recent activity levels.\n * This report is critical for driving architectural marketing decisions.\n */\nSELECT \n    u.user_id,\n    u.email_address,\n    COUNT(o.order_id) AS total_orders,\n    ROUND(AVG(o.order_total_value), 2) AS average_order_value,\n    MAX(o.transaction_timestamp) AS last_active_date\nFROM users u\nINNER JOIN orders o ON u.user_id = o.customer_id\nWHERE o.status = "COMPLETED" \n  AND o.transaction_timestamp > "2025-12-31 23:59:59"\nGROUP BY u.user_id, u.email_address\nHAVING COUNT(o.order_id) >= 10 \n   AND AVG(o.order_total_value) > 250.00\nORDER BY average_order_value DESC;', 
        difficulty: 'hard', 
        category: 'code', 
        language: 'sql' 
    },
    { 
        text: '/**\n * High-performance throttle function inspired by Lodash-style logic.\n * It ensures that a given callback is executed at most once per\n * every "wait" millisecond interval, regardless of call frequency.\n */\nfunction throttle(callback, wait) {\n    let lastCallTime = 0;\n    let timerId = null;\n\n    return function throttled(...args) {\n        const now = Date.now();\n        const remaining = wait - (now - lastCallTime);\n\n        if (remaining <= 0 || remaining > wait) {\n            if (timerId) {\n                clearTimeout(timerId);\n                timerId = null;\n            }\n            lastCallTime = now;\n            callback.apply(this, args);\n        } else if (!timerId) {\n            timerId = setTimeout(() => {\n                lastCallTime = Date.now();\n                timerId = null;\n                callback.apply(this, args);\n            }, remaining);\n        }\n    };\n}', 
        difficulty: 'hard', 
        category: 'code', 
        language: 'javascript' 
    }
];

const DAILY_CHALLENGE_POOL = [
    "The future of programming lies in the harmonious integration of human creativity and machine intelligence. As we develop more advanced algorithms, we must remember that the core of every great application is the intent of its creator. Coding is not just about syntax; it is about solving problems that matter to real people. Every line of code we write has the potential to simplify a task, connect a community, or even save a life. Let us build digital tools that empower and inspire the next generation of innovators.",
    "In the rapidly evolving landscape of cybersecurity, resilience is more than just a defensive strategy. It is a mindset that anticipates failure and prepares for recovery at every level of the system architecture. We must move beyond simple perimeter defenses and embrace a zero-trust model that verifies every connection and every user. In a world where data is the most valuable currency, protecting it is our highest responsibility. True security is achieved through continuous vigilance, robust encryption, and a commitment to transparency in all our virtual operations.",
    "Artificial intelligence is not a replacement for human thought, but a powerful catalyst for its expansion. By automating the mundane and the repetitive, AI allows us to focus our energy on the truly complex and the profoundly creative. We are entering an era where the boundaries between the physical and the digital are increasingly blurred, demanding a new ethical framework for technological development. We must ensure that these powerful tools are used to reduce inequality and enhance the common good. Innovation should always be guided by empathy and a vision for progress.",
    "The architecture of a successful software system is built on the foundation of clean, modular, and maintainable code. Technical debt may offer a short-term speed boost, but it inevitably leads to a long-term paralysis of growth and innovation. Effective engineers understand that code is read far more often than it is written, making clarity our primary objective. We should strive to build systems that are flexible enough to evolve with changing requirements while remaining robust enough to handle unexpected failures. Excellence in engineering is a journey of constant learning and refinement.",
    "Data is the lifeblood of the modern enterprise, but raw information only gains value when it is transformed into actionable knowledge. Through the lens of advanced analytics, we can identify hidden trends and make predictions that drive strategic growth. However, with this power comes a significant ethical obligation to respect user privacy and ensure data integrity at every stage. We must build data systems that are not only efficient but also transparent and fair. In a data-driven world, trust is the most critical asset we must protect and nurture.",
    "Cloud computing has fundamentally democratized access to high-performance infrastructure, enabling startups to compete with established giants on a global scale. By abstracting away the complexities of hardware management, the cloud allows developers to focus entirely on building great products. However, as we move more of our lives into the virtual sphere, we must be mindful of the environmental and social impacts of our digital footprint. Sustainability should be a core design principle for every modern application. Let us build a digital future that is both powerful and responsible.",
    "Open source software is the ultimate testament to the power of global collaboration and the free exchange of ideas. By sharing our work with the world, we enable others to learn, build, and innovate in ways we could never have imagined alone. This collective intelligence has built the very foundations of the modern internet, proving that cooperation is more effective than competition. We must continue to support and contribute to the communities that make this possible. Together, we can solve the world's most difficult problems through the simple act of sharing.",
    "User experience design is the bridge between complex technology and the people who use it every day. A great interface is invisible, allowing the user to achieve their goals with minimal effort and maximum delight. We must prioritize accessibility and inclusivity, ensuring that our digital tools are usable by everyone, regardless of their background or ability. Empathy is the most important tool in a designer's toolkit, allowing us to see the world through the eyes of our users. Let us create technology that feels human, intuitive, and truly helpful.",
    "The advent of blockchain technology has introduced a new paradigm for trust and decentralization in the digital world. By enabling peer-to-peer transactions without the need for traditional intermediaries, we can build more transparent and resilient systems. However, the path to mainstream adoption is paved with significant technical and regulatory challenges that we must navigate with care. We should focus on creating real-world value and solving practical problems rather than chasing hype. In a decentralized future, every individual should have the power to control their own digital identity and assets.",
    "The internet of things is connecting billions of devices, creating a vast and intricate web of intelligence that spans the entire globe. From smart homes to industrial automation, these connected systems are making our lives more efficient and our industries more productive. However, the massive scale of these networks introduces unprecedented security and privacy risks that we must address proactively. We must design for security from the very beginning, ensuring that every connected device is a reliable and safe node in the network. The future is connected, and we must make it secure."
];

const getDailyChallenge = () => {
    const dateString = new Date().toISOString().split('T')[0];
    const index = dateString.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % DAILY_CHALLENGE_POOL.length;
    return {
        text: DAILY_CHALLENGE_POOL[index],
        date: dateString,
        index: index
    };
};

// In-memory state to track rooms and players
const rooms = {};
const onlineOperators = {};

let globalChampionGhost = { wpm: 0, name: '', keystrokes: [] };

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    onlineOperators[socket.id] = { uid: socket.user.uid, name: socket.user.name };
    io.emit('registry_updated', Object.values(onlineOperators));

    socket.on('send_duel_challenge', ({ targetUid, roomId }) => {
        const targetSocketId = Object.keys(onlineOperators).find(
            sid => onlineOperators[sid].uid === targetUid
        );
        if (targetSocketId) {
            io.to(targetSocketId).emit('duel_challenged', { challengerName: socket.user.name, roomId });
        }
    });

    // Create a new room
    socket.on('createRoom', (data, callback) => {
        const roomId = data?.roomId ? data.roomId.toUpperCase() : generateRoomCode();
        // Initialize room state
        rooms[roomId] = {
            id: roomId,
            host: socket.id,
            players: [{ id: socket.id, uid: socket.user.uid, name: data?.playerName || 'Host', progress: 0, wpm: 0, avatar: data?.avatar }],
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
            uid: socket.user.uid,
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
    socket.on('startRace', ({ roomId, difficulty, category, mode, duration, targetLines }, callback) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.host !== socket.id) {
            if (callback) callback({ success: false, error: 'Only the host can start the race' });
            return;
        }

        const raceMode = mode === 'length' ? 'length' : 'time';
        const raceDuration = [30, 60, 120].includes(duration) ? duration : 30;
        const raceTargetLines = [5, 10, 15, 20].includes(targetLines) ? targetLines : 5;

        room.mode = raceMode;
        room.duration = raceDuration;
        room.targetLines = raceTargetLines;

        const diff = difficulty || 'medium';
        const cat = category || 'prose';
        const source = cat === 'code' ? CODE_SNIPPETS : QUOTES;
        const pool = source.filter(q => q.difficulty === diff);
        const poolTexts = pool.length > 0 ? pool.map((q) => q.text) : source.map((q) => q.text);

        let selectedText;
        if (raceMode === 'length') {
            const targetWordCount = raceTargetLines * 12;
            let combined = '';
            while (combined.split(/\s+/).filter((w) => w.length > 0).length < targetWordCount) {
                const pick = poolTexts[Math.floor(Math.random() * poolTexts.length)];
                combined += (combined ? ' ' : '') + pick;
            }
            const words = combined.split(/\s+/).filter((w) => w.length > 0);
            selectedText = words.slice(0, targetWordCount).join(' ');
        } else {
            selectedText = poolTexts[Math.floor(Math.random() * poolTexts.length)] || source[0].text;
        }

        room.text = selectedText;
        room.status = 'playing';
        console.log(`[${roomId}] Race started — diff: ${diff}, cat: ${cat}, mode: ${raceMode}, duration: ${raceDuration}s, lines: ${raceTargetLines}`);

        io.to(roomId).emit('raceStarted', {
            text: selectedText,
            countdown: 3,
            championGhost: globalChampionGhost,
            mode: raceMode,
            duration: raceDuration,
            targetLines: raceTargetLines
        });

        if (callback) callback({ success: true });
    });

    // Update typing progress
    socket.on('updateProgress', ({ roomId, progressPercentage, wpm }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Establish absolute server authority: Ignore client-submitted ID and use authenticated socket.user.uid / socket.id
        const player = room.players.find(p => p.id === socket.id && p.uid === socket.user.uid);

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

    // Provide the Daily Challenge
    socket.on('getDailyChallenge', (callback) => {
        if (callback) callback({ success: true, ...getDailyChallenge() });
    });

    // Handle player finishing the race
    socket.on('playerFinished', (data) => {
        const { roomId, wpm, accuracy, keystrokes } = data;
        const room = rooms[roomId];
        if (!room) return;

        // Establish absolute server authority: Ensure we map to the verified socket.user.uid
        const player = room.players.find(p => p.id === socket.id && p.uid === socket.user.uid);
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
        delete onlineOperators[socket.id];
        io.emit('registry_updated', Object.values(onlineOperators));

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
                    if (room.host === socket.id && room.players.length > 0) {
                        room.host = room.players[0].id;
                        console.log(`[${roomId}] Host reassigned to ${room.host}`);
                    }
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
