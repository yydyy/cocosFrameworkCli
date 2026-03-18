// @FilePath: node.ts

//@ts-ignore
const nodeMemPool = require('./indexExtend').NodeMemPool
 
declare module cc {
    export interface Node {
        
        /**
         * 排序优先级 - private
         */
        _sortingPriority:number;

        /**
         * 排序优先级
         */
        sortingPriority:number;

        /**
         * 排序优使能 - private
         */
        _sortingEnabled:boolean;

        /**
         * 排序优使能
         */
        sortingEnabled:boolean;
    }
}

if(!('sortingPriority' in cc.Node.prototype)){
    Object.defineProperty(cc.Node.prototype, 'sortingPriority', {
        get: function() { 
            return this._sortingPriority; 
        },
        set: function(value) { 
            this._sortingPriority = value;
            // console.log(`sortingPriority ${this.name} ${value}`);
            if(CC_JSB){
                this._sortingPriorityProxy[0] = value;
            }
        },
        enumerable: true
    });

    Object.defineProperty(cc.Node.prototype, 'sortingEnabled', {
        get: function() { 
            return this._sortingEnabled; 
        },
        set: function(value) { 
            this._sortingEnabled = value;
            // console.log(`sortingEnabled ${this.name} ${value}`);
            if(CC_JSB){
                this._sortingEnabledProxy[0] = value ? 1 : 0;
            }
        },
        enumerable: true
    });
}

if(CC_JSB){
    //@ts-ignore
    cc.Node.prototype._initDataFromPool = function(){
        if (!this._spaceInfo) {
            if (CC_EDITOR || CC_TEST) {
                this._spaceInfo = {
                    trs: new Float64Array(10),
                    localMat: new Float64Array(16),
                    worldMat: new Float64Array(16),
                };
            } else {
                this._spaceInfo = nodeMemPool.pop();
            }
        }

        let spaceInfo = this._spaceInfo;
        this._matrix = cc.mat4(spaceInfo.localMat);
        cc.Mat4.identity(this._matrix);
        this._worldMatrix = cc.mat4(spaceInfo.worldMat);
        cc.Mat4.identity(this._worldMatrix);
        this._localMatDirty = 0xffff;
        this._worldMatDirty = true;
        this._sortingPriorityProxy = spaceInfo.sortingPriority;
        this._sortingEnabledProxy = spaceInfo.sortingEnabled;

        let trs = this._trs = spaceInfo.trs;
        trs[0] = 0; // position.x
        trs[1] = 0; // position.y
        trs[2] = 0; // position.z
        trs[3] = 0; // rotation.x
        trs[4] = 0; // rotation.y
        trs[5] = 0; // rotation.z
        trs[6] = 1; // rotation.w
        trs[7] = 1; // scale.x
        trs[8] = 1; // scale.y
        trs[9] = 1; // scale.z
    }

    //@ts-ignore
    cc.Node.prototype._backDataIntoPool = function() {
        if (!(CC_EDITOR || CC_TEST)) {
            // push back to pool
            nodeMemPool.push(this._spaceInfo);
            this._sortingPriorityProxy = null;
            this._sortingEnabledProxy = null;
            this._matrix = null;
            this._worldMatrix = null;
            this._trs = null;
            this._spaceInfo = null;
        }
    }
}
