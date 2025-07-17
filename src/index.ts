import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

interface Room {
    id: string;
    clients: Map<WebSocket, { username: string, joined_at: number }>;
    created_at: number
}

interface ChatMessage {
    type: 'create' | 'join' | 'chat' | 'leave';
    room_id?: string;
    chat_message?: string;
    username?: string;
    timestamp?: number;
}

export class ChatServer {
    private wss: WebSocketServer;
    //key would b roomId as it will help to fetch the room in O(1) time.
    private rooms: Map<string, Room> = new Map();
    //tracks current room for each client
    private client_room: Map<WebSocket, string> = new Map();

    constructor(port: 8080) {
        this.wss = new WebSocketServer({ port });
        this.setUpServer();
        console.log("Chat server is running at port: 8080");
    }

    private setUpServer() {
        this.wss.on('connection', (socket: WebSocket) => {
            this.handleConnection(socket);
        })

        this.wss.on('error', (error) => {
            console.error("Websocket server error:", error);
        });
    }

    private handleConnection(socket: WebSocket) {
        console.log(`New user connected. Total users: ${this.wss.clients.size}`);

        this.sendToClient(socket, {
            type: 'system',
            message: 'Welcome to the Chat server!',
            timestamp: Date.now()
        })

        socket.on("message", (data) => {
            this.handleMessage(socket, data);
        })

        socket.on('close', () => {
            this.handleDisconnection(socket);
        })

        socket.on('error', (error) => {
            console.error('Client socket error:', error);
            this.handleDisconnection(socket);
        })
    }

    private handleMessage(socket: WebSocket, data: any) {
        try {
            const message: ChatMessage = JSON.parse(data.toString());
            switch (message.type) {
                case 'create':
                    this.handleRoomCreation(socket, data);
                    break;
                case 'join':
                    this.handleJoinRoom(socket, data);
                    break;
                case 'chat':
                    this.handleChat(socket, message);
                    break;
                case 'leave':
                    this.handleLeaveRoom(socket);
                    break;
            }
        } catch (error) {
            console.error("Unable to parse message.", error);
            this.sendError(socket, "Invalid message format.");
        }
    }

    private handleRoomCreation(socket: WebSocket, message: ChatMessage) {
        this.removeFromCurrentRoom(socket);

        const joined_at = Date.now();
        const room_id = randomUUID();
        const username = message.username || `User_${joined_at}`;

        const room: Room = {
            id: room_id,
            clients: new Map(),
            created_at: joined_at
        }

        room.clients.set(socket, {
            username,
            joined_at
        })
        this.rooms.set(room_id, room);
        this.client_room.set(socket, room_id);

        this.sendToClient(socket, {
            type: 'room_created',
            room_id: room_id,
            message: `Room created successfully. Room id: ${room_id}`,
            timestamp: joined_at
        })

        console.log(`Room ${room_id} created by user ${username}`);
    }

    private handleJoinRoom(socket: WebSocket, message: ChatMessage) {
        if (!message.room_id) {
            this.sendError(socket, "Room id is required.");
            return;
        }

        const room = this.rooms.get(message.room_id);
        if (!room) {
            this.sendError(socket, 'Room not found');
            return;
        }

        this.removeFromCurrentRoom(socket);

        const joined_at = Date.now();
        const username = message.username || `User_${joined_at}`;
        room.clients.set(socket, {
            username,
            joined_at
        })

        this.client_room.set(socket, message.room_id);

        this.sendToClient(socket, {
            type: 'room_joined',
            room_id: message.room_id,
            message: `Room ${message.room_id} joined successfully`,
            joined_at
        })

        this.broadcastToRoom(message.room_id, {
            type: 'user_joined',
            message: `${username} joined the room`,
            joined_at
        }, socket);

        console.log(`${username} joined room ${message.room_id}`);
    }

    private handleChat(socket: WebSocket, message: ChatMessage) {
        const room_id = this.client_room.get(socket);
        if (!room_id) {
            this.sendError(socket, 'First join a room mittar...!!');
            return;
        }

        const room = this.rooms.get(room_id);
        if (!room) {
            this.sendError(socket, 'Room no longer exists..!!!');
            return;
        }

        const client_info = room.clients.get(socket);
        if (!client_info) {
            this.sendError(socket, 'You are not a member of this room.');
            return;
        }

        if (!message.chat_message || message.chat_message.trim() === '') {
            this.sendError(socket, "Chat message cant be empty.");
            return;
        }
        this.broadcastToRoom(room_id, {
            type: 'chat',
            message: `${message.chat_message}`,
            username: client_info.username,
            timestamp: Date.now()
        });

    }

    private handleLeaveRoom(socket: WebSocket) {
        this.removeFromCurrentRoom(socket);
        this.sendToClient(socket, {
            type: 'room_left',
            message: 'You have left the room.',
            timestamp: Date.now()
        });
    }

    private handleDisconnection(socket: WebSocket) {
        console.log(`Client disconnected. Total users left: ${this.wss.clients.size}`);
        this.removeFromCurrentRoom(socket);
        this.client_room.delete(socket);
    }

    private broadcastToRoom(room_id: string, message: any, excludeSocket?: WebSocket) {
        const room = this.rooms.get(room_id);
        if (!room) return;

        const broadcast_message = JSON.stringify(message);
        room.clients.forEach((client_info, client) => {
            if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
                client.send(broadcast_message);
            }
        });

        console.log(`Broadcast done in room ${room_id}`);
    }

    private removeFromCurrentRoom(socket: WebSocket) {
        const current_room = this.client_room.get(socket);
        if (!current_room) return;

        const room = this.rooms.get(current_room);
        if (!room) return;

        const client_info = room.clients.get(socket);
        room.clients.delete(socket);
        if (!room.clients.size) {
            this.rooms.delete(current_room);
            console.log(`Room ${current_room} deleted since all members left`)
        }
        this.client_room.delete(socket);

        this.sendToClient(socket, {
            type: 'room_left',
            message: `Left room ${current_room}`,
            timestamp: Date.now()
        })

        if (client_info) {
            this.broadcastToRoom(current_room, {
                type: 'user_left',
                message: `${client_info.username} left the room`,
                client_info,
                timestamp: Date.now()
            }, socket);

            console.log(`${client_info?.username} left room ${current_room} at ${Date.now()}`);
        }
    }

    private sendToClient(socket: WebSocket, message: any) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    private sendError(socket: WebSocket, errorMessage: string) {
        this.sendToClient(socket, {
            type: 'error',
            message: errorMessage,
            timestamp: Date.now()
        })
    }
}

const chat_server = new ChatServer(8080);
