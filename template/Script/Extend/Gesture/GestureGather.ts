// @FilePath: GestureGather.ts


import GestureRecognize from "./GestureRecognize";


const { ccclass, property } = cc._decorator;

@ccclass
export default class GestureGather extends cc.Component {

    @property(cc.Graphics)
    graphics: cc.Graphics = null;

    @property(cc.Color)
    color: cc.Color = cc.Color.RED;

    private _recordPoints: cc.Vec2[] = [];

    get recordPoints() {
        return this._recordPoints;
    }
    set recordPoints(value) {
        this._recordPoints = value;
    }

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }


    private onTouchStart(event: cc.Event.EventTouch) {
        this.recordPoints = [];
        this.graphics.clear();
        this.graphics.strokeColor = this.color;
        this.graphics.moveTo(event.getLocationX(), event.getLocationY());

        this.recordPoints.push(new cc.Vec2(event.getLocationX(), event.getLocationY()));
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        this.graphics.lineTo(event.getLocationX(), event.getLocationY());
        this.graphics.stroke(); //绘制线条
        this.recordPoints.push(new cc.Vec2(event.getLocationX(), event.getLocationY()));
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        this.graphics.stroke(); //绘制线条
        this.recordPoints.push(new cc.Vec2(event.getLocationX(), event.getLocationY()));
        this.checkGesture();
    }

    private onTouchCancel(event: cc.Event.EventTouch) {

        this.onTouchEnd(event);
    }



    public checkGesture() {
        let data = GestureRecognize.instance.linearInterpolation(this.recordPoints, 10);

        this.graphics.clear();
        this.graphics.strokeColor = cc.Color.WHITE;
        this.graphics.moveTo(data[0].x, data[0].y);

        for (let i = 1; i < data.length; i++) {
            this.graphics.lineTo(data[i].x, data[i].y);
            this.graphics.stroke(); //绘制线条
        }

        let directrList = GestureRecognize.instance.getDirectList(data);

        console.log("手势方向", directrList);

        let gestureType = GestureRecognize.instance.matchGesture(directrList);

    }
}

