/**
 * Database configuration that switches based on environment
 */

const config = {
    development: {
        type: 'file',
        dataPath: './data'
    },

    production: {
        type: 'postgres',
        databaseUrl: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // DigitalOcean managed databases
        }
    },

    // Fallback to file storage if database fails
    fallback: {
        type: 'file',
        dataPath: process.env.DATA_PATH || '/mnt/app-data'
    }
};

function getDatabaseConfig() {
    const env = process.env.NODE_ENV || 'development';
    return config[env] || config.development;
}

module.exports = {
    getDatabaseConfig,
    config
};
