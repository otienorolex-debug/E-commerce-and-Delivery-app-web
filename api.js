/**
 * JAMBO MALL - REST API CLIENT WRAPPER MODULE
 * Handles downstream data serialization and network connection endpoints
 */

export const API_BASE = 'https://dummyjson.com';

let requestId = 0;

/**
 * Executes a network fetch request against the store inventory target
 * @param {string} url - Target REST API endpoint URL
 * @returns {Promise<Array>} Resolves to the arrays of products
 */
export async function fetchInventory(url = `${API_BASE}/products?limit=30`) {
    const currentRequestId = ++requestId;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP network error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Ensure stale asynchronous promises do not overwrite contemporary actions
        if (currentRequestId !== requestId) {
            return null;
        }
        
        if (!data || !Array.isArray(data.products)) {
            throw new Error('Unexpected remote dataset layout schema structure');
        }
        
        return data.products;
    } catch (error) {
        if (currentRequestId !== requestId) return null;
        throw error;
    }
}
