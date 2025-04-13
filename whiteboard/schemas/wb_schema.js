

const room_id_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    // rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    security: [{ ApiToken: [] }],
    params: {
        type: "object",
        properties: {
            roomId: {
                type: "string",
            },
        },
        required: ["roomId"],
        additionalProperties: false
    }
}

const save_room_schema = {
    tags: ["user"],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    body: {
        type: "object",
        properties: {
            roomId: {
                type: "string",
            },
            paths: {
                type: "array", // ✅ Changed from "string" to "array"
                // items: {
                //     type: "object", // ✅ Each item in the array is an object
                //     properties: {
                //         x: { type: "number" },
                //         y: { type: "number" },
                //         color: { type: "string" },
                //         strokeWidth: { type: "number" },
                //     },
                //     required: ["x", "y", "color", "strokeWidth"], // Adjust required fields as needed
                //     additionalProperties: false,
                // },
            },
        },
        required: ["roomId", "paths"], // ✅ Now paths is required
        additionalProperties: false,
    },
};


const getUsersSchema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    // rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    security: [{ ApiToken: [] }],
    params: {
        type: "object",
        properties: {
            userKeyword: {
                type: "string",
            },
        },
        required: ["userKeyword"],
        additionalProperties: false
    }
}


const create_room_schema = {
    tags: ["user"],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    body: {
        type: "object",
        properties: {
            room_id: {
                type: "string",
            },
            participants: {
                type: "array",
            },
            password: {
                type: "string",
            },
            is_private: {
                type : 'string'
            }
        },
        required: ["room_id", "password"], 
        additionalProperties: false,
    },
};


const join_room_schema = {
    tags: ["user"],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    body: {
        type: "object",
        properties: {
            room_id: {
                type: "string",
            },
            username: {
                type: "string",
            },
            password: {
                type: "string",
            }
        },
        required: ["room_id"], 
        additionalProperties: false,
    },
};



module.exports = { room_id_schema,save_room_schema, getUsersSchema, create_room_schema, join_room_schema}