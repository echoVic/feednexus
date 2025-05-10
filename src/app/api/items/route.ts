import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUnreadItems, getStarredItems } from "@/lib/rss/parser";

// 获取用户的文章列表（未读或星标）
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "unread";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let items;
    if (filter === "starred") {
      items = await getStarredItems(session.user.id);
    } else {
      items = await getUnreadItems(session.user.id, limit);
    }

    // 获取每个文章的阅读状态
    const itemsWithStatus = await Promise.all(
      items.map(async (item) => {
        const status = await prisma.readStatus.findUnique({
          where: {
            userId_feedItemId: {
              userId: session.user.id,
              feedItemId: item.id,
            },
          },
        });

        return {
          ...item,
          isRead: status?.isRead || false,
          isStarred: status?.isStarred || false,
        };
      })
    );

    return NextResponse.json(itemsWithStatus);
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}
