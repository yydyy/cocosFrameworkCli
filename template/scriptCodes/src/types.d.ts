// Cocos Creator 全局类型声明
// 仅供插件编译时使用，不会包含在生成的 .d.ts 中

// 声明全局 cc 命名空间
declare namespace cc {
    class Component {
        node: Node;
        onDestroy?(): void;
    }

    class Node {
        name: string;
        parent: Node | null;
        isValid: boolean;
    }
    function log(...args: any[]): void;
    class Prefab { }
    var sys: any;
    function instantiate(node: Node): Node;
    function isValid(node: any, deep?: boolean): boolean;
}

// 声明全局 $app 对象
declare const $app: any;



