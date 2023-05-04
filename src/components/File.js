import React, {useEffect, useState} from "react";
import {chunkUpload} from "../utils/FileUtils";
import {findAll} from "../api/FileApi";
import '../App.css';

const File = () => {
    const [fileList, setFileList] = useState([]);

    const upload = () => {
        let file = document.getElementById('file').files[0];
        if (file) {
            chunkUpload(file);
        }
    }

    useEffect(() => {
        findAll().then((resp) => {
            setFileList(resp)
        })
    }, [])

    return (
        <div>
            <h3>文件上传</h3>
            <input type="file" id="file"/>
            <button onClick={upload}>上传</button>
            <br/>
            <h3>文件列表</h3>
            <ul>
                {
                    fileList.map((file) => (<li className={'item'} key={file.id}>
                        <span>{file.name}</span>
                        <span>{Math.floor(file.size / (1024 * 1024))}MB</span>
                    </li>))
                }
            </ul>
        </div>
    );
};

export default File;