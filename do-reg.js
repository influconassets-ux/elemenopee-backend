import axios from 'axios';

const run = async () => {
    try {
        const res = await axios.post('http://localhost:5000/api/users/register', {
            name: 'Admin',
            email: 'admin@elemenopee.com',
            password: 'adminpassword123',
            role: 'admin'
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.log('ERROR:', err.response?.data || err.message);
    }
};

run();
