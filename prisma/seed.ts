import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // 创建测试用户
    const hashedPassword = await hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: '测试用户',
        password: hashedPassword,
      },
    });

    console.log(`创建测试用户成功: ${user.email}`);

    // 创建一些示例 RSS 源
    const feeds = [
      {
        title: '少数派',
        url: 'https://rsshub.app/sspai/matrix',
        description: '少数派 - Matrix',
        siteUrl: 'https://sspai.com',
        imageUrl: 'https://cdn.sspai.com/sspai/assets/img/favicon/icon.ico',
      },
      {
        title: '知乎每日精选',
        url: 'https://rsshub.app/zhihu/daily',
        description: '知乎每日精选',
        siteUrl: 'https://www.zhihu.com',
        imageUrl: 'https://static.zhihu.com/heifetz/favicon.ico',
      },
      {
        title: '豆瓣最受欢迎的书评',
        url: 'https://rsshub.app/douban/book/review/best',
        description: '豆瓣最受欢迎的书评',
        siteUrl: 'https://book.douban.com',
        imageUrl: 'https://img3.doubanio.com/favicon.ico',
      },
    ];

    for (const feedData of feeds) {
      const feed = await prisma.feed.upsert({
        where: { url: feedData.url },
        update: {},
        create: {
          title: feedData.title,
          url: feedData.url,
          description: feedData.description,
          siteUrl: feedData.siteUrl,
          imageUrl: feedData.imageUrl,
          lastFetched: new Date(),
        },
      });

      console.log(`创建 RSS 源成功: ${feed.title}`);

      // 为测试用户添加订阅
      const subscription = await prisma.subscription.upsert({
        where: {
          userId_feedId: {
            userId: user.id,
            feedId: feed.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          feedId: feed.id,
          folder: '示例订阅',
        },
      });

      console.log(`创建订阅关系成功: ${subscription.id}`);

      // 为每个源创建一些示例文章
      for (let i = 1; i <= 5; i++) {
        const item = await prisma.feedItem.create({
          data: {
            feedId: feed.id,
            guid: `${feed.id}-item-${i}`,
            title: `${feedData.title} 示例文章 ${i}`,
            link: `${feedData.siteUrl}/article/${i}`,
            description: `这是 ${feedData.title} 的示例文章 ${i}，用于测试 RSS 阅读器功能。`,
            content: `<h2>这是 ${feedData.title} 的示例文章 ${i}</h2><p>这是一篇用于测试 RSS 阅读器功能的示例文章。</p><p>您可以在这里看到文章的详细内容，包括文本、链接和其他 HTML 元素。</p>`,
            author: '示例作者',
            categories: '示例分类',
            publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // 每篇文章间隔一天
          },
        });

        console.log(`创建示例文章成功: ${item.title}`);

        // 随机将一些文章标记为已读或收藏
        if (i % 2 === 0) {
          await prisma.readStatus.create({
            data: {
              userId: user.id,
              feedItemId: item.id,
              isRead: true,
              isStarred: i % 3 === 0,
            },
          });
          console.log(`标记文章状态成功: ${item.title}`);
        }
      }
    }

    console.log('数据库初始化成功！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
