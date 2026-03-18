//////////////////////// unit-base
// invalid pointer value
let POINTER_INVALID_FLAG = 0xffff;
let SPACE_FREE_FLAG = 0x0;
let SPACE_USE_FLAG = 0x1;
let POS_NEXT_FREE = 0;
let POS_FREE_FLAG = 1;

let UnitBase = function (unitID, memPool, contentNum) {
    contentNum = contentNum || 128;

    // set unit id
    this.unitID = unitID;
    this._memPool = memPool;

    this._data = new Uint16Array(2);
    // head of the free content index
    this._data[0] = 0;
    // using segment num
    this._data[1] = 0;

    this._contentNum = contentNum;
    this._signData = new Uint16Array(this._contentNum * 2);
    this._spacesData = [];

    for (let i = 0; i < contentNum; i++) {
        let signIndex = i * 2;
        // store content block index but not sign array index
        this._signData[signIndex + POS_NEXT_FREE] = i + 1;
        this._signData[signIndex + POS_FREE_FLAG] = SPACE_FREE_FLAG;

        this._spacesData[i] = {
            index: i,
            unitID: unitID,
        };
    }
    // last one has no next space;
    this._signData[(contentNum - 1) * 2] = POINTER_INVALID_FLAG;
};

let UnitBaseProto = UnitBase.prototype;
UnitBaseProto.hasSpace = function () {
    return this._data[0] !== POINTER_INVALID_FLAG;
};

UnitBaseProto.isAllFree = function () {
    return this._data[1] == 0;
};

// pop space from unit
UnitBaseProto.pop = function () {
    let headFreeIndex = this._data[0];
    if (headFreeIndex === POINTER_INVALID_FLAG) return null;

    let index = headFreeIndex;
    let signIndex = index * 2;
    let space = this._spacesData[index];

    // set use flag
    this._signData[signIndex + POS_FREE_FLAG] = SPACE_USE_FLAG;

    // store new next free space index
    this._data[0] = this._signData[signIndex + POS_NEXT_FREE];
    // add using segment num
    this._data[1]++;
    return space;
};

// push back to unit
UnitBaseProto.push = function (index) {
    let signIndex = index * 2;

    // set free flag
    this._signData[signIndex + POS_FREE_FLAG] = SPACE_FREE_FLAG;

    // store head free index to the space
    this._signData[signIndex + POS_NEXT_FREE] = this._data[0];
    // update head free index
    this._data[0] = index;
    // sub using segment num
    this._data[1]--;
};

// dump all space info
UnitBaseProto.dump = function () {
    let spaceNum = 0;
    let index = this._data[0];
    let freeStr = "";

    while (index != POINTER_INVALID_FLAG) {
        spaceNum++;
        freeStr += index + "->";
        index = this._signData[index * 2 + POS_NEXT_FREE];
    }

    let usingNum = 0;
    let usingStr = "";
    let contentNum = this._contentNum;
    for (let i = 0; i < contentNum; i++) {
        let freeFlag = this._signData[i * 2 + POS_FREE_FLAG];
        if (freeFlag == SPACE_USE_FLAG) {
            usingNum++;
            usingStr += i + "->";
        }
    }

    let totalNum = spaceNum + usingNum;
    console.log(
        "unitID:", this.unitID,
        "spaceNum:", spaceNum,
        "calc using num:", usingNum,
        'store using num:', this._data[1],
        'calc total num:', totalNum,
        'actually total num:', this._contentNum
    );
    console.log("free info:", freeStr);
    console.log("using info:", usingStr);

    if (usingNum != this._data[1]) {
        LogFunc.error(
            'using num error',
            "calc using num:", usingNum,
            'store using num:', this._data[1]
        );
    }

    if (spaceNum + usingNum != this._contentNum) {
        LogFunc.error(
            'total num error',
            'calc total num:', totalNum,
            'actually total num:', this._contentNum
        );
    }
};

///////////////////////////////////////NodeUnit

const FLOAT_ARRAY_TYPE = (CC_JSB && CC_NATIVERENDERER) ? Float32Array : Float64Array;
const FLOAT_BYTES = (CC_JSB && CC_NATIVERENDERER) ? 4 : 8;

const Uint32_Bytes = 4;
const Uint8_Bytes = 1;

// Space : [Dirty]                                  [Size:4 Uint32]
const Dirty_Type = Uint32Array;
const Dirty_Members = 1;
const Dirty_Stride = Dirty_Members * Uint32_Bytes;

// Space : [TRS]                                    [Size:4 * 10 Float32|Float64]
const TRS_Members = 10;
const TRS_Stride = TRS_Members * FLOAT_BYTES;

