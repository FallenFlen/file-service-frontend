import SparkMD5 from 'spark-md5';
import {uploadChunk, mergeChunk, checkFileExistence, advanceDownload, commonDownload} from "../api/FileApi";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5mb分片

export const downloadWithChunk = (path, size) => {
    let startByte = 0
    let endByte = CHUNK_SIZE
    if (size <= CHUNK_SIZE) {
        commonDownload(path)
            .then((resp) => {
                console.log(`common download successfully!`)
                console.log(resp)
                processAfterDownload(resp)
            })
        return
    }

    while (endByte <= size) {
        let range = `bytes=${startByte}-${endByte}`
        advanceDownload(path, range)
            .then((resp) => {
                console.log('advance download successfully!')
                processAfterDownload(resp)
            })
        startByte = endByte + 1
        endByte += CHUNK_SIZE
    }
}

const processAfterDownload = (response) => {
    // 提取文件名
    const fileName = response.headers['content-disposition'].match(/filename=(.*)/)[1]
    const blob = new Blob([response.data], {type: 'application/octet-stream'})

    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // 兼容IE，window.navigator.msSaveBlob：以本地方式保存文件
        window.navigator.msSaveBlob(blob, decodeURI(fileName))
    } else {
        // 创建新的URL并指向File对象或者Blob对象的地址
        const blobURL = window.URL.createObjectURL(blob)
        // 创建a标签，用于跳转至下载链接
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = blobURL
        tempLink.setAttribute('download', decodeURI(fileName))
        // 兼容：某些浏览器不支持HTML5的download属性
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank')
        }
        // 挂载a标签
        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        // 释放blob URL地址
        window.URL.revokeObjectURL(blobURL)
    }
}

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
                        await doUpload(file, md5, totalChunkCount, size, resp.validChunkNumbers)
                        doMerge(file.name, md5, totalChunkCount, size)
                    } else {
                        console.log('full file already existed, upload completed')
                    }

                })
        }
    };

};

const doUpload = async (file, md5, totalChunkCount, size, validChunkNumbers) => {
    for (let i = 0; i < totalChunkCount; i++) {
        let chunkNumber = i + 1;
        if (validChunkNumbers.includes(chunkNumber)) {
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
        })
        .catch((err) => {
            console.log(`merge chunk failed:${err}`);
        });
}


