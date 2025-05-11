# 大师快跑

## 项目简介
"大师快跑"是一个基于Next.js 14开发的网站，提供以下功能：

1. **地区和时间显示**：通过IP地址判断用户所在地区，显示当前地区和时间，并用图片形式展示对应的中国天干地支时辰。如果无法自动获取地区，则允许用户手动输入城市。

2. **抛硬币模拟**：
   - 用户需要抛6次硬币
   - 每次点击按钮抛一次硬币
   - 记录并显示每次抛硬币的结果和首次抛硬币的时间
   - 硬币正面为数字5，背面为荷花图案
   - 每次抛硬币的结果由电脑随机生成
   - 抛硬币时有上下翻转的动画，持续2-4秒
   - 硬币图案停留在结果对应的面

3. **AI聊天界面**：完成6次抛硬币后，出现与AI的聊天界面，调用AI进行对话（具体调用方式待定）。

## 使用方法
1. 启动开发服务器：
   ```bash
   npm run dev
   ```
2. 在浏览器中访问 [http://localhost:3000](http://localhost:3000) 查看网站。

## 技术栈
- Next.js 14
- TypeScript
- Tailwind CSS
- ESLint

## 贡献
欢迎提交问题和功能请求！

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
