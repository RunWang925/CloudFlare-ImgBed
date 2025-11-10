import { getDatabase } from '../../../utils/databaseAdapter.js';

export async function onRequest(context) {
    // 页面设置相关，GET方法读取设置，POST方法保存设置
    const {
      request, // same as existing Worker API
      env, // same as existing Worker API
      params, // if filename includes [id] or [[path]]
      waitUntil, // same as ctx.waitUntil in existing Worker API
      next, // used for middleware or to fetch assets
      data, // arbitrary space for passing data between middlewares
    } = context;

    const db = getDatabase(env);

    // GET读取设置
    if (request.method === 'GET') {
        const settings = await getPageConfig(db, env)

        return new Response(JSON.stringify(settings), {
            headers: {
                'content-type': 'application/json',
            },
        })
    }

    // POST保存设置
    if (request.method === 'POST') {
        const body = await request.json()
        const settings = body
        // 写入数据库
        await db.put('manage@sysConfig@page', JSON.stringify(settings))

        return new Response(JSON.stringify(settings), {
            headers: {
                'content-type': 'application/json',
            },
        })
    }

}

export async function getPageConfig(db, env) {
    const settings = {}
    // 读取数据库中的设置
    const settingsStr = await db.get('manage@sysConfig@page')
    const settingsKV = settingsStr ? JSON.parse(settingsStr) : {}

    const config = []
    settings.config = config
    config.push(
        // 全局设置
        {
            id: 'siteTitle',
            label: '网站标题',
            placeholder: 'PeiQi ImgHub',
            value: 'PeiQi ImgHub', // 强制默认生效
            category: '全局设置',
        },
        {
            id: 'siteIcon',
            label: '网站图标',
            category: '全局设置',
            value: '', // 留空可在管理端自定义，默认使用项目内置图标
        },
        {
            id: 'ownerName',
            label: '图床名称',
            placeholder: '野猪佩奇弟弟的图床',
            value: '野猪佩奇弟弟的图床', // 强制默认生效
            category: '全局设置',
        },
        {
            id: 'logoUrl',
            label: '图床Logo',
            category: '全局设置',
            value: '', // 留空可在管理端自定义
        },
        {
            id: 'bkInterval',
            label: '背景切换间隔',
            placeholder: '3000',
            tooltip: '单位：毫秒 ms',
            value: '3000', // 补全默认值，避免空值
            category: '全局设置',
        },
        {
            id: 'bkOpacity',
            label: '背景图透明度',
            placeholder: '1',
            tooltip: '0-1 之间的小数',
            value: '1', // 补全默认值，避免空值
            category: '全局设置',
        },
        {
            id: 'urlPrefix',
            label: '默认URL前缀',
            tooltip: '自定义URL前缀，如：https://img.a.com/file/，留空则使用当前域名 <br/> 设置后将应用于客户端和管理端',
            category: '全局设置',
            value: '', // 留空使用默认域名
        },
        // 客户端设置
        {
            id: 'announcement',
            label: '公告',
            tooltip: '支持HTML标签',
            category: '客户端设置',
            value: '仅用于速度测试，不保证图片有效性，请勿上传重要或违规内容，测试相关图片可能随时清理。', // 预设公告
        },
        {
            id: 'defaultUploadChannel',
            label: '默认上传渠道',
            type: 'select',
            options: [
                { label: 'Telegram', value: 'telegram' },
                { label: 'Cloudflare R2', value: 'cfr2' },
                { label: 'S3', value: 's3' },
            ],
            placeholder: 'telegram',
            value: 'telegram', // 补全默认值
            category: '客户端设置',
        },
        {
            id: 'defaultUploadFolder',
            label: '默认上传目录',
            placeholder: '/peiqi-uploads/',
            category: '客户端设置',
            value: '/peiqi-uploads/' // 强制默认生效
        },
        {
            id: 'defaultUploadNameType',
            label: '默认命名方式',
            type: 'select',
            options: [
                { label: '默认', value: 'default' },
                { label: '仅前缀', value: 'index' },
                { label: '仅原名', value: 'origin' },
                { label: '短链接', value: 'short' },
            ],
            placeholder: 'default',
            value: 'default', // 补全默认值
            category: '客户端设置',
        },
        {
            id: 'loginBkImg',
            label: '登录页背景图',
            tooltip: '1.填写 bing 使用必应壁纸轮播 <br/> 2.填写 ["url1","url2"] 使用多张图片轮播 <br/> 3.填写 ["url"] 使用单张图片',
            category: '客户端设置',
            value: 'bing', // 强制默认生效
        },
        {
            id: 'uploadBkImg',
            label: '上传页背景图',
            tooltip: '1.填写 bing 使用必应壁纸轮播 <br/> 2.填写 ["url1","url2"] 使用多张图片轮播 <br/> 3.填写 ["url"] 使用单张图片',
            category: '客户端设置',
            value: 'bing', // 强制默认生效
        },
        {
            id: 'footerLink',
            label: '页脚传送门链接',
            category: '客户端设置',
            value: '', // 留空可在管理端自定义
        },
        {
            id: 'disableFooter',
            label: '隐藏页脚',
            type: 'boolean',
            default: false,
            category: '客户端设置',
            value: false, // 补全默认值
        },
        // 管理端设置
        {
            id: 'adminLoginBkImg',
            label: '登录页背景图',
            tooltip: '1.填写 bing 使用必应壁纸轮播 <br/> 2.填写 ["url1","url2"] 使用多张图片轮播 <br/> 3.填写 ["url"] 使用单张图片',
            category: '管理端设置',
            value: 'bing', // 强制默认生效
        }
    )

    const userConfig = env.USER_CONFIG
    if (userConfig) {
        try {
            const parsedConfig = JSON.parse(userConfig)
            if (typeof parsedConfig === 'object' && parsedConfig !== null) {
                // 搜索config中的id，如果存在则更新（仅非空值生效）
                for (let i = 0; i < config.length; i++) {
                    if (parsedConfig[config[i].id] && parsedConfig[config[i].id] !== "") {
                        config[i].value = parsedConfig[config[i].id]
                    }
                }
            }
        } catch (error) {
            // do nothing
        }
    }

    // 用KV中的设置覆盖默认设置（优化：仅当数据库value非空时才覆盖）
    for (let i = 0; i < settingsKV.config?.length; i++) {
        const item = settingsKV.config[i]
        const index = config.findIndex(x => x.id === item.id)
        // 新增判断：排除空值、undefined，避免覆盖代码默认值
        if (index !== -1 && item.value !== "" && item.value !== undefined) {
            config[index].value = item.value
        }
    }

    return settings
}