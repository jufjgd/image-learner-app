const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 图片识别API
app.post('/api/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传图片' });
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

    // 调用豆包API进行图片识别
    const response = await axios.post('https://api.doubao.com/vision/object_detection', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`
      }
    });

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('图片识别出错:', error);
    res.status(500).json({ error: '图片识别失败' });
  }
});

// 获取单词详细信息API
app.post('/api/word_info', async (req, res) => {
  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: '缺少单词列表' });
    }

    // 调用豆包API获取单词详细信息
    const response = await axios.post('https://api.doubao.com/knowledge/words', {
      words
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('获取单词信息出错:', error);
    res.status(500).json({ error: '获取单词信息失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});  
