const premiereDate = new Date('2025-12-07T22:59:00Z');
let timeOffset = 0;

fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
    .then(response => response.json())
    .then(data => {
        const serverTime = new Date(data.datetime);
        const localTime = new Date();
        timeOffset = serverTime - localTime;
    })
    .catch(() => {
        console.log('sync failed, using local time');
    });

function updateCountdown() {
    const now = new Date(Date.now() + timeOffset);
    const timeRemaining = premiereDate - now;

    if (timeRemaining <= 0) {
        document.getElementById('countdown').textContent = 'LIVE';
        return;
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    document.getElementById('countdown').textContent = `${formattedHours} : ${formattedMinutes} : ${formattedSeconds}`;
}

updateCountdown();
setInterval(updateCountdown, 1000);
