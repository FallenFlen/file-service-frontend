import axios from "axios";

const BASE_URL = 'http://localhost:8080/files';

export const advanceUploadChunk = (formData) => axios.post(`${BASE_URL}/advance/chunk`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
})
    .then((resp) => resp.data);