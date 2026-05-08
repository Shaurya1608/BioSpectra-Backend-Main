async function check() {
    try {
        const response = await fetch('http://localhost:5000/api/editorial');
        const data = await response.json();
        console.log('Total members:', data.length);
        const advisory = data.filter(m => m.memberType === 'national_advisory');
        console.log('National Advisory members:', advisory.length);
        if (advisory.length > 0) {
            console.log('Sample advisory member:', advisory[0]);
        }
    } catch (error) {
        console.error('Check failed:', error.message);
    }
}

check();
