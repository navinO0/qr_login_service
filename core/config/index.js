require('dotenv').config();

const config =  {
    POSTGRESS_CONFIG: {
        host: process.env.HOST || 'localhost',
        user: process.env.USER || 'danvin',
        password: process.env.PASSWORD ||'Password@123',
        database: process.env.DATABASE || 'testdb',
        port: process.env.PORT ||'5432'    
    },
    DB_CONFIG: {
        
    },
    KEY_HEX: process.env.KEY_HEX  ||"51d50fd2414f785fdd9cd1d7d6b98cbca8ce426b4f39a79affd9d900ca8d7eeb",
    IV_HEX: process.env.IV_HEX || "cc6f3e4f66ad34ade65e3e67fb96856c",
    JWT_SECRET: process.env.JWT_SECRET || "XXXXX"
    
}

module.exports = {config}