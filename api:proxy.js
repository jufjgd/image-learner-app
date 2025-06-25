// api/proxy.js

export default async function handler(request, response) {
  // 只接受POST请求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // 从Vercel的环境变量中安全地获取API密钥
  const apiKey = process.env.ARK_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured.' });
  }
  
  // 目标API的URL
  const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  try {
    // 将前端发来的请求体 (payload) 转发给目标API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request.body),
    });

    // 从目标API获取响应数据
    const data = await apiResponse.json();

    // 将目标API的响应原样返回给前端
    response.status(apiResponse.status).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    response.status(500).json({ error: 'An error occurred in the proxy.' });
  }
}