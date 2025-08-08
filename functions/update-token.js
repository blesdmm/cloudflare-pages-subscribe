export async function onRequest(context) {
const { request, env } = context;
const BASE_URL = 'https://api.duya.pro'; // 替换为你的机场API基地址
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1";

// 权限验证（防止未授权调用）
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${env.UPDATE_TOKEN_SECRET}`) {
return new Response("未授权", { status: 401 });
}

try {
// 生成随机邮箱/密码
const generateEmail = () => {
const user = Math.random().toString(36).substring(2, 10);
const domains = ['gmail.com', 'qq.com', '163.com', 'outlook.com'];
return `${user}@${domains[Math.floor(Math.random() * domains.length)]}`;
};
const generatePassword = () => {
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const email = generateEmail();
const password = generatePassword();

// 注册账号
const regRes = await fetch(`${BASE_URL}/v1/auth/register`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Origin': 'https://duya.pro',
'Referer': 'https://duya.pro/register',
'User-Agent': USER_AGENT
},
body: JSON.stringify({ email, password })
});
const regJson = await regRes.json();
if (!regJson.success) throw new Error(`注册失败：${regJson.message || '未知错误'}`);

// 登录获取Auth Token（等待1秒防反爬）
await new Promise(resolve => setTimeout(resolve, 1000));
const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Origin': 'https://duya.pro',
'Referer': 'https://duya.pro/login',
'User-Agent': USER_AGENT
},
body: JSON.stringify({ email, password })
});
const loginJson = await loginRes.json();
const authToken = loginJson.data?.token;
if (!authToken) throw new Error("登录失败：未获取到Auth Token");

// 获取订阅Token（等待1秒防反爬）
await new Promise(resolve => setTimeout(resolve, 1000));
const subRes = await fetch(`${BASE_URL}/v1/public/user/subscribe`, {
method: 'GET',
headers: {
'Authorization': authToken,
'User-Agent': USER_AGENT,
'Origin': 'https://duya.pro',
'Referer': 'https://duya.pro/dashboard'
}
});
const subJson = await subRes.json();
const subList = subJson.data?.list || [];
if (!subList.length) throw new Error("未获取到订阅列表");
const subToken = subList[0].token;
if (!subToken) throw new Error("未找到订阅Token");

// 存储订阅Token到KV
await env.KV_TOKENS.put('current_sub_token', subToken);

// 返回成功响应
return new Response("订阅Token更新成功", { status: 200 });
} catch (error) {
console.error("Token更新失败:", error);
return new Response(`Token更新失败：${error.message}`, { status: 500 });
}
}
