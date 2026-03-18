import { INetWork } from "./NetWorkBase";

export class WsNet implements INetWork {
    private _ws: WebSocket
    constructor(url: string) {
        this._ws = new WebSocket(url)
    }
    decode(data: ArrayBuffer) {

    }
    encode(data: any): ArrayBuffer {
        return
    }
    close(): void {
        this._ws.close()
    }
}