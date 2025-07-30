const axios = require('axios');

getLichessRating = async (username) => {
    try {
        const response = await axios.get(`https://lichess.org/api/user/${username}`);
        rating = response.data.perfs.rapid.rating;
        console.log(`Rating for ${username}: ${rating}`);
        return rating;
        
    } catch (error) {
        console.error('Error fetching data from Lichess:', error);
        throw error;
    }
}

module.exports = {
    getLichessRating
}