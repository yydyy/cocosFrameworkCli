// @FilePath: render-flow.ts

let _batcher;
let _cullingMask = 0;

/**
 * 当前渲染层级
 */
let renderLevel = 0;

/**
 * 当前渲染优先级
 */
let renderPriority = 0;

/**
 * 渲染器缓存
 */
let rendererCache:cc.RenderComponent[] = [];

/**
 * 渲染器排序
 */
let rendererOrder:boolean = false;

/**
 * 刷新渲染缓存
 */
function flushRendererCache(){
    if(rendererCache.length > 0){
        if(rendererOrder){
            rendererCache.sort((a, b)=>{ return a.renderPriority - b.renderPriority; });
        }
        for(let render of rendererCache){
            // console.log(`${render.node.name} - ${render.renderPriority}`);
            //@ts-ignore
            render._checkBacth(_batcher, render.node._cullingMask);
            //@ts-ignore
            render._assembler.fillBuffers(render, _batcher);
        }
        rendererCache.length = 0;
    }
    rendererOrder = false;
}

//@ts-ignore
cc.RenderFlow.visitRootNode = function (rootNode){
    renderLevel = 0;
    renderPriority = 0;
    rendererCache.length = 0;
    rendererOrder = false;

    //@ts-ignore
    _batcher = cc.RenderFlow.getBachther();
    
    //@ts-ignore
    cc.RenderFlow.validateRenderers();    

    let preCullingMask = _cullingMask;
    _cullingMask = rootNode._cullingMask;

    //@ts-ignore
    if (rootNode._renderFlag & cc.RenderFlow.FLAG_WORLD_TRANSFORM) {
        _batcher.worldMatDirty ++;
        rootNode._calculWorldMatrix();
        //@ts-ignore
        rootNode._renderFlag &= ~cc.RenderFlow.FLAG_WORLD_TRANSFORM;

        //@ts-ignore
        cc.RenderFlow.flows[rootNode._renderFlag]._func(rootNode);
        flushRendererCache();

        _batcher.worldMatDirty --;
    }
    else {
        //@ts-ignore
        cc.RenderFlow.flows[rootNode._renderFlag]._func(rootNode);
        flushRendererCache();
    }

    _cullingMask = preCullingMask;
}

//@ts-ignore
cc.RenderFlow.prototype._render = function (node) {
    let comp = node._renderComponent;
    let preRenderPriority = renderPriority;

    renderPriority = node._sortingEnabled ? node._sortingPriority : renderPriority;
    
    if(node._sortingEnabled){
        // cc.log(`++ ${node.name}`);
        ++renderLevel;
    }
    // cc.log(`${renderLevel} -> ${node.name}`);
    if(renderLevel > 0){
        if(comp instanceof cc.Mask){
            flushRendererCache();

            //@ts-ignore
            comp._checkBacth(_batcher, node._cullingMask);
            //@ts-ignore
            comp._assembler.fillBuffers(comp, _batcher);
        }else{
            if (_batcher.worldMatDirty && comp._assembler.updateWorldVerts) {
                comp._assembler.updateWorldVerts(comp);
            }
            if(comp instanceof sp.Skeleton){
                _batcher.worldMatDirty++;
                //@ts-ignore
                comp.attachUtil._syncAttachedNode();
            }
            rendererCache.push(comp);
            comp.renderPriority = node._sortingEnabled ? node._sortingPriority : renderPriority;
            if(renderPriority != 0){
                rendererOrder = true;
            }
        }
    }else{
        //@ts-ignore
        comp._checkBacth(_batcher, node._cullingMask);
        //@ts-ignore
        comp._assembler.fillBuffers(comp, _batcher);
    }
    this._next._func(node);

    if(node._sortingEnabled){
        // cc.log(`-- ${node.name}`);
        --renderLevel;
        if(renderLevel <= 0){
            flushRendererCache();
        }
    }
    renderPriority = preRenderPriority;

};

//@ts-ignore
cc.RenderFlow.prototype._postRender = function (node) {
    let comp = node._renderComponent;
    if(comp instanceof cc.Mask){
        flushRendererCache();
    }
    comp._checkBacth(_batcher, node._cullingMask);
    comp._assembler.postFillBuffers(comp, _batcher);
    this._next._func(node);
};

//@ts-ignore
cc.RenderFlow.prototype._children = function (node) {
    let cullingMask = _cullingMask;
    let batcher = _batcher;

    let parentOpacity = batcher.parentOpacity;
    let opacity = (batcher.parentOpacity *= (node._opacity / 255));

    if(!node._renderComponent && node._sortingEnabled){
        // cc.log(`++ ${node.name}`);
        ++renderLevel;
    }

    //@ts-ignore
    let worldTransformFlag = batcher.worldMatDirty ? cc.RenderFlow.FLAG_WORLD_TRANSFORM : 0;
    //@ts-ignore
    let worldOpacityFlag = batcher.parentOpacityDirty ? cc.RenderFlow.FLAG_OPACITY_COLOR : 0;
    let worldDirtyFlag = worldTransformFlag | worldOpacityFlag;

    let children = node._children;
    for (let i = 0, l = children.length; i < l; i++) {
        let c = children[i];

        // Advance the modification of the flag to avoid node attribute modification is invalid when opacity === 0.
        c._renderFlag |= worldDirtyFlag;
        if (!c._activeInHierarchy || c._opacity === 0) continue;

        _cullingMask = c._cullingMask = c.groupIndex === 0 ? cullingMask : 1 << c.groupIndex;

        // TODO: Maybe has better way to implement cascade opacity
        let colorVal = c._color._val;
        c._color._fastSetA(c._opacity * opacity);
        // @ts-ignore
        cc.RenderFlow.flows[c._renderFlag]._func(c);
        c._color._val = colorVal;
    }

    batcher.parentOpacity = parentOpacity;

    this._next._func(node);
    
    if(!node._renderComponent && node._sortingEnabled){
        // cc.log(`-- ${node.name}`);
        --renderLevel;
        if(renderLevel <= 0){
            flushRendererCache();
        }
    }
};
