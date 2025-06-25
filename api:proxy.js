// api/proxy.js

export default async function handler(request, response) {
  // 1. 仅允许 POST 方法
  if (request.method !== 'POST') {
    return response.status(405).json({ error: { message: 'Only POST method is allowed.' } });
  }

  // 2. 安全地从 Vercel 环境变量中获取 API 密钥
  //    您需要在 Vercel 项目设置中添加一个名为 ARK_API_KEY 的环境变量
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    console.error('Proxy Error: ARK_API_KEY environment variable is not set.');
    return response.status(500).json({ error: { message: '服务器配置错误：API密钥未设置。' } });
  }
  
  // 这是豆包API的地址，如果您的地址不同，请在此处修改
  const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  try {
    // 3. 将请求转发给豆包 API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request.body),
    });

    // 4. 获取外部 API 的原始响应体
    const responseBody = await apiResponse.text();
    
    // 5. 检查外部 API 的响应是否成功
    if (!apiResponse.ok) {
      console.error(`External API Error: Status ${apiResponse.status}, Body: ${responseBody}`);
      // 尝试将错误信息作为JSON返回，如果失败则返回纯文本
      try {
        JSON.parse(responseBody);
        return response.status(apiResponse.status).setHeader('Content-Type', 'application/json').send(responseBody);
      } catch (e) {
        return response.status(apiResponse.status).setHeader('Content-Type', 'text/plain').send(responseBody);
      }
    }

    // 6. 将成功响应（应为JSON）返回给前端
    return response.status(200).setHeader('Content-Type', 'application/json').send(responseBody);

  } catch (error) {
    console.error('Proxy Caught Error:', error);
    return response.status(500).json({ error: { message: '代理服务器发生意外错误。', details: error.message } });
  }
}
