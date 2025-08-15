const { pool } = require('../config/database');

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Execute a transaction
 * @param {Function} callback - Function containing transaction queries
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get a single row from a query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
async function getOne(text, params = []) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

/**
 * Get multiple rows from a query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of rows
 */
async function getMany(text, params = []) {
    const result = await query(text, params);
    return result.rows;
}

/**
 * Insert a record and return it
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<Object>} Inserted record
 */
async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const text = `
        INSERT INTO ${table} (${columns})
        VALUES (${placeholders})
        RETURNING *
    `;
    
    const result = await query(text, values);
    return result.rows[0];
}

/**
 * Update a record and return it
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Updated record
 */
async function update(table, data, where) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    
    const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = whereKeys.map((key, i) => `${key} = $${i + dataKeys.length + 1}`).join(' AND ');
    
    const text = `
        UPDATE ${table}
        SET ${setClause}
        WHERE ${whereClause}
        RETURNING *
    `;
    
    const result = await query(text, [...dataValues, ...whereValues]);
    return result.rows[0];
}

/**
 * Delete a record
 * @param {string} table - Table name
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Deleted record
 */
async function deleteOne(table, where) {
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const text = `
        DELETE FROM ${table}
        WHERE ${whereClause}
        RETURNING *
    `;
    
    const result = await query(text, whereValues);
    return result.rows[0];
}

module.exports = {
    query,
    transaction,
    getOne,
    getMany,
    insert,
    update,
    deleteOne,
};
