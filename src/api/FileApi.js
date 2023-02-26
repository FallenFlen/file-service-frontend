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

export const checkFileExistence = (data) => axios.post(`${BASE_URL}/advance/chunk/validate-and-clean-damaged`, data)
    .then((resp) => resp.data);

export const findAll = () => axios.get(`${BASE_URL}/advance/all`)
    .then((resp) => resp.data);

export const advanceDownload = (path, range) => axios.get(`${BASE_URL}/advance/download`, {
    params: {
        path
    },
    headers: {
        "Range": range
    }
})

export const commonDownload = (path) => axios.get(`${BASE_URL}/common/download`, {
    params: {
        path
    }
})