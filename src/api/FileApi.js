import axios from "axios";

const BASE_URL = 'http://localhost:8080/files';

export const uploadChunk = (formData) => axios.post(`${BASE_URL}/advance/chunk`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
})
    .then((resp) => resp.data);

export const mergeChunk = (data) => axios.post(`${BASE_URL}/advance/chunk/merge`, data)
    .then((resp) => resp.data);

export const checkFileExistence = (data) => axios.post(`${BASE_URL}/advance/check-existence`, data)
    .then((resp) => resp.data);