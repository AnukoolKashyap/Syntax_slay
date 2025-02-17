// api.js
export async function debugCode(code) {
    try {
        const response = await fetch('/api/debug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error('Debugging failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Debug error:', error);
        return { error: error.message };
    }
}