const CONFIG = require('../core/config');
const { getKeysByPattern, getCacheValue, deleteCacheValue, flushCache } = require('../core/redis_config/redis_client');

// routes.js or cron-jobs.js
async function jobPlugin(fastify, options) {
    fastify.cronScheduler.scheduleJob(
        'Backup Messages Cron Job',
        CONFIG.SCHEDULER.BACKUP_CRON_SCHEDULE,
        async () => {
            const chatRooms = await getKeysByPattern(`${CONFIG.REDIS.MESSAGES_KEY}*`);
            const insertPromises = chatRooms.map(async (roomId) => {
                try {
                    const cached = await getCacheValue(roomId);
                    if (!cached) return;
                    const room_id = roomId.split('_')[1];
                    let messages = JSON.parse(cached);
            
                    messages = messages.map(({ id, ...rest }) => ({
                        ...rest,
                        room_id,
                        is_active: true
                    }));
                    const result = await fastify.knex('messages')
                        .insert(messages)
                        .returning('*');
            
                    fastify.log.info(`Inserted ${result.length} messages for room: ${room_id}`);
                    await deleteCacheValue(roomId);
            
                } catch (error) {
                    fastify.log.error(error, `Failed to insert messages for room ${roomId}`);
                }
            });
            
            await Promise.all(insertPromises);
        }
    );
}

module.exports = require('fastify-plugin')(jobPlugin);
