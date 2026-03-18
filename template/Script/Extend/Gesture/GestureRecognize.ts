// @FilePath: GestureRecognize.ts
import GestureConfig from "./GestureConfig";

//八个方位
enum DirectType {
    Right = 1,
    Right_Up = 2,
    Up = 3,
    Left_Up = 4,
    Left = 5,
    Left_Down = 6,
    Down = 7,
    Right_Down = 8,
}
export { DirectType };

export default class GestureRecognize {
    private static _instance: GestureRecognize;
    public static get instance(): GestureRecognize {
        if (!this._instance) {
            this._instance = new GestureRecognize();
        }
        return this._instance;
    }

    //最大误差
    private gestureMaximumError = 10;



    // 计算方向
    private getDirect(point1: { x, y }, point2: { x, y }) {
        let angle = Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
        if (angle < 0) {
            angle += 360;
        }

        // 根据角度范围确定方向
        if (angle >= 22.5 && angle < 67.5) {
            return DirectType.Right_Up;
        } else if (angle >= 67.5 && angle < 112.5) {
            return DirectType.Up;
        } else if (angle >= 112.5 && angle < 157.5) {
            return DirectType.Left_Up;
        } else if (angle >= 157.5 && angle < 202.5) {
            return DirectType.Left;
        } else if (angle >= 202.5 && angle < 247.5) {
            return DirectType.Left_Down;
        } else if (angle >= 247.5 && angle < 292.5) {
            return DirectType.Down;
        } else if (angle >= 292.5 && angle < 337.5) {
            return DirectType.Right_Down;
        } else {
            return DirectType.Right;
        }
    }

    // 计算两个数组之间的差异
    private getArraySub(a1: Array<number>, a2: Array<number>) {
        let count = 0;

        for (let i = 0; i < a1.length; i++) {
            let item2 = a2[i] || 0;
            count += Math.abs(a1[i] - item2);
        }
        return count;
    }

    // 插值
    public linearInterpolation(points: Array<{ x, y }>, numPoints) {
        // 计算原始点之间的距离
        const distances = points.map((_, i) => {
            if (i === points.length - 1) return 0;
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            return Math.sqrt(dx * dx + dy * dy);
        });

        // 计算总距离
        const totalDistance = distances.reduce((a, b) => a + b, 0);

        // 计算每个插值点之间的距离
        const stepDistance = totalDistance / (numPoints - 2);

        // 初始化插值点数组
        const interpolatedPoints = [];

        // 当前距离和当前点索引
        let currentDistance = 0;
        let currentIndex = 0;

        // 插值
        for (let i = 1; i < numPoints - 1; i++) {
            // 计算当前插值点在原始点数组中的位置
            while (currentDistance + distances[currentIndex] < stepDistance * i) {
                currentDistance += distances[currentIndex];
                currentIndex += 1;
            }

            // 计算当前插值点的位置
            const t = (stepDistance * i - currentDistance) / distances[currentIndex];
            const interpolatedPoint = {
                x: points[currentIndex].x + t * (points[currentIndex + 1].x - points[currentIndex].x),
                y: points[currentIndex].y + t * (points[currentIndex + 1].y - points[currentIndex].y)
            };

            // 添加到插值点数组
            interpolatedPoints.push(interpolatedPoint);
        }

        // 添加开头和结尾点
        interpolatedPoints.unshift(points[0]);
        interpolatedPoints.push(points[points.length - 1]);

        return interpolatedPoints;
    }

    // 计算方向列表
    public getDirectList(points: Array<{ x, y }>) {
        let directList = [];
        for (let i = 0; i < points.length - 1; i++) {
            directList.push(this.getDirect(points[i], points[i + 1]));
        }
        return directList;
    }

    // 手势识别
    public matchGesture(direcList: Array<number>) {

        let min = 10000000;
        let gestureType = null;

        let gestureRec = GestureConfig.Instance.gestureRec;
        for (let key in gestureRec) {
            let gestureData = gestureRec[key];
            let configListArray = gestureData.direcListArray; // 获取手势配置列表

            for (let i = 0; i < configListArray.length; i++) {
                let configList = configListArray[i];
                let count = this.getArraySub(direcList, configList);
                if (count < min) {
                    min = count;
                    gestureType = key;
                }
            }
        }
        if (min > this.gestureMaximumError) {
            gestureType = null;
            console.log("没有匹配到手势")
            return null;
        } else {
            console.log("匹配到手势", gestureRec[gestureType].shape)
            return gestureRec[gestureType].shape
        }


    }

}