// Space : [LocalMatrix]                            [Size:4 * 16 Float32|Float64]
const LocalMatrix_Members = 16;
const LocalMatrix_Stride = LocalMatrix_Members * FLOAT_BYTES;

// Space : [WorldMatrix]                            [Size:4 * 16 Float32|Float64]
const WorldMatrix_Members = 16;
const WorldMatrix_Stride = WorldMatrix_Members * FLOAT_BYTES;

// Space : [sortingPriority]                        [Size:4 * 1 Float32|Float64]
const SortingPriority_Members = 1;
const SortingPriority_Stride = SortingPriority_Members * FLOAT_BYTES;

// Space : [Parent Unit]                            [Size:4 Uint32]
// Space : [Parent Index]                           [Size:4 Uint32]
const Parent_Type = Uint32Array;
const Parent_Members = 2;
const Parent_Stride = Parent_Members * Uint32_Bytes;

// Space : [ZOrder]                                 [Size:4 Uint32]
const ZOrder_Type = Uint32Array;
const ZOrder_Members = 1;
const ZOrder_Stride = ZOrder_Members * Uint32_Bytes;

// Space : [CullingMask]                            [Size:4 Int32]
const CullingMask_Type = Int32Array;
const CullingMask_Members = 1;
const CullingMask_Stride = CullingMask_Members * Uint32_Bytes;

// Space : [Opacity]                                [Size:1 Uint8]
const Opacity_Type = Uint8Array;
const Opacity_Members = 1;
const Opacity_Stride = Opacity_Members * Uint8_Bytes;

// Space : [Is3D]                                   [Size:1 Uint8]
const Is3D_Type = Uint8Array;
const Is3D_Members = 1;
const Is3D_Stride = Is3D_Members * Uint8_Bytes;

// Space : [sortingEnabled]                         [Size:1 Uint8]
const SortingEnabled_Type = Uint8Array;
const SortingEnabled_Members = 1;
const SortingEnabled_Stride = SortingEnabled_Members * Uint8_Bytes;

// Space : [NodePtr]                                [Size:4 * 2 Uint32]
const Node_Type = Uint32Array;
const Node_Members = 2;

// Space : [Skew]                                   [Size:4 * 2 Float32]
const Skew_Members = 2;
const Skew_Stride = Skew_Members * FLOAT_BYTES;

//  let UnitBase = require('./cunit-base');
let NodeUnit = function (unitID, memPool) {
    UnitBase.call(this, unitID, memPool);

    let contentNum = this._contentNum;
    this.trsList = new FLOAT_ARRAY_TYPE(contentNum * TRS_Members);
    this.localMatList = new FLOAT_ARRAY_TYPE(contentNum * LocalMatrix_Members);
    this.worldMatList = new FLOAT_ARRAY_TYPE(contentNum * WorldMatrix_Members);

    if (CC_JSB && CC_NATIVERENDERER) {
        this.dirtyList = new Dirty_Type(contentNum * Dirty_Members);
        this.parentList = new Parent_Type(contentNum * Parent_Members);
        this.zOrderList = new ZOrder_Type(contentNum * ZOrder_Members);
        this.cullingMaskList = new CullingMask_Type(contentNum * CullingMask_Members);
        this.opacityList = new Opacity_Type(contentNum * Opacity_Members);
        this.is3DList = new Is3D_Type(contentNum * Is3D_Members);
        this.nodeList = new Node_Type(contentNum * Node_Members);
        this.skewList = new FLOAT_ARRAY_TYPE(contentNum * Skew_Members);
        this.sortingPriorityList = new FLOAT_ARRAY_TYPE(contentNum * SortingPriority_Stride);
        this.sortingEnabledList = new SortingEnabled_Type(contentNum * SortingEnabled_Stride);

        this._memPool._nativeMemPool.updateNodeData(
            unitID,
            this.dirtyList,
            this.trsList,
            this.localMatList,
            this.worldMatList,
            this.parentList,
            this.zOrderList,
            this.cullingMaskList,
            this.opacityList,
            this.is3DList,
            this.nodeList,
            this.skewList,
            this.sortingPriorityList,
            this.sortingEnabledList
        );
    }

    for (let i = 0; i < contentNum; i++) {
        let space = this._spacesData[i];

        space.trs = new FLOAT_ARRAY_TYPE(this.trsList.buffer, i * TRS_Stride, TRS_Members);
        space.localMat = new FLOAT_ARRAY_TYPE(this.localMatList.buffer, i * LocalMatrix_Stride, LocalMatrix_Members);
        space.worldMat = new FLOAT_ARRAY_TYPE(this.worldMatList.buffer, i * WorldMatrix_Stride, WorldMatrix_Members);

        if (CC_JSB && CC_NATIVERENDERER) {
            space.dirty = new Dirty_Type(this.dirtyList.buffer, i * Dirty_Stride, Dirty_Members);
            space.parent = new Parent_Type(this.parentList.buffer, i * Parent_Stride, Parent_Members);
            space.zOrder = new ZOrder_Type(this.zOrderList.buffer, i * ZOrder_Stride, ZOrder_Members);
            space.cullingMask = new CullingMask_Type(this.cullingMaskList.buffer, i * CullingMask_Stride, CullingMask_Members);
            space.opacity = new Opacity_Type(this.opacityList.buffer, i * Opacity_Stride, Opacity_Members);
            space.is3D = new Is3D_Type(this.is3DList.buffer, i * Is3D_Stride, Is3D_Members);
            space.skew = new FLOAT_ARRAY_TYPE(this.skewList.buffer, i * Skew_Stride, Skew_Members);
            space.sortingPriority = new FLOAT_ARRAY_TYPE(this.sortingPriorityList.buffer, i * SortingPriority_Stride, SortingPriority_Members);
            space.sortingEnabled = new SortingEnabled_Type(this.sortingEnabledList.buffer, i * SortingEnabled_Stride, SortingEnabled_Members);
        }
    }
};

