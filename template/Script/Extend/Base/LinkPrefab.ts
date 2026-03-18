// @FilePath: LinkPrefab.ts
const { ccclass, executeInEditMode, property, menu } = cc._decorator;

// 屏蔽2.3.1版本prefab嵌套prefab的弹框问题
if (CC_EDITOR && !window["Editor"].isBuilder) {
    window["_Scene"].DetectConflict.beforeAddChild = function () {
        return false
    }
}

// cc.Object["Flags"].DontSave          // 当前节点不会被保存到prefab文件里
// cc.Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
// cc.Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示

@ccclass
@menu('自定义组件/LinkPrefab')
@executeInEditMode
export default class LinkPrefab extends cc.Component {
    private _realNode: cc.Node = null

    @property({ visible: false })
    private _prefab: cc.Prefab = null

    @property({ type: cc.Prefab, visible: true, displayName: "预制体" })
    set prefab(value: cc.Prefab) {
        this.onPrefabChanged(value)
    }
    get prefab(): cc.Prefab {
        return this._prefab
    }

    onLoad() {
        this.checkRealNode();
    }

    private resetFlag(node: cc.Node) {
        if (CC_EDITOR) {
            node["_objFlags"] |= cc.Object["Flags"].DontSave;
            node["_objFlags"] |= cc.Object["Flags"].LockedInEditor;
            node["_objFlags"] |= cc.Object["Flags"].HideInHierarchy;
        }
    }

    private resetRealNode() {
        if (!this._prefab) {
            return;
        }
        let find = false;
        if (this.node.childrenCount > 0) {
            for (let one of this.node.children) {
                if (one.name == this._prefab.name) {
                    find = true;
                    this._realNode = one;
                }
            }
        }
        if (!find) {
            let newNode = cc.instantiate(this._prefab);
            if (!newNode) {
                return;
            }
            this.resetFlag(newNode);
            newNode.x = 0;
            newNode.y = 0;
            this.node.addChild(newNode, -1) //添加到最底层
            this._realNode = newNode;
            this.resetSize();
        }
    }

    private resetSize() {
        if (this.node.width == 0 && this.node.height == 0) {
            this.node.setContentSize(this._realNode.getContentSize())
        }
        let widget = this._realNode.getComponent(cc.Widget);
        if (widget) {
            widget.enabled = true;
        }
    }

    private onPrefabChanged(newPfab: cc.Prefab) {
        if (this._realNode) {
            this._realNode.destroy();
            this._realNode = null;
        }
        this._prefab = newPfab;
        this.resetRealNode();
    }

    private checkRealNode() {
        if (!this._realNode) {
            this.resetRealNode();
        }
    }

    public getPefabNode(): cc.Node {
        if (!this._realNode) {
            this.resetRealNode();
        }
        return this._realNode
    }

    public getComponentEx<T extends cc.Component>(type: { prototype: T }): T {
        this.checkRealNode();
        let prefabNode = this._realNode
        return prefabNode ? prefabNode.getComponent(type) : null;
    }

    public getRealComponent(name: string) {
        this.checkRealNode();
        let prefabNode = this._realNode
        return prefabNode ? prefabNode.getComponent(name) : null;
    }
}


