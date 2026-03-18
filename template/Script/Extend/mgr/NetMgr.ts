import { INetWork, NetWorkState, NetWorkType } from "./net/NetWorkBase";
import { WsNet } from "./net/WsNet";


@$gb.Identifiable
class _NetMgr {
    private netWork: INetWork = null
    private _state: NetWorkState = NetWorkState.INIT
    init(url: string, type: NetWorkType = NetWorkType.WS) {
        if (type === NetWorkType.WS) {
            this.netWork = new WsNet(url)
        }
    }

    reconnect(url: string) {
        this.disconnect()

    }

    disconnect() {
        if (this._state === NetWorkState.CONNECTING || this._state === NetWorkState.CONNECTED) {
            this.netWork?.close()
            this._state = NetWorkState.CLOSED
        }
    }
}

export const netMgr = $gb.SingletonProxy(_NetMgr)
$gb.registerApp("net", netMgr);

