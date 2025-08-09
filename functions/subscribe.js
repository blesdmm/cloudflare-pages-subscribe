export async function onRequest(context) {
const { request, env } = context;
const BASE_URL = 'https://api.duya.pro'; // 替换为你的机场API基地址（如Duya的API）
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"; // 模拟手机浏览器

try {
// 从KV获取最新订阅Token（由update-token.js更新）
const subToken = await env.KV_TOKENS.get('current_sub_token');
if (!subToken) throw new Error("未找到订阅Token，请等待每天自动更新");

// 下载订阅内容（拼接Token）
const subContentRes = await fetch(`${BASE_URL}/api/subscribe?token=${subToken}`, {
method: 'GET',
headers: { 'User-Agent': USER_AGENT }
});
const subContent = await subContentRes.text();

// 尝试Base64解码（兼容机场返回的编码格式）
let decodedContent;
try {
decodedContent = atob(subContent); // 对应Python的base64.b64decode
} catch (e) {
decodedContent = subContent; // 解码失败则返回原始内容
}

// 返回订阅内容（设置响应头让浏览器自动下载）
return new Response(decodedContent, {
headers: {
'Content-Type': 'text/plain; charset=utf-8',
'Content-Disposition': 'attachment; filename=subscription.txt',
'Cache-Control': 'no-cache' // 禁止缓存，确保每次获取最新内容
}
});
} catch (error) {
console.error("订阅请求处理失败:", error);
return new Response(`订阅获取失败：${error.message}`, {
status: 500,
headers: { 'Content-Type': 'text/plain; charset=utf-8' }
});
}
}
