// @FilePath: PlatformMgr.ts

/*
 * @Author: yyd
 * @Date: 2024-04-08 19:06:55
 * @LastEditTime: 2026-01-01 17:32:25
 * @FilePath: \cocosTools\assets\Script\Extend\mgr\PlatformMgr.ts
 * @Description:  平台相关
 */

import { ReleaseType } from "./ReleaseType";

@$gb.Identifiable
class PlatformMgr_  {
    get isAndroid(): boolean {
        return this.isPlatform(cc.sys.ANDROID)
    }
    /**ios 或者 ios ipad */
    get isIos(): boolean {
        return this.isPlatform(cc.sys.IPHONE) || this.isPlatform(cc.sys.IPAD)
    }
    get isWechat_game() {
        return this.isPlatform(cc.sys.WECHAT_GAME)
    }
    get isWeb() {
        return cc.sys.isBrowser && !this.isPlatform(cc.sys.WECHAT_GAME)
    }
    /**移动平台原生 */
    get isMobileNative() {
        return cc.sys.isNative && cc.sys.isMobile
    }
    isPlatform(platform: number) {
        return cc.sys.platform == platform
    }
    /**原生平台 */
    get isNative() {
        return cc.sys.isNative
    }
    //vvvvvvvv   wxgame平台独有  vvvvvvvvvv
    /**
   * 分享本地资源出去
   * @param path bundle包+资源路径  bundle.xx/xx
   */
    shareNativeImage(path: string, title: string = "红中麻将", lifeTarget: cc.Node | cc.Component = null) {
        $app.uiTool.unschedule("shareNativeImage")
        if (!path) {
            this.onlyShareScreenImgToWx({}, title)
            return
        }
        $app.load.getRes(path, cc.SpriteFrame, lifeTarget, ReleaseType.AtOnce).then(sf => {
            if (!sf) return
            const canvas = this.isWechat_game ? wx.createCanvas() : document.createElement('canvas'); // wx.createCanvas();
            canvas.width = sf.getOriginalSize().width;
            canvas.height = sf.getOriginalSize().height;
            // 获取 2D 绘图上下文
            const ctx = canvas.getContext('2d')
            const image = $app.platform.isWechat_game ? wx.createImage() : new Image()//web端主要是看 数据
            image.src = sf.getTexture().url
            // console.log("src ", image.src)
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
                const dataURL = canvas.toDataURL('image/png')
                const filePath = wx.env.USER_DATA_PATH + '/temp_share.png'
                const fs = wx.getFileSystemManager()
                fs.writeFile({
                    filePath: filePath,
                    data: dataURL.split(',')[1],
                    encoding: 'base64',
                    success: () => {
                        // 使用本地临时路径分享
                        wx.shareAppMessage({
                            title,
                            imageUrl: filePath,
                        });
                        $app.uiTool.scheduleOnce("shareNativeImage", () => {
                            fs.unlink({ filePath })
                        }, 1000)
                    }
                })
            }
        })
    }
    /**分享 */
    onlyShareScreenImgToWx(screenData?: any, title?: string) {
        var canvas: any = cc.game.canvas
        let width = wx.getSystemInfoSync().screenWidth;
        var that = this;
        // 因为分享的图片要求比例是5:4
        canvas.toTempFilePath({
            x: screenData == undefined ? 0 : screenData.x,
            y: screenData == undefined ? 0 : screenData.y,
            width: screenData == undefined ? canvas.width : screenData.width,
            height: screenData == undefined ? canvas.height : screenData.height,
            destWidth: 500,
            destHeight: 400,
            success: (res) => {
                clog.warn("路径", res.tempFilePath)
                wx.shareAppMessage({
                    imageUrl: res.tempFilePath,
                    title,
                    // success: (res) => {
                    //     LogFunc.log("微信小游戏截图 success == " + JSON.stringify(res))
                    // },
                    // fail: (res) => {
                    //     clog.log("微信小游戏截图 fail == " + JSON.stringify(res))
                    //     if (res.errno == 103) {
                    //         //没有打开保存相册的权限
                    //         const obj: any = {
                    //             scopeSetting: "scope.writePhotosAlbum",
                    //             scopeDes: "保存到相册",
                    //             content: "需要获取您的保存到相册权限，请确认授权，否则无法使用保存到相册功能"
                    //         }
                    //         $app.platform.getScopeSetting(obj)
                    //     }
                    // },
                })
            },
            fail: (res) => {
                clog.log("toTempFilePath fail == " + JSON.stringify(res))
            }
        })
    }
    /**
     * 抖动
     */
    setVibrate(tag: "short" | "long" = "short", type: "heavy" | "medium" | "light" = "heavy") {
        if ("short" == tag) {
            wx.vibrateShort(new class implements WechatMinigame.VibrateShortOption {
                type = type
                fail = (res: WechatMinigame.VibrateShortFailCallbackResult) => { }
                success = (res: WechatMinigame.GeneralCallbackResult) => { }
            })
        }
        else if ("long" == tag) {
            wx.vibrateLong(new class implements WechatMinigame.VibrateShortOption {
                type = type
                fail = (res: WechatMinigame.VibrateShortFailCallbackResult) => { }
                success = (res: WechatMinigame.GeneralCallbackResult) => { }
            })
        }
    }
    /**
    * 监听wx 版本的更新
    */
    listenUpdateRes(callBack?: Function) {
        const updateMgr = wx?.getUpdateManager()
        // }
        updateMgr?.onCheckForUpdate(function (res) {
            clog.log("微信更新  onCheckForUpdate 相关", res)
            if (!res.hasUpdate) return callBack?.()
            wx.showModal({
                title: '发现新版本',
                content: '发现新版本，是否更新？',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        updateMgr.applyUpdate();
                    }
                }
            });
        })
    }
    /**复制到剪切板 */
    copyToClipboard(str: string) {
        wx.setClipboardData({
            data: str,
            success: function (res) {
                wx.showToast({
                    title: '复制成功',
                    icon: 'success',
                    duration: 2000
                });
            },
            fail: function (err) {
                wx.showToast({
                    title: '复制失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    }
    /**
  * 微信小游戏获取各种权限  1
  * @param auth
  * @param callback
  */
    getSettingWxScope(auth: string, node: cc.Node, okCall: (res: any) => void, failedCall: (res) => void) {
        wx.getSetting({
            // withSubscriptions: true,
            success(res) {
                if (res.authSetting[auth]) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                    okCall(null)
                } else {
                    clog.log("没有授权,重新创建按钮来授权")
                    //申请权限 
                    this.createLoginButtionAtNode(node, failedCall)
                }
            }
        })
    }
    // 获取微信小游戏权限   2
    getScopeSetting(scopeSettingObj: { scopeSetting: string, scopeDes: string, content: any }) {
        clog.log("getScopeSetting.. ", scopeSettingObj)
        wx.getSetting({
            success: (res) => {
                if (res.authSetting[scopeSettingObj.scopeSetting] != undefined && res.authSetting[scopeSettingObj.scopeSetting] != true) {//非初始化进入该页面,且未授权
                    wx.showModal({
                        title: '是否授权' + scopeSettingObj.scopeDes,
                        content: scopeSettingObj.content,
                        success: function (res) {
                            if (res.cancel) {
                                wx.showToast({
                                    title: '拒绝授权，获取' + scopeSettingObj.scopeDes + '权限失败',
                                    icon: 'success',
                                    // duration: 1000
                                })
                            } else if (res.confirm) {
                                wx.openSetting({
                                    success: function (dataAu) {
                                        if (dataAu.authSetting[scopeSettingObj.scopeSetting] == true) {
                                            wx.showToast({
                                                title: '授权成功',
                                                icon: 'none',
                                                // duration: 1000
                                            })
                                        } else {
                                            wx.showToast({
                                                title: '拒绝授权，获取' + scopeSettingObj.scopeDes + '权限失败',
                                                icon: 'success',
                                                // duration: 1000
                                            })
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }

    /**米大师支付 */
    buyMidasPayment(dataObj: {}, callback: (res: any) => void) {
        const data: WechatMinigame.RequestMidasPaymentOption = {
            mode: "game",
            currencyType: "CNY",
            env: 0,
            offerId: "",
            platform: "android",
            buyQuantity: 0,
            outTradeNo: Date.now().toString(),
            success: (res) => {
                callback(res)
            },
            fail: (res) => {
                callback(res)
            }
        }
        for (let k in dataObj) {
            if (Reflect.has(data, k))
                data[k] = dataObj[k]
        }
        clog.log("buyMidasPayment 参数", data)
        wx.requestMidasPayment(data)
    }
    /**
    * 创建一个透明的区域，叠加在一个cocos登陆图片上面，点击这个区域，就触发登陆
    * 在wx小游戏环境才有用，用完需要调用hide destroy show来控制按钮状态
    */
    private _createLoginButton(point: cc.Vec2, size: cc.Size, callBack: Function) {
        let button = wx.createUserInfoButton({
            type: 'text',
            text: '',
            // image: "images/ksyx.png",//图片的位置是在打包构建后的bulid里的根目录开始而不是项目目录
            style: {
                left: point.x,
                top: point.y,
                width: size.width,
                height: size.height,
                // backgroundColor: '#00000088',//最后两位为透明度
                backgroundColor: '#ff000000',
                fontSize: 22,
                color: '#ffffff',
                textAlign: "center",
                borderColor: "",
                borderRadius: 0,
                borderWidth: 0,
                lineHeight: 0
            }
        });
        button.onTap((res) => {
            clog.log("小游戏登陆 002")
            callBack()
            button.destroy()
        });
        button.show()
        return button
    }
    /**
     * 创建一个cocos node 位置上的透明图片
     * @param node 
     * @param callBack 
     * @returns 
     */
    createLoginButtionAtNode(node: cc.Node, callBack: Function) {
        return this._createLoginButton(this._cocosNodeToWXPoint(node), node.getContentSize(), callBack)
    }
    /**转换位置 */
    private _cocosNodeToWXPoint(node: cc.Node) {
        let p = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let scale = wx.getWindowInfo().screenWidth / cc.view.getVisibleSize().width;
        let x = (p.x - node.getContentSize().width / 2) * scale;
        let y = (cc.view.getVisibleSize().height - p.y - node.getContentSize().height / 2) * scale;
        return cc.v2(x, y);
    }
    //^^^^^^  wxgame平台独有  ^^^^^^^
}
export const PlatformMgr = $gb.SingletonProxy(PlatformMgr_)
