// api/proxy.js

export default async function handler(request, response) {
  // 1. 仅允许 POST 方法
  if (request.method !== 'POST') {
    return response.status(405).json({ error: { message: 'Only POST method is allowed.' } });
  }

  // 2. 安全地从 Vercel 环境变量中获取 API 密钥
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    console.error('Proxy Error: ARK_API_KEY environment variable is not set.');
    return response.status(500).json({ error: { message: '服务器配置错误：API密钥未设置。请在Vercel项目中检查环境变量。' } });
  }
  
  const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  try {
    // 3. 将请求转发给火山引擎 API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request.body),
    });

    // 4. 检查外部 API 的响应是否成功
    if (!apiResponse.ok) {
      // 尝试解析外部 API 的错误信息
      let errorBody = '无法解析来自外部API的错误响应。';
      try {
        // 使用 .text() 以避免外部API返回非JSON错误时导致解析失败
        errorBody = await apiResponse.text();
      } catch (e) { /* 忽略解析错误 */ }
      
      console.error(`External API Error: Status ${apiResponse.status}, Body: ${errorBody}`);
      return response.status(apiResponse.status).json({ 
        error: { message: `请求外部API失败。状态码: ${apiResponse.status}`, details: errorBody }
      });
    }

    // 5. 解析外部 API 的 JSON 响应
    const data = await apiResponse.json();

    // 6. 将成功响应返回给前端
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy Caught Error:', error);
    return response.status(500).json({ error: { message: '代理服务器发生意外错误。', details: error.message } });
  }
}
