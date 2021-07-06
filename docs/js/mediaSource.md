# MediaSource

MediaSource是Media Source Extensions API 表示媒体资源HTMLMediaElement对象的接口。MediaSource 对象可以附着在HTMLMediaElement在客户端进行播放。通过重写原生的MediaSource方法(如何重写原生的js方法？就是将原生的方法先指向另一个变量，再在重写的原生方法中利用function.call(),调用该变量指向的原生方法)，通过这样的方式，我们可以进行TS网页视频流的捕获下载。

```js
// ==UserScript==
// @name         m3u8视频下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @include      *
// @description  try to brave me!
// @author       logicZ
// @grant        none
// ==/UserScript==

(function () {
    //创建流存储与展示操作的Dom元素
    let _sourceBufferList = [],
        playRate = 1
    let _ifCanCreateSetTime = true //是否可以创建定时操作
    let $btnDownload = document.createElement('div')
    let $downloadNum = document.createElement('div')
    let $oneRate = document.createElement('div') // 原速播放
    let $sixteenRate = document.createElement('div') // 十六倍速播放
    let $domList = document.getElementsByTagName('video') //媒体资源

    function _changeRatePlay1() {
        playRate = 1
        for (let i = 0, length = $domList.length; i < length; i++) {
            const $dom = $domList[i]
            $dom.playbackRate = 1
        }
    }

    function _changeRatePlay16() {
        playRate = 16
        _ifCanCreateSetTime = true
        for (let i = 0, length = $domList.length; i < length; i++) {
            const $dom = $domList[i]
            $dom.playbackRate = 16
        }
    }

    // 分类下载资源audio/radio
    function _download() {
        _sourceBufferList.forEach((target) => {
            const mime = target.mime.split(';')[0]
            let preType = mime.split('/')[0]
            let type = mime.split('/')[1]
            if (preType == "audio") {
                type = "mp3"
            }
            //创建资源下载路径
            const fileBlob = new Blob(target.bufferList, {
                type: mime
            }) // 创建一个Blob对象，并设置文件的 MIME 类型
            const a = document.createElement('a')
            a.download = `${document.title}.${type}`
            a.href = URL.createObjectURL(fileBlob)
            a.style.display = 'none'
            document.body.appendChild(a)
            //模拟点击触发下载
            a.click()
            a.remove()
        })
    }

    // 监听资源全部录取成功
    let _endOfStream = window.MediaSource.prototype.endOfStream
    window.MediaSource.prototype.endOfStream = function () {
        alert('资源全部捕获成功，即将下载！')
        //触发原生endOfStream方法操作
        _endOfStream.call(this)
    }

    // 录取资源
    let _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer
    window.MediaSource.prototype.addSourceBuffer = function (mime) {
        //打印媒体类型
        console.log(mime)
        //触发原生addSourceBuffer方法操作
        let sourceBuffer = _addSourceBuffer.call(this, mime)
        let _append = sourceBuffer.appendBuffer
        let bufferList = []
        _sourceBufferList.push({
            mime,
            bufferList,
        })
        sourceBuffer.appendBuffer = function (buffer) {
            $downloadNum.innerHTML = `已捕获 ${_sourceBufferList[0].bufferList.length} 个片段`
            bufferList.push(buffer)
            //为防止网页加载后减慢捕获速度，每次捕获流都会根据现有条件决定是否加快捕获速度
            if (playRate != 1) {
                $domList[0].playbackRate = playRate
            }
            //触发原生的sourceBuffer.appendBuffer方法
            _append.call(this, buffer)
        }
        return sourceBuffer
    }

    // 添加操作的dom至html页面并绑定事件
    function _appendDom() {
        const baseStyle = `
          position: fixed;
          top: 50px;
          right: 50px;
          height: 40px;
          padding: 0 20px;
          z-index: 9999;
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          line-height: 40px;
          text-align: center;
          border-radius: 4px;
          background-color: #3498db;
          box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.3);
        `
        $oneRate.innerHTML = '原速捕获'
        $sixteenRate.innerHTML = '十六倍速捕获'
        $downloadNum.innerHTML = '已捕获 0 个片段'
        $btnDownload.innerHTML = '下载已捕获片段'
        $sixteenRate.style = baseStyle + `top: 150px;`
        $oneRate.style = baseStyle + `top: 200px;`
        $btnDownload.style = baseStyle + `top: 100px;`
        $downloadNum.style = baseStyle
        $btnDownload.addEventListener('click', _download)
        $sixteenRate.addEventListener('click', _changeRatePlay16)
        $oneRate.addEventListener('click', _changeRatePlay1)
        //在head标签元素前插入Dom元素
        document.getElementsByTagName('html')[0].insertBefore($sixteenRate, document.getElementsByTagName('head')[0]);
        document.getElementsByTagName('html')[0].insertBefore($oneRate, document.getElementsByTagName('head')[0]);
        document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
        document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
    }

    _appendDom()
})()
```
