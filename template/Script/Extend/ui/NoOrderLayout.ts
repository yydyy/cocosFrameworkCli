/*
 * @Author: yyd
 * @Date: 2024-04-11 10:09:39
 * @LastEditTime: 2025-10-17 10:08:34
 * @FilePath: \cocosTools\assets\Script\Extend\ui\NoOrderLayout.ts
 * @Description:  自定义layout 
 */

const { ccclass, property, menu, inspector, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
@menu("通用/NoOrderLayout")
// @inspector("'packages://inspector/inspectors/comps/cclayout.js'")
export default class NoOrderLayout extends cc.Layout {
    @property()
    private _isRef: boolean = false
    @property({ type: cc.Boolean, tooltip: CC_DEV && "点击主动触发刷新" })
    get isRef() {
        return this._isRef;
    }
    set isRef(value: boolean) {
        this._isRef = value;
        if (this._isRef) {
            this.checkValid()
            this.updateLayout();
            this._isRef = false
        }
    }

    // @property()
    // private _isSlope: boolean = false
    // @property({ type: cc.Boolean, tooltip: CC_DEV && "是否启用斜率计算child的x轴,目前只支持竖直方向" })
    // get isSlope() {
    //     return this._isSlope;
    // }
    // set isSlope(value: boolean) {
    //     if (this.type != cc.Layout.Type.VERTICAL) return
    //     this._isSlope = value;
    //     if (this.excludeChildNames) {
    //         this.excludeChildNames.length = 0
    //         this.excludeChildNames.pushCheck("pingNode")
    // }
    // }    
    // /**需要排除的 子节点名字 */
    // @property({
    //     type: [cc.String], tooltip: CC_DEV && "需排除的子节点名字", visible() {
    //         return this.isSlope
    //     },
    // })
    // readonly excludeChildNames: string[] = ["pingNode"];
    // @property({ type: cc.Float, tooltip: CC_DEV && "传入斜率" })
    // readonly slopek: number = 0.1
    // /**起始坐标 */
    // @property({ type: cc.Vec2, tooltip: CC_DEV && "第一个child的坐标" })
    // readonly beginVec2: cc.Vec2 = cc.v2(0, 0)

    //子节点添加的顺序
    private _childAddIndexArray: ccArrayType<cc.Node> = ccArray()
    /**
     * 排列的节点集合
     */
    get eleChildren() {
        return this._childAddIndexArray
    }

    /**
     * 根据传入的y 计算出x坐标
     * @param y 
     * @returns x
     */
    // slopeXFun(y: number) {
    //     return this.beginVec2.x + (y - this.beginVec2.y) / this.slopek
    // }

    /**
     * 主动监测没有父节点的节点 特别是enable=false的时候 使用
     */
    checkValid() {
        for (let a = this._childAddIndexArray.length - 1; a >= 0; a--) {
            const child = this._childAddIndexArray[a]
            if (!child || !child.isValid || !child.parent) {
                this._childAddIndexArray.splice(a, 1)
            }
        }
    }
    /**
     * 主动加入集合中 特别是enable=false的时候 使用  会重置
     * @param ele 
     */
    pushOrReset(ele: cc.Node) {
        if (!this._childAddIndexArray.includes(ele)) {
            this._childAddIndexArray.push(ele)
        }
        else {
            this._childAddIndexArray.deleteElement(ele)
            this._childAddIndexArray.push(ele)
        }
    }
    /**
     * 直接添加 不重置
     * @param ele 
     */
    push(ele: cc.Node) {
        const isTrue = this._childAddIndexArray.pushCheck(ele)
        // if (!isTrue) {
        //     clog.warn("没有添加成功", ele.name)
        // } else {
        //     clog.warn("添加成功", ele.name)
        // }
    }
    __preload() {
        this.node.children.forEach(child => {
            this.push(child)
        })
        // this._changeThisToMiddle()
    }

    private _addEventListeners() {
        cc.director.on(cc.Director.EVENT_AFTER_UPDATE, this.updateLayout, this);
        //@ts-ignore
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this._resized, this);
        //@ts-ignore
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
        this.node.on(cc.Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.node.on(cc.Node.EventType.CHILD_REMOVED, this._childRemoved, this);
        // this.node.on(cc.Node.EventType.CHILD_REORDER, this._doLayoutDirty, this);
        this._addChildrenEventListeners()
    }
    private _removeEventListeners() {
        cc.director.off(cc.Director.EVENT_AFTER_UPDATE, this.updateLayout, this);
        //@ts-ignore
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this._resized, this);
        //@ts-ignore
        this.node.off(cc.Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
        this.node.off(cc.Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.node.off(cc.Node.EventType.CHILD_REMOVED, this._childRemoved, this);
        // this.node.off(cc.Node.EventType.CHILD_REORDER, this._doLayoutDirty, this);
        this._removeChildrenEventListeners();
    }
    private _childAdded(child: cc.Node) {
        //@ts-ignore
        super._childAdded(child)
        // child.on(cc.Node.EventType.SCALE_CHANGED, this._doScaleDirty, this);
        // //@ts-ignore
        // child.on(cc.Node.EventType.SIZE_CHANGED, this._doLayoutDirty, this);
        // //@ts-ignore
        // child.on(cc.Node.EventType.POSITION_CHANGED, this._doLayoutDirty, this);
        // //@ts-ignore
        // child.on(cc.Node.EventType.ANCHOR_CHANGED, this._doLayoutDirty, this);
        // child.on('active-in-hierarchy-changed', this._notifyChildAct, this)
        const temp = child as any
        if (temp.isTop) {//去最上方
            if (this.verticalDirection === cc.Layout.VerticalDirection.TOP_TO_BOTTOM) {
                this._childAddIndexArray.unshift(temp)
                return
            }
        }
        this.push(temp)
    }
    private _childRemoved(child: cc.Node) {
        //@ts-ignore
        super._childRemoved(child)
        // child.off('active-in-hierarchy-changed', this._notifyChildAct, this);
        this._childAddIndexArray.deleteElement(child)
    }
    private _addChildrenEventListeners() {
        // const children = this.node.children;
        // for (var i = 0; i < children.length; ++i) {
        //     var child = children[i]
        //     child.on('active-in-hierarchy-changed', this._notifyChildAct, this)
        // }
        //@ts-ignore
        super._addChildrenEventListeners()
    }
    private _removeChildrenEventListeners() {
        // const children = this.node.children;
        // for (var i = 0; i < children.length; ++i) {
        //     var child = children[i]
        //     child.off('active-in-hierarchy-changed', this._notifyChildAct, this)
        // }
        //@ts-ignore
        super._removeChildrenEventListeners()
    }

    /**
     * 刷新
     * @param child 
     */
    private _notifyChildAct(refChild: cc.Node) {
        const idx = this._childAddIndexArray.indexOf(refChild)
        if (idx >= 0) {
            // const item = refChild.getComponent(ItemBase)
            // item?.parent?.refAttribute(item)
            // for (let a = idx + 1; a < this._childAddIndexArray.length; a++) {
            //     const child = this._childAddIndexArray[a]
            //     const item = child.getComponent(ItemBase)
            //     item?.refAttribute()
            //     // cc.log("刷新", a)
            // }
        }
    }

    _doLayout() {
        //@ts-ignore
        super._doLayout()
        // this._changeThisToMiddle()
    }

    _doLayoutVertically(baseHeight: number, columnBreak: boolean, fnPositionX, applyChildren: boolean) {
        var layoutAnchor = this.node.getAnchorPoint();
        // const isSome = this.node.children.some(child => !child.getComponent(ItemBase))
        // if (isSome) {
        //     cc.warn("当前排序中有非itemBase组件的节点，请检查")
        // }
        var children = this._childAddIndexArray =ccArray.from(this._childAddIndexArray.filter(child => child.isValid))

        var sign = 1;
        var paddingY = this.paddingBottom;
        var bottomBoundaryOfLayout = -layoutAnchor.y * baseHeight;
        if (this.verticalDirection === cc.Layout.VerticalDirection.TOP_TO_BOTTOM) {
            sign = -1;
            bottomBoundaryOfLayout = (1 - layoutAnchor.y) * baseHeight;
            paddingY = this.paddingTop;
        }

        var nextY = bottomBoundaryOfLayout + sign * paddingY - sign * this.spacingY;
        var columnMaxWidth = 0;
        var tempMaxWidth = 0;
        var secondMaxWidth = 0;
        var column = 0;
        var containerResizeBoundary = 0;
        var maxWidthChildAnchorX = 0;

        var activeChildCount = 0
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.activeInHierarchy) {
                activeChildCount++;
            }
        }
        var newChildHeight = this.cellSize.height;
        if (this.type !== cc.Layout.Type.GRID && this.resizeMode === cc.Layout.ResizeMode.CHILDREN) {
            newChildHeight = (baseHeight - (this.paddingTop + this.paddingBottom) - (activeChildCount - 1) * this.spacingY) / activeChildCount;
        }

        for (var i = 0; i < children.length; ++i) {
            // for (let addIdx in childAddIdxList) {
            var child = children[i]
            //@ts-ignore
            let childScaleX = this._getUsedScaleValue(child.scaleX);
            //@ts-ignore
            let childScaleY = this._getUsedScaleValue(child.scaleY);
            if (!child.activeInHierarchy) {
                continue;
            }

            //for resizing children
            if (this.resizeMode === cc.Layout.ResizeMode.CHILDREN) {
                child.height = newChildHeight / childScaleY;
                if (this.type === cc.Layout.Type.GRID) {
                    child.width = this.cellSize.width / childScaleX;
                }
            }

            var anchorY = child.anchorY;
            var childBoundingBoxWidth = child.width * childScaleX;
            var childBoundingBoxHeight = child.height * childScaleY;

            if (secondMaxWidth > tempMaxWidth) {
                tempMaxWidth = secondMaxWidth;
            }

            if (childBoundingBoxWidth >= tempMaxWidth) {
                secondMaxWidth = tempMaxWidth;
                tempMaxWidth = childBoundingBoxWidth;
                maxWidthChildAnchorX = child.getAnchorPoint().x;
            }

            if (this.verticalDirection === cc.Layout.VerticalDirection.TOP_TO_BOTTOM) {
                anchorY = 1 - child.anchorY;
            }
            nextY = nextY + sign * anchorY * childBoundingBoxHeight + sign * this.spacingY;
            var topBoundaryOfChild = sign * (1 - anchorY) * childBoundingBoxHeight;

            if (columnBreak) {
                var columnBreakBoundary = nextY + topBoundaryOfChild + sign * (sign > 0 ? this.paddingTop : this.paddingBottom);
                var bottomToTopColumnBreak = this.verticalDirection === cc.Layout.VerticalDirection.BOTTOM_TO_TOP && columnBreakBoundary > (1 - layoutAnchor.y) * baseHeight;
                var topToBottomColumnBreak = this.verticalDirection === cc.Layout.VerticalDirection.TOP_TO_BOTTOM && columnBreakBoundary < -layoutAnchor.y * baseHeight;

                if (bottomToTopColumnBreak || topToBottomColumnBreak) {
                    if (childBoundingBoxWidth >= tempMaxWidth) {
                        if (secondMaxWidth === 0) {
                            secondMaxWidth = tempMaxWidth;
                        }
                        columnMaxWidth += secondMaxWidth;
                        secondMaxWidth = tempMaxWidth;
                    }
                    else {
                        columnMaxWidth += tempMaxWidth;
                        secondMaxWidth = childBoundingBoxWidth;
                        tempMaxWidth = 0;
                    }
                    nextY = bottomBoundaryOfLayout + sign * (paddingY + anchorY * childBoundingBoxHeight);
                    column++;
                }
            }

            var finalPositionX = fnPositionX(child, columnMaxWidth, column);
            if (baseHeight >= (childBoundingBoxHeight + (this.paddingTop + this.paddingBottom))) {
                if (applyChildren) {
                    child.setPosition(cc.v2(finalPositionX, nextY));
                }
            }

            var signX = 1;
            var tempFinalPositionX;
            //when the item is the last column break item, the tempMaxWidth will be 0.
            var rightMarign = (tempMaxWidth === 0) ? childBoundingBoxWidth : tempMaxWidth;

            if (this.horizontalDirection === cc.Layout.HorizontalDirection.RIGHT_TO_LEFT) {
                signX = -1;
                containerResizeBoundary = containerResizeBoundary || this.node.width;
                tempFinalPositionX = finalPositionX + signX * (rightMarign * maxWidthChildAnchorX + this.paddingLeft);
                if (tempFinalPositionX < containerResizeBoundary) {
                    containerResizeBoundary = tempFinalPositionX;
                }
            }
            else {
                containerResizeBoundary = containerResizeBoundary || -this.node.width;
                tempFinalPositionX = finalPositionX + signX * (rightMarign * maxWidthChildAnchorX + this.paddingRight);
                if (tempFinalPositionX > containerResizeBoundary) {
                    containerResizeBoundary = tempFinalPositionX;
                }
            }

            nextY += topBoundaryOfChild;
        }
        return containerResizeBoundary
    }

    //
    _doLayoutHorizontally(baseWidth: number, rowBreak: boolean, fnPositionY: (child: cc.Node, rowMaxHeight?: number, row?: number) => number, applyChildren: boolean) {
        var layoutAnchor = this.node.getAnchorPoint();
        // const isSome = this.node.children.some(child => !child.getComponent(ItemBase))
        // if (isSome) {
        //     cc.warn("当前排序中有非itemBase组件的节点，请检查")
        // }
        var children = this._childAddIndexArray = ccArray.from(this._childAddIndexArray.filter(child => child.isValid))

        var sign = 1;
        var paddingX = this.paddingLeft;
        var leftBoundaryOfLayout = -layoutAnchor.x * baseWidth;
        if (this.horizontalDirection === cc.Layout.HorizontalDirection.RIGHT_TO_LEFT) {
            sign = -1;
            leftBoundaryOfLayout = (1 - layoutAnchor.x) * baseWidth;
            paddingX = this.paddingRight;
        }

        var nextX = leftBoundaryOfLayout + sign * paddingX - sign * this.spacingX;
        var rowMaxHeight = 0;
        var tempMaxHeight = 0;
        var secondMaxHeight = 0;
        var row = 0;
        var containerResizeBoundary = 0;

        var maxHeightChildAnchorY = 0;

        var activeChildCount = 0
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.activeInHierarchy) {
                activeChildCount++;
                // const item = child.getComponent(ItemBase)
                // if (item)
                //     childAddIdxList[item.addIdx] = child;
            }
        }

        var newChildWidth = this.cellSize.width;
        if (this.type !== cc.Layout.Type.GRID && this.resizeMode === cc.Layout.ResizeMode.CHILDREN) {
            newChildWidth = (baseWidth - (this.paddingLeft + this.paddingRight) - (activeChildCount - 1) * this.spacingX) / activeChildCount;
        }

        for (var i = 0; i < children.length; ++i) {
            // for (let addIdx in childAddIdxList) {
            var child = children[i]
            //@ts-ignore
            let childScaleX = this._getUsedScaleValue(child.scaleX);
            //@ts-ignore
            let childScaleY = this._getUsedScaleValue(child.scaleY);
            if (!child.activeInHierarchy) {
                continue;
            }

            //for resizing children
            //@ts-ignore
            if (this._resize === cc.Layout.ResizeMode.CHILDREN) {
                child.width = newChildWidth / childScaleX;
                if (this.type === cc.Layout.Type.GRID) {
                    child.height = this.cellSize.height / childScaleY;
                }
            }

            var anchorX = child.anchorX;
            var childBoundingBoxWidth = child.width * childScaleX;
            var childBoundingBoxHeight = child.height * childScaleY;

            if (secondMaxHeight > tempMaxHeight) {
                tempMaxHeight = secondMaxHeight;
            }

            if (childBoundingBoxHeight >= tempMaxHeight) {
                secondMaxHeight = tempMaxHeight;
                tempMaxHeight = childBoundingBoxHeight;
                maxHeightChildAnchorY = child.getAnchorPoint().y;
            }

            if (this.horizontalDirection === cc.Layout.HorizontalDirection.RIGHT_TO_LEFT) {
                anchorX = 1 - child.anchorX;
            }
            nextX = nextX + sign * anchorX * childBoundingBoxWidth + sign * this.spacingX;
            var rightBoundaryOfChild = sign * (1 - anchorX) * childBoundingBoxWidth;

            if (rowBreak) {
                var rowBreakBoundary = nextX + rightBoundaryOfChild + sign * (sign > 0 ? this.paddingRight : this.paddingLeft);
                var leftToRightRowBreak = this.horizontalDirection === cc.Layout.HorizontalDirection.LEFT_TO_RIGHT && rowBreakBoundary > (1 - layoutAnchor.x) * baseWidth;
                var rightToLeftRowBreak = this.horizontalDirection === cc.Layout.HorizontalDirection.RIGHT_TO_LEFT && rowBreakBoundary < -layoutAnchor.x * baseWidth;

                if (leftToRightRowBreak || rightToLeftRowBreak) {

                    if (childBoundingBoxHeight >= tempMaxHeight) {
                        if (secondMaxHeight === 0) {
                            secondMaxHeight = tempMaxHeight;
                        }
                        rowMaxHeight += secondMaxHeight;
                        secondMaxHeight = tempMaxHeight;
                    }
                    else {
                        rowMaxHeight += tempMaxHeight;
                        secondMaxHeight = childBoundingBoxHeight;
                        tempMaxHeight = 0;
                    }
                    nextX = leftBoundaryOfLayout + sign * (paddingX + anchorX * childBoundingBoxWidth);
                    row++;
                }
            }

            var finalPositionY = fnPositionY(child, rowMaxHeight, row);
            if (baseWidth >= (childBoundingBoxWidth + this.paddingLeft + this.paddingRight)) {
                if (applyChildren) {
                    child.setPosition(cc.v2(nextX, finalPositionY));
                }
            }

            var signX = 1;
            var tempFinalPositionY;
            var topMarign = (tempMaxHeight === 0) ? childBoundingBoxHeight : tempMaxHeight;

            if (this.verticalDirection === cc.Layout.VerticalDirection.TOP_TO_BOTTOM) {
                containerResizeBoundary = containerResizeBoundary || this.node.height;
                signX = -1;
                tempFinalPositionY = finalPositionY + signX * (topMarign * maxHeightChildAnchorY + this.paddingBottom);
                if (tempFinalPositionY < containerResizeBoundary) {
                    containerResizeBoundary = tempFinalPositionY;
                }
            }
            else {
                containerResizeBoundary = containerResizeBoundary || -this.node.height;
                tempFinalPositionY = finalPositionY + signX * (topMarign * maxHeightChildAnchorY + this.paddingTop);
                if (tempFinalPositionY > containerResizeBoundary) {
                    containerResizeBoundary = tempFinalPositionY;
                }
            }

            nextX += rightBoundaryOfChild;
        }
        return containerResizeBoundary;
    }
}
//@ts-ignore
// $app.NoOrderLayout=NoOrderLayout