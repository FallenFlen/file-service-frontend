import React from "react";
import {chunkUpload} from "../utils/FileUtils";

const File = () => {
    const upload = () => {
        let file = document.getElementById('file').files[0];
        console.log(file);
        chunkUpload(file);
    }

    return (
        <div>
            <h3>文件上传</h3>
            <input type="file" id="file"/>
            <button onClick={upload}>上传</button>
        </div>
    );
};

export default File;