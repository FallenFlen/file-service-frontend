import SparkMD5 from 'spark-md5';
import {uploadChunk, mergeChunk, checkFileExistence} from "../api/FileApi";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5mb分片

export const chunkUpload = (file) => {
    let fileReader = new FileReader();
    let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    let currentChunk = 0;
    let size = file.size;
    let totalChunkCount = Math.ceil(size / CHUNK_SIZE);
    let spark = new SparkMD5.ArrayBuffer();

    const loadNext = () => {
        let start = currentChunk * CHUNK_SIZE;
        let end = ((start + CHUNK_SIZE) >= file.size) ? file.size : start + CHUNK_SIZE;
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();

    fileReader.onload = (e) => {
        spark.append(e.target.result);
        if (currentChunk < totalChunkCount) {
            currentChunk++;
            loadNext();
        } else {
            let md5 = spark.end();
            console.log(`full file md5:${md5}`);
            checkFileExistence({
                "fullFileMd5": md5
            })
                .then(async (resp) => {
                    if (!resp.fullFileExist) {
                        await doUpload(file, md5, totalChunkCount, size, resp.existedAndValidChunkNumbers)
                        doMerge(file.name, md5, totalChunkCount, size)
                    } else {
                        alertAndReload();
                        console.log('full file already existed, upload completed')
                    }

                })
        }
    };

};

const alertAndReload = () => {
    alert('File upload success!');
    window.location.reload();
}

const doUpload = async (file, md5, totalChunkCount, size, existedAndValidChunkNumbers) => {
    for (let i = 0; i < totalChunkCount; i++) {
        let chunkNumber = i + 1;
        if (existedAndValidChunkNumbers.includes(chunkNumber)) {
            console.log('test skip chunk upload')
            continue
        }
        let chunkStart = (chunkNumber - 1) * CHUNK_SIZE;
        let chunkEnd = Math.min(size, chunkStart + CHUNK_SIZE);
        let slice = file.slice(chunkStart, chunkEnd);
        let formData = new FormData();
        formData.append('chunk', slice);
        formData.append('number', chunkNumber);
        formData.append('standardSize', CHUNK_SIZE);
        formData.append('totalChunkCount', totalChunkCount);
        formData.append('fullFileName', file.name);
        formData.append('fullFileMd5', md5);
        await uploadChunk(formData).then((data) => {
            console.log(`upload chunk successfully:${data}`);
        });
    }
}

const doMerge = (fileName, md5, totalChunkCount, fullFileSize) => {
    mergeChunk({
        fullFileMd5: md5,
        fullFileName: fileName,
        totalChunkCount,
        fullFileSize
    })
        .then((data) => {
            console.log(`merge chunk successfully:${data}`);
            alertAndReload();
        })
        .catch((err) => {
            alert('merge chunk failed!');
            console.log(`merge chunk failed:${err}`);
        });
}


