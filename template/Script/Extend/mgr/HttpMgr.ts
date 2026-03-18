// @FilePath: HttpMgr.ts
/*
 * @Author: yyd
 * @Date: 2026-03-09
 * @LastEditTime: 2026-03-12
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\HttpMgr.ts
 * @Description: HTTP 请求管理器 (支持异步、同步、混合多请求、失败重试等)
 */


/** 编解码器接口 */
interface CodecBase {
    encode(data: any): any
    decode(data: any): any
}

@$gb.Identifiable
class _HttpMgr {
    /** GET 请求 */
    async get(urlStr: string, config?: Partial<HttpConfig>): Promise<any> {
        return await this._open("GET", urlStr, config)
    }

    /** POST 请求 */
    async post(urlStr: string, config?: Partial<HttpConfig>): Promise<any> {
        return await this._open("POST", urlStr, config)
    }

    /** 
     * 并发请求多个接口
     * @param requests 请求数组
     * @returns Promise.all 的结果数组
     */
    async all(requests: Array<{ method: "GET" | "POST"; url: string; config?: Partial<HttpConfig> }>): Promise<any[]> {
        const promises = requests.map(req => this._open(req.method, req.url, req.config))
        return await Promise.all(promises)
    }

    /** 
     * 竞速请求 - 哪个先成功就返回哪个
     * @param requests 请求数组
     * @returns 最快成功的请求结果
     */
    async race(requests: Array<{ method: "GET" | "POST"; url: string; config?: Partial<HttpConfig> }>): Promise<any> {
        const promises = requests.map(req => this._open(req.method, req.url, req.config))
        return await Promise.race(promises)
    }

    /** 
     * 通用方法 - 带重试机制
     */
    private async _open(typeStr: "GET" | "POST", urlStr: string, config?: Partial<HttpConfig>): Promise<any> {
        const httpConfig = new HttpConfig(config)
        let lastError: Error | null = null
        const maxRetries = httpConfig.retryCount ?? 0
        const retryDelay = httpConfig.retryDelay ?? 1000

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0 && httpConfig.onRetry) {
                    httpConfig.onRetry(attempt, maxRetries)
                }
                return await this._sendRequest(typeStr, urlStr, httpConfig)
            } catch (error) {
                lastError = error as Error
                if (attempt < maxRetries) {
                    await this._delay(retryDelay * (attempt + 1))
                }
            }
        }

        throw lastError
    }

    /** 
     * 实际发送请求
     */
    private _sendRequest(typeStr: "GET" | "POST", urlStr: string, httpConfig: HttpConfig): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const xmlHttp = new XMLHttpRequest()
            const sendData = !httpConfig.codec ? httpConfig.body : httpConfig.codec.encode(httpConfig.body)

            const timeoutTimer = setTimeout(() => {
                reject(new Error("Request timeout"))
            }, httpConfig.timeoutNum)

            xmlHttp.onreadystatechange = async () => {
                if (xmlHttp.readyState === 4) {
                    clearTimeout(timeoutTimer)
                    if (xmlHttp.status >= 200 && xmlHttp.status < 400) {
                        let result: any
                        switch (xmlHttp.responseType) {
                            case "":
                            case "text":
                                result = xmlHttp.response
                                break
                            case "arraybuffer":
                                const buffer = new Uint8Array(xmlHttp.response)
                                let data = ""
                                for (let kNum = 0; kNum < buffer.byteLength; kNum++) {
                                    data += String.fromCharCode(buffer[kNum])
                                }
                                if (typeof window !== "undefined" && window.btoa) {
                                    result = "data:image/png;base64," + window.btoa(data)
                                } else {
                                    result = xmlHttp.response
                                }
                                break
                            case "blob":
                                if (typeof FileReader !== "undefined") {
                                    result = await new Promise<any>((resolve2) => {
                                        const read = new FileReader()
                                        read.onload = () => {
                                            resolve2(read.result)
                                        }
                                        read.readAsDataURL(xmlHttp.response)
                                    })
                                } else {
                                    result = xmlHttp.response
                                }
                                break
                            case "document":
                                result = xmlHttp.response
                                break
                            case "json":
                                result = xmlHttp.response
                                break
                        }
                        resolve(!httpConfig.codec ? result : httpConfig.codec.decode(result))
                    } else {
                        reject(new Error(`Request failed with status ${xmlHttp.status}`))
                    }
                }
            }

            xmlHttp.onerror = () => {
                clearTimeout(timeoutTimer)
                reject(new Error("Network error"))
            }

            xmlHttp.open(typeStr, urlStr, true)

            if (httpConfig.returnType) {
                xmlHttp.responseType = httpConfig.returnType
            }

            if (cc && cc.sys && cc.sys.isNative) {
                xmlHttp.setRequestHeader("Accept-Encoding", "gzip,deflate")
            }

            if (httpConfig.header) {
                for (const kStr in httpConfig.header) {
                    xmlHttp.setRequestHeader(kStr, httpConfig.header[kStr])
                }
            }

            if (httpConfig.openCallbackFunc) {
                httpConfig.openCallbackFunc(xmlHttp)
            }

            xmlHttp.send(sendData)
        })
    }

    /** 
     * 延迟工具函数
     */
    private _delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

/** 配置信息 */
class HttpConfig {
    constructor(init?: Partial<HttpConfig>) {
        Object.assign(this, init)
    }

    /** 超时时间(ms) */
    timeoutNum = 5000

    /** 返回数据类型 */
    returnType?: XMLHttpRequestResponseType

    /** 编解码器 */
    codec?: CodecBase

    /** 内容 */
    body?: Document | Blob | BufferSource | FormData | URLSearchParams | string

    /** 标头 */
    header?: Record<string, string>

    /** open 后回调 */
    openCallbackFunc?: (http: XMLHttpRequest) => void

    /** 失败重试次数（0 表示不重试） */
    retryCount?: number

    /** 重试间隔(ms) */
    retryDelay?: number

    /** 重试时的回调 */
    onRetry?: (attempt: number, maxRetries: number) => void
}

export const HttpMgr = $gb.SingletonProxy(_HttpMgr)
$gb.registerApp("http", HttpMgr)

export { HttpConfig }