(function () {
    let Super = function () { };
    Super.prototype = UnitBase.prototype;
    NodeUnit.prototype = new Super();
})();

/////////////////////////// ;

let MemPool = function (unitClass) {
    this._unitClass = unitClass;
    this._pool = [];
    this._findOrder = [];

    if (CC_JSB && CC_NATIVERENDERER) {
        this._initNative();
    }
};

let proto = MemPool.prototype;
proto._initNative = function () {
    this._nativeMemPool = new renderer.MemPool();
};

proto._buildUnit = function (unitID) {
    let unit = new this._unitClass(unitID, this);
    if (CC_JSB && CC_NATIVERENDERER) {
        this._nativeMemPool.updateCommonData(unitID, unit._data, unit._signData);
    }
    return unit;
};

proto._destroyUnit = function (unitID) {
    this._pool[unitID] = null;
    for (let idx = 0, n = this._findOrder.length; idx < n; idx++) {
        let unit = this._findOrder[idx];
        if (unit && unit.unitID == unitID) {
            this._findOrder.splice(idx, 1);
            break;
        }
    }
    if (CC_JSB && CC_NATIVERENDERER) {
        this._nativeMemPool.removeCommonData(unitID);
    }
};

proto._findUnitID = function () {
    let unitID = 0;
    let pool = this._pool;
    while (pool[unitID]) unitID++;
    return unitID;
};

proto.pop = function () {
    let findUnit = null;
    let idx = 0;
    let findOrder = this._findOrder;
    let pool = this._pool;
    for (let n = findOrder.length; idx < n; idx++) {
        let unit = findOrder[idx];
        if (unit && unit.hasSpace()) {
            findUnit = unit;
            break;
        }
    }

    if (!findUnit) {
        let unitID = this._findUnitID();
        findUnit = this._buildUnit(unitID);
        pool[unitID] = findUnit;
        findOrder.push(findUnit);
        idx = findOrder.length - 1;
    }

    // swap has space unit to first position, so next find will fast
    let firstUnit = findOrder[0];
    if (firstUnit !== findUnit) {
        findOrder[0] = findUnit;
        findOrder[idx] = firstUnit;
    }

    return findUnit.pop();
};

proto.push = function (info) {
    let unit = this._pool[info.unitID];
    unit.push(info.index);
    if (this._findOrder.length > 1 && unit.isAllFree()) {
        this._destroyUnit(info.unitID);
    }
    return unit;
};

///////////// //////////////
let NodeMemPool = function (unitClass) {
    MemPool.call(this, unitClass);
};

(function(){
    let Super = function(){};
    Super.prototype = MemPool.prototype;
    NodeMemPool.prototype = new Super();
})();

// let proto = NodeMemPool.prototype;
proto._initNative = function () {
    this._nativeMemPool = new renderer.NodeMemPool();
}; 

proto._destroyUnit = function (unitID) {
    MemPool.prototype._destroyUnit.call(this, unitID);
    if (CC_JSB && CC_NATIVERENDERER) {
        this._nativeMemPool.removeNodeData(unitID);
    }
};

module.exports = {
    NodeMemPool: new NodeMemPool(NodeUnit)
};