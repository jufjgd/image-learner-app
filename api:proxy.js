// api/proxy.js

export default async function handler(request, response) {
  // 1. 仅允许 POST 方法
  if (request.method !== 'POST') {
    return response.status(405).json({ error: { message: 'Only POST method is allowed.' } });
  }

  // 2. 从 Vercel 环境变量中安全地获取新的 Gemini API 密钥
  const apiKey = process.env.GEMINI_API_KEY; // 注意：变量名已更改
  if (!apiKey) {
    console.error('Proxy Error: GEMINI_API_KEY environment variable is not set.');
    return response.status(500).json({ error: { message: '服务器配置错误：GEMINI_API_KEY 未设置。' } });
  }

  // 3. 从前端获取请求体
  const { imageDataUrl, promptText } = request.body;
  if (!imageDataUrl || !promptText) {
    return response.status(400).json({ error: { message: '请求体缺少 imageDataUrl 或 promptText。' } });
  }

  // 4. 构建 Gemini API 的 URL 和请求体
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

  // Gemini 需要纯净的 Base64 数据，去除前缀
  const base64Data = imageDataUrl.split(',')[1];

  const geminiPayload = {
    contents: [{
      parts: [
        { text: promptText },
        {
          inline_data: {
            mime_type: "image/jpeg", // 您可以根据上传的图片类型动态修改，但jpeg/png通用性好
            data: base64Data
          }
        }
      ]
    }]
  };

  try {
    // 5. 调用 Gemini API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    const responseData = await apiResponse.json();
    
    // 6. 检查来自 Gemini 的错误
    if (!apiResponse.ok || !responseData.candidates) {
        console.error('Gemini API Error:', responseData);
        const errorMessage = responseData.error?.message || 'Gemini API返回了错误或无效的响应。';
        return response.status(apiResponse.status).json({ error: { message: errorMessage, details: responseData }});
    }

    // 7. 提取文本内容并返回给前端
    // Gemini 的响应结构与豆包不同
    const textContent = responseData.candidates[0].content.parts[0].text;
    
    // 直接将 Gemini 返回的包含JSON的文本内容封装后发给前端
    return response.status(200).json({ content: textContent });

  } catch (error) {
    console.error('Proxy Caught Error:', error);
    return response.status(500).json({ error: { message: '代理服务器发生意外错误。', details: error.message } });
  }
}
