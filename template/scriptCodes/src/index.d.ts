import './extensions';
import './extensions/Clog';
import './extensions/SafeAsync';
import './core/RegisterClass';
import { _ccArray, ccArray } from './extensions/Array';
import { SingleFunc, SingletonProxy, Identifiable, getOnlyId, registerClass, registerCtrlId, registerEvent, registerView, registerApp } from './decorators';
declare const $gb: {
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
type GlobalObjectType = typeof $gb;
type CcArrayFactoryType = typeof ccArray;
type CcArrayClassType = typeof _ccArray;
declare global {
    interface Window {
        $gb: GlobalObjectType;
        _ccArray: CcArrayClassType;
        ccArray: CcArrayFactoryType;
    }
    const $gb: GlobalObjectType;
    const ccArray: CcArrayFactoryType;
    const _ccArray: CcArrayClassType;
    type ccArrayType<T> = _ccArray<T>;
}
export { _ccArray, ccArray, $gb };
export default $gb;
