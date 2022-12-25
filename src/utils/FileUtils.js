import SparkMD5 from 'spark-md5';
import {advanceUploadChunk} from "../api/FileApi";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5mb分片

export const chunkUpload = (file) => {
    let fileReader = new FileReader();
    let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    let currentChunk = 0;
    let chunks = Math.ceil(file.size / CHUNK_SIZE);
    let spark = new SparkMD5.ArrayBuffer();

    const loadNext = () => {
        let start = currentChunk * CHUNK_SIZE;
        let end = ((start + CHUNK_SIZE) >= file.size) ? file.size : start + CHUNK_SIZE;
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();

    fileReader.onload = (e) => {
        spark.append(e.target.result);
        if (currentChunk < chunks) {
            currentChunk++;
            loadNext();
        } else {
            let md5 = spark.end();
            console.log(`full file md5:${md5}`);
            doUpload(file, md5)
        }
    };

};

const doUpload = (file, md5) => {
    let size = file.size;
    let chunks = Math.ceil(size / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
        let chunkNumber = i + 1;
        let chunkStart = (chunkNumber - 1) * CHUNK_SIZE;
        let chunkEnd = Math.min(size, chunkStart + CHUNK_SIZE);
        let slice = file.slice(chunkStart, chunkEnd);
        let formData = new FormData();
        formData.append('chunk', slice);
        formData.append('md5', md5);
        advanceUploadChunk(formData).then((data) => {
            console.log(`upload chunk successfully:${data}`);
        });
    }
}


