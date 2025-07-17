import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

// Mock the crypto module
jest.mock("crypto", () => ({
    randomUUID: jest.fn(() => "test-room-id-123")
}));

// Mock WebSocket and WebSocketServer
const mockWebSocketServer = {
    on: jest.fn(),
    clients: new Set()
};

const mockWebSocket = {
    send: jest.fn(),
    on: jest.fn(),
    readyState: 1, // WebSocket.OPEN
    close: jest.fn()
};

jest.mock("ws", () => ({
    WebSocketServer: jest.fn().mockImplementation(() => mockWebSocketServer),
    WebSocket: {
        OPEN: 1,
        CLOSED: 3
    }
}));

// Import the ChatServer after mocking
import { ChatServer } from "./index";

// Define proper type for mock sockets
interface MockSocket {
    send: jest.Mock;
    on: jest.Mock;
    readyState: number;
    close: jest.Mock;
    messageHandler?: Function;
    closeHandler?: Function;
    errorHandler?: Function;
}

describe("ChatServer", () => {
    let chatServer: ChatServer;
    let mockSocket1: MockSocket;
    let mockSocket2: MockSocket;
    let connectionHandler: Function;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock sockets
        mockSocket1 = {
            send: jest.fn(),
            on: jest.fn(),
            readyState: 1,
            close: jest.fn()
        };

        mockSocket2 = {
            send: jest.fn(),
            on: jest.fn(),
            readyState: 1,
            close: jest.fn()
        };

        // Setup WebSocketServer mock to capture handlers
        mockWebSocketServer.on.mockImplementation((event: string, handler: Function) => {
            if (event === "connection") {
                connectionHandler = handler;
            }
        });

        // Setup socket event handlers
        mockSocket1.on.mockImplementation((event: string, handler: Function) => {
            if (event === "message") {
                mockSocket1.messageHandler = handler;
            } else if (event === "close") {
                mockSocket1.closeHandler = handler;
            } else if (event === "error") {
                mockSocket1.errorHandler = handler;
            }
        });

        mockSocket2.on.mockImplementation((event: string, handler: Function) => {
            if (event === "message") {
                mockSocket2.messageHandler = handler;
            } else if (event === "close") {
                mockSocket2.closeHandler = handler;
            } else if (event === "error") {
                mockSocket2.errorHandler = handler;
            }
        });

        // Create ChatServer instance
        chatServer = new ChatServer(8080);

        // Simulate connections
        connectionHandler(mockSocket1);
        connectionHandler(mockSocket2);
    });

    describe("Server Setup", () => {
        it("should create WebSocketServer with correct port", () => {
            expect(WebSocketServer).toHaveBeenCalledWith({ port: 8080 });
        });

        it("should set up connection handler", () => {
            expect(mockWebSocketServer.on).toHaveBeenCalledWith("connection", expect.any(Function));
        });

        it("should send welcome message on connection", () => {
            expect(mockSocket1.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: "system",
                    message: "Welcome to the Chat server!",
                    timestamp: expect.any(Number)
                })
            );
        });
    });

    // describe("Room Creation", () => {
    //     it("should create a room successfully", () => {
    //         const createMessage = {
    //             type: "create",
    //             username: "testuser"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_created",
    //                 room_id: "test-room-id-123",
    //                 message: "Room created successfully. Room id: test-room-id-123",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should create a room with default username if none provided", () => {
    //         const createMessage = {
    //             type: "create"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_created",
    //                 room_id: "test-room-id-123",
    //                 message: "Room created successfully. Room id: test-room-id-123",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("Room Joining", () => {
    //     beforeEach(() => {
    //         // Create a room first
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));
    //     });

    //     it("should join an existing room successfully", () => {
    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };

    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_joined",
    //                 room_id: "test-room-id-123",
    //                 message: "Room test-room-id-123 joined successfully",
    //                 joined_at: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should broadcast user join to existing room members", () => {
    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };

    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "user_joined",
    //                 message: "joiner joined the room",
    //                 joined_at: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should return error when joining non-existent room", () => {
    //         const joinMessage = {
    //             type: "join",
    //             room_id: "non-existent-room",
    //             username: "joiner"
    //         };

    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Room not found",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should return error when room_id is missing", () => {
    //         const joinMessage = {
    //             type: "join",
    //             username: "joiner"
    //         };

    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Room id is required.",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("Chat Messaging", () => {
    //     beforeEach(() => {
    //         // Create room and join users
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };
    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));
    //     });

    //     it("should broadcast chat message to all room members", () => {
    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: "Hello everyone!"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(chatMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "chat",
    //                 message: "Hello everyone!",
    //                 username: "creator",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should not send chat message to sender", () => {
    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: "Hello everyone!"
    //         };

    //         const initialCallCount = mockSocket1.send.mock.calls.length;
    //         mockSocket1.messageHandler!(JSON.stringify(chatMessage));

    //         // Should not have additional calls to sender
    //         expect(mockSocket1.send).toHaveBeenCalledTimes(initialCallCount);
    //     });

    //     it("should return error when user not in any room", () => {
    //         // Create a new socket that hasn't joined any room
    //         const mockSocket3: MockSocket = {
    //             send: jest.fn(),
    //             on: jest.fn(),
    //             readyState: 1,
    //             close: jest.fn()
    //         };

    //         mockSocket3.on.mockImplementation((event: string, handler: Function) => {
    //             if (event === "message") {
    //                 mockSocket3.messageHandler = handler;
    //             }
    //         });

    //         connectionHandler(mockSocket3);

    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: "Hello!"
    //         };

    //         mockSocket3.messageHandler!(JSON.stringify(chatMessage));

    //         expect(mockSocket3.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "First join a room mittar...!!",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should return error when chat message is empty", () => {
    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: ""
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(chatMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Chat message cant be empty.",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should return error when chat message is only whitespace", () => {
    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: "   "
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(chatMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Chat message cant be empty.",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("Room Leaving", () => {
    //     beforeEach(() => {
    //         // Create room and join users
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };
    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));
    //     });

    //     it("should leave room successfully", () => {
    //         const leaveMessage = {
    //             type: "leave"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(leaveMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_left",
    //                 message: "You have left the room.",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should broadcast user leave to remaining room members", () => {
    //         const leaveMessage = {
    //             type: "leave"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(leaveMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "user_left",
    //                 message: "creator left the room",
    //                 client_info: {
    //                     username: "creator",
    //                     joined_at: expect.any(Number)
    //                 },
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("Connection Handling", () => {
    //     it("should handle socket disconnection", () => {
    //         // Create room first
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         // Simulate disconnection
    //         mockSocket1.closeHandler!();

    //         // Should clean up the room and client mapping
    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_left",
    //                 message: "Left room test-room-id-123",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should handle socket error", () => {
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         // Simulate error
    //         mockSocket1.errorHandler!(new Error("Socket error"));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_left",
    //                 message: "Left room test-room-id-123",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("Message Parsing", () => {
    //     it("should handle invalid JSON message", () => {
    //         const invalidMessage = "invalid json";

    //         mockSocket1.messageHandler!(invalidMessage);

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Invalid message format.",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should handle unknown message type", () => {
    //         const unknownMessage = {
    //             type: "unknown_type"
    //         };

    //         mockSocket1.messageHandler!(JSON.stringify(unknownMessage));

    //         // Should not crash and not send any error (switch statement has no default)
    //         // This tests the robustness of the message handling
    //     });
    // });

    // describe("Room Management", () => {
    //     it("should delete room when all members leave", () => {
    //         // Create room with one user
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         // Leave room
    //         const leaveMessage = {
    //             type: "leave"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(leaveMessage));

    //         // Try to join the deleted room
    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };
    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket2.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "error",
    //                 message: "Room not found",
    //                 timestamp: expect.any(Number)
    //             })
    //         );
    //     });

    //     it("should handle user switching rooms", () => {
    //         // Create first room
    //         const createMessage1 = {
    //             type: "create",
    //             username: "user1"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage1));

    //         // Create second room
    //         (randomUUID as jest.Mock).mockReturnValueOnce("test-room-id-456");
    //         const createMessage2 = {
    //             type: "create",
    //             username: "user2"
    //         };
    //         mockSocket2.messageHandler!(JSON.stringify(createMessage2));

    //         // User1 joins second room (should leave first room)
    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-456",
    //             username: "user1"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(joinMessage));

    //         expect(mockSocket1.send).toHaveBeenCalledWith(
    //             JSON.stringify({
    //                 type: "room_joined",
    //                 room_id: "test-room-id-456",
    //                 message: "Room test-room-id-456 joined successfully",
    //                 joined_at: expect.any(Number)
    //             })
    //         );
    //     });
    // });

    // describe("WebSocket State Handling", () => {
    //     it("should not send message to closed socket", () => {
    //         mockSocket1.readyState = 3; // WebSocket.CLOSED

    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         // Should not call send on closed socket
    //         expect(mockSocket1.send).not.toHaveBeenCalled();
    //     });

    //     it("should only broadcast to open sockets", () => {
    //         // Create room and join users
    //         const createMessage = {
    //             type: "create",
    //             username: "creator"
    //         };
    //         mockSocket1.messageHandler!(JSON.stringify(createMessage));

    //         const joinMessage = {
    //             type: "join",
    //             room_id: "test-room-id-123",
    //             username: "joiner"
    //         };
    //         mockSocket2.messageHandler!(JSON.stringify(joinMessage));

    //         // Close socket2
    //         mockSocket2.readyState = 3;

    //         const chatMessage = {
    //             type: "chat",
    //             chat_message: "Hello everyone!"
    //         };

    //         const initialCallCount = mockSocket2.send.mock.calls.length;
    //         mockSocket1.messageHandler!(JSON.stringify(chatMessage));

    //         // Should not send to closed socket
    //         expect(mockSocket2.send).toHaveBeenCalledTimes(initialCallCount);
    //     });
    // });
});