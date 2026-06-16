import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Point to your Express backend
});

// Automatically attach the JWT token to the headers if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;