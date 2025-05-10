import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { markAsRead, toggleStar } from "@/lib/rss/parser";

// 获取特定文章的详情
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 在 Next.js 15 中，params 是一个 Promise，需要使用 await 解包
    const resolvedParams = await params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const id = resolvedParams.id;

    // 获取文章详情
    const item = await prisma.feedItem.findUnique({
      where: {
        id,
      },
      include: {
        feed: true,
        readStatus: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "未找到文章" },
        { status: 404 }
      );
    }

    // 标记为已读
    await markAsRead(item.id, session.user.id);

    return NextResponse.json(item);
  } catch (error) {
    console.error("获取文章详情失败:", error);
    return NextResponse.json(
      { error: "获取文章详情失败" },
      { status: 500 }
    );
  }
}

// 更新文章状态（已读/收藏）
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 在 Next.js 15 中，params 是一个 Promise，需要使用 await 解包
    const resolvedParams = await params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const id = resolvedParams.id;
    const { isRead, isStarred } = await req.json();

    // 获取文章
    const item = await prisma.feedItem.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "未找到文章" },
        { status: 404 }
      );
    }

    // 更新文章状态
    let status;

    // 更新已读状态
    if (isRead !== undefined) {
      status = await markAsRead(id, session.user.id, isRead);
    }

    // 更新收藏状态
    if (isStarred !== undefined) {
      status = await toggleStar(id, session.user.id, isStarred);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("更新文章状态失败:", error);
    return NextResponse.json(
      { error: "更新文章状态失败" },
      { status: 500 }
    );
  }
}
