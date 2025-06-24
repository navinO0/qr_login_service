

const Ajv = require("ajv");
const AjvErrors = require("ajv-errors");
const addFormats = require("ajv-formats");
const { errorSchemas } = require("../../core/schemas");

const qr_schema = {
    tags: ['login'],
    summary: "Get application records.",
    description: `<h3>This API allows logged in users to get application records.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            user_id: { type: "string" },
            citizen_id: { type: "string" },
        }
    },
    additionalProperties: false,
    response: {
        ...errorSchemas,
    },
}

const user_create_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    body: {
        type: "object",
        properties: {
            username: {
                type: "string",
                minLength: 3,
                maxLength: 255,
                description: "Unique username for the user",
                example: "john_doe123"
            },
            password: {
                type: "string",
                minLength: 8,
                description: "User's password (hashed using bcrypt)",
                example: "user_password123"
            },
            email: {
                type: "string",
                description: "User's email address (unique)",
                example: "john.doe@example.com"
            },
            mobile: {
                type: "string",
                // pattern: "^[0-9]{10,15}$",  // Regex to validate mobile number format (10 to 15 digits)
                description: "User's mobile number (optional)",
                example: "1234567890"
            },
            first_name: {
                type: "string",
                maxLength: 255,
                description: "User's first name",
                example: "John"
            },
            middle_name: {
                type: "string",
                maxLength: 255,
                description: "User's middle name (optional)",
                example: "Michael"
            },
            last_name: {
                type: "string",
                maxLength: 255,
                description: "User's last name",
                example: "Doe"
            },
            profile_photo: {
                type: "string",
            },
            device_info: {
                type: "object",
            }
        },
        required: ["username", "password", "email"],  // Make username, password, and email required
        additionalProperties: false
    }
};


const user_login_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],
    req_encrypted: true,
    encrypted_properties: ["username", "password"],
    body: {
        type: "object",
        properties: {
            username: {
                type: "string",
                minLength: 3,
                maxLength: 255,
                description: "Unique username for the user"
            },
            password: {
                type: "string",
                minLength: 8
            },
            device_info: {
                type: "object",
            }
        },
        required: ["username", "password"],  // Make username, password, and email required
        additionalProperties: false
    }
};

const lgin_code_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    security: [{ ApiToken: [] }],
    body: {
        type: "object",
        properties: {
            token: {
                type: "string",
            },
        },
        required: ["token"],
        additionalProperties: false
    }
};

const login_with_code = {
    tags: ['user'],
    summary: "User Login via QR Code",
    description: "<h3>This API allows users to log in using a QR code and optionally send device information for session management.</h3>",
    rbac: ["*"],  // Adjust based on your role-based access control
    params: {
        type: "object",
        properties: {
            code: {
                type: "string",
                description: "The one-time QR login code",
            },
        },
        required: ["code"],
        additionalProperties: false,
    },
    body: {
        type: "object",
        required: []
    }
};


const image_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    security: [{ ApiToken: [] }]
};

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
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    // rbac: ["*"],  // Roles or permissions (adjust as needed, e.g., ['admin', 'user'])
    // security: [{ ApiToken: [] }],
    body: {
        type: "object",
        properties: {
            roomId: {
                type: "string",
            },
            paths: {
                type: "string",
            },
        },
        required: [],  // Make username, password, and email required
        additionalProperties: false
    }
};

async function ajvCompiler(app, options) {
    const ajv = new Ajv({
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
        allErrors: true,
        allowUnionTypes: true,
        strict: false
    });
    AjvErrors(ajv);
    addFormats(ajv);
    app.setValidatorCompiler(({ schema }) => {
        return ajv.compile(schema);
    });
}

const register_google_user_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],
    body: {
        type: "object",
        properties: {
            username: {
                type: "string",
                minLength: 3,
                maxLength: 255,
                description: "Unique username for the user",
                example: "john_doe123"
            },
            email: {
                type: "string",
                // format: "email",  
                description: "User's email address (unique)",
                example: "john.doe@example.com"
            },
            first_name: {
                type: "string",
                maxLength: 255,
                description: "User's first name",
                example: "John"
            },
            profile_photo: {
                type: "string",
            },
            device_info: {
                type : "object"
            }
        },
        required: ["username"],
        additionalProperties: false
    }
};


const get_devices_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],
    security: [{ ApiToken: [] }],
    // body: {
    //     type: "object",
    //     properties: {
    //         token: {
    //             type: "string",
    //         },
    //     },
    // required: ["token"],  
    // additionalProperties: false
    // }
};


const remove_all_devices_schema = {
    tags: ['user'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],
    security: [{ ApiToken: [] }],
    body: {
        type: "object",
        properties: {
            is_remove_all_devices: {
                type: "boolean",
            },
            device_fingerprint: {
                type: "string",
            }
        },
        required: ["is_remove_all_devices"],
        additionalProperties: false
    }
};

module.exports = { qr_schema, ajvCompiler, user_create_schema, user_login_schema, lgin_code_schema, login_with_code, image_schema, room_id_schema, save_room_schema, register_google_user_schema, get_devices_schema, remove_all_devices_schema }