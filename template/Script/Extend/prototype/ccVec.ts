// @FilePath: ccVec.ts
/*
 * @Author: yyd
 * @Date: 2024-06-17 09:45:03
 * @LastEditTime: 2024-06-17 09:49:35
 * @FilePath: \trunk\assets\script\extend\ccVec.ts
 * @Description:  扩展cc.Vec2  cc.Vec3  
 */

declare namespace cc {
    interface Vec2 {
        /**
         * 转换为vec3 并设置z值 不传为0
         */
        toVec3(z?: number): Vec3;
    }
    interface Vec3 {
        /**
         * 转换为vec2 抛弃z值
         */
        toVec2(): Vec2;
    }
}

cc.Vec2.prototype.toVec3 = function (z?: number) {
    return new cc.Vec3(this.x, this.y, z || 0);
}

cc.Vec3.prototype.toVec2 = function () {
    return new cc.Vec2(this.x, this.y);
}