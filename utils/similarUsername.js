const db = require('../config/db.conf.js');

/**
 * Generates alternative username suggestions that are not already in the database
 * @param {string} username - The original username to find alternatives for
 * @returns {Promise<string[]>} - Array of available username suggestions
 */
async function generateSimilarUsernames(username) {
    const suggestions = [];
    const baseName = username.toLowerCase();

    console.log("I got here");
    
    // Create potential alternatives
    const potentialSuggestions = [
        `${baseName}1`,
        `${baseName}2`,
        `${baseName}3`,
        `${baseName}_`,
        `_${baseName}`,
        `${baseName}22`,
        `the_${baseName}`,
        `${baseName}_official`,
        `real_${baseName}`,
        `${baseName}${Math.floor(Math.random() * 100)}`
    ];
    
    // Check which suggestions are available
    for (const suggestion of potentialSuggestions) {
        const exists = await db.query(`
            SELECT * FROM users
            WHERE username = $1
            LIMIT 1`,
            [suggestion]
        );
        
        if (exists.rowCount === 0) {
            suggestions.push(suggestion);

            // Return once we have 5 suggestions
            if (suggestions.length >= 5) {
                break;
            }
        }
    }
    console.log("I got here 2");
    
    // If we still need more suggestions, generate random numbers
    while (suggestions.length < 5) {
        const randomNum = Math.floor(Math.random() * 1000);
        const suggestion1 = `${baseName}${randomNum}`;
        console.log("I got here");
        
        const exists = await db.query(`
            SELECT * FROM users
            WHERE username = $1
            LIMIT 1`,
            [suggestion1]
        );
        console.log(exists);
        
        if (exists.rowCount === 0 && !suggestions.includes(suggestion1)) {
            suggestions.push(suggestion1);
        }
    }
    
    return suggestions;
}


module.exports = generateSimilarUsernames;
