import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,

})

//REQUEST INTERCEPTOR
//Runs before every request is sent and attach the jwt token from localstorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('niti_setu_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

//Response interceptor
api.interceptors.response.use((response) => response, (error) => {
    const status = error.response?.status;
    if (status === 401) {
        localStorage.removeItem('niti_setu_token');
        localStorage.removeItem('niti_setu_user');

        //Only redirect if not already on login page

        if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
        }
    } else if (status === 429) {
        toast.error('Too many requests. Please wait a moment');
    } else if (status === 403) {
        toast.error('You do not have permission for this action');
    } else if (status >= 500) {
        toast.error('Server error. Please try again later');
    }
    return Promise.reject(error);
});

export default api;

