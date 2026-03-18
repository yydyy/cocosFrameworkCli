// Decorators
import { SingleFunc, SingletonProxy, SingleFuncClass } from './Singleton';
import { Identifiable, getOnlyId } from './Identifiable';
import { registerClass, registerCtrlId, registerEvent, registerView, registerApp } from './Registrars';

// 导出装饰器
export {
    SingleFunc,
    SingletonProxy,
    SingleFuncClass,
    Identifiable,
    getOnlyId,
    registerClass,
    registerCtrlId,
    registerEvent,
    registerView,
    registerApp,
};

export default {
    SingleFunc,
    SingletonProxy,
    Identifiable,
    getOnlyId,
    registerClass,
    registerCtrlId,
    registerEvent,
    registerView,
    registerApp
};