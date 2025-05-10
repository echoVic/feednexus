import axios from 'axios';
import { Feed as PrismaFeed, FeedItem as PrismaFeedItem } from '@prisma/client';
import prisma from '@/lib/prisma';

// RSSHub 库的接口
interface RSSHubItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate: string;
  guid: string;
  author?: string;
  category?: string[];
}

interface RSSHubFeed {
  title: string;
  link: string;
  description?: string;
  image?: string;
  items: RSSHubItem[];
}

// 从 URL 获取 RSS 内容
export async function fetchRSSFeed(url: string): Promise<RSSHubFeed | null> {
  try {
    // 如果是 RSSHub 路径，添加基础 URL
    const fullUrl = url.startsWith('/') 
      ? `https://rsshub.app${url}` 
      : url;

    const response = await axios.get(fullUrl);
    
    // 如果是 XML 格式，需要解析
    if (typeof response.data === 'string') {
      // 这里可以使用 rsshub-lib 或其他 RSS 解析库
      // 简化起见，我们假设直接返回 JSON
      console.error('不支持直接解析 XML，请使用 RSSHub 实例');
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error('获取 RSS 失败:', error);
    return null;
  }
}

// 保存 Feed 到数据库
export async function saveFeed(rssFeed: RSSHubFeed): Promise<PrismaFeed> {
  // 检查 Feed 是否已存在
  let feed = await prisma.feed.findUnique({
    where: { url: rssFeed.link },
  });

  // 如果不存在，创建新的 Feed
  if (!feed) {
    feed = await prisma.feed.create({
      data: {
        title: rssFeed.title,
        url: rssFeed.link,
        description: rssFeed.description || '',
        siteUrl: rssFeed.link,
        imageUrl: rssFeed.image,
        lastFetched: new Date(),
      },
    });
  } else {
    // 更新现有 Feed
    feed = await prisma.feed.update({
      where: { id: feed.id },
      data: {
        title: rssFeed.title,
        description: rssFeed.description || feed.description,
        imageUrl: rssFeed.image || feed.imageUrl,
        lastFetched: new Date(),
      },
    });
  }

  // 保存 Feed 项目
  await saveFeedItems(feed.id, rssFeed.items);

  return feed;
}

// 保存 Feed 项目到数据库
async function saveFeedItems(feedId: string, items: RSSHubItem[]): Promise<PrismaFeedItem[]> {
  const savedItems: PrismaFeedItem[] = [];

  for (const item of items) {
    // 检查项目是否已存在
    const existingItem = await prisma.feedItem.findUnique({
      where: {
        feedId_guid: {
          feedId,
          guid: item.guid || item.link, // 如果没有 guid，使用 link 作为唯一标识
        },
      },
    });

    if (!existingItem) {
      // 创建新项目
      const newItem = await prisma.feedItem.create({
        data: {
          feedId,
          guid: item.guid || item.link,
          title: item.title,
          link: item.link,
          description: item.description || '',
          content: item.content || item.description || '',
          author: item.author || '',
          categories: item.category ? item.category.join(',') : '',
          publishedAt: new Date(item.pubDate),
        },
      });
      savedItems.push(newItem);
    }
  }

  return savedItems;
}

// 获取用户的所有订阅
export async function getUserSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      feed: true,
    },
    orderBy: [
      { folder: 'asc' },
      { sortOrder: 'asc' },
    ],
  });
}

// 获取用户的未读文章
export async function getUnreadItems(userId: string, limit = 50) {
  return prisma.feedItem.findMany({
    where: {
      feed: {
        subscriptions: {
          some: {
            userId,
          },
        },
      },
      readStatus: {
        none: {
          userId,
          isRead: true,
        },
      },
    },
    include: {
      feed: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

// 获取用户的星标文章
export async function getStarredItems(userId: string) {
  return prisma.feedItem.findMany({
    where: {
      readStatus: {
        some: {
          userId,
          isStarred: true,
        },
      },
    },
    include: {
      feed: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });
}

// 标记文章为已读
export async function markAsRead(userId: string, itemId: string) {
  return prisma.readStatus.upsert({
    where: {
      userId_feedItemId: {
        userId,
        feedItemId: itemId,
      },
    },
    update: {
      isRead: true,
    },
    create: {
      userId,
      feedItemId: itemId,
      isRead: true,
    },
  });
}

// 切换文章的星标状态
export async function toggleStar(userId: string, itemId: string) {
  const existing = await prisma.readStatus.findUnique({
    where: {
      userId_feedItemId: {
        userId,
        feedItemId: itemId,
      },
    },
  });

  if (existing) {
    return prisma.readStatus.update({
      where: {
        id: existing.id,
      },
      data: {
        isStarred: !existing.isStarred,
      },
    });
  } else {
    return prisma.readStatus.create({
      data: {
        userId,
        feedItemId: itemId,
        isStarred: true,
      },
    });
  }
}
