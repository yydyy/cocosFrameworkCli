/*
 * @Author: auto-generated
 * @Date: 2026-03-17
 * @Description: 界面注册运行时文件
 * 
 * 此文件由工具自动生成，请勿手动修改
 * 运行 npm run generate-view-map 自动更新
 */

import { UiId, registerViewInfo, WindowType, UiZdxType } from "../Extend/Base/UiDefines";
import { Bundles } from "../Extend/Base/Bundles";

// D:\Documents\cocostools\cocosTools\assets\Script\Extend\ui\PromptBoxView.ts
const PromptBoxViewViewInfo = {
    uid: "PromptBoxView",
    path: "common.view/PromptBoxView",
    bundle: Bundles.common,
    windowType: WindowType.Dialog,
    zdx: UiZdxType.default,
};

// D:\Documents\cocostools\cocosTools\assets\Script\ui\MainView.ts
const MainViewViewInfo = { 
    uid: "MainView",
    path: "view/MainView",
    bundle: Bundles.common,
    windowType: WindowType.Full,
    zdx: UiZdxType.default,
};

// D:\Documents\cocostools\cocosTools\assets\Script\ui\ShowView.ts
const ShowViewViewInfo = {
    uid: "ShowView",
    path: "view/ShowView",
    bundle: Bundles.common,
    windowType: WindowType.Dialog,
    zdx: UiZdxType.default,
};
const viewInfoMap = {
    "PromptBoxView": PromptBoxViewViewInfo,
    "MainView": MainViewViewInfo,
    "ShowView": ShowViewViewInfo
};

// 注册UiId和viewInfo
for (const key in viewInfoMap) {
    const viewName = key as UiIdType;
    if (!UiId[viewName]) {
        UiId[key] = viewName;
    }
    registerViewInfo(viewName, viewInfoMap[key]);
}
