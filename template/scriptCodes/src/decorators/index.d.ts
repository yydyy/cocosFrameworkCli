import { SingleFunc, SingletonProxy, SingleFuncClass } from './Singleton';
import { Identifiable, getOnlyId } from './Identifiable';
import { registerClass, registerCtrlId, registerEvent, registerView, registerApp } from './Registrars';
export { SingleFunc, SingletonProxy, SingleFuncClass, Identifiable, getOnlyId, registerClass, registerCtrlId, registerEvent, registerView, registerApp, };
declare const _default: {
    SingleFunc: typeof SingleFunc;
    SingletonProxy: typeof SingletonProxy;
    Identifiable: typeof Identifiable;
    getOnlyId: typeof getOnlyId;
    registerClass: typeof registerClass;
    registerCtrlId: typeof registerCtrlId;
    registerEvent: typeof registerEvent;
    registerView: typeof registerView;
    registerApp: typeof registerApp;
};
export default _default;
