intent(
    'i (want|like) to participate in the upcoming (swimming | badminton) (meet| tornament). But i am nervous. (What can i do!)',
    
    p => {
        p.play(
            'Feeling nervous before a (swimming | badminton) meet is completely normal. It\'s a natural response to the anticipation of competition. Here are some tips to help you manage your nervousness and perform your best!',
        );
    },
);

follow(
    '(Can i get|i need|) (the|) $(QUERY competitors|participants|athletes) (list|name)',
    p => {
        p.state.query = p.QUERY.value;
        playWeather(p);
    },
);
async function playWeather(p) {
    let response;
    p.state.bestTime = p.state.bestTime || '13 Seconds'
    try {
        p.play(`You are standing in the top 5% who are less than ${p.state.bestTime} in 25 meters freestyle according to the last time event`)
    } catch (error) {
        const code = error.response.status;

        p.play(`Could not get weather information for ${p.state.location}`)

        if (code === 404) {
            p.state.location = null;
        } else {
            console.log(`failed to get weather: ${error}, code: ${code}`);
        }
        return;
    }
}