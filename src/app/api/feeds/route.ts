import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fetchRSSFeed, saveFeed } from "@/lib/rss/parser";

// 获取所有订阅源
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        feed: true,
      },
      orderBy: [
        { folder: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("获取订阅失败:", error);
    return NextResponse.json(
      { error: "获取订阅失败" },
      { status: 500 }
    );
  }
}

// 添加新的订阅源
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const { url, folder = "未分类" } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "请提供 RSS 链接" },
        { status: 400 }
      );
    }

    // 获取 RSS 内容
    const rssFeed = await fetchRSSFeed(url);

    if (!rssFeed) {
      return NextResponse.json(
        { error: "无法解析 RSS 源" },
        { status: 400 }
      );
    }

    // 保存 Feed 到数据库
    const feed = await saveFeed(rssFeed);

    // 检查用户是否已订阅该 Feed
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId_feedId: {
          userId: session.user.id,
          feedId: feed.id,
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "已订阅该 RSS 源" },
        { status: 400 }
      );
    }

    // 创建订阅关系
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        feedId: feed.id,
        folder,
      },
      include: {
        feed: true,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("添加订阅失败:", error);
    return NextResponse.json(
      { error: "添加订阅失败" },
      { status: 500 }
    );
  }
}
